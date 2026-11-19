function cartoesFinanceiros(resumo, coluna = 'col-12 col-sm-4', tamanhoValor = 'fs-4') {
  const lucroClasse = resumo.lucroEstimado < 0 ? 'text-danger' : 'text-success';
  const indicadores = [
    { titulo: 'Faturamento', valor: dinheiro(resumo.faturamento), classe: '' },
    { titulo: 'Despesas', valor: dinheiro(resumo.despesas), classe: 'text-danger' },
    { titulo: 'Lucro estimado', valor: dinheiro(resumo.lucroEstimado), classe: lucroClasse },
  ];

  return indicadores.map((item) => `<div class="${coluna}">
    <article class="card app-kpi-card border-0 p-3 h-100">
      <p class="small text-secondary mb-2">${item.titulo}</p>
      <strong class="${tamanhoValor} ${item.classe}">${item.valor}</strong>
    </article>
  </div>`).join('');
}

function paginacaoHtml(total, pagina, tamanho = 12) {
  const paginas = Math.ceil(total / tamanho);
  if (paginas <= 1) return '';
  return `<nav class="d-flex align-items-center justify-content-center gap-3 py-2" aria-label="Paginação de produtos">
    <button type="button" class="btn btn-outline-secondary btn-sm" data-pagina="${pagina - 1}" ${pagina <= 1 ? 'disabled' : ''}>Anterior</button>
    <span class="small text-secondary" aria-live="polite">Página ${pagina} de ${paginas}</span>
    <button type="button" class="btn btn-outline-secondary btn-sm" data-pagina="${pagina + 1}" ${pagina >= paginas ? 'disabled' : ''}>Próxima</button>
  </nav>`;
}
