module.exports = {
  routes: [
    { method: 'GET', path: '/equipe', handler: 'equipe.listar' },
    { method: 'POST', path: '/equipe', handler: 'equipe.criar' },
    { method: 'PUT', path: '/equipe/:id', handler: 'equipe.atualizar' },
  ],
};
