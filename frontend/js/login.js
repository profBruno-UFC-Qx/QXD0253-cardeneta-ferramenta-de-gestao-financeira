const formLogin = document.getElementById('form-login');
const erroLogin = document.getElementById('erro');

function destinoDepoisDoLogin() {
  const proxima = new URLSearchParams(window.location.search).get('next');
  return proxima && /^[a-z0-9-]+\.html$/i.test(proxima) ? proxima : 'index.html';
}

if (getToken()) {
  window.location.replace('perfil.html');
} else {
  formLogin.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    erroLogin.hidden = true;
    const botao = document.getElementById('btn-enviar');
    botao.disabled = true;
    botao.textContent = 'Entrando…';

    try {
      const resultado = await api('/auth/local', {
        method: 'POST',
        auth: false,
        body: {
          identifier: document.getElementById('identifier').value.trim(),
          password: document.getElementById('senha').value,
        },
      });
      salvarSessao(resultado.jwt, { id: resultado.user.id });
      const conta = await api('/conta');
      salvarSessao(resultado.jwt, conta);
      window.location.assign(destinoDepoisDoLogin());
    } catch (erro) {
      limparSessao();
      erroLogin.textContent = erro.message;
      erroLogin.hidden = false;
      botao.disabled = false;
      botao.textContent = 'Entrar';
    }
  });
}
