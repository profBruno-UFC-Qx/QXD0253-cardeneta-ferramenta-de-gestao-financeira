const { factories } = require('@strapi/strapi');

const UID = 'api::lanchonete.lanchonete';
const CAMPOS_TEXTO = [
  ['nome', 120, true],
  ['descricao', 2000, false],
  ['telefone', 30, false],
  ['endereco', 300, false],
  ['horario', 500, false],
];
const CAMPOS_PERMITIDOS = new Set([
  ...CAMPOS_TEXTO.map(([campo]) => campo),
  'aberta',
  'taxaEntrega',
  'logo',
]);

function validarConfiguracao(dados) {
  if (!dados || typeof dados !== 'object' || Array.isArray(dados)) {
    return { erro: 'Envie os dados da lanchonete no campo data' };
  }

  const desconhecidos = Object.keys(dados).filter((campo) => !CAMPOS_PERMITIDOS.has(campo));
  if (desconhecidos.length) return { erro: `Campo não permitido: ${desconhecidos[0]}` };

  const saida = {};
  for (const [campo, maximo, obrigatorio] of CAMPOS_TEXTO) {
    if (!Object.prototype.hasOwnProperty.call(dados, campo)) continue;
    const valor = dados[campo];
    if (valor === null && !obrigatorio) {
      saida[campo] = null;
      continue;
    }
    if (typeof valor !== 'string') return { erro: `O campo ${campo} deve ser texto` };
    const texto = valor.trim();
    if (obrigatorio && texto.length < 2) return { erro: 'Informe o nome da lanchonete' };
    if (texto.length > maximo) return { erro: `O campo ${campo} excede o limite de ${maximo} caracteres` };
    saida[campo] = texto;
  }

  if (Object.prototype.hasOwnProperty.call(dados, 'aberta')) {
    if (typeof dados.aberta !== 'boolean') return { erro: 'O estado da lanchonete deve ser verdadeiro ou falso' };
    saida.aberta = dados.aberta;
  }

  if (Object.prototype.hasOwnProperty.call(dados, 'taxaEntrega')) {
    const bruto = dados.taxaEntrega;
    if (bruto === null || bruto === '' || typeof bruto === 'boolean') {
      return { erro: 'Informe uma taxa de entrega válida' };
    }
    const valor = Number(bruto);
    if (!Number.isFinite(valor) || valor < 0 || valor > 999999.99) {
      return { erro: 'A taxa de entrega deve estar entre R$ 0,00 e R$ 999.999,99' };
    }
    saida.taxaEntrega = Math.round((valor + Number.EPSILON) * 100) / 100;
  }

  if (Object.prototype.hasOwnProperty.call(dados, 'logo')) {
    const logo = dados.logo;
    if (logo === null) saida.logo = null;
    else {
      const id = Number(logo);
      if (!Number.isSafeInteger(id) || id < 1) return { erro: 'A imagem do logo não é válida' };
      saida.logo = id;
    }
  }

  if (!Object.keys(saida).length) return { erro: 'Nenhuma informação para salvar' };
  return { saida };
}

module.exports = factories.createCoreController(UID, ({ strapi }) => ({
  async gerenciar(ctx) {
    const sessao = ctx.state.user;
    if (!sessao?.id) return ctx.unauthorized('Sessão inválida ou expirada');

    const usuario = await strapi.db.query('plugin::users-permissions.user').findOne({
      where: { id: sessao.id },
      populate: ['role'],
    });

    if (!usuario) return ctx.unauthorized('Usuário não encontrado');

    if (usuario.role?.type !== 'gerente') {
      return ctx.forbidden('Apenas o gerente pode alterar os dados da lanchonete');
    }

    const { saida, erro } = validarConfiguracao(ctx.request.body?.data);
    if (erro) return ctx.badRequest(erro);

    const documentos = strapi.documents(UID);
    const atual = await documentos.findFirst();
    if (!atual?.documentId) return ctx.notFound('Lanchonete não encontrada');

    const atualizado = await documentos.update({
      documentId: atual.documentId,
      data: saida,
      populate: ['logo'],
    });

    const limpo = await strapi.contentAPI.sanitize.output(atualizado, strapi.getModel(UID), {
      auth: ctx.state.auth,
    });

    return { data: limpo };
  },
}));
