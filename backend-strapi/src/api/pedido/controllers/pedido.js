const { factories } = require('@strapi/strapi');
const { digitos, texto } = require('../../../utils/validacao');

const STATUS = ['recebido', 'em_preparo', 'pronto', 'em_entrega', 'entregue', 'cancelado'];
const PAGAMENTOS = ['dinheiro', 'pix', 'cartao'];
const MODALIDADES = ['mesa', 'retirada', 'entrega'];

const ehStaff = (user) => ['atendente', 'gerente'].includes(user?.role?.type);

module.exports = factories.createCoreController('api::pedido.pedido', () => ({
  async find(ctx) {
    const user = ctx.state.user;
    if (!ehStaff(user)) {
      const filters = ctx.query.filters || {};
      ctx.query = { ...ctx.query, filters: { ...filters, cliente: { id: user.id } } };
    }
    return super.find(ctx);
  },

  async findOne(ctx) {
    const user = ctx.state.user;
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
      const produto = await strapi.documents('api::produto.produto').findOne({ documentId: String(item.produto) });
      if (!produto || !produto.disponivel) return ctx.badRequest('Um dos produtos não está disponível');
      subtotal += Number(produto.preco) * quantidade;
      linhas.push({ produto, quantidade });
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
        cliente: user.documentId,
      },
    });

    try {
      for (const { produto, quantidade } of linhas) {
        await strapi.documents('api::item-pedido.item-pedido').create({
          data: {
            quantidade,
            precoUnitario: Number(produto.preco),
            nomeProduto: produto.nome,
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
