const { factories } = require('@strapi/strapi');
function normalizarRelacao(valor) {
  const ids = Array.isArray(valor) ? valor : (Array.isArray(valor?.set) ? valor.set : null);
  if (!ids || ids.length > 30) return { erro: 'Selecione no máximo 30 adicionais do catálogo' };
  const vistos = new Set();
  const set = [];
  for (const valorId of ids) {
    const id = String(valorId || '').trim();
    if (!id || vistos.has(id)) return { erro: 'A seleção de adicionais contém identificador inválido ou repetido' };
    vistos.add(id);
    set.push(id);
  }
  return { relacao: { set } };
}
module.exports = factories.createCoreController('api::produto.produto', () => ({
  async create(ctx) {
    const dados = ctx.request.body?.data || {};
    delete dados.adicionais;
    dados.adicionaisMigrados = true;
    if (dados.adicionaisCatalogo !== undefined) {
      if (ctx.state.user?.role?.type !== 'gerente') return ctx.forbidden('Somente gerente pode associar adicionais aos produtos');
      const normalizados = normalizarRelacao(dados.adicionaisCatalogo);
      if (normalizados.erro) return ctx.badRequest(normalizados.erro);
      dados.adicionaisCatalogo = normalizados.relacao;
    }
    return super.create(ctx);
  },
  async update(ctx) {
    const dados = ctx.request.body?.data || {};
    delete dados.adicionais;
    delete dados.adicionaisMigrados;
    if (dados.adicionaisCatalogo !== undefined) {
      if (ctx.state.user?.role?.type !== 'gerente') return ctx.forbidden('Somente gerente pode associar adicionais aos produtos');
      const normalizados = normalizarRelacao(dados.adicionaisCatalogo);
      if (normalizados.erro) return ctx.badRequest(normalizados.erro);
      dados.adicionaisCatalogo = normalizados.relacao;
    }
    if (ctx.state.user?.role?.type === 'atendente') {
      const disponivel = dados.disponivel;
      if (typeof disponivel !== 'boolean') return ctx.badRequest('Informe a disponibilidade como verdadeiro ou falso');
      ctx.request.body = { data: { disponivel } };
    }
    return super.update(ctx);
  },
}));
