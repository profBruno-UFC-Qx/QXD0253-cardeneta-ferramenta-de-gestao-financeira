module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/lanchonete',
      handler: 'api::lanchonete.lanchonete.find',
      config: {
        auth: false,
      },
    },
    {
      method: 'PUT',
      path: '/lanchonete',
      handler: 'api::lanchonete.lanchonete.update',
    },
    {
      method: 'PUT',
      path: '/lanchonetes/configuracao',
      handler: 'api::lanchonete.lanchonete.gerenciar',
    },
  ],
};
