let enderecos = [];
const camposEndereco = ['rotulo', 'destinatario', 'telefone', 'cep', 'rua', 'numero', 'complemento', 'bairro', 'cidade', 'referencia'];

function valorCampoEndereco(campo) {
  return document.getElementById(`end-${campo}`).value.trim();
}

function dadosDoFormularioEndereco() {
  return {
    rotulo: valorCampoEndereco('rotulo'),
    destinatario: valorCampoEndereco('destinatario'),
    telefone: digitos(valorCampoEndereco('telefone')),
    cep: digitos(valorCampoEndereco('cep')),
    rua: valorCampoEndereco('rua'),
    numero: valorCampoEndereco('numero'),
    complemento: valorCampoEndereco('complemento'),
    bairro: valorCampoEndereco('bairro'),
    cidade: valorCampoEndereco('cidade'),
    referencia: valorCampoEndereco('referencia'),
  };
}

function limparFormularioEndereco() {
  document.getElementById('form-endereco').reset();
  document.getElementById('end-id').value = '';
  document.getElementById('titulo-form-endereco').textContent = 'Novo endereço';
  document.getElementById('btn-salvar-endereco').textContent = 'Salvar endereço';
}

function preencherFormularioEndereco(endereco) {
  document.getElementById('end-id').value = endereco.documentId;
  camposEndereco.forEach((campo) => {
    const elemento = document.getElementById(`end-${campo}`);
    const valor = endereco[campo] || '';
    elemento.value = campo === 'telefone' ? mascaraTelefone(valor) : valor;
  });
  document.getElementById('titulo-form-endereco').textContent = 'Editar endereço';
  document.getElementById('btn-salvar-endereco').textContent = 'Salvar alterações';
}

function renderEnderecos() {
  const caixa = document.getElementById('lista-enderecos');
  if (!enderecos.length) {
    caixa.innerHTML = '<p class="text-secondary small mb-0">Você ainda não cadastrou endereços.</p>';
    return;
  }

  caixa.innerHTML = enderecos.map((endereco) => {
    const linha = [
      `${endereco.rua}, ${endereco.numero}${endereco.complemento ? ` — ${endereco.complemento}` : ''}`,
      endereco.bairro,
      endereco.cidade,
      endereco.cep ? `CEP ${endereco.cep}` : '',
    ].filter(Boolean).join(' · ');
    return `<article class="card border-0 shadow-sm d-flex flex-column flex-sm-row align-items-start justify-content-between gap-3 p-3">
      <div class="overflow-hidden">
        <strong>${esc(endereco.rotulo || 'Endereço')} · ${esc(endereco.destinatario)}</strong>
        <p class="small mb-1 mt-1">${esc(linha)}</p>
        ${endereco.telefone ? `<small class="d-block text-secondary">${esc(mascaraTelefone(endereco.telefone))}</small>` : ''}
        ${endereco.referencia ? `<small class="d-block text-secondary">Referência: ${esc(endereco.referencia)}</small>` : ''}
      </div>
      <div class="d-flex flex-wrap gap-2">
        <button type="button" class="btn btn-outline-secondary btn-sm rounded-3" data-editar-endereco="${esc(endereco.documentId)}">Editar</button>
        <button type="button" class="btn btn-outline-danger btn-sm rounded-3" data-excluir-endereco="${esc(endereco.documentId)}">Excluir</button>
      </div>
    </article>`;
  }).join('');
}

async function carregarEnderecos() {
  const resultado = await api('/enderecos?sort=createdAt:desc');
  enderecos = resultado.data || [];
  renderEnderecos();
}

function iniciarEnderecos() {
  const form = document.getElementById('form-endereco');
  const caixa = document.getElementById('lista-enderecos');
  const btnNovo = document.getElementById('btn-novo-endereco');

  btnNovo.addEventListener('click', () => {
    limparFormularioEndereco();
    form.hidden = false;
    document.getElementById('end-destinatario').focus();
  });

  document.getElementById('btn-cancelar-endereco').addEventListener('click', () => {
    form.hidden = true;
    limparFormularioEndereco();
  });

  form.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    const dados = dadosDoFormularioEndereco();
    const id = document.getElementById('end-id').value;
    const botao = document.getElementById('btn-salvar-endereco');
    botao.disabled = true;
    try {
      if (id) await api(`/enderecos/${encodeURIComponent(id)}`, { method: 'PUT', body: { data: dados } });
      else await api('/enderecos', { method: 'POST', body: { data: dados } });
      form.hidden = true;
      limparFormularioEndereco();
      await carregarEnderecos();
      toast(id ? 'Endereço atualizado.' : 'Endereço adicionado.');
    } catch (erro) {
      toast(erro.message, 'erro');
    } finally {
      botao.disabled = false;
    }
  });

  caixa.addEventListener('click', async (evento) => {
    const btnEditar = evento.target.closest('[data-editar-endereco]');
    if (btnEditar) {
      const item = enderecos.find((endereco) => endereco.documentId === btnEditar.dataset.editarEndereco);
      if (!item) return;
      preencherFormularioEndereco(item);
      form.hidden = false;
      form.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }

    const btnExcluir = evento.target.closest('[data-excluir-endereco]');
    if (!btnExcluir) return;
    if (!window.confirm('Deseja excluir este endereço?')) return;
    try {
      await api(`/enderecos/${encodeURIComponent(btnExcluir.dataset.excluirEndereco)}`, { method: 'DELETE' });
      await carregarEnderecos();
      toast('Endereço excluído.');
    } catch (erro) {
      toast(erro.message, 'erro');
    }
  });
}
