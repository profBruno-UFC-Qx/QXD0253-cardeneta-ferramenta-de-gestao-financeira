let categorias = [];
const porId = (id) => document.getElementById(id);

function produtosDaCategoria(categoria) {
  if (Array.isArray(categoria.produtos)) return categoria.produtos;
  return categoria.produtos?.data || [];
}

function renderCategorias() {
  const lista = porId('lista');
  porId('resumo').textContent = `${categorias.length} ${categorias.length === 1 ? 'categoria cadastrada' : 'categorias cadastradas'}`;
  lista.innerHTML = categorias.length ? categorias.map((c) => {
    const vinculados = produtosDaCategoria(c).length;
    return `<article class="d-flex flex-wrap align-items-center justify-content-between gap-3 border-bottom p-3">
      <div class="overflow-hidden flex-fill"><h2 class="fs-6 fw-semibold mb-1">${esc(c.nome)}</h2><p class="text-secondary small mb-1">${esc(c.descricao || 'Sem descrição')}</p><span class="badge text-bg-light">${vinculados} ${vinculados === 1 ? 'produto' : 'produtos'}</span></div>
      <div class="d-flex gap-2"><button type="button" class="btn btn-sm btn-outline-secondary" data-acao="editar" data-id="${esc(c.documentId)}"><span class="material-symbols-outlined align-middle fs-6">edit</span> Editar</button><button type="button" class="btn btn-sm btn-outline-danger" data-acao="excluir" data-id="${esc(c.documentId)}"><span class="material-symbols-outlined align-middle fs-6">delete</span> Excluir</button></div>
    </article>`;
  }).join('') : '<p class="text-secondary small p-3 mb-0">Nenhuma categoria cadastrada.</p>';
}

async function carregar() {
  categorias = await apiTodos('/categorias', { populate: 'produtos', sort: 'nome:asc' });
  renderCategorias();
}

function abrir(categoria = null) {
  const form = porId('dlg-categoria-form');
  form.dataset.id = categoria?.documentId || '';
  porId('dlg-categoria-titulo').textContent = categoria ? 'Editar categoria' : 'Nova categoria';
  porId('c-nome').value = categoria?.nome || '';
  porId('c-descricao').value = categoria?.descricao || '';
  porId('dlg-categoria').showModal();
}

async function salvar(evento) {
  evento.preventDefault();
  const form = evento.currentTarget;
  if (!form.reportValidity()) return;
  const id = form.dataset.id;
  const botao = form.querySelector('[type="submit"]');
  botao.disabled = true;
  try {
    await api(id ? `/categorias/${encodeURIComponent(id)}` : '/categorias', {
      method: id ? 'PUT' : 'POST',
      body: { data: { nome: porId('c-nome').value.trim(), descricao: porId('c-descricao').value.trim() } },
    });
    porId('dlg-categoria').close();
    toast('Categoria salva');
    await carregar();
  } catch (erro) { toast(erro.message, 'erro'); }
  finally { botao.disabled = false; }
}

async function acao(evento) {
  const botao = evento.target.closest('[data-acao]');
  if (!botao) return;
  const categoria = categorias.find((c) => c.documentId === botao.dataset.id);
  if (!categoria) return;
  if (botao.dataset.acao === 'editar') abrir(categoria);
  if (botao.dataset.acao === 'excluir') {
    const total = produtosDaCategoria(categoria).length;
    const aviso = total ? ` Ela possui ${total} produto(s); confirme que deseja excluir a categoria.` : '';
    if (!confirm(`Excluir a categoria “${categoria.nome}”?${aviso}`)) return;
    try {
      await api(`/categorias/${encodeURIComponent(categoria.documentId)}`, { method: 'DELETE' });
      toast('Categoria excluída');
      await carregar();
    } catch (erro) { toast(erro.message, 'erro'); }
  }
}

function iniciar() {
  porId('btn-novo').addEventListener('click', () => abrir());
  porId('dlg-categoria-form').addEventListener('submit', salvar);
  porId('lista').addEventListener('click', acao);
  carregar().catch((erro) => toast(erro.message, 'erro'));
}

if (montarLayout()) iniciar();
