let catalogo = [];
const elAdicional = (id) => document.getElementById(id);
function renderCatalogo() {
  const lista = elAdicional('lista');
  elAdicional('resumo').textContent = `${catalogo.length} adicionais cadastrados`;
  lista.innerHTML = catalogo.length ? catalogo.map((a) => {
    const vinculos = Array.isArray(a.produtos) ? a.produtos.length : 0;
    return `<tr>
      <td><strong>${esc(a.nome)}</strong>${vinculos ? `<div class="text-secondary small">Usado em ${vinculos} ${vinculos === 1 ? 'produto' : 'produtos'}</div>` : ''}</td>
      <td>${dinheiro(a.preco)}</td>
      <td><span class="badge ${a.disponivel ? 'text-bg-success' : 'text-bg-secondary'}">${a.disponivel ? 'Ativo' : 'Inativo'}</span></td>
      <td><div class="d-flex justify-content-end gap-2">
        <button type="button" class="btn btn-sm btn-outline-secondary" data-acao="editar" data-id="${esc(a.documentId)}"><span class="material-symbols-outlined align-middle fs-6">edit</span> Editar</button>
        <button type="button" class="btn btn-sm btn-outline-danger" data-acao="excluir" data-id="${esc(a.documentId)}" aria-label="Excluir ${esc(a.nome)}"><span class="material-symbols-outlined align-middle fs-6">delete</span></button>
      </div></td>
    </tr>`;
  }).join('') : '<tr><td colspan="4" class="py-5 text-center text-secondary">Nenhum adicional cadastrado.</td></tr>';
}
async function carregar() {
  catalogo = await apiTodos('/adicionais', { populate: 'produtos', sort: 'nome:asc' });
  renderCatalogo();
}
function abrir(adicional = null) {
  const form = elAdicional('form-adicional');
  form.dataset.id = adicional?.documentId || '';
  elAdicional('titulo-dialogo').textContent = adicional ? 'Editar adicional' : 'Novo adicional';
  elAdicional('a-nome').value = adicional?.nome || '';
  elAdicional('a-preco').value = adicional?.preco ?? '';
  elAdicional('a-disponivel').checked = adicional ? Boolean(adicional.disponivel) : true;
  elAdicional('dlg-adicional').showModal();
}
async function salvar(evento) {
  evento.preventDefault();
  const form = evento.currentTarget;
  if (!form.reportValidity()) return;
  const id = form.dataset.id;
  const botao = form.querySelector('[type="submit"]');
  botao.disabled = true;
  try {
    await api(id ? `/adicionais/${encodeURIComponent(id)}` : '/adicionais', {
      method: id ? 'PUT' : 'POST',
      body: { data: { nome: elAdicional('a-nome').value.trim(), preco: Number(elAdicional('a-preco').value), disponivel: elAdicional('a-disponivel').checked } },
    });
    elAdicional('dlg-adicional').close();
    toast(id ? 'Adicional atualizado' : 'Adicional cadastrado');
    await carregar();
  } catch (erro) { toast(erro.message, 'erro'); }
  finally { botao.disabled = false; }
}
async function acionar(evento) {
  const botao = evento.target.closest('[data-acao]');
  if (!botao) return;
  const adicional = catalogo.find((item) => item.documentId === botao.dataset.id);
  if (!adicional) return;
  if (botao.dataset.acao === 'editar') return abrir(adicional);
  const quantidade = Array.isArray(adicional.produtos) ? adicional.produtos.length : 0;
  const aviso = quantidade ? ` O adicional está associado a ${quantidade} produto(s); a exclusão também removerá essas associações.` : '';
  if (!confirm(`Excluir “${adicional.nome}”?${aviso}`)) return;
  try {
    await api(`/adicionais/${encodeURIComponent(adicional.documentId)}`, { method: 'DELETE' });
    toast('Adicional excluído do catálogo');
    await carregar();
  } catch (erro) { toast(erro.message, 'erro'); }
}
function iniciarAdicionais() {
  elAdicional('btn-novo').addEventListener('click', () => abrir());
  elAdicional('form-adicional').addEventListener('submit', salvar);
  elAdicional('lista').addEventListener('click', acionar);
  carregar().catch((erro) => toast(erro.message, 'erro'));
}
if (montarLayout()) iniciarAdicionais();
