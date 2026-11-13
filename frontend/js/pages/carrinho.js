function renderCarrinho() {
  const itens = getCarrinho();
  document.getElementById('vazio').classList.toggle('d-none', itens.length > 0);
  document.getElementById('corpo-carrinho').classList.toggle('d-none', itens.length === 0);

  document.getElementById('itens').innerHTML = itens.map((i) => `<div class="card border-0 shadow-sm d-flex align-items-center gap-3 p-3 flex-row">
    <div class="ratio ratio-1x1 flex-shrink-0 rounded-3 overflow-hidden" style="width:64px">${i.imagem
      ? `<img src="${esc(i.imagem)}" alt="" class="rounded-3 object-fit-cover">`
      : semImagemHtml('rounded-3')}</div>
    <div class="overflow-hidden flex-fill">
      <p class="text-truncate fw-semibold mb-1">${esc(i.nome)}</p>
      <p class="text-secondary small mb-2">${dinheiro(i.preco)} cada</p>
      <div class="mt-2 d-flex align-items-center gap-3">${seletorQuantidade(i.documentId, i.quantidade)}
        <button type="button" class="btn btn-sm btn-link text-danger text-decoration-none fw-semibold" data-acao="remover" data-id="${esc(i.documentId)}">Remover</button>
      </div>
    </div>
    <strong class="flex-shrink-0">${dinheiro(i.preco * i.quantidade)}</strong>
  </div>`).join('');
}

async function iniciar() {
  const loja = await carregarLoja();
  renderCarrinho();
  const checkout = await iniciarCheckout({
    loja,
    aoSucesso: () => { window.location.href = ehStaff() ? 'pedidos.html' : 'meus-pedidos.html'; },
  });

  document.getElementById('itens').addEventListener('click', (e) => {
    const botao = e.target.closest('[data-acao]');
    if (!botao) return;
    const id = botao.dataset.id;
    if (botao.dataset.acao === 'mais') alterarQuantidade(id, 1);
    if (botao.dataset.acao === 'menos') alterarQuantidade(id, -1);
    if (botao.dataset.acao === 'remover') removerDoCarrinho(id);
    renderCarrinho();
    checkout.atualizar();
  });
}

if (montarLayout()) {
  if (ehStaff()) window.location.href = 'pedidos.html';
  else iniciar();
}
