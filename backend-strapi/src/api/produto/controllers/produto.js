const { factories } = require('@strapi/strapi');

module.exports = factories.createCoreController('api::produto.produto', () => ({
  async update(ctx) {
    if (ctx.state.user?.role?.type === 'atendente') {
      const disponivel = ctx.request.body?.data?.disponivel;
      if (typeof disponivel !== 'boolean') return ctx.badRequest('Informe a disponibilidade como verdadeiro ou falso');
      ctx.request.body = { data: { disponivel } };
    }
    return super.update(ctx);
  },
}));
