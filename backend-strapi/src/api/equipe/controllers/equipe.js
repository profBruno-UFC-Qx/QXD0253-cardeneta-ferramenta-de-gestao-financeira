const { digitos, telefoneValido, texto } = require('../../../utils/validacao');

const PAPEIS = ['authenticated', 'atendente', 'gerente'];
const PAPEIS_EQUIPE = ['atendente', 'gerente'];

const usuarios = () => strapi.db.query('plugin::users-permissions.user');
const papeis = () => strapi.db.query('plugin::users-permissions.role');

function linha(usuario, papel) {
  return {
    id: usuario.id,
    nome: usuario.nome || usuario.username,
    email: usuario.email,
    telefone: usuario.telefone || '',
    bloqueado: Boolean(usuario.blocked),
    papel: papel || usuario.role?.type,
  };
}

module.exports = {
  async listar(ctx) {
    const lista = await usuarios().findMany({ populate: ['role'], orderBy: { id: 'asc' }, limit: 1000 });
    ctx.body = lista.map((usuario) => linha(usuario));
  },

  async criar(ctx) {
    const { nome, email, senha, telefone, papel } = ctx.request.body || {};
    const nomeLimpo = texto(nome, 120);
    const emailLimpo = texto(email, 160).toLowerCase();

    if (!nomeLimpo) return ctx.badRequest('Informe o nome');
    if (!/^\S+@\S+\.\S+$/.test(emailLimpo)) return ctx.badRequest('E-mail inválido');
    if (String(senha || '').length < 6) return ctx.badRequest('A senha precisa ter pelo menos 6 caracteres');
    if (!PAPEIS_EQUIPE.includes(papel)) return ctx.badRequest('Papel inválido');
    if (telefone && !telefoneValido(telefone)) return ctx.badRequest('Telefone inválido');
    if (await usuarios().findOne({ where: { email: emailLimpo } })) return ctx.badRequest('E-mail já cadastrado');

    const role = await papeis().findOne({ where: { type: papel } });
    if (!role) return ctx.badRequest('O papel informado não está configurado no Strapi');

    const criado = await strapi.plugin('users-permissions').service('user').add({
      username: emailLimpo,
      nome: nomeLimpo,
      email: emailLimpo,
      password: senha,
      telefone: digitos(telefone),
      provider: 'local',
      confirmed: true,
      blocked: false,
      role: role.id,
    });
    ctx.status = 201;
    ctx.body = linha(criado, papel);
  },

  async atualizar(ctx) {
    const id = Number(ctx.params.id);
    if (ctx.state.user && id === ctx.state.user.id) {
      return ctx.forbidden('Você não pode alterar a própria conta por aqui');
    }

    const existente = await usuarios().findOne({ where: { id }, populate: ['role'] });
    if (!existente) return ctx.notFound();

    const { papel, bloqueado } = ctx.request.body || {};
    const dados = {};
    if (papel !== undefined) {
      if (!PAPEIS.includes(papel)) return ctx.badRequest('Papel inválido');
      const role = await papeis().findOne({ where: { type: papel } });
      if (!role) return ctx.badRequest('O papel informado não está configurado no Strapi');
      dados.role = role.id;
    }
    if (bloqueado !== undefined) dados.blocked = Boolean(bloqueado);
    if (!Object.keys(dados).length) return ctx.badRequest('Nenhuma alteração informada');

    const atualizado = await usuarios().update({ where: { id }, data: dados, populate: ['role'] });
    ctx.body = linha(atualizado);
  },
};
