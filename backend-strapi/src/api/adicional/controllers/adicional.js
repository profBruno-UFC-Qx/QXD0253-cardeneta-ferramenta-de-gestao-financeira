const { factories } = require('@strapi/strapi');
function validar(ctx) {
  const dados = ctx.request.body?.data || {};
  const resultado = {};
  if (dados.nome !== undefined) {
    const nome = String(dados.nome).trim();
    if (nome.length < 2 || nome.length > 80) return { erro: 'O nome deve ter entre 2 e 80 caracteres' };
    resultado.nome = nome;
  }
  if (dados.preco !== undefined) {
    if (dados.preco === '' || dados.preco === null) return { erro: 'Informe o preço do adicional' };
    const preco = Number(dados.preco);
    if (!Number.isFinite(preco) || preco < 0 || preco > 10000) return { erro: 'O preço deve estar entre R$ 0,00 e R$ 10.000,00' };
    resultado.preco = Math.round(preco * 100) / 100;
  }
  if (dados.disponivel !== undefined) {
    if (typeof dados.disponivel !== 'boolean') return { erro: 'Disponibilidade inválida' };
    resultado.disponivel = dados.disponivel;
  }
  return { dados: resultado };
}
module.exports = factories.createCoreController('api::adicional.adicional', () => ({
  async find(ctx) {
    if (ctx.state.user?.role?.type !== 'gerente') {
      const filtros = ctx.query.filters || {};
      ctx.query = { ...ctx.query, filters: { $and: [filtros, { disponivel: { $eq: true } }] } };
    }
    return super.find(ctx);
  },
  async findOne(ctx) {
    if (ctx.state.user?.role?.type !== 'gerente') {
      const adicional = await strapi.documents('api::adicional.adicional').findOne({ documentId: ctx.params.id });
      if (!adicional || adicional.disponivel === false) return ctx.notFound();
    }
    return super.findOne(ctx);
  },
  async create(ctx) {
    if (ctx.state.user?.role?.type !== 'gerente') return ctx.forbidden('Somente gerente pode cadastrar adicionais');
    const validacao = validar(ctx);
    if (validacao.erro) return ctx.badRequest(validacao.erro);
    if (!validacao.dados.nome || validacao.dados.preco === undefined) return ctx.badRequest('Informe nome e preço');
    ctx.request.body = { data: validacao.dados };
    return super.create(ctx);
  },
  async update(ctx) {
    if (ctx.state.user?.role?.type !== 'gerente') return ctx.forbidden('Somente gerente pode alterar adicionais');
    const validacao = validar(ctx);
    if (validacao.erro) return ctx.badRequest(validacao.erro);
    if (!Object.keys(validacao.dados).length) return ctx.badRequest('Nenhuma alteração informada');
    ctx.request.body = { data: validacao.dados };
    return super.update(ctx);
  },
  async delete(ctx) {
    if (ctx.state.user?.role?.type !== 'gerente') return ctx.forbidden('Somente gerente pode excluir adicionais');
    return super.delete(ctx);
  },
}));
