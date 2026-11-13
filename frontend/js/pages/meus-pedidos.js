function etapas(modalidade) {
  return modalidade === 'entrega'
    ? ['recebido', 'em_preparo', 'pronto', 'em_entrega', 'entregue']
    : ['recebido', 'em_preparo', 'pronto', 'entregue'];
}

function progresso(p) {
  if (p.status === 'cancelado') return '';
  const lista = etapas(p.modalidade);
  const atual = lista.indexOf(p.status);
  const percentual = atual < 0 ? 0 : Math.round(((atual + 1) / lista.length) * 100);
  return `<div class="progress mt-2" style="height:.375rem" role="progressbar" aria-label="Andamento do pedido" aria-valuenow="${percentual}" aria-valuemin="0" aria-valuemax="100"><div class="progress-bar bg-warning" style="width:${percentual}%"></div></div>`;
}

function cartaoPedido(p) {
  return `<article class="card border-0 shadow-sm p-3">
    <div class="d-flex align-items-center justify-content-between gap-3">
      <div><p class="fw-bold mb-1">Pedido #${p.id}</p><p class="text-secondary small mb-0">${dataHora(p.createdAt)} · ${esc(PAGAMENTOS[p.formaPagamento] || p.formaPagamento)}</p></div>
      ${badgeStatus(p.status)}
    </div>
    ${progresso(p)}
    ${detalheModalidade(p)}
    <ul class="mt-3 mb-0 vstack gap-2 small ps-3">${(p.itens || []).map((i) =>
    `<li class="d-flex justify-content-between gap-3"><span>${i.quantidade}× ${esc(i.nomeProduto || 'Item removido')}</span><span class="text-secondary">${dinheiro(i.precoUnitario * i.quantidade)}</span></li>`).join('')}
      ${Number(p.taxaEntrega) > 0 ? `<li class="d-flex justify-content-between gap-3"><span class="text-secondary">Taxa de entrega</span><span class="text-secondary">${dinheiro(p.taxaEntrega)}</span></li>` : ''}
    </ul>
    ${p.observacoes ? `<p class="text-secondary mt-2 small mb-0">Obs.: ${esc(p.observacoes)}</p>` : ''}
    <div class="mt-3 d-flex justify-content-between border-top border-secondary-subtle pt-3 fw-semibold"><span>Total</span><span>${dinheiro(p.total)}</span></div>
  </article>`;
}

async function carregar() {
  const lista = document.getElementById('lista');
  try {
    const res = await api('/pedidos' + qs({ populate: 'itens', sort: 'createdAt:desc', 'pagination[pageSize]': 30 }));
    lista.innerHTML = res.data.length
      ? res.data.map(cartaoPedido).join('')
      : estadoVazio('receipt_long', 'Você ainda não fez pedidos', '<a href="index.html" class="fw-semibold text-warning-emphasis">Ver cardápio</a>');
  } catch (erro) {
    lista.innerHTML = estadoVazio('error', 'Não foi possível carregar', esc(erro.message));
  }
}

async function iniciar() {
  carregar();
  setInterval(() => {
    if (!document.hidden) carregar();
  }, 20000);
}

if (montarLayout()) iniciar();
