const TIPOS_DESPESA = { insumo: 'Insumo', conta_fixa: 'Conta fixa', outros: 'Outros' };
let despesas = [];
const $ = (id) => document.getElementById(id);
const dataHoje = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
function datasFiltro() { return { de: $('f-de').value, ate: $('f-ate').value }; }
function renderResumo(dados) {
  const r = dados.resumo;
  $('resumo-financeiro').innerHTML = `<div class="col-12 col-sm-4"><article class="card border-0 shadow-sm p-3"><p class="small text-secondary mb-2">Faturamento</p><strong class="fs-4">${dinheiro(r.faturamento)}</strong></article></div><div class="col-12 col-sm-4"><article class="card border-0 shadow-sm p-3"><p class="small text-secondary mb-2">Despesas</p><strong class="fs-4 text-danger">${dinheiro(r.despesas)}</strong></article></div><div class="col-12 col-sm-4"><article class="card border-0 shadow-sm p-3"><p class="small text-secondary mb-2">Lucro estimado</p><strong class="fs-4 ${r.lucroEstimado < 0 ? 'text-danger' : 'text-success'}">${dinheiro(r.lucroEstimado)}</strong></article></div>`;
}
function renderDespesas() {
  $('total-itens').textContent = `${despesas.length} ${despesas.length === 1 ? 'registro' : 'registros'}`;
  $('lista-despesas').innerHTML = despesas.length ? `<table class="table align-middle mb-0"><thead class="table-light"><tr><th class="ps-3">Data</th><th>Descrição</th><th>Tipo</th><th class="text-end">Valor</th><th class="text-end pe-3 d-print-none">Ações</th></tr></thead><tbody>${despesas.map((item) => `<tr><td class="ps-3 text-nowrap">${new Date(`${item.data}T12:00:00`).toLocaleDateString('pt-BR')}</td><td class="fw-medium">${esc(item.descricao)}</td><td><span class="badge text-bg-light">${TIPOS_DESPESA[item.tipo] || 'Outros'}</span></td><td class="text-end fw-semibold">${dinheiro(item.valor)}</td><td class="text-end pe-3 text-nowrap d-print-none"><button class="btn btn-sm btn-outline-secondary me-1" data-acao="editar" data-id="${esc(item.documentId)}" aria-label="Editar despesa"><span class="material-symbols-outlined fs-6 align-middle">edit</span></button><button class="btn btn-sm btn-outline-danger" data-acao="excluir" data-id="${esc(item.documentId)}" aria-label="Excluir despesa"><span class="material-symbols-outlined fs-6 align-middle">delete</span></button></td></tr>`).join('')}</tbody></table>` : `<div class="p-4">${estadoVazio('receipt_long', 'Nenhuma despesa encontrada neste período')}</div>`;
}
async function carregar() {
  const params = datasFiltro();
  const [lista, resumo] = await Promise.all([
    apiTodos('/despesas', { ...(params.de ? { de: params.de } : {}), ...(params.ate ? { ate: params.ate } : {}), sort: 'data:desc' }),
    api('/relatorios/resumo' + qs({ de: params.de || primeiroDiaMes(), ate: params.ate || dataHoje() })),
  ]);
  despesas = lista || [];
  renderResumo(resumo);
  renderDespesas();
}
function primeiroDiaMes() { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`; }
function abrir(item) {
  $('form-despesa').reset();
  $('despesa-id').value = item?.documentId || '';
  $('dlg-titulo').textContent = item ? 'Editar despesa' : 'Nova despesa';
  $('descricao').value = item?.descricao || '';
  $('valor').value = item?.valor ?? '';
  $('data').value = item?.data || dataHoje();
  $('tipo').value = item?.tipo || 'insumo';
  $('dlg-despesa').showModal();
}
async function salvar(evento) {
  evento.preventDefault();
  const form = evento.currentTarget;
  if (!form.reportValidity()) return;
  const id = $('despesa-id').value;
  const dados = { descricao: $('descricao').value.trim(), valor: Number($('valor').value), data: $('data').value, tipo: $('tipo').value };
  const botao = form.querySelector('[type="submit"]');
  botao.disabled = true;
  try {
    await api(id ? `/despesas/${encodeURIComponent(id)}` : '/despesas', { method: id ? 'PUT' : 'POST', body: { data: dados } });
    $('dlg-despesa').close(); toast(id ? 'Despesa atualizada' : 'Despesa cadastrada'); await carregar();
  } catch (erro) { toast(erro.message, 'erro'); }
  finally { botao.disabled = false; }
}
async function agir(evento) {
  const botao = evento.target.closest('[data-acao]');
  if (!botao) return;
  const item = despesas.find((d) => d.documentId === botao.dataset.id);
  if (!item) return;
  if (botao.dataset.acao === 'editar') abrir(item);
  if (botao.dataset.acao === 'excluir' && confirm(`Excluir a despesa “${item.descricao}”?`)) {
    try { await api(`/despesas/${encodeURIComponent(item.documentId)}`, { method: 'DELETE' }); toast('Despesa excluída'); await carregar(); }
    catch (erro) { toast(erro.message, 'erro'); }
  }
}
function iniciar() {
  $('filtro').addEventListener('submit', (e) => { e.preventDefault(); carregar().catch((erro) => toast(erro.message, 'erro')); });
  $('limpar').addEventListener('click', () => { $('f-de').value = ''; $('f-ate').value = ''; carregar().catch((erro) => toast(erro.message, 'erro')); });
  $('btn-nova').addEventListener('click', () => abrir());
  $('form-despesa').addEventListener('submit', salvar);
  $('lista-despesas').addEventListener('click', agir);
  carregar().catch((erro) => toast(erro.message, 'erro'));
}
if (montarLayout()) iniciar();
