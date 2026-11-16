let relatorioAtual = null;
const $r = (id) => document.getElementById(id);
const localISO = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
function barraLista(items, format = dinheiro) {
  if (!items?.length) return estadoVazio('bar_chart', 'Sem dados neste período');
  const max = Math.max(1, ...items.map((item) => item.valor));
  return `<div class="vstack gap-3">${items.map((item) => `<div><div class="d-flex justify-content-between gap-3 small mb-1"><span>${esc(item.chave)}</span><strong>${format(item.valor)}</strong></div><div class="progress" role="progressbar" aria-label="${esc(item.chave)}" aria-valuenow="${Math.round(item.valor / max * 100)}" aria-valuemin="0" aria-valuemax="100"><div class="progress-bar bg-warning" style="width:${Math.max(2, item.valor / max * 100)}%"></div></div></div>`).join('')}</div>`;
}
function graficoDias(serie) {
  if (!serie?.length) return estadoVazio('show_chart', 'Sem vendas neste período');
  const max = Math.max(1, ...serie.map((d) => d.faturamento));
  return `<div class="chart-bars" role="img" aria-label="Faturamento por dia">${serie.map((d) => `<div class="chart-bar-col" title="${esc(d.data)}: ${dinheiro(d.faturamento)}"><span class="chart-bar-value">${dinheiro(d.faturamento)}</span><div class="chart-bar" style="height:${Math.max(5, d.faturamento / max * 100)}%"></div><span class="chart-bar-label">${new Date(`${d.data}T12:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</span></div>`).join('')}</div>`;
}
function tabelaProdutos(items) {
  return items?.length ? `<table class="table align-middle mb-0"><thead class="table-light"><tr><th class="ps-3">Produto</th><th class="text-end pe-3">Unidades</th></tr></thead><tbody>${items.map((p) => `<tr><td class="ps-3">${esc(p.nome)}</td><td class="text-end pe-3 fw-semibold">${p.quantidade}</td></tr>`).join('')}</tbody></table>` : `<div class="p-3">${estadoVazio('lunch_dining', 'Sem produtos vendidos')}</div>`;
}
function tabelaDias(items) {
  return items?.length ? `<table class="table align-middle mb-0"><thead class="table-light"><tr><th class="ps-3">Data</th><th class="text-end">Pedidos</th><th class="text-end pe-3">Faturamento</th></tr></thead><tbody>${items.map((d) => `<tr><td class="ps-3">${new Date(`${d.data}T12:00:00`).toLocaleDateString('pt-BR')}</td><td class="text-end">${d.pedidos}</td><td class="text-end pe-3 fw-semibold">${dinheiro(d.faturamento)}</td></tr>`).join('')}</tbody></table>` : `<div class="p-3">${estadoVazio('calendar_month', 'Sem vendas no período')}</div>`;
}
function render(d) {
  relatorioAtual = d;
  const r = d.resumo;
  $r('periodo-label').textContent = `Período: ${new Date(`${d.periodo.de}T12:00:00`).toLocaleDateString('pt-BR')} até ${new Date(`${d.periodo.ate}T12:00:00`).toLocaleDateString('pt-BR')}`;
  $r('kpis').innerHTML = `<div class="col-6 col-xl-3"><article class="card border-0 shadow-sm p-3"><p class="small text-secondary mb-2">Faturamento</p><strong class="fs-5">${dinheiro(r.faturamento)}</strong></article></div><div class="col-6 col-xl-3"><article class="card border-0 shadow-sm p-3"><p class="small text-secondary mb-2">Despesas</p><strong class="fs-5 text-danger">${dinheiro(r.despesas)}</strong></article></div><div class="col-6 col-xl-3"><article class="card border-0 shadow-sm p-3"><p class="small text-secondary mb-2">Lucro estimado</p><strong class="fs-5 ${r.lucroEstimado < 0 ? 'text-danger' : 'text-success'}">${dinheiro(r.lucroEstimado)}</strong></article></div><div class="col-6 col-xl-3"><article class="card border-0 shadow-sm p-3"><p class="small text-secondary mb-2">Pedidos · Ticket médio</p><strong class="fs-5">${r.pedidos} <span class="text-secondary fs-6">· ${dinheiro(r.ticketMedio)}</span></strong></article></div>`;
  $r('grafico-dia').innerHTML = graficoDias(d.vendasPorDia);
  $r('grafico-pagamento').innerHTML = barraLista(d.porPagamento);
  $r('grafico-modalidade').innerHTML = barraLista(d.porModalidade);
  $r('grafico-horario').innerHTML = barraLista(d.porHora);
  $r('grafico-despesas').innerHTML = barraLista((d.despesasPorTipo || []).map((x) => ({ chave: ({ insumo: 'Insumos', conta_fixa: 'Contas fixas', outros: 'Outros' })[x.chave] || x.chave, valor: x.valor })));
  $r('tabela-produtos').innerHTML = tabelaProdutos(d.produtosMaisVendidos);
  $r('tabela-dias').innerHTML = tabelaDias(d.vendasPorDia);
}
async function carregar() {
  const de = $r('de').value;
  const ate = $r('ate').value;
  if (de && ate && de > ate) throw new Error('A data inicial não pode ser posterior à data final');
  const d = await api('/relatorios/resumo' + qs({ de, ate }));
  render(d);
}
function csvCell(valor) { return `"${String(valor ?? '').replaceAll('"', '""')}"`; }
function baixarCSV() {
  if (!relatorioAtual) return;
  const d = relatorioAtual;
  const linhas = [['Relatório Caderneta', `${d.periodo.de} a ${d.periodo.ate}`], [], ['Indicador', 'Valor'], ['Faturamento', d.resumo.faturamento], ['Despesas', d.resumo.despesas], ['Lucro estimado', d.resumo.lucroEstimado], ['Pedidos', d.resumo.pedidos], ['Ticket médio', d.resumo.ticketMedio], [], ['Vendas por dia'], ['Data', 'Pedidos', 'Faturamento'], ...(d.vendasPorDia || []).map((x) => [x.data, x.pedidos, x.faturamento]), [], ['Vendas por forma de pagamento'], ['Forma', 'Faturamento'], ...(d.porPagamento || []).map((x) => [x.chave, x.valor]), [], ['Vendas por modalidade'], ['Modalidade', 'Faturamento'], ...(d.porModalidade || []).map((x) => [x.chave, x.valor]), [], ['Vendas por horário'], ['Horário', 'Faturamento'], ...(d.porHora || []).map((x) => [x.chave, x.valor]), [], ['Despesas por tipo'], ['Tipo', 'Valor'], ...(d.despesasPorTipo || []).map((x) => [x.chave, x.valor]), [], ['Produtos mais vendidos'], ['Produto', 'Unidades'], ...(d.produtosMaisVendidos || []).map((x) => [x.nome, x.quantidade])];
  const conteudo = '\uFEFF' + linhas.map((linha) => linha.map(csvCell).join(';')).join('\r\n');
  const url = URL.createObjectURL(new Blob([conteudo], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a'); link.href = url; link.download = `relatorio-${d.periodo.de}-${d.periodo.ate}.csv`; link.click(); URL.revokeObjectURL(url);
}
function iniciar() {
  const hoje = new Date();
  const inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  $r('de').value = localISO(inicio); $r('ate').value = localISO(hoje);
  $r('filtro').addEventListener('submit', (e) => { e.preventDefault(); carregar().catch((erro) => toast(erro.message, 'erro')); });
  $r('exportar').addEventListener('click', baixarCSV);
  $r('imprimir').addEventListener('click', () => window.print());
  carregar().catch((erro) => toast(erro.message, 'erro'));
}
if (montarLayout()) iniciar();
