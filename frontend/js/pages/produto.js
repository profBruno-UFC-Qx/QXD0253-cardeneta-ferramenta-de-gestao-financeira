let produto = null;
let quantidade = 1;

function renderProduto() {
  const imagem = urlImagem(produto.imagem);
  const preco = Number(produto.preco);
  const podeComprar = produto.disponivel && !ehStaff();

  document.getElementById('produto').innerHTML = `
    <div class="col-12 col-md-6">
      <div class="ratio ratio-1x1 rounded-4 overflow-hidden bg-white shadow-sm">
        ${imagem
      ? `<img src="${esc(imagem)}" alt="${esc(produto.nome)}" class="w-100 h-100 object-fit-cover">`
      : semImagemHtml('w-100 h-100')}
      </div>
    </div>
    <div class="col-12 col-md-6 d-flex flex-column gap-3">
      <div>
        ${produto.categoria ? `<span class="d-inline-flex rounded-pill bg-warning px-3 py-2 small fw-semibold text-dark mb-2">${esc(produto.categoria.nome)}</span>` : ''}
        <h1 class="fs-2 fw-bold mb-2">${esc(produto.nome)}</h1>
        <p class="fs-4 fw-bold text-warning-emphasis mb-0">${dinheiro(preco)}</p>
      </div>
      ${produto.descricao ? `<p class="text-secondary lh-base mb-0">${esc(produto.descricao)}</p>` : ''}
      ${podeComprar
      ? `<div class="d-flex align-items-center gap-3 mt-3">
            <div class="d-inline-flex align-items-center rounded-3 border border-secondary-subtle bg-white">
              <button type="button" data-qtd="-1" class="btn btn-light d-flex align-items-center justify-content-center rounded-start py-2 px-3" aria-label="Diminuir"><span class="material-symbols-outlined">remove</span></button>
              <span id="qtd" class="px-3 text-center fw-semibold fs-5">${quantidade}</span>
              <button type="button" data-qtd="1" class="btn btn-light d-flex align-items-center justify-content-center rounded-end py-2 px-3" aria-label="Aumentar"><span class="material-symbols-outlined">add</span></button>
            </div>
            <button id="btn-adicionar" type="button" class="btn btn-warning btn-lg flex-fill fw-bold d-flex align-items-center justify-content-center gap-2 text-dark">
              <span class="material-symbols-outlined">add_shopping_cart</span>
              Adicionar · <span id="subtotal">${dinheiro(preco * quantidade)}</span>
            </button>
          </div>`
      : produto.disponivel
        ? '<p class="text-secondary mb-0">A equipe pode consultar o produto, mas os pedidos são feitos pela área do cliente.</p>'
        : '<div class="rounded-3 bg-danger-subtle p-3 small fw-semibold text-danger-emphasis">Produto indisponível no momento</div>'}
    </div>`;
}

function atualizarQuantidade() {
  document.getElementById('qtd').textContent = quantidade;
  document.getElementById('subtotal').textContent = dinheiro(Number(produto.preco) * quantidade);
}

async function iniciar() {
  const id = window.location.hash.slice(1) || new URLSearchParams(window.location.search).get('id');
  const caixa = document.getElementById('produto');
  if (!id) {
    caixa.innerHTML = `<div class="col-12">${estadoVazio('search_off', 'Produto não encontrado', '<a href="index.html" class="fw-semibold text-warning-emphasis">Voltar ao cardápio</a>')}</div>`;
    return;
  }
  try {
    const res = await api('/produtos/' + encodeURIComponent(id) + '?populate=*', { auth: false });
    produto = res.data;
    document.title = `${produto.nome} - Caderneta`;
    renderProduto();
  } catch {
    caixa.innerHTML = `<div class="col-12">${estadoVazio('search_off', 'Produto não encontrado', '<a href="index.html" class="fw-semibold text-warning-emphasis">Voltar ao cardápio</a>')}</div>`;
    return;
  }

  caixa.addEventListener('click', (e) => {
    const qtd = e.target.closest('[data-qtd]');
    if (qtd) {
      quantidade = Math.min(50, Math.max(1, quantidade + Number(qtd.dataset.qtd)));
      atualizarQuantidade();
    }
    if (e.target.closest('#btn-adicionar')) {
      for (let i = 0; i < quantidade; i++) adicionarAoCarrinho(produto);
      toast(`${quantidade}× ${produto.nome} no carrinho`);
      quantidade = 1;
      atualizarQuantidade();
    }
  });
}

if (montarLayout()) iniciar();
