async function cadastrar(e) {
  e.preventDefault();
  const valor = (id) => document.getElementById(id).value.trim();
  document.getElementById('erro').classList.add('d-none');

  if (!cpfValido(valor('cpf'))) return mostrarErro('CPF inválido', true);
  if (!telefoneValido(valor('telefone'))) return mostrarErro('Telefone inválido. Use DDD + número', true);

  const botao = document.getElementById('btn-enviar');
  botao.disabled = true;
  try {
    const res = await api('/conta/cadastro', {
      method: 'POST',
      auth: false,
      body: {
        nome: valor('nome'),
        email: valor('email'),
        senha: document.getElementById('senha').value,
        cpf: digitos(valor('cpf')),
        telefone: digitos(valor('telefone')),
      },
    });
    salvarSessao(res.jwt, res.usuario);
    window.location.href = 'index.html';
  } catch (erro) {
    mostrarErro(erro.message, true);
    botao.disabled = false;
  }
}

function iniciar() {
  if (papel()) {
    window.location.href = paginaInicial();
    return;
  }
  document.getElementById('form-cadastro').addEventListener('submit', cadastrar);
}

if (montarLayout()) iniciar();
