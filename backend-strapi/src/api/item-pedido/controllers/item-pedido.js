const { factories } = require('@strapi/strapi');

const ehStaff = (user) => ['atendente', 'gerente'].includes(user?.role?.type);

module.exports = factories.createCoreController('api::item-pedido.item-pedido', () => ({
  async find(ctx) {
    const user = ctx.state.user;
    if (!ehStaff(user)) {
      const filters = ctx.query.filters || {};
      ctx.query = { ...ctx.query, filters: { ...filters, pedido: { cliente: { id: user.id } } } };
    }
    return super.find(ctx);
  },
}));
