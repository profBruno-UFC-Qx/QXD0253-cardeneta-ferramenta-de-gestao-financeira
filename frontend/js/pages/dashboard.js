let periodoDashboard = 'mes';
const isoData = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
function datasDashboard(tipo) {
  const hoje = new Date();
  const ate = isoData(hoje);
  const inicio = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
  if (tipo === '7dias') inicio.setDate(inicio.getDate() - 6);
  if (tipo === 'mes') inicio.setDate(1);
  return { de: isoData(inicio), ate };
}
const labelPeriodo = ({ de, ate }) => `${new Date(`${de}T12:00:00`).toLocaleDateString('pt-BR')} a ${new Date(`${ate}T12:00:00`).toLocaleDateString('pt-BR')}`;
function cartaoIndicador(rotulo, valor, icone, detalhe, classe = '') {
  return `<div class="col-12 col-sm-6 col-xl-3"><article class="card border-0 shadow-sm h-100 p-3"><div class="d-flex justify-content-between align-items-start"><div><p class="text-secondary small mb-2">${rotulo}</p><p class="fs-4 fw-bold mb-1 ${classe}">${valor}</p><p class="small text-secondary mb-0">${detalhe}</p></div><span class="material-symbols-outlined rounded-3 bg-warning-subtle p-2 text-warning-emphasis">${icone}</span></div></article></div>`;
}
function renderDashboard(dados) {
  const r = dados.resumo;
  document.getElementById('indicadores').innerHTML = [
    cartaoIndicador('Faturamento', dinheiro(r.faturamento), 'payments', `${r.pedidos} pedidos no período`),
    cartaoIndicador('Pedidos', r.pedidos, 'receipt_long', `${r.emAndamento} em andamento`),
    cartaoIndicador('Ticket médio', dinheiro(r.ticketMedio), 'shopping_bag', 'Valor médio por pedido'),
    cartaoIndicador('Lucro estimado', dinheiro(r.lucroEstimado), 'trending_up', `Despesas: ${dinheiro(r.despesas)}`, r.lucroEstimado < 0 ? 'text-danger' : 'text-success'),
  ].join('');
  const serie = dados.vendasPorDia || [];
  const max = Math.max(1, ...serie.map((d) => d.faturamento));
  document.getElementById('grafico-vendas').innerHTML = serie.length ? `<div class="chart-bars" role="img" aria-label="Gráfico de faturamento por dia">${serie.map((d) => `<div class="chart-bar-col" title="${esc(new Date(`${d.data}T12:00:00`).toLocaleDateString('pt-BR'))}: ${dinheiro(d.faturamento)}"><span class="chart-bar-value">${dinheiro(d.faturamento)}</span><div class="chart-bar" style="height:${Math.max(5, d.faturamento / max * 100)}%"></div><span class="chart-bar-label">${new Date(`${d.data}T12:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</span></div>`).join('')}</div>` : estadoVazio('bar_chart', 'Sem vendas neste período');
  const produtos = dados.produtosMaisVendidos || [];
  document.getElementById('top-produtos').innerHTML = produtos.length ? produtos.slice(0, 6).map((p, i) => `<div class="d-flex align-items-center gap-3"><span class="rank-number">${i + 1}</span><span class="flex-fill text-truncate fw-medium">${esc(p.nome)}</span><span class="badge text-bg-light">${p.quantidade} un.</span></div>`).join('') : estadoVazio('lunch_dining', 'Sem produtos vendidos neste período');
}
async function carregarDashboard() {
  const intervalo = datasDashboard(periodoDashboard);
  document.getElementById('periodo-label').textContent = labelPeriodo(intervalo);
  try {
    const dados = await api('/relatorios/resumo' + qs(intervalo));
    renderDashboard(dados);
  } catch (erro) { toast(erro.message, 'erro'); }
}
function iniciar() {
  document.querySelectorAll('[data-periodo]').forEach((b) => b.addEventListener('click', () => {
    periodoDashboard = b.dataset.periodo;
    document.querySelectorAll('[data-periodo]').forEach((el) => el.classList.toggle('btn-warning', el === b));
    document.querySelectorAll('[data-periodo]').forEach((el) => el.classList.toggle('btn-outline-secondary', el !== b));
    carregarDashboard();
  }));
  carregarDashboard();
}
if (montarLayout()) iniciar();
