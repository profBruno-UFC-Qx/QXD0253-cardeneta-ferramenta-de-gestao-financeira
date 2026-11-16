function renderCarrinho() {
  const itens = getCarrinho();
  document.getElementById('vazio').classList.toggle('d-none', itens.length > 0);
  document.getElementById('corpo-carrinho').classList.toggle('d-none', itens.length === 0);
  document.getElementById('itens').innerHTML = itens.map((i) => {
    const chave = chaveCarrinho(i);
    const extras = adicionaisItem(i);
    const imagem = urlImagem(i.imagem);
    return `<div class="card border-0 shadow-sm d-flex align-items-center gap-3 p-3 flex-row">
      <div class="ratio ratio-1x1 flex-shrink-0 rounded-3 overflow-hidden" style="width:64px">${imagem
        ? `<img src="${esc(imagem)}" alt="${esc(i.nome)}" class="rounded-3 object-fit-cover">`
        : semImagemHtml('rounded-3')}</div>
      <div class="overflow-hidden flex-fill">
        <p class="text-truncate fw-semibold mb-1">${esc(i.nome)}</p>
        <p class="text-secondary small mb-1">${dinheiro(precoUnitarioCarrinho(i))} cada</p>
        ${extras.length ? `<ul class="small text-secondary mb-2 ps-3">${extras.map((a) => `<li>${quantidadeAdicional(a)}× ${esc(a.nome)} · ${dinheiro(Number(a.preco) * quantidadeAdicional(a))}</li>`).join('')}</ul>` : ''}
        <div class="mt-2 d-flex align-items-center gap-3">${seletorQuantidade(chave, i.quantidade)}
          <button type="button" class="btn btn-sm btn-link text-danger text-decoration-none fw-semibold" data-acao="remover" data-id="${esc(chave)}">Remover</button>
        </div>
      </div>
      <strong class="flex-shrink-0">${dinheiro(precoUnitarioCarrinho(i) * i.quantidade)}</strong>
    </div>`;
  }).join('');
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
