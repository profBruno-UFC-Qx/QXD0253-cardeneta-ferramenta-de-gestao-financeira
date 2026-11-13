let carrinho = JSON.parse(localStorage.getItem('carrinho') || '[]');

function adicionarAoCarrinho(produto) {
  const item = carrinho.find(i => i.documentId === produto.documentId);
  if (item) item.quantidade++;
  else carrinho.push({ ...produto, quantidade: 1 });
  localStorage.setItem('carrinho', JSON.stringify(carrinho));
  atualizarBadge();
}

function alterarQuantidade(id, delta) {
  const item = carrinho.find(i => i.documentId === id);
  if (!item) return;
  item.quantidade += delta;
  if (item.quantidade <= 0) carrinho = carrinho.filter(i => i.documentId !== id);
  localStorage.setItem('carrinho', JSON.stringify(carrinho));
  atualizarBadge();
}

function removerDoCarrinho(id) {
  carrinho = carrinho.filter(i => i.documentId !== id);
  localStorage.setItem('carrinho', JSON.stringify(carrinho));
  atualizarBadge();
}

function limparCarrinho() {
  carrinho = [];
  localStorage.setItem('carrinho', JSON.stringify(carrinho));
  atualizarBadge();
}

function getCarrinho() {
  return JSON.parse(localStorage.getItem('carrinho') || '[]');
}

function quantidadeNoCarrinho(id) {
  return carrinho.find(i => i.documentId === id)?.quantidade || 0;
}

function totalItens() {
  return carrinho.reduce((acc, i) => acc + i.quantidade, 0);
}

function totalCarrinho() {
  return carrinho.reduce((acc, i) => acc + (Number(i.preco) * i.quantidade), 0);
}

function atualizarBadge() {
  const badge = document.getElementById('badge-carrinho');
  if (badge) {
    const n = totalItens();
    badge.textContent = n;
    badge.classList.toggle('d-none', n === 0);
  }
}

function seletorQuantidade(id, qtd) {
  return `<div class="d-inline-flex align-items-center rounded-3 border border-secondary-subtle bg-white">
    <button type="button" class="btn btn-sm btn-light d-flex align-items-center justify-content-center rounded-start px-2" data-acao="menos" data-id="${esc(id)}"><span class="material-symbols-outlined fs-6">remove</span></button>
    <span class="px-2 text-center fw-semibold small" style="min-width: 24px;">${qtd}</span>
    <button type="button" class="btn btn-sm btn-light d-flex align-items-center justify-content-center rounded-end px-2" data-acao="mais" data-id="${esc(id)}"><span class="material-symbols-outlined fs-6">add</span></button>
  </div>`;
}
