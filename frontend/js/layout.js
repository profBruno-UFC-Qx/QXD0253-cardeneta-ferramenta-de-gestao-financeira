const MENU_PAINEL = [
  { href: 'pedidos.html', icone: 'receipt_long', rotulo: 'Pedidos', papeis: ['atendente', 'gerente'] },
  { href: 'index.html', icone: 'storefront', rotulo: 'Cardápio', papeis: ['atendente', 'gerente'] },
];

const ROTULO_PAPEL = { authenticated: 'Cliente', atendente: 'Atendente', gerente: 'Gerente' };
const BOTAO_ICONE = 'btn btn-light p-2 rounded-circle text-secondary d-flex align-items-center justify-content-center';

function iniciais(nome) {
  return String(nome || '?').trim().split(/\s+/).slice(0, 2).map((p) => p[0].toUpperCase()).join('');
}

function marcaHtml() {
  return `<span data-marca-logo class="ratio ratio-1x1 flex-shrink-0 rounded-3 overflow-hidden" style="width:36px;height:36px"><span class="d-flex align-items-center justify-content-center bg-warning text-dark"><span class="material-symbols-outlined fs-5">storefront</span></span></span>
    <span data-marca-nome class="text-truncate fw-bold fs-5 text-dark">Caderneta</span>`;
}

function botaoSair(rotulo = false) {
  return `<button type="button" data-sair class="${BOTAO_ICONE}" aria-label="Sair"><span class="material-symbols-outlined">logout</span>${rotulo ? '<span class="ms-2 small">Sair</span>' : ''}</button>`;
}

function aplicarMarca() {
  carregarLoja().then((loja) => {
    if (!loja) return;
    document.querySelectorAll('[data-marca-nome]').forEach((el) => { el.textContent = loja.nome; });
    if (loja.logo) {
      document.querySelectorAll('[data-marca-logo]').forEach((el) => {
        el.innerHTML = `<img src="${esc(urlImagem(loja.logo))}" class="object-fit-cover" alt="">`;
      });
    }
    document.title = `${document.title.split(' - ')[0]} - ${loja.nome}`;
  });
}

function montarLoja(conteudo) {
  const usuario = getUsuario();
  const atual = papel();
  const topo = document.createElement('header');
  topo.className = 'app-header position-sticky top-0 z-3';
  topo.innerHTML = `<div class="mx-auto d-flex py-2 container-xl align-items-center gap-2 px-3">
    <a href="index.html" class="me-auto d-flex overflow-hidden align-items-center gap-2 text-decoration-none">${marcaHtml()}</a>
    ${atual === 'authenticated' ? `<a href="perfil.html" class="${BOTAO_ICONE} text-decoration-none" aria-label="Minha conta"><span class="material-symbols-outlined">person</span></a>` : ''}
    ${atual === 'authenticated' ? `<a href="meus-pedidos.html" class="${BOTAO_ICONE} text-decoration-none" aria-label="Meus pedidos"><span class="material-symbols-outlined">receipt_long</span></a>` : ''}
    ${ehStaff() ? `<a href="${paginaInicial()}" class="${BOTAO_ICONE} text-decoration-none" aria-label="Painel"><span class="material-symbols-outlined">space_dashboard</span></a>` : ''}
    <a href="carrinho.html" class="position-relative ${BOTAO_ICONE} text-decoration-none" aria-label="Carrinho">
      <span class="material-symbols-outlined">shopping_bag</span>
      <span id="badge-carrinho" class="position-absolute end-0 top-0 d-flex d-none align-items-center justify-content-center rounded-pill bg-warning px-2 small fw-bold text-dark"></span>
    </a>
    ${usuario ? botaoSair() : '<a href="login.html" class="btn btn-warning fw-semibold px-3 rounded-3 text-dark ms-2">Entrar</a>'}
  </div>`;
  conteudo.before(topo);
  atualizarBadge();
}

function montarPainel(conteudo) {
  const usuario = getUsuario();
  const atual = paginaAtual();
  const itens = MENU_PAINEL.filter((i) => i.papeis.includes(papel()));

  const linkLateral = (i) => {
    const ativo = i.href === atual;
    const classe = ativo ? 'bg-warning-subtle text-warning-emphasis fw-bold' : 'text-secondary';
    return `<a href="${i.href}" class="d-flex align-items-center gap-3 rounded-3 px-3 py-2 small text-decoration-none ${classe}"><span class="material-symbols-outlined">${i.icone}</span>${i.rotulo}</a>`;
  };

  const lateral = document.createElement('aside');
  lateral.className = 'position-sticky top-0 d-none min-vh-100 d-print-none flex-shrink-0 flex-column border-end border-secondary-subtle bg-white d-md-flex';
  lateral.style.width = '240px';

  lateral.innerHTML = `<a href="${paginaInicial()}" class="d-flex align-items-center gap-3 p-3 text-decoration-none border-bottom border-secondary-subtle mb-2">${marcaHtml()}</a>
    <nav class="flex-fill vstack gap-1 overflow-y-auto px-3 py-2">${itens.map(linkLateral).join('')}</nav>

    <div class="d-flex align-items-center gap-3 border-top border-secondary-subtle p-3 mt-auto">
      <div class="d-flex flex-shrink-0 align-items-center justify-content-center rounded-circle bg-warning text-dark fw-bold" style="width: 36px; height: 36px; font-size: 14px;">
        ${esc(iniciais(nomeUsuario()))}
      </div>
      <div class="overflow-hidden flex-fill">
        <p class="text-truncate small fw-bold mb-0 text-dark">${esc(nomeUsuario())}</p>
        <p class="text-secondary mb-0" style="font-size: 0.75rem;">${ROTULO_PAPEL[papel()]}</p>
      </div>
      ${botaoSair()}
    </div>`;

  const topo = document.createElement('header');
  topo.className = 'position-sticky top-0 d-flex py-2 align-items-center justify-content-between border-bottom border-secondary-subtle bg-white px-3 d-md-none d-print-none';
  topo.innerHTML = `<a href="${paginaInicial()}" class="d-flex overflow-hidden align-items-center gap-3 text-decoration-none">${marcaHtml()}</a><div class="d-flex align-items-center">${botaoSair()}</div>`;

  const principais = itens.length > 5 ? itens.slice(0, 4) : itens;
  const extras = itens.length > 5 ? itens.slice(4) : [];

  const linkInferior = (i) => {
    const ativo = i.href === atual;
    return `<a href="${i.href}" class="d-flex h-100 flex-fill flex-column align-items-center justify-content-center gap-1 text-decoration-none ${ativo ? 'text-warning-emphasis ' : 'text-secondary '}"><span class="material-symbols-outlined ">${i.icone}</span><span class="small fw-medium">${i.rotulo}</span></a>`;
  };

  const inferior = document.createElement('nav');
  inferior.className = 'position-fixed start-0 end-0 bottom-0 d-flex py-2 d-print-none align-items-center justify-content-around border-top border-secondary-subtle bg-white px-3 d-md-none';
  inferior.innerHTML = principais.map(linkInferior).join('') + (extras.length
    ? `<button type="button" data-abrir="menu-mais" class="d-flex h-100 flex-fill flex-column align-items-center justify-content-center gap-1 text-secondary border-0 bg-transparent"><span class="material-symbols-outlined">menu</span><span class="small fw-medium">Mais</span></button>`
    : '');

  const mais = document.createElement('dialog');
  mais.id = 'menu-mais';
  mais.className = 'w-100 mw-100 rounded-top-3 rounded-bottom-0 bg-white p-3 d-md-none shadow-lg border-0';
  mais.innerHTML = `<div class="mx-auto container-sm vstack gap-3">${extras.map(linkLateral).join('')}
    <button type="button" data-sair class="d-flex w-100 align-items-center gap-3 rounded-3 px-3 py-2 small fw-medium text-danger border-0 bg-transparent"><span class="material-symbols-outlined">logout</span>Sair</button></div>`;

  const coluna = document.createElement('div');
  // AQUI ESTAVA O PROBLEMA: removemos o mb-2 e deixamos o flex-fill puro
  coluna.className = 'd-flex min-vh-100 overflow-hidden flex-fill flex-column bg-light';
  conteudo.before(coluna);
  coluna.append(topo, conteudo);
  document.body.prepend(lateral);
  document.body.append(inferior, mais);
}

function ligarEventosGlobais() {
  document.addEventListener('input', (e) => {
    const tipo = e.target.dataset?.mascara;
    if (tipo === 'cpf') e.target.value = mascaraCpf(e.target.value);
    if (tipo === 'telefone') e.target.value = mascaraTelefone(e.target.value);
  });
  document.addEventListener('click', (e) => {
    const alvo = e.target.closest('[data-sair],[data-abrir],[data-fechar]');
    if (!alvo) return;
    if (alvo.hasAttribute('data-sair')) sair();
    if (alvo.hasAttribute('data-abrir')) document.getElementById(alvo.dataset.abrir).showModal();
    if (alvo.hasAttribute('data-fechar')) alvo.closest('dialog').close();
  });
  document.addEventListener('click', (e) => {
    if (e.target instanceof HTMLDialogElement) e.target.close();
  });
}

function montarLayout() {
  const conteudo = document.getElementById('conteudo');
  const area = document.body.dataset.area;
  const permitidos = document.body.dataset.papeis;

  if (permitidos && !exigirPapel(permitidos.split(','))) return false;

  if (area === 'painel') montarPainel(conteudo);
  if (area === 'loja') montarLoja(conteudo);

  ligarEventosGlobais();
  aplicarMarca();
  return true;
}
