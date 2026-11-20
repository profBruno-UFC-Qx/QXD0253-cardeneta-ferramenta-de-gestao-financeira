const STATUS_EXCLUIDOS = ['cancelado'];
function dataLocalISO(d) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Fortaleza', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
}
function horaLocal(d) {
  return new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Fortaleza', hour: '2-digit', hourCycle: 'h23' }).format(d) + ':00';
}
function dataValida(valor) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(valor || ''))) return false;
  const data = new Date(`${valor}T12:00:00.000Z`);
  return Number.isFinite(data.getTime()) && data.toISOString().slice(0, 10) === valor;
}
function obterPeriodo(ctx) {
  const agora = new Date();
  const ate = ctx.query.ate || dataLocalISO(agora);
  const dataMes = dataLocalISO(agora).slice(0, 7) + '-01';
  const de = ctx.query.de || dataMes;
  if (!dataValida(de) || !dataValida(ate) || de > ate) return null;
  return { de, ate };
}
const soma = (mapa, chave, valor) => { mapa[chave] = (mapa[chave] || 0) + valor; };
module.exports = {
  async resumo(ctx) {
    const periodo = obterPeriodo(ctx);
    if (!periodo) return ctx.badRequest('Intervalo de datas inválido');
    const { de, ate } = periodo;
    const inicioUtc = new Date(`${de}T00:00:00-03:00`).toISOString();
    const fimUtc = new Date(new Date(`${ate}T00:00:00-03:00`).getTime() + 86400000 - 1).toISOString();
    const pedidos = await strapi.documents('api::pedido.pedido').findMany({
      filters: { createdAt: { $gte: inicioUtc, $lte: fimUtc }, status: { $notIn: STATUS_EXCLUIDOS } },
      populate: { itens: true },
      sort: { createdAt: 'asc' },
      limit: 10000,
    });
    const despesas = await strapi.documents('api::despesa.despesa').findMany({
      filters: { data: { $gte: de, $lte: ate } }, sort: { data: 'asc' }, limit: 10000,
    });
    const vendasPorDia = {};
    const porPagamento = {};
    const porModalidade = {};
    const porHora = {};
    const produtos = {};
    const pedidosPorDia = {};
    let faturamento = 0;
    let emAndamento = 0;
    for (const pedido of pedidos) {
      const total = Number(pedido.total) || 0;
      const quando = new Date(pedido.createdAt);
      const dia = dataLocalISO(quando);
      const hora = horaLocal(quando);
      faturamento += total;
      soma(vendasPorDia, dia, total);
      soma(pedidosPorDia, dia, 1);
      soma(porPagamento, pedido.formaPagamento || 'não informado', total);
      soma(porModalidade, pedido.modalidade || 'não informado', total);
      soma(porHora, hora, total);
      if (!['entregue', 'cancelado'].includes(pedido.status)) emAndamento++;
      for (const item of pedido.itens || []) {
        const nome = item.nomeProduto || 'Produto removido';
        produtos[nome] = (produtos[nome] || 0) + (Number(item.quantidade) || 0);
      }
    }
    const despesasPorTipo = {};
    let totalDespesas = 0;
    for (const despesa of despesas) {
      const valor = Number(despesa.valor) || 0;
      totalDespesas += valor;
      soma(despesasPorTipo, despesa.tipo || 'outros', valor);
    }
    const quantidadePedidos = pedidos.length;
    const porDia = Object.keys(vendasPorDia).sort().map((data) => ({ data, faturamento: arredondar(vendasPorDia[data]), pedidos: pedidosPorDia[data] }));
    ctx.body = {
      periodo: { de, ate },
      resumo: { faturamento: arredondar(faturamento), despesas: arredondar(totalDespesas), lucroEstimado: arredondar(faturamento - totalDespesas), pedidos: quantidadePedidos, ticketMedio: arredondar(quantidadePedidos ? faturamento / quantidadePedidos : 0), emAndamento },
      vendasPorDia: porDia,
      porPagamento: ordenarValores(porPagamento),
      porModalidade: ordenarValores(porModalidade),
      porHora: ordenarValores(porHora),
      despesasPorTipo: ordenarValores(despesasPorTipo),
      produtosMaisVendidos: Object.entries(produtos).map(([nome, quantidade]) => ({ nome, quantidade })).sort((a, b) => b.quantidade - a.quantidade).slice(0, 10),
    };
  },
};
function arredondar(valor) { return Math.round((valor + Number.EPSILON) * 100) / 100; }
function ordenarValores(obj) { return Object.entries(obj).sort((a, b) => b[1] - a[1]).map(([chave, valor]) => ({ chave, valor: arredondar(valor) })); }
