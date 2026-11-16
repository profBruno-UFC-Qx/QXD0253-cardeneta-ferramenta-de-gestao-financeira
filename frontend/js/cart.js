let carrinho = JSON.parse(localStorage.getItem('carrinho') || '[]');
function adicionaisItem(item) { return Array.isArray(item.adicionais) ? item.adicionais : []; }
function idCatalogo(adicional) { return adicional.documentId || adicional.id; }
function quantidadeAdicional(adicional) { return Math.max(1, Number(adicional.quantidade) || 1); }
function chaveCarrinho(item) {
  const ids = adicionaisItem(item).map((a) => `${a.id}:${quantidadeAdicional(a)}`).sort();
  return `${item.documentId}|${ids.join(',')}`;
}
function precoUnitarioCarrinho(item) {
  return Number(item.preco) + adicionaisItem(item).reduce((soma, adicional) => soma + Number(adicional.preco || 0) * quantidadeAdicional(adicional), 0);
}
function salvarCarrinho() {
  localStorage.setItem('carrinho', JSON.stringify(carrinho));
  atualizarBadge();
}
function adicionarAoCarrinho(produto, quantidade = 1, idsAdicionais = []) {
  const disponiveis = Array.isArray(produto.adicionaisCatalogo) ? produto.adicionaisCatalogo : [];
  const escolhas = new Map(idsAdicionais.map((opcao) => typeof opcao === 'string' ? [opcao, 1] : [opcao.id || opcao.documentId, Math.max(1, Math.min(50, Number(opcao.quantidade) || 1))]));
  const selecionados = disponiveis
    .filter((a) => a.disponivel !== false && escolhas.has(idCatalogo(a)))
    .map((a) => ({ id: idCatalogo(a), nome: a.nome, preco: Number(a.preco), quantidade: escolhas.get(idCatalogo(a)) }));
  const variante = { ...produto, adicionais: selecionados };
  const chave = chaveCarrinho(variante);
  const item = carrinho.find((i) => chaveCarrinho(i) === chave);
  if (item) item.quantidade = Math.min(50, item.quantidade + quantidade);
  else carrinho.push({ ...variante, quantidade: Math.min(50, quantidade) });
  salvarCarrinho();
}
function atualizarAdicionaisCatalogoProduto(documentId, catalogo) {
  const itens = carrinho.filter((item) => item.documentId === documentId);
  for (const item of itens) {
    const mapeados = adicionaisItem(item).map((antigo) => {
      const atual = catalogo.find((opcao) => opcao.documentId === antigo.id)
        || catalogo.find((opcao) => opcao.nome === antigo.nome && Number(opcao.preco) === Number(antigo.preco));
      if (!atual || atual.disponivel === false) return null;
      return { id: atual.documentId, nome: atual.nome, preco: Number(atual.preco), quantidade: Math.max(1, Number(antigo.quantidade) || 1) };
    });
    if (mapeados.some((adicional) => !adicional)) return false;
    item.adicionaisCatalogo = catalogo;
    item.adicionais = mapeados;
  }
  salvarCarrinho();
  return true;
}
function encontrarItem(id) {
  return carrinho.find((i) => chaveCarrinho(i) === id)
    || carrinho.find((i) => i.documentId === id);
}
function alterarQuantidade(id, delta) {
  const item = encontrarItem(id);
  if (!item) return;
  item.quantidade += delta;
  if (item.quantidade <= 0) carrinho = carrinho.filter((i) => i !== item);
  else item.quantidade = Math.min(50, item.quantidade);
  salvarCarrinho();
}
function removerDoCarrinho(id) {
  const item = encontrarItem(id);
  if (item) carrinho = carrinho.filter((i) => i !== item);
  salvarCarrinho();
}
function limparCarrinho() {
  carrinho = [];
  salvarCarrinho();
}
function getCarrinho() {
  return JSON.parse(localStorage.getItem('carrinho') || '[]');
}
function quantidadeNoCarrinho(id) {
  return carrinho.filter((i) => i.documentId === id).reduce((soma, i) => soma + i.quantidade, 0);
}
function totalItens() {
  return carrinho.reduce((acc, i) => acc + i.quantidade, 0);
}
function totalCarrinho() {
  return carrinho.reduce((acc, i) => acc + precoUnitarioCarrinho(i) * i.quantidade, 0);
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
