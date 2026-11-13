const ABERTOS = ['recebido', 'em_preparo', 'pronto', 'em_entrega'];

const ABAS = [
  { id: 'abertos', rotulo: 'Em andamento', filtro: (p) => ABERTOS.includes(p.status) },
  { id: 'entregues', rotulo: 'Entregues', filtro: (p) => p.status === 'entregue' },
  { id: 'cancelados', rotulo: 'Cancelados', filtro: (p) => p.status === 'cancelado' },
];

let pedidos = [];
let abaAtiva = 'abertos';

function proximo(p) {
  if (p.status === 'recebido') return { status: 'em_preparo', rotulo: 'Iniciar preparo', icone: 'skillet' };
  if (p.status === 'em_preparo') return { status: 'pronto', rotulo: 'Marcar como pronto', icone: 'check_circle' };
  if (p.status === 'pronto' && p.modalidade === 'entrega') return { status: 'em_entrega', rotulo: 'Saiu para entrega', icone: 'delivery_dining' };
  if (p.status === 'pronto') return { status: 'entregue', rotulo: p.modalidade === 'mesa' ? 'Servido na mesa' : 'Entregue ao cliente', icone: 'takeout_dining' };
  if (p.status === 'em_entrega') return { status: 'entregue', rotulo: 'Entrega concluída', icone: 'task_alt' };
  return null;
}

function filtrados(aba) {
  const modalidade = document.getElementById('filtro-modalidade').value;
  return pedidos.filter((p) => aba.filtro(p) && (!modalidade || p.modalidade === modalidade));
}

function renderAbas() {
  document.getElementById('abas').innerHTML = ABAS.map((a) =>
    `<button type="button" class="categoria-btn ${a.id === abaAtiva ? 'active' : ''}" data-aba="${a.id}">${a.rotulo}<span class="badge text-bg-light ms-1">${filtrados(a).length}</span></button>`).join('');
}

function cartaoPedido(p) {
  const acao = proximo(p);
  const atrasado = ABERTOS.includes(p.status) && Date.now() - new Date(p.createdAt).getTime() > 20 * 60000;
  const botoes = acao
    ? `<div class="mt-3 d-flex gap-2">
        <button type="button" class="btn btn-warning flex-fill fw-semibold d-flex align-items-center justify-content-center gap-1" data-acao="avancar" data-id="${esc(p.documentId)}" data-status="${acao.status}"><span class="material-symbols-outlined fs-6">${acao.icone}</span>${acao.rotulo}</button>
        <button type="button" class="btn btn-outline-danger px-3" data-acao="cancelar" data-id="${esc(p.documentId)}" aria-label="Cancelar pedido"><span class="material-symbols-outlined fs-5">close</span></button>
      </div>`
    : '';

  return `<article class="card border-0 shadow-sm p-3">
    <div class="d-flex align-items-start justify-content-between gap-3">
      <div class="overflow-hidden">
        <p class="fw-bold mb-1">#${p.id} · ${esc(p.nomeCliente || 'Cliente')}</p>
        <p class="small mb-0 ${atrasado ? 'fw-semibold text-warning' : 'text-secondary'}">${tempoDecorrido(p.createdAt)} · ${p.tipo === 'balcao' ? 'Balcão' : 'Online'}</p>
      </div>
      ${badgeStatus(p.status)}
    </div>
    ${detalheModalidade(p, true)}
    <ul class="mt-3 mb-0 vstack gap-2 small ps-3">${(p.itens || []).map((i) => `<li><strong>${i.quantidade}×</strong> ${esc(i.nomeProduto || 'Item removido')}</li>`).join('')}</ul>
    ${p.observacoes ? `<p class="mt-3 mb-0 rounded-3 bg-warning-subtle p-3 small text-warning-emphasis">${esc(p.observacoes)}</p>` : ''}
    <div class="mt-3 d-flex align-items-center justify-content-between border-top border-secondary-subtle pt-3 small">
      <span class="text-secondary">${esc(PAGAMENTOS[p.formaPagamento] || p.formaPagamento)}</span>
      <strong class="fs-6">${dinheiro(p.total)}</strong>
    </div>
    ${botoes}
  </article>`;
}

function renderLista() {
  const aba = ABAS.find((a) => a.id === abaAtiva);
  let lista = filtrados(aba);
  if (abaAtiva === 'abertos') lista = lista.slice().reverse();
  document.getElementById('lista').innerHTML = lista.length
    ? lista.map(cartaoPedido).join('')
    : estadoVazio('inbox', 'Nenhum pedido aqui');
}

function renderTudo() {
  renderAbas();
  renderLista();
}

async function carregar() {
  try {
    const res = await api('/pedidos' + qs({ populate: 'itens', sort: 'createdAt:desc', 'pagination[pageSize]': 100 }));
    pedidos = res.data;
    renderTudo();
    document.getElementById('atualizado').textContent = 'Atualizado às ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  } catch (erro) {
    toast(erro.message, 'erro');
  }
}

async function mudarStatus(id, status) {
  try {
    await api('/pedidos/' + id, { method: 'PUT', body: { data: { status } } });
    await carregar();
  } catch (erro) {
    toast(erro.message, 'erro');
  }
}

function iniciar() {
  document.getElementById('abas').addEventListener('click', (e) => {
    const botao = e.target.closest('[data-aba]');
    if (!botao) return;
    abaAtiva = botao.dataset.aba;
    renderTudo();
  });
  document.getElementById('filtro-modalidade').addEventListener('change', renderTudo);

  document.getElementById('lista').addEventListener('click', (e) => {
    const botao = e.target.closest('[data-acao]');
    if (!botao) return;
    if (botao.dataset.acao === 'avancar') mudarStatus(botao.dataset.id, botao.dataset.status);
    if (botao.dataset.acao === 'cancelar' && confirm('Cancelar este pedido?')) mudarStatus(botao.dataset.id, 'cancelado');
  });

  carregar();
  setInterval(() => {
    if (!document.hidden) carregar();
  }, 15000);
}

if (montarLayout()) iniciar();
