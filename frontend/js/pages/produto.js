let produto = null;
let quantidade = 1;
let fotosProduto = [];
let fotoAtiva = 0;

function prepararFotos() {
  const todas = [produto?.imagem, ...(Array.isArray(produto?.galeria) ? produto.galeria : produto?.galeria?.data || [])]
    .filter((foto) => foto?.url);
  const vistos = new Set();
  fotosProduto = todas.filter((foto) => {
    const chave = foto.id || foto.documentId || foto.url;
    if (vistos.has(chave)) return false;
    vistos.add(chave);
    return true;
  });
  fotoAtiva = 0;
}

function renderFotos() {
  const atual = fotosProduto[fotoAtiva];
  const destaque = atual
    ? `<img id="foto-principal" src="${esc(urlImagem(atual))}" alt="${esc(produto.nome)}" class="img-produto">`
    : semImagemHtml('h-100 w-100');
  const miniaturas = fotosProduto.length > 1 ? `<div class="d-flex gap-2 overflow-auto pt-2" aria-label="Imagens do produto">
    ${fotosProduto.map((foto, indice) => `<button type="button" class="btn p-0 border ${indice === fotoAtiva ? 'border-warning border-2' : 'border-secondary-subtle'} flex-shrink-0" data-foto="${indice}" aria-label="Ver imagem ${indice + 1}"><img src="${esc(urlImagem(foto))}" alt="" class="object-fit-cover rounded" style="width:72px;height:64px"></button>`).join('')}
  </div>` : '';
  return `<div><div class="ratio ratio-4x3 overflow-hidden rounded-3 bg-warning-subtle">${destaque}</div>${miniaturas}</div>`;
}

function renderProduto() {
  prepararFotos();
  const preco = Number(produto.preco);
  const adicionais = (Array.isArray(produto.adicionaisCatalogo) ? produto.adicionaisCatalogo : []).filter((a) => a.disponivel !== false);
  const podeComprar = produto.disponivel && !ehStaff();
  document.getElementById('produto').innerHTML = `
    <div class="col">${renderFotos()}</div>
    <div class="col vstack gap-3">
      <div>
        ${produto.categoria ? `<span class="badge bg-warning-subtle text-dark">${esc(produto.categoria.nome)}</span>` : ''}
        <h1 class="fs-2 fw-bold mt-2 mb-1">${esc(produto.nome)}</h1>
        <p class="fs-3 fw-bold mb-0">${dinheiro(preco)}</p>
      </div>
      ${produto.descricao ? `<p class="text-secondary mb-0">${esc(produto.descricao)}</p>` : ''}
      ${podeComprar
      ? `${adicionais.length ? `<fieldset class="card border-0 bg-white p-3"><legend class="fs-6 fw-semibold mb-2">Adicionais <span class="small text-secondary fw-normal">(quantidade por unidade)</span></legend><div class="vstack gap-2">${adicionais.map((a) => `<label class="d-flex align-items-center justify-content-between gap-3"><span>${esc(a.nome)} <span class="small text-secondary">· ${dinheiro(a.preco)} cada</span></span><input class="form-control form-control-sm text-center" type="number" min="0" max="50" step="1" value="0" style="width:76px" data-adicional-quantidade="${esc(a.documentId)}" aria-label="Quantidade de ${esc(a.nome)}"></label>`).join('')}</div></fieldset>` : ''}<div class="d-flex align-items-center gap-3">
            <div class="input-group" style="max-width:136px">
              <button type="button" data-qtd="-1" class="btn btn-outline-secondary" aria-label="Diminuir quantidade"><span class="material-symbols-outlined">remove</span></button>
              <span id="qtd" class="form-control text-center" aria-live="polite">${quantidade}</span>
              <button type="button" data-qtd="1" class="btn btn-outline-secondary" aria-label="Aumentar quantidade"><span class="material-symbols-outlined">add</span></button>
            </div>
            <button id="btn-adicionar" type="button" class="btn btn-warning flex-fill fw-semibold"><span class="material-symbols-outlined align-middle fs-5">add_shopping_cart</span> Adicionar · <span id="subtotal">${dinheiro(preco * quantidade)}</span></button>
          </div>`
      : produto.disponivel
        ? '<p class="text-secondary small">A equipe pode consultar o produto, mas os pedidos são feitos pela área do cliente.</p>'
        : '<div class="alert alert-secondary mb-0">Produto indisponível no momento.</div>'}
    </div>`;
}

function atualizarQuantidade() {
  const qtd = document.getElementById('qtd');
  const subtotal = document.getElementById('subtotal');
  if (qtd) qtd.textContent = quantidade;
  const extras = [...document.querySelectorAll('[data-adicional-quantidade]')].reduce((soma, input) => {
    const adicional = (produto.adicionaisCatalogo || []).find((a) => a.documentId === input.dataset.adicionalQuantidade);
    const quantidadeAdicional = Math.max(0, Math.min(50, Number(input.value) || 0));
    return soma + Number(adicional?.preco || 0) * quantidadeAdicional;
  }, 0);
  if (subtotal) subtotal.textContent = dinheiro((Number(produto.preco) + extras) * quantidade);
}

async function iniciar() {
  const id = window.location.hash.slice(1) || new URLSearchParams(window.location.search).get('id');
  const caixa = document.getElementById('produto');
  if (!id) {
    caixa.innerHTML = estadoVazio('search_off', 'Produto não encontrado', '<a href="index.html" class="link-dark fw-semibold">Voltar ao cardápio</a>');
    return;
  }
  try {
    const resposta = await api('/produtos/' + encodeURIComponent(id) + '?populate=*', { auth: false });
    produto = resposta.data;
    document.title = `${produto.nome} - Caderneta`;
    renderProduto();
  } catch {
    caixa.innerHTML = estadoVazio('search_off', 'Produto não encontrado', '<a href="index.html" class="link-dark fw-semibold">Voltar ao cardápio</a>');
    return;
  }

  caixa.addEventListener('input', (evento) => {
    if (evento.target.matches('[data-adicional-quantidade]')) {
      evento.target.value = String(Math.max(0, Math.min(50, Number(evento.target.value) || 0)));
      atualizarQuantidade();
    }
  });
  caixa.addEventListener('click', (evento) => {
    const quantidadeBotao = evento.target.closest('[data-qtd]');
    const miniatura = evento.target.closest('[data-foto]');
    if (quantidadeBotao) {
      quantidade = Math.min(50, Math.max(1, quantidade + Number(quantidadeBotao.dataset.qtd)));
      atualizarQuantidade();
    }

    if (miniatura) {
      fotoAtiva = Number(miniatura.dataset.foto);
      const imagem = document.getElementById('foto-principal');
      if (imagem) imagem.src = urlImagem(fotosProduto[fotoAtiva]);
      caixa.querySelectorAll('[data-foto]').forEach((botao, indice) => {
        botao.classList.toggle('border-warning', indice === fotoAtiva);
        botao.classList.toggle('border-2', indice === fotoAtiva);
      });
    }
    if (evento.target.closest('#btn-adicionar')) {
      const selecionados = [...caixa.querySelectorAll('[data-adicional-quantidade]')]
        .filter((input) => Number(input.value) > 0)
        .map((input) => ({ id: input.dataset.adicionalQuantidade, quantidade: Number(input.value) }));
      adicionarAoCarrinho(produto, quantidade, selecionados);
      toast(`${quantidade}× ${produto.nome} no carrinho`);
      quantidade = 1;
      caixa.querySelectorAll('[data-adicional-quantidade]').forEach((input) => { input.value = '0'; });
      atualizarQuantidade();
    }
  });
}

if (montarLayout()) iniciar();
