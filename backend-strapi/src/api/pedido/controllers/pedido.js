const { factories } = require('@strapi/strapi');
const { digitos, texto } = require('../../../utils/validacao');

const STATUS = ['recebido', 'em_preparo', 'pronto', 'em_entrega', 'entregue', 'cancelado'];
const PAGAMENTOS = ['dinheiro', 'pix', 'cartao'];
const MODALIDADES = ['mesa', 'retirada', 'entrega'];
const UID = 'api::pedido.pedido';

const ehStaff = (user) => ['atendente', 'gerente'].includes(user?.role?.type);
module.exports = factories.createCoreController('api::pedido.pedido', () => ({
  async find(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized();
    if (ehStaff(user)) return super.find(ctx);

    const page = Math.max(1, Number(ctx.query.pagination?.page) || 1);
    const pageSize = Math.max(1, Math.min(100, Number(ctx.query.pagination?.pageSize) || 30));
    const where = { cliente: { id: user.id } };
    const query = strapi.db.query(UID);
    const [pedidos, total] = await Promise.all([
      query.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        populate: ['itens'],
        limit: pageSize,
        offset: (page - 1) * pageSize,
      }),
      query.count({ where }),
    ]);
    const limpos = await this.sanitizeOutput(pedidos, ctx);
    return this.transformResponse(limpos, {
      pagination: { page, pageSize, pageCount: Math.ceil(total / pageSize), total },
    });
  },

  async findOne(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized();
    const pedido = await strapi.documents('api::pedido.pedido').findOne({
      documentId: ctx.params.id,
      populate: ['cliente'],
    });
    if (!pedido) return ctx.notFound();
    if (!ehStaff(user) && pedido.cliente?.id !== user.id) return ctx.forbidden();
    return super.findOne(ctx);
  },

  async create(ctx) {
    const user = ctx.state.user;
    const dados = ctx.request.body?.data || {};
    const itens = Array.isArray(dados.itens) ? dados.itens : [];

    if (!itens.length) return ctx.badRequest('O pedido precisa ter pelo menos um item');
    if (!PAGAMENTOS.includes(dados.formaPagamento)) return ctx.badRequest('Forma de pagamento inválida');
    if (!MODALIDADES.includes(dados.modalidade)) return ctx.badRequest('Escolha mesa, retirada ou entrega');

    const mesa = texto(dados.mesa, 20);
    const entregaNome = texto(dados.entregaNome, 120);
    const entregaTelefone = digitos(dados.entregaTelefone);
    const entregaEndereco = texto(dados.entregaEndereco, 400);

    if (dados.modalidade === 'mesa' && !mesa) return ctx.badRequest('Informe o número da mesa');
    if (dados.modalidade === 'entrega' && (!entregaNome || !entregaEndereco || entregaTelefone.length < 10)) {
      return ctx.badRequest('Informe quem vai receber, o telefone e o endereço de entrega');
    }

    const loja = await strapi.documents('api::lanchonete.lanchonete').findFirst();
    if (loja && loja.aberta === false) return ctx.badRequest('A lanchonete está fechada no momento');

    let subtotal = 0;
    const linhas = [];
    for (const item of itens) {
      const quantidade = Number(item.quantidade);
      if (!Number.isInteger(quantidade) || quantidade < 1 || quantidade > 50) {
        return ctx.badRequest('Quantidade inválida');
      }
      const produto = await strapi.documents('api::produto.produto').findOne({ documentId: String(item.produto), populate: ['adicionaisCatalogo'] });
      if (!produto || !produto.disponivel) return ctx.badRequest('Um dos produtos não está disponível');
      const selecoes = item.adicionais === undefined ? [] : item.adicionais;
      if (!Array.isArray(selecoes) || selecoes.length > 30) {
        return ctx.badRequest('Lista de adicionais inválida');
      }
      const disponiveis = Array.isArray(produto.adicionaisCatalogo) ? produto.adicionaisCatalogo : [];
      const adicionais = [];
      const idsVistos = new Set();
      for (const selecao of selecoes) {
        const id = String(typeof selecao === 'string' ? selecao : selecao?.id || '');
        const quantidadeAdicional = typeof selecao === 'string' ? 1 : Number(selecao?.quantidade ?? 1);
        if (!Number.isInteger(quantidadeAdicional) || quantidadeAdicional < 1 || quantidadeAdicional > 50) {
          return ctx.badRequest('Quantidade de adicional inválida');
        }
        if (!id || idsVistos.has(id)) return ctx.badRequest('Um adicional foi selecionado mais de uma vez ou não possui ID');
        idsVistos.add(id);
        const adicional = disponiveis.find((opcao) => opcao.documentId === id && opcao.disponivel !== false);
        if (!adicional) return ctx.badRequest('Um adicional selecionado não está disponível para este produto');
        adicionais.push({ id: adicional.documentId, nome: adicional.nome, preco: Number(adicional.preco), quantidade: quantidadeAdicional });
      }
      const precoAdicionais = adicionais.reduce((soma, adicional) => soma + adicional.preco * adicional.quantidade, 0);
      subtotal += (Number(produto.preco) + precoAdicionais) * quantidade;
      linhas.push({ produto, quantidade, adicionais });
    }

    const taxa = dados.modalidade === 'entrega' ? Number(loja?.taxaEntrega || 0) : 0;
    const staff = ehStaff(user);
    const contato = staff ? digitos(dados.telefoneContato) : digitos(user.telefone);

    const pedido = await strapi.documents('api::pedido.pedido').create({
      data: {
        status: 'recebido',
        tipo: staff ? 'balcao' : 'online',
        modalidade: dados.modalidade,
        mesa: dados.modalidade === 'mesa' ? mesa : '',
        entregaNome: dados.modalidade === 'entrega' ? entregaNome : '',
        entregaTelefone: dados.modalidade === 'entrega' ? entregaTelefone : '',
        entregaEndereco: dados.modalidade === 'entrega' ? entregaEndereco : '',
        taxaEntrega: taxa,
        telefoneContato: contato,
        formaPagamento: dados.formaPagamento,
        observacoes: texto(dados.observacoes, 400),
        total: Math.round((subtotal + taxa) * 100) / 100,
        nomeCliente: staff && dados.nomeCliente ? texto(dados.nomeCliente, 120) : user.nome || user.username,
        cliente: user.id,
      },
    });

    try {
      for (const { produto, quantidade, adicionais } of linhas) {
        await strapi.documents('api::item-pedido.item-pedido').create({
          data: {
            quantidade,
            precoUnitario: Number(produto.preco),
            nomeProduto: produto.nome,
            adicionais,
            pedido: pedido.documentId,
            produto: produto.documentId,
          },
        });
      }
    } catch (erro) {
      await strapi.documents('api::pedido.pedido').delete({ documentId: pedido.documentId });
      throw erro;
    }

    const criado = await strapi.documents('api::pedido.pedido').findOne({
      documentId: pedido.documentId,
      populate: ['itens'],
    });
    const limpo = await this.sanitizeOutput(criado, ctx);
    ctx.status = 201;
    return this.transformResponse(limpo);
  },

  async update(ctx) {
    const status = ctx.request.body?.data?.status;
    if (!STATUS.includes(status)) return ctx.badRequest('Status inválido');
    ctx.request.body = { data: { status } };
    return super.update(ctx);
  },
}));
