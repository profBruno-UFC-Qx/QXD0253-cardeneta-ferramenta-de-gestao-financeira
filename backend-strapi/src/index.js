const api = (nome, acoes) => acoes.map((acao) => `api::${nome}.${nome}.${acao}`);

const LER = ['find', 'findOne'];

const CRUD = ['find', 'findOne', 'create', 'update', 'delete'];

const CONTA = ['me', 'atualizar'];


const LEITURA_PUBLICA = [
  ...api('categoria', LER),
  ...api('produto', LER),
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
    ...api('pedido', [...LER, 'update']),
    ...api('item-pedido', ['find']),
    ...api('conta', CONTA),
  ],

  gerente: [
    ...LEITURA_PUBLICA,
    ...api('pedido', CRUD),
    ...api('item-pedido', ['find']),
    ...api('conta', CONTA),
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
      await conceder(strapi, type, acoes);
    }



    await garantirLanchonete(strapi)

    if (process.env.SEED_DEMO === 'true') {
      await criarUsuariosDemo(strapi);
      await criarCardapioDemo(strapi);
    }
  },
};
