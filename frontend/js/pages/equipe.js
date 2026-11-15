let usuarios = [];
const meuId = getUsuario()?.id;
const papeis = [
  { tipo: 'authenticated', rotulo: 'Cliente' },
  { tipo: 'atendente', rotulo: 'Atendente' },
  { tipo: 'gerente', rotulo: 'Gerente' },
];
const porId = (id) => document.getElementById(id);

function linhaUsuario(u) {
  const proprio = Number(u.id) === Number(meuId);
  const opcoes = papeis.map((p) => `<option value="${p.tipo}" ${p.tipo === u.papel ? 'selected' : ''}>${p.rotulo}</option>`).join('');
  return `<div class="list-group-item d-flex flex-wrap align-items-center gap-3 p-3">
    <div class="d-flex align-items-center justify-content-center rounded-circle bg-warning-subtle text-dark fw-semibold flex-shrink-0" style="width:40px;height:40px">${esc(iniciais(u.nome))}</div>
    <div class="overflow-hidden flex-fill"><p class="text-truncate fw-semibold mb-1">${esc(u.nome)}${proprio ? ' <span class="text-secondary small fw-normal">(você)</span>' : ''}</p><p class="text-secondary small text-truncate mb-0">${esc(u.email)}${u.telefone ? ` · ${esc(mascaraTelefone(u.telefone))}` : ''}</p></div>
    <select class="form-select form-select-sm w-auto" data-acao="papel" data-id="${u.id}" ${proprio ? 'disabled' : ''} aria-label="Papel de ${esc(u.nome)}">${opcoes}</select>
    <div class="form-check form-switch mb-0"><input class="form-check-input" type="checkbox" role="switch" data-acao="ativo" data-id="${u.id}" ${u.bloqueado ? '' : 'checked'} ${proprio ? 'disabled' : ''} aria-label="Conta ativa de ${esc(u.nome)}"><label class="form-check-label small">Ativa</label></div>
  </div>`;
}

function secao(titulo, lista) {
  const linhas = lista.length ? lista.map(linhaUsuario).join('') : '<p class="text-secondary small p-3 mb-0">Ninguém por aqui.</p>';
  return `<section class="card border-0 shadow-sm"><div class="d-flex justify-content-between align-items-center border-bottom px-3 py-2"><h2 class="fs-6 fw-bold mb-0">${titulo}</h2><span class="badge text-bg-light">${lista.length}</span></div><div class="list-group list-group-flush">${linhas}</div></section>`;
}

function renderUsuarios() {
  porId('lista').innerHTML = secao('Equipe', usuarios.filter((u) => ['atendente', 'gerente'].includes(u.papel)))
    + secao('Clientes', usuarios.filter((u) => u.papel === 'authenticated'));
}

async function carregar() {
  usuarios = await api('/equipe');
  renderUsuarios();
}

async function atualizar(id, dados) {
  try {
    await api(`/equipe/${encodeURIComponent(id)}`, { method: 'PUT', body: dados });
    toast('Alteração salva');
  } catch (erro) { toast(erro.message, 'erro'); }
  await carregar();
}

async function criar(evento) {
  evento.preventDefault();
  const form = evento.currentTarget;
  if (!form.reportValidity()) return;
  const botao = form.querySelector('[type="submit"]');
  botao.disabled = true;
  try {
    await api('/equipe', {
      method: 'POST',
      body: {
        nome: porId('f-nome').value.trim(),
        email: porId('f-email').value.trim(),
        telefone: digitos(porId('f-telefone').value),
        senha: porId('f-senha').value,
        papel: porId('f-papel').value,
      },
    });
    porId('dlg-funcionario').close();
    form.reset();
    toast('Funcionário criado');
    await carregar();
  } catch (erro) { toast(erro.message, 'erro'); }
  finally { botao.disabled = false; }
}

function iniciar() {
  porId('btn-novo').addEventListener('click', () => porId('dlg-funcionario').showModal());
  porId('dlg-funcionario-form').addEventListener('submit', criar);
  porId('lista').addEventListener('change', (evento) => {
    const alvo = evento.target.closest('[data-acao]');
    if (!alvo) return;
    if (alvo.dataset.acao === 'papel') atualizar(alvo.dataset.id, { papel: alvo.value });
    if (alvo.dataset.acao === 'ativo') atualizar(alvo.dataset.id, { bloqueado: !alvo.checked });
  });
  carregar().catch((erro) => toast(erro.message, 'erro'));
}

if (montarLayout()) iniciar();
