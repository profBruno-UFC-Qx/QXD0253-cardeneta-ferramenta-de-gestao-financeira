const elLanchoneta = (id) => document.getElementById(id);
let seletorLogoLanchoneta;

function mostrarErroLanchoneta(mensagem) {
  const alerta = elLanchoneta('erro');
  alerta.textContent = mensagem || 'Não foi possível concluir a operação.';
  alerta.classList.remove('d-none');
}

function atualizarEstadoLanchoneta() {
  const badge = elLanchoneta('estado-loja');
  const aberta = elLanchoneta('l-aberta').checked;
  badge.className = `badge-status ${aberta ? 'badge-aberta' : 'badge-fechada'} mb-3`;
  badge.innerHTML = `<span class="dot ${aberta ? 'bg-success' : 'bg-danger'}"></span>${aberta ? 'Aberta — recebendo pedidos' : 'Fechada — pedidos pausados'}`;
}

async function carregarLanchoneta() {
  const loja = await carregarLoja();
  if (!loja) throw new Error('Não foi possível carregar os dados da lanchonete. Confira se o Strapi está iniciado.');

  elLanchoneta('l-nome').value = loja.nome || '';
  elLanchoneta('l-descricao').value = loja.descricao || '';
  elLanchoneta('l-telefone').value = loja.telefone || '';
  elLanchoneta('l-endereco').value = loja.endereco || '';
  elLanchoneta('l-horario').value = loja.horario || '';
  elLanchoneta('l-taxa').value = Number(loja.taxaEntrega || 0).toFixed(2);
  elLanchoneta('l-aberta').checked = loja.aberta !== false;
  seletorLogoLanchoneta.reiniciar(loja.logo ? urlImagem(loja.logo) : '');
  atualizarEstadoLanchoneta();
  elLanchoneta('btn-salvar').disabled = false;
}

async function salvarLanchoneta(evento) {
  evento.preventDefault();
  const form = evento.currentTarget;
  if (!form.reportValidity()) return;
  elLanchoneta('erro').classList.add('d-none');

  const botao = elLanchoneta('btn-salvar');
  botao.disabled = true;
  try {
    const dados = {
      nome: elLanchoneta('l-nome').value.trim(),
      descricao: elLanchoneta('l-descricao').value.trim(),
      telefone: elLanchoneta('l-telefone').value.trim(),
      endereco: elLanchoneta('l-endereco').value.trim(),
      horario: elLanchoneta('l-horario').value.trim(),
      taxaEntrega: Number(elLanchoneta('l-taxa').value),
      aberta: elLanchoneta('l-aberta').checked,
    };
    await seletorLogoLanchoneta.aplicar(dados, 'logo');
    await api('/lanchonetes/configuracao', { method: 'PUT', body: { data: dados } });
    limparCacheLoja();
    await carregarLanchoneta();
    aplicarMarca();
    elLanchoneta('erro').classList.add('d-none');
    toast('Informações da lanchonete salvas');
  } catch (erro) {
    mostrarErroLanchoneta(erro.message);
    toast(erro.message, 'erro');
  } finally {
    botao.disabled = false;
  }
}

function iniciarLanchoneta() {
  seletorLogoLanchoneta = ligarSeletorImagem({
    input: elLanchoneta('l-logo'),
    previa: elLanchoneta('logo-previa'),
    remover: elLanchoneta('l-remover-logo'),
  });
  elLanchoneta('l-aberta').addEventListener('change', atualizarEstadoLanchoneta);
  elLanchoneta('form-lanchoneta').addEventListener('submit', salvarLanchoneta);
  carregarLanchoneta().catch((erro) => {
    mostrarErroLanchoneta(erro.message);
    toast(erro.message, 'erro');
  });
}

if (montarLayout()) iniciarLanchoneta();
