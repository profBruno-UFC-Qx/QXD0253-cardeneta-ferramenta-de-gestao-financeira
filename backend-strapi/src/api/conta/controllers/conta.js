const { digitos, cpfValido, telefoneValido, texto } = require('../../../utils/validacao');

const usuarios = () => strapi.db.query('plugin::users-permissions.user');

const resposta = (u, papel) => ({
  id: u.id,
  nome: u.nome || u.username,
  email: u.email,
  cpf: u.cpf || '',
  telefone: u.telefone || '',
  role: { type: papel || u.role?.type },
});

async function perfil(ctx) {
  const usuario = await usuarios().findOne({ where: { id: ctx.state.user.id }, populate: ['role'] });
  ctx.body = resposta(usuario);
}

module.exports = {
  me: perfil,

  async atualizar(ctx) {
    const { nome, telefone, cpf } = ctx.request.body || {};
    const dados = {};

    if (nome !== undefined) {
      if (!texto(nome)) return ctx.badRequest('Informe o nome');
      dados.nome = texto(nome, 120);
    }
    if (telefone !== undefined) {
      if (!telefoneValido(telefone)) return ctx.badRequest('Telefone inválido. Use DDD + número');
      dados.telefone = digitos(telefone);
    }
    if (cpf) {
      if (!cpfValido(cpf)) return ctx.badRequest('CPF inválido');
      const outro = await usuarios().findOne({ where: { cpf: digitos(cpf), id: { $ne: ctx.state.user.id } } });
      if (outro) return ctx.badRequest('CPF já cadastrado');
      dados.cpf = digitos(cpf);
    }

    await usuarios().update({ where: { id: ctx.state.user.id }, data: dados });
    return perfil(ctx);
  },

  async cadastro(ctx) {
    const { nome, email, senha, cpf, telefone, endereco } = ctx.request.body || {};
    const emailLimpo = texto(email, 160).toLowerCase();

    if (!texto(nome)) return ctx.badRequest('Informe o nome');
    if (!/^\S+@\S+\.\S+$/.test(emailLimpo)) return ctx.badRequest('E-mail inválido');
    if (String(senha || '').length < 6) return ctx.badRequest('A senha precisa ter pelo menos 6 caracteres');
    if (!cpfValido(cpf)) return ctx.badRequest('CPF inválido');
    if (!telefoneValido(telefone)) return ctx.badRequest('Telefone inválido. Use DDD + número');

    if (await usuarios().findOne({ where: { email: emailLimpo } })) return ctx.badRequest('E-mail já cadastrado');
    if (await usuarios().findOne({ where: { cpf: digitos(cpf) } })) return ctx.badRequest('CPF já cadastrado');

    const papel = await strapi.db.query('plugin::users-permissions.role').findOne({ where: { type: 'authenticated' } });
    const usuario = await strapi.plugin('users-permissions').service('user').add({
      username: emailLimpo,
      nome: texto(nome, 120),
      email: emailLimpo,
      password: senha,
      cpf: digitos(cpf),
      telefone: digitos(telefone),
      provider: 'local',
      confirmed: true,
      blocked: false,
      role: papel.id,
    });

    if (endereco?.rua && endereco?.numero && endereco?.bairro) {
      await strapi.documents('api::endereco.endereco').create({
        data: {
          rotulo: texto(endereco.rotulo) || 'Casa',
          destinatario: texto(endereco.destinatario) || texto(nome, 120),
          telefone: digitos(endereco.telefone || telefone),
          cep: digitos(endereco.cep),
          rua: texto(endereco.rua),
          numero: texto(endereco.numero),
          complemento: texto(endereco.complemento),
          bairro: texto(endereco.bairro),
          cidade: texto(endereco.cidade),
          referencia: texto(endereco.referencia),
          usuario: usuario.documentId,
        },
      });
    }

    const jwt = strapi.plugin('users-permissions').service('jwt').issue({ id: usuario.id });
    ctx.status = 201;
    ctx.body = { jwt, usuario: resposta(usuario, 'authenticated') };
  },
};
