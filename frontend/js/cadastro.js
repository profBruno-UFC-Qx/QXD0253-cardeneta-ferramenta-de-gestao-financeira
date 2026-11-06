const formCadastro = document.getElementById('form-cadastro');
const erroCadastro = document.getElementById('erro');

function mostrarErroCadastro(mensagem) {
  erroCadastro.textContent = mensagem;
  erroCadastro.hidden = false;
  erroCadastro.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

if (getToken()) {
  window.location.replace('perfil.html');
} else {
  formCadastro.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    erroCadastro.hidden = true;

    const nome = document.getElementById('nome').value.trim();
    const email = document.getElementById('email').value.trim().toLowerCase();
    const cpf = document.getElementById('cpf').value;
    const telefone = document.getElementById('telefone').value;
    const senha = document.getElementById('senha').value;

    if (!cpfValido(cpf)) return mostrarErroCadastro('CPF inválido. Confira os números digitados.');
    if (!telefoneValido(telefone)) return mostrarErroCadastro('Telefone inválido. Informe DDD e número.');
    if (senha.length < 6) return mostrarErroCadastro('A senha precisa ter pelo menos 6 caracteres.');

    const botao = document.getElementById('btn-enviar');
    botao.disabled = true;
    botao.textContent = 'Criando conta…';
    try {
      const resultado = await api('/conta/cadastro', {
        method: 'POST',
        auth: false,
        body: { nome, email, senha, cpf: digitos(cpf), telefone: digitos(telefone) },
      });
      salvarSessao(resultado.jwt, resultado.usuario);
      window.location.assign('perfil.html');
    } catch (erro) {
      mostrarErroCadastro(erro.message);
      botao.disabled = false;
      botao.textContent = 'Criar conta';
    }
  });
}
