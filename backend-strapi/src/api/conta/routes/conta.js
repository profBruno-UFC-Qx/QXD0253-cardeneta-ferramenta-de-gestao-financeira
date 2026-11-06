module.exports = {
  routes: [
    { method: 'GET', path: '/conta', handler: 'conta.me' },
    { method: 'PUT', path: '/conta', handler: 'conta.atualizar' },
    { method: 'POST', path: '/conta/cadastro', handler: 'conta.cadastro', config: { auth: false } },
  ],
};
