const { factories } = require('@strapi/strapi');
const { texto } = require('../../../utils/validacao');

const CAMPOS = ['rotulo', 'destinatario', 'telefone', 'cep', 'rua', 'numero', 'complemento', 'bairro', 'cidade', 'referencia'];
const UID = 'api::endereco.endereco';

const limpar = (dados = {}) => Object.fromEntries(CAMPOS.filter((c) => c in dados).map((c) => [c, texto(dados[c])]));

async function enderecoDoUsuario(ctx) {
  return strapi.db.query(UID).findOne({
    where: { documentId: ctx.params.id, usuario: { id: ctx.state.user.id } },
  });
}

module.exports = factories.createCoreController('api::endereco.endereco', () => ({
  async find(ctx) {
    const enderecos = await strapi.db.query(UID).findMany({
      where: { usuario: { id: ctx.state.user.id } },
      orderBy: { createdAt: 'desc' },
    });
    const limpos = await this.sanitizeOutput(enderecos, ctx);
    return this.transformResponse(limpos);
  },

  async findOne(ctx) {
    const endereco = await enderecoDoUsuario(ctx);
    if (!endereco) return ctx.notFound();
    const limpo = await this.sanitizeOutput(endereco, ctx);
    return this.transformResponse(limpo);
  },

  async create(ctx) {
    const dados = limpar(ctx.request.body?.data);
    if (!dados.destinatario || !dados.rua || !dados.numero || !dados.bairro) {
      return ctx.badRequest('Preencha destinatário, rua, número e bairro');
    }
    const endereco = await strapi.documents('api::endereco.endereco').create({
      data: { ...dados, usuario: ctx.state.user.documentId },
    });
    const limpo = await this.sanitizeOutput(endereco, ctx);
    ctx.status = 201;
    return this.transformResponse(limpo);
  },

  async update(ctx) {
    if (!(await enderecoDoUsuario(ctx))) return ctx.notFound();
    ctx.request.body = { data: limpar(ctx.request.body?.data) };
    return super.update(ctx);
  },

  async delete(ctx) {
    if (!(await enderecoDoUsuario(ctx))) return ctx.notFound();
    return super.delete(ctx);
  },
}));
