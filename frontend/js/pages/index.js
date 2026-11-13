let loja = null;
let produtos = [];
let categorias = [];
let categoriaAtiva = '';

function renderLoja() {
  const box = document.getElementById('loja-info');
  if (!loja) {
    box.innerHTML = '<p class="small text-secondary mb-0">Não foi possível carregar os dados da lanchonete.</p>';
    return;
  }
  const logo = loja.logo
    ? `<img src="${esc(urlImagem(loja.logo))}" class="object-fit-cover rounded-3" style="width:64px;height:64px" alt="Logo">`
    : '<span class="d-flex rounded-3 align-items-center justify-content-center bg-warning-subtle text-warning-emphasis" style="width:64px;height:64px"><span class="material-symbols-outlined fs-3">storefront</span></span>';
  const status = loja.aberta
    ? '<span class="badge-status badge-aberta"><span class="dot bg-success"></span>Aberta</span>'
    : '<span class="badge-status badge-fechada"><span class="dot bg-danger"></span>Fechada no momento</span>';
  const info = (icone, texto) => (texto
    ? `<span class="d-inline-flex align-items-center gap-2"><span class="material-symbols-outlined fs-6">${icone}</span>${esc(texto)}</span>`
    : '');

  box.innerHTML = `<div class="d-flex align-items-center gap-3">
    ${logo}
    <div class="overflow-hidden flex-fill">
      <div class="d-flex flex-wrap align-items-center gap-2 mb-1">
        <h1 class="fs-5 fw-bold mb-0">${esc(loja.nome)}</h1>${status}
      </div>
      ${loja.descricao ? `<p class="text-secondary mb-2 small">${esc(loja.descricao)}</p>` : ''}
      <div class="text-secondary d-flex flex-wrap column-gap-3 row-gap-1 small">
        ${info('schedule', loja.horario)}${info('call', loja.telefone ? mascaraTelefone(loja.telefone) : '')}${info('location_on', loja.endereco)}
      </div>
    </div>
  </div>`;
}

function renderCategorias() {
  document.getElementById('categorias').innerHTML = categorias.length || categoriaAtiva !== ''
    ? botoesCategoria(categorias, categoriaAtiva)
    : '';
}

function cartaoProduto(p) {
  const imagem = urlImagem(p.imagem);
  const qtd = quantidadeNoCarrinho(p.documentId);
  let acao;
  if (!p.disponivel) acao = '<span class="small fw-semibold text-danger">Indisponível</span>';
  else if (ehStaff()) acao = '<span class="text-secondary small">Acesso da equipe</span>';
  else if (qtd === 0) acao = `<button type="button" class="btn btn-warning btn-add d-flex align-items-center gap-1 text-dark" data-acao="mais" data-id="${esc(p.documentId)}"><span class="material-symbols-outlined fs-6">add</span>Adicionar</button>`;
  else acao = seletorQuantidade(p.documentId, qtd);

  return `<div class="card card-produto border-0 shadow-sm flex-row align-items-center p-3 h-100 ${p.disponivel ? '' : 'opacity-75'}">
    <a href="produto.html#${esc(p.documentId)}" class="flex-shrink-0 rounded-3 overflow-hidden me-3" style="width:80px;height:80px" aria-label="Ver ${esc(p.nome)}">
      ${imagem
      ? `<img src="${esc(imagem)}" alt="${esc(p.nome)}" loading="lazy" class="img-produto">`
      : semImagemHtml('img-produto')}
    </a>
    <div class="d-flex flex-column flex-fill overflow-hidden">
      <h2 class="fs-6 fw-bold mb-1 text-truncate"><a href="produto.html#${esc(p.documentId)}" class="text-dark text-decoration-none">${esc(p.nome)}</a></h2>
      <p class="text-secondary small mb-2 line-clamp-2">${esc(p.descricao)}</p>
      <div class="mt-auto d-flex align-items-center justify-content-between gap-2">
        <strong class="fs-6">${dinheiro(p.preco)}</strong>${acao}
      </div>
    </div>
  </div>`;
}

function renderProdutos() {
  const lista = produtos.filter((p) => (!categoriaAtiva || p.categoria?.nome === categoriaAtiva));
  document.getElementById('lista').innerHTML = lista.length
    ? lista.map((p) => `<div class="col">${cartaoProduto(p)}</div>`).join('')
    : estadoVazio('search_off', 'Nenhum produto nesta categoria');
  renderBarra();
}

function renderBarra() {
  const barra = document.getElementById('barra-carrinho');
  const n = totalItens();
  barra.classList.toggle('d-none', n === 0);
  if (n === 0) return;
  barra.innerHTML = `<a href="carrinho.html" class="d-flex align-items-center justify-content-between rounded-3 bg-warning px-3 py-2 fw-bold text-dark text-decoration-none shadow">
    <span class="d-flex align-items-center gap-2"><span class="material-symbols-outlined">shopping_bag</span>${n} ${n === 1 ? 'item' : 'itens'}</span>
    <span>Ver carrinho · ${dinheiro(totalCarrinho())}</span>
  </a>`;
}

async function iniciar() {
  const lista = document.getElementById('lista');
  lista.innerHTML = estadoVazio('hourglass_top', 'Carregando cardápio...');
  try {
    const [cats, prods, dadosLoja] = await Promise.all([
      api('/categorias?sort=nome', { auth: false }),
      api('/produtos' + qs({ populate: '*', sort: 'nome', 'pagination[pageSize]': 100 }), { auth: false }),
      carregarLoja(),
    ]);
    categorias = cats.data;
    produtos = prods.data;
    loja = dadosLoja;
    renderLoja();
    renderCategorias();
    renderProdutos();
  } catch (erro) {
    lista.innerHTML = estadoVazio('cloud_off', 'Não foi possível carregar o cardápio', esc(erro.message));
  }

  document.getElementById('categorias').addEventListener('click', (e) => {
    const botao = e.target.closest('[data-categoria]');
    if (!botao) return;
    categoriaAtiva = botao.dataset.categoria;
    renderCategorias();
    renderProdutos();
  });

  lista.addEventListener('click', (e) => {
    const botao = e.target.closest('[data-acao]');
    if (!botao) return;
    const id = botao.dataset.id;
    if (botao.dataset.acao === 'mais') {
      const produto = produtos.find((p) => p.documentId === id);
      if (quantidadeNoCarrinho(id) === 0) adicionarAoCarrinho(produto);
      else alterarQuantidade(id, 1);
    } else {
      alterarQuantidade(id, -1);
    }
    renderProdutos();
  });
}

if (montarLayout()) iniciar();
