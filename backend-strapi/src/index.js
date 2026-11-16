const api = (nome, acoes) => acoes.map((acao) => `api::${nome}.${nome}.${acao}`);

const LER = ['find', 'findOne'];

const CRUD = ['find', 'findOne', 'create', 'update', 'delete'];

const CONTA = ['me', 'atualizar'];
const FINANCEIRO = api('despesa', CRUD);
const ADICIONAIS = api('adicional', CRUD);
const RELATORIOS = ['api::relatorio.relatorio.resumo'];


const LEITURA_PUBLICA = [
  ...api('categoria', LER),
  ...api('produto', LER),
  ...api('adicional', LER),
  ...api('lanchonete', ['find']),
];



const PERMISSOES = {
  public: LEITURA_PUBLICA,
  authenticated: [
    ...LEITURA_PUBLICA,
    ...api('pedido', [...LER, 'create']),
    ...api('item-pedido', ['find']),
    ...api('endereco', CRUD),
    ...api('conta', CONTA),
  ],
  atendente: [
    ...LEITURA_PUBLICA,
    ...api('produto', ['update']),
    ...api('pedido', [...LER, 'create', 'update']),
    ...api('item-pedido', ['find']),
    ...api('conta', CONTA),
  ],

  gerente: [
    ...LEITURA_PUBLICA,
    ...api('categoria', CRUD),
    ...api('produto', CRUD),
    ...api('pedido', CRUD),
    ...api('item-pedido', ['find']),
    ...api('equipe', ['listar', 'criar', 'atualizar']),
    ...FINANCEIRO,
    ...ADICIONAIS,
    ...RELATORIOS,
    ...api('conta', CONTA),
    'plugin::upload.content-api.upload',
    'plugin::upload.content-api.destroy',
  ],

};

const UPLOAD_ACOES = ['upload', 'find', 'findOne', 'destroy']
  .map((acao) => `plugin::upload.content-api.${acao}`);
const EQUIPE_ACOES = api('equipe', ['listar', 'criar', 'atualizar']);
const PERMISSOES_NEGADAS = {
  public: [
    ...api('categoria', ['create', 'update', 'delete']),
    ...api('produto', ['create', 'update', 'delete']),
    ...EQUIPE_ACOES,
    ...FINANCEIRO,
    ...api('adicional', ['create', 'update', 'delete']),
    ...RELATORIOS,
    ...UPLOAD_ACOES,
  ],
  authenticated: [
    ...api('categoria', ['create', 'update', 'delete']),
    ...api('produto', ['create', 'update', 'delete']),
    ...EQUIPE_ACOES,
    ...FINANCEIRO,
    ...api('adicional', ['create', 'update', 'delete']),
    ...RELATORIOS,
    ...UPLOAD_ACOES,
  ],
  atendente: [
    ...api('categoria', ['create', 'update', 'delete']),
    ...api('produto', ['create', 'delete']),
    ...EQUIPE_ACOES,
    ...FINANCEIRO,
    ...api('adicional', ['create', 'update', 'delete']),
    ...RELATORIOS,
    ...UPLOAD_ACOES,
  ],
};

async function garantirPapel(strapi, name, type, description) {
  const papeis = strapi.db.query('plugin::users-permissions.role');
  const existente = await papeis.findOne({ where: { type } });
  if (existente) return existente;
  return papeis.create({ data: { name, type, description } });
}



async function conceder(strapi, type, acoes) {
  const papeis = strapi.db.query('plugin::users-permissions.role');
  const permissoes = strapi.db.query('plugin::users-permissions.permission');
  const papel = await papeis.findOne({ where: { type } });
  if (!papel) {
    strapi.log.warn(`Papel "${type}" não encontrado. Reinicie o Strapi.`);
    return;
  }



  for (const action of acoes) {
    const existente = await permissoes.findOne({ where: { action, role: papel.id } });
    if (!existente) await permissoes.create({ data: { action, role: papel.id } });
  }
}

async function revogar(strapi, type, acoes) {
  const papel = await strapi.db.query('plugin::users-permissions.role').findOne({ where: { type } });
  if (!papel) return;
  const permissoes = strapi.db.query('plugin::users-permissions.permission');
  for (const action of acoes) {
    const existente = await permissoes.findOne({ where: { action, role: papel.id } });
    if (existente) await permissoes.delete({ where: { id: existente.id } });
  }
}

async function garantirLanchonete(strapi) {
  const lojas = strapi.documents('api::lanchonete.lanchonete');
  if (await lojas.findFirst()) return;



  await lojas.create({
    data: {
      nome: 'BG Lanches',
      descricao: 'Lanches, porções e bebidas em Quixeramobim.',
      horario: 'Todos os dias, das 18h às 23h',
      aberta: true,
    },
  });
}


async function criarUsuariosDemo(strapi) {
  const senha = process.env.DEMO_USER_PASSWORD;
  if (!senha || senha.length < 12) {
    strapi.log.warn(
      'Contas demo não criadas: defina DEMO_USER_PASSWORD com pelo menos 12 caracteres no .env local.'
    );

    return;
  }

  const usuarios = [
    { nome: 'Gerente de teste', email: 'gerente@caderneta.com', telefone: '88999990001', role: 'gerente' },
    { nome: 'Atendente de teste', email: 'atendente@caderneta.com', telefone: '88999990002', role: 'atendente' },
    { nome: 'Cliente de teste', email: 'cliente@caderneta.com', telefone: '88999990003', cpf: '52998224725', role: 'authenticated' },
  ];


  const consultaUsuarios = strapi.db.query('plugin::users-permissions.user');
  const consultaPapeis = strapi.db.query('plugin::users-permissions.role');
  const servicoUsuarios = strapi.plugin('users-permissions').service('user');



  for (const usuario of usuarios) {
    if (await consultaUsuarios.findOne({ where: { email: usuario.email } })) continue;

    const papel = await consultaPapeis.findOne({ where: { type: usuario.role } });
    if (!papel) {
      strapi.log.warn(`Conta demo ignorada: papel "${usuario.role}" não encontrado.`);
      continue;
    }




    await servicoUsuarios.add({
      username: usuario.email,
      nome: usuario.nome,
      email: usuario.email,
      telefone: usuario.telefone,
      cpf: usuario.cpf,
      password: senha,
      provider: 'local',
      confirmed: true,
      blocked: false,
      role: papel.id,
    });
  }
}




async function migrarAdicionaisLegados(strapi) {
  const produtos = strapi.documents('api::produto.produto');
  const catalogo = strapi.documents('api::adicional.adicional');
  let pagina = 1;
  let migrados = 0;
  while (true) {
    const lote = await produtos.findMany({
      populate: ['adicionaisCatalogo'],
      pagination: { page: pagina, pageSize: 100 },
    });
    if (!lote.length) break;
    for (const produto of lote) {
      if (produto.adicionaisMigrados) continue;
      const ids = new Set((Array.isArray(produto.adicionaisCatalogo) ? produto.adicionaisCatalogo : [])
        .map((adicional) => adicional.documentId).filter(Boolean));
      const antigos = Array.isArray(produto.adicionais) ? produto.adicionais : [];
      for (const antigo of antigos) {
        const nome = String(antigo?.nome || '').trim().slice(0, 80);
        const preco = Number(antigo?.preco);
        if (nome.length < 2 || !Number.isFinite(preco) || preco < 0 || preco > 10000) continue;
        let encontrados = await catalogo.findMany({
          filters: { nome, preco: Math.round(preco * 100) / 100 },
          pagination: { page: 1, pageSize: 1 },
        });
        let adicional = encontrados[0];
        if (!adicional) {
          adicional = await catalogo.create({
            data: { nome, preco: Math.round(preco * 100) / 100, disponivel: antigo.disponivel !== false },
          });
        }
        if (adicional?.documentId) ids.add(adicional.documentId);
      }
      await produtos.update({
        documentId: produto.documentId,
        data: { adicionaisCatalogo: { set: [...ids] }, adicionaisMigrados: true },
      });
      migrados++;
    }
    if (lote.length < 100) break;
    pagina++;
  }
  if (migrados) strapi.log.info(`Migração do catálogo: ${migrados} produto(s) conferido(s); JSON legado preservado.`);
}
async function criarCardapioDemo(strapi) {
  const categorias = strapi.documents('api::categoria.categoria');
  if ((await categorias.count({})) > 0) return;

  const cardapio = {

    Lanches: [
      { nome: 'X-Burger', descricao: 'Pão, hambúrguer, queijo e salada', preco: 15 },
      { nome: 'X-Bacon', descricao: 'Pão, hambúrguer, queijo e bacon', preco: 18 },
    ],


    Bebidas: [
      { nome: 'Refrigerante lata', descricao: '350 ml', preco: 6 },
      { nome: 'Suco natural', descricao: 'Sabor do dia, 400 ml', preco: 8 },
    ],


    Porções: [
      { nome: 'Batata frita', descricao: 'Porção média', preco: 14 },
    ],
  };

  for (const [nome, itens] of Object.entries(cardapio)) {
    const categoria = await categorias.create({ data: { nome } });
    for (const item of itens) {
      await strapi.documents('api::produto.produto').create({
        data: { ...item, disponivel: true, categoria: categoria.documentId },
      });
    }
  }
}



module.exports = {
  register() { },

  async bootstrap({ strapi }) {
    await garantirPapel(strapi, 'Atendente', 'atendente', 'Funcionário da lanchonete');
    await garantirPapel(strapi, 'Gerente', 'gerente', 'Dono ou gerente da lanchonete');


    for (const [type, acoes] of Object.entries(PERMISSOES)) {
      await revogar(strapi, type, PERMISSOES_NEGADAS[type] || []);
      await conceder(strapi, type, acoes);
    }



    try { await migrarAdicionaisLegados(strapi); }
    catch (erro) { strapi.log.error(`Falha ao migrar adicionais legados; JSON original preservado: ${erro.message}`); }
    await garantirLanchonete(strapi)

    if (process.env.SEED_DEMO === 'true') {
      await criarUsuariosDemo(strapi);
      await criarCardapioDemo(strapi);
    }
  },
};
