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
function tabelaImpressao(items, coluna, tituloValor = 'Faturamento', format = dinheiro) {
  if (!items?.length) return '<p class="report-print-only small text-secondary">Sem dados neste período.</p>';
  const total = items.reduce((soma, item) => soma + (Number(item.valor) || 0), 0);
  return `<table class="table table-sm table-bordered report-print-only report-print-table"><thead><tr><th scope="col">${esc(coluna)}</th><th scope="col" class="text-end">${esc(tituloValor)}</th></tr></thead><tbody>${items.map((item) => `<tr><td>${esc(item.chave)}</td><td class="text-end">${format(item.valor)}</td></tr>`).join('')}</tbody><tfoot><tr><th scope="row">Total</th><th class="text-end">${format(total)}</th></tr></tfoot></table>`;
}
function tabelaDiasImpressao(items) {
  if (!items?.length) return '<p class="report-print-only small text-secondary">Sem vendas neste período.</p>';
  const totalPedidos = items.reduce((soma, item) => soma + (Number(item.pedidos) || 0), 0);
  const totalVendas = items.reduce((soma, item) => soma + (Number(item.faturamento) || 0), 0);
  return `<table class="table table-sm table-bordered report-print-only report-print-table"><thead><tr><th>Data</th><th class="text-end">Pedidos</th><th class="text-end">Faturamento</th></tr></thead><tbody>${items.map((item) => `<tr><td>${new Date(`${item.data}T12:00:00`).toLocaleDateString('pt-BR')}</td><td class="text-end">${item.pedidos}</td><td class="text-end">${dinheiro(item.faturamento)}</td></tr>`).join('')}</tbody><tfoot><tr><th>Total do período</th><th class="text-end">${totalPedidos}</th><th class="text-end">${dinheiro(totalVendas)}</th></tr></tfoot></table>`;
}
function tabelaProdutos(items) {
  return items?.length ? `<table class="table table-sm align-middle mb-0 report-data-table"><thead><tr><th>Produto</th><th class="text-end">Unidades</th></tr></thead><tbody>${items.map((p) => `<tr><td>${esc(p.nome)}</td><td class="text-end fw-semibold">${p.quantidade}</td></tr>`).join('')}</tbody><tfoot><tr><th>Total</th><th class="text-end">${items.reduce((soma, p) => soma + (Number(p.quantidade) || 0), 0)}</th></tr></tfoot></table>` : `<div class="p-3">${estadoVazio('lunch_dining', 'Sem produtos vendidos')}</div>`;
}
function tabelaDias(items) {
  return items?.length ? `<table class="table table-sm align-middle mb-0 report-data-table"><thead><tr><th>Data</th><th class="text-end">Pedidos</th><th class="text-end">Faturamento</th></tr></thead><tbody>${items.map((d) => `<tr><td>${new Date(`${d.data}T12:00:00`).toLocaleDateString('pt-BR')}</td><td class="text-end">${d.pedidos}</td><td class="text-end fw-semibold">${dinheiro(d.faturamento)}</td></tr>`).join('')}</tbody><tfoot><tr><th>Total</th><th class="text-end">${items.reduce((soma, d) => soma + (Number(d.pedidos) || 0), 0)}</th><th class="text-end">${dinheiro(items.reduce((soma, d) => soma + (Number(d.faturamento) || 0), 0))}</th></tr></tfoot></table>` : `<div class="p-3">${estadoVazio('calendar_month', 'Sem vendas no período')}</div>`;
}
function render(d) {
  relatorioAtual = d;
  const r = d.resumo;
  $r('periodo-label').textContent = `Período: ${new Date(`${d.periodo.de}T12:00:00`).toLocaleDateString('pt-BR')} até ${new Date(`${d.periodo.ate}T12:00:00`).toLocaleDateString('pt-BR')}`;
  $r('kpis').innerHTML = cartoesFinanceiros(r, 'col-6 col-xl-3', 'fs-5')
    + `<div class="col-6 col-xl-3"><article class="card app-kpi-card border-0 p-3 h-100"><p class="small text-secondary mb-2">Pedidos · Ticket médio</p><strong class="fs-5">${r.pedidos} <span class="text-secondary fs-6">· ${dinheiro(r.ticketMedio)}</span></strong></article></div>`;
  $r('grafico-dia').innerHTML = `<div class="report-screen-chart">${graficoDias(d.vendasPorDia)}</div>${tabelaDiasImpressao(d.vendasPorDia)}`;
  $r('grafico-pagamento').innerHTML = `<div class="report-screen-chart">${barraLista(d.porPagamento)}</div>${tabelaImpressao(d.porPagamento, 'Forma de pagamento')}`;
  $r('grafico-modalidade').innerHTML = `<div class="report-screen-chart">${barraLista(d.porModalidade)}</div>${tabelaImpressao(d.porModalidade, 'Modalidade')}`;
  $r('grafico-horario').innerHTML = `<div class="report-screen-chart">${barraLista(d.porHora)}</div>${tabelaImpressao(d.porHora, 'Horário')}`;
  const despesasPorTipo = (d.despesasPorTipo || []).map((x) => ({ chave: ({ insumo: 'Insumos', conta_fixa: 'Contas fixas', outros: 'Outros' })[x.chave] || x.chave, valor: x.valor }));
  $r('grafico-despesas').innerHTML = `<div class="report-screen-chart">${barraLista(despesasPorTipo)}</div>${tabelaImpressao(despesasPorTipo, 'Tipo de despesa', 'Valor')}`;
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
