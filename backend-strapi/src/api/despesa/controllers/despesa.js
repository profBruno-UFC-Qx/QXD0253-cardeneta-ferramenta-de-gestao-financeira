const { factories } = require('@strapi/strapi');
const TIPOS = ['insumo', 'conta_fixa', 'outros'];
const usuarioRef = (user) => user?.documentId || user?.id;
const dataValida = (valor) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(valor || ''))) return false;
  const data = new Date(`${valor}T12:00:00.000Z`);
  return Number.isFinite(data.getTime()) && data.toISOString().slice(0, 10) === valor;
};
function validar(dados, parcial = false) {
  const saida = {};
  if (!parcial || dados.descricao !== undefined) {
    const descricao = String(dados.descricao || '').trim().slice(0, 160);
    if (descricao.length < 2) return { erro: 'Informe uma descrição com pelo menos 2 caracteres' };
    saida.descricao = descricao;
  }
  if (!parcial || dados.valor !== undefined) {
    const valor = Number(dados.valor);
    if (!Number.isFinite(valor) || valor <= 0) return { erro: 'O valor deve ser maior que zero' };
    saida.valor = Math.round(valor * 100) / 100;
  }
  if (!parcial || dados.data !== undefined) {
    if (!dataValida(dados.data)) {
      return { erro: 'Informe uma data válida' };
    }
    saida.data = dados.data;
  }
  if (!parcial || dados.tipo !== undefined) {
    if (!TIPOS.includes(dados.tipo)) return { erro: 'Tipo de despesa inválido' };
    saida.tipo = dados.tipo;
  }
  return { saida };
}
function intervalo(ctx) {
  const { de, ate } = ctx.query;
  if (de && !dataValida(de)) return null;
  if (ate && !dataValida(ate)) return null;
  if (de && ate && de > ate) return null;
  const data = {};
  if (de) data.$gte = de;
  if (ate) data.$lte = ate;
  return Object.keys(data).length ? { data } : {};
}
module.exports = factories.createCoreController('api::despesa.despesa', () => ({
  async find(ctx) {
    const filtro = intervalo(ctx);
    if (!filtro) return ctx.badRequest('Intervalo de datas inválido');
    ctx.query = { ...ctx.query, filters: { ...(ctx.query.filters || {}), ...filtro }, sort: ctx.query.sort || 'data:desc' };
    return super.find(ctx);
  },
  async create(ctx) {
    const dados = ctx.request.body?.data || {};
    const { saida, erro } = validar(dados);
    if (erro) return ctx.badRequest(erro);
    const criado = await strapi.documents('api::despesa.despesa').create({ data: { ...saida, registradaPor: usuarioRef(ctx.state.user) } });
    ctx.status = 201;
    const limpo = await this.sanitizeOutput(criado, ctx);
    return this.transformResponse(limpo);
  },
  async update(ctx) {
    const existente = await strapi.documents('api::despesa.despesa').findOne({ documentId: ctx.params.id });
    if (!existente) return ctx.notFound();
    const { saida, erro } = validar(ctx.request.body?.data || {}, true);
    if (erro) return ctx.badRequest(erro);
    const atualizado = await strapi.documents('api::despesa.despesa').update({ documentId: ctx.params.id, data: saida });
    const limpo = await this.sanitizeOutput(atualizado, ctx);
    return this.transformResponse(limpo);
  },
  async delete(ctx) {
    const removido = await strapi.documents('api::despesa.despesa').delete({ documentId: ctx.params.id });
    if (!removido) return ctx.notFound();
    const limpo = await this.sanitizeOutput(removido, ctx);
    return this.transformResponse(limpo);
  },
}));
