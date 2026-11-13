function destino() {
  const proxima = new URLSearchParams(window.location.search).get('next');
  if (proxima && /^[a-z0-9-]+\.html$/.test(proxima)) return proxima;
  return paginaInicial();
}

async function entrar(e) {
  e.preventDefault();
  const botao = document.getElementById('btn-enviar');
  document.getElementById('erro').classList.add('d-none');
  botao.disabled = true;
  try {
    const res = await api('/auth/local', {
      method: 'POST',
      auth: false,
      body: {
        identifier: document.getElementById('identifier').value.trim(),
        password: document.getElementById('senha').value,
      },
    });
    salvarSessao(res.jwt, { id: res.user.id });
    const conta = await api('/conta');
    salvarSessao(res.jwt, conta);
    window.location.href = destino();
  } catch (erro) {
    limparSessao();
    mostrarErro(erro.message);
    botao.disabled = false;
  }
}

function iniciar() {
  if (papel()) {
    window.location.href = paginaInicial();
    return;
  }
  limparSessao();
  document.getElementById('form-login').addEventListener('submit', entrar);
}

if (montarLayout()) iniciar();
