let loja = null;
let produtos = [];
let categorias = [];
let categoriaAtiva = '';
let paginaCardapio = 1;
const TAMANHO_PAGINA_CARDAPIO = 12;
const el = (id) => document.getElementById(id);

function renderLoja() {
  const box = el('loja-info');
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
      <div class="d-flex flex-wrap align-items-center gap-2 mb-1"><h1 class="fs-5 fw-bold mb-0">${esc(loja.nome)}</h1>${status}</div>
      ${loja.descricao ? `<p class="text-secondary mb-2 small">${esc(loja.descricao)}</p>` : ''}
      <div class="text-secondary d-flex flex-wrap column-gap-3 row-gap-1 small">${info('schedule', loja.horario)}${info('call', loja.telefone ? mascaraTelefone(loja.telefone) : '')}${info('location_on', loja.endereco)}</div>
    </div>
  </div>`;
}

function produtosFiltrados() {
  const termo = el('busca-cardapio').value.trim().toLocaleLowerCase('pt-BR');
  return produtos.filter((produto) => {
    const texto = `${produto.nome} ${produto.descricao || ''}`.toLocaleLowerCase('pt-BR');
    return (!categoriaAtiva || produto.categoria?.nome === categoriaAtiva) && (!termo || texto.includes(termo));
  });
}

function renderCategorias() {
  el('categorias').innerHTML = botoesCategoria(categorias, categoriaAtiva);
}

function cartaoProduto(p) {
  const imagem = urlImagem(p.imagem);
  const qtd = quantidadeNoCarrinho(p.documentId);
  const possuiAdicionais = (Array.isArray(p.adicionaisCatalogo) ? p.adicionaisCatalogo : []).some((a) => a.disponivel !== false);
  let acao;
  if (!p.disponivel) acao = '<button class="btn btn-outline-secondary w-100" type="button" disabled>Indisponível</button>';
  else if (ehStaff()) acao = '<span class="small text-secondary text-center">Pedidos disponíveis pelo Balcão</span>';
  else if (possuiAdicionais) acao = `<a href="produto.html#${esc(p.documentId)}" class="btn btn-warning w-100 fw-semibold text-dark text-decoration-none"><span class="material-symbols-outlined align-middle fs-6">tune</span> Personalizar</a>`;
  else if (qtd === 0) acao = `<button type="button" class="btn btn-warning w-100 fw-semibold" data-acao="mais" data-id="${esc(p.documentId)}"><span class="material-symbols-outlined align-middle fs-6">add_shopping_cart</span> Adicionar</button>`;
  else acao = seletorQuantidade(p.documentId, qtd);
  return `<article class="card cardapio-card h-100 overflow-hidden border-0 ${p.disponivel ? '' : 'opacity-75'}">
    <a href="produto.html#${esc(p.documentId)}" class="ratio ratio-4x3 bg-warning-subtle overflow-hidden" aria-label="Ver ${esc(p.nome)}">
      ${imagem ? `<img src="${esc(imagem)}" alt="${esc(p.nome)}" class="img-produto" loading="lazy">` : semImagemHtml('h-100 w-100')}
    </a>
    <div class="card-body d-flex flex-column gap-1 p-3">
      <p class="small text-secondary mb-0">${esc(p.categoria?.nome || 'Produto')}</p>
      <h2 class="fs-6 fw-bold mb-0 text-truncate"><a href="produto.html#${esc(p.documentId)}" class="text-dark text-decoration-none">${esc(p.nome)}</a></h2>
      <p class="text-secondary small mb-2">${dinheiro(p.preco)}</p>
      <div class="mt-auto">${acao}</div>
    </div>
  </article>`;
}

function renderProdutos() {
  const filtrados = produtosFiltrados();
  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / TAMANHO_PAGINA_CARDAPIO));
  paginaCardapio = Math.min(paginaCardapio, totalPaginas);
  const inicio = (paginaCardapio - 1) * TAMANHO_PAGINA_CARDAPIO;
  const visiveis = filtrados.slice(inicio, inicio + TAMANHO_PAGINA_CARDAPIO);
  el('lista').innerHTML = visiveis.length
    ? visiveis.map((p) => `<div class="col">${cartaoProduto(p)}</div>`).join('')
    : estadoVazio('search_off', 'Nenhum produto encontrado');
  el('paginacao-cardapio').innerHTML = paginacaoHtml(filtrados.length, paginaCardapio, TAMANHO_PAGINA_CARDAPIO);
  renderBarra();
}

function renderBarra() {
  const barra = el('barra-carrinho');
  const n = totalItens();
  barra.classList.toggle('d-none', n === 0);
  if (n === 0) return;
  barra.innerHTML = `<a href="carrinho.html" class="d-flex align-items-center justify-content-between rounded-3 bg-warning px-3 py-2 fw-bold text-dark text-decoration-none shadow">
    <span class="d-flex align-items-center gap-2"><span class="material-symbols-outlined">shopping_bag</span>${n} ${n === 1 ? 'item' : 'itens'}</span>
    <span>Ver carrinho · ${dinheiro(totalCarrinho())}</span>
  </a>`;
}

async function iniciar() {
  const lista = el('lista');
  if (new URLSearchParams(window.location.search).get('rota-invalida') === '1') {
    const aviso = document.createElement('div');
    aviso.className = 'alert alert-info py-2 small';
    aviso.setAttribute('role', 'status');
    aviso.textContent = 'A rota ou página solicitada não existe. Você está no Cardápio.';
    el('conteudo').prepend(aviso);
    window.history.replaceState({}, document.title, 'index.html');
  }
  lista.innerHTML = estadoVazio('hourglass_top', 'Carregando cardápio...');
  el('busca-cardapio').addEventListener('input', () => { paginaCardapio = 1; renderProdutos(); });
  try {
    const [cats, prods, dadosLoja] = await Promise.all([
      apiTodos('/categorias', { sort: 'nome:asc' }),
      apiTodos('/produtos', { populate: '*', sort: 'nome:asc' }),
      carregarLoja(),
    ]);
    categorias = cats;
    produtos = prods;
    loja = dadosLoja;
    renderLoja();
    renderCategorias();
    renderProdutos();
  } catch (erro) {
    const codigosHtml = [400, 401, 403, 500, 503];
    if (codigosHtml.includes(erro.status)) {
      window.location.replace(`/${erro.status}.html`);
      return;
    }
    const indisponivel = erro.status === 503 || erro.code === 'STRAPI_UNAVAILABLE';
    lista.innerHTML = `<div class="col-12">
      <section class="card border-0 shadow-sm p-4 p-md-5 text-center" role="alert" aria-labelledby="erro-cardapio-titulo">
        <span class="material-symbols-outlined display-5 text-secondary mb-3">${indisponivel ? 'cloud_off' : 'warning'}</span>
        <p class="small fw-bold text-warning-emphasis text-uppercase mb-2">${indisponivel ? 'Serviço indisponível · erro 503' : 'Não foi possível carregar'}</p>
        <h2 class="fs-5 fw-bold" id="erro-cardapio-titulo">${indisponivel ? 'Não conseguimos conectar ao servidor' : 'Não foi possível carregar o cardápio'}</h2>
        <p class="text-secondary mb-3">${indisponivel ? 'Verifique se o Strapi está iniciado em localhost:1337 e tente novamente.' : esc(erro.message)}</p>
        <div><button class="btn btn-warning fw-semibold" type="button" onclick="location.reload()"><span class="material-symbols-outlined align-middle me-1">refresh</span>Tentar novamente</button></div>
      </section>
    </div>`;
  }
  el('categorias').addEventListener('click', (e) => {
    const botao = e.target.closest('[data-categoria]');
    if (!botao) return;
    categoriaAtiva = botao.dataset.categoria;
    paginaCardapio = 1;
    renderCategorias();
    renderProdutos();
  });
  el('paginacao-cardapio').addEventListener('click', (e) => {
    const botao = e.target.closest('[data-pagina]');
    if (!botao || botao.disabled) return;
    paginaCardapio = Number(botao.dataset.pagina);
    renderProdutos();
    el('lista').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  lista.addEventListener('click', (e) => {
    const botao = e.target.closest('[data-acao]');
    if (!botao) return;
    const id = botao.dataset.id;
    if (botao.dataset.acao === 'mais') {
      const produto = produtos.find((p) => p.documentId === id);
      if (quantidadeNoCarrinho(id) === 0) adicionarAoCarrinho(produto);
      else alterarQuantidade(id, 1);
    } else alterarQuantidade(id, -1);
    renderProdutos();
  });
}

if (montarLayout()) iniciar();
