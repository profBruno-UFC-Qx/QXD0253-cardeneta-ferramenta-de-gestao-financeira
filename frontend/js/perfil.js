function redirecionarLogin() {
  window.location.replace(`login.html?next=${encodeURIComponent('perfil.html')}`);
}

async function iniciarPerfil() {
  if (!getToken()) {
    redirecionarLogin();
    return;
  }

  document.getElementById('form-conta').addEventListener('submit', async (evento) => {
    evento.preventDefault();
    const erro = document.getElementById('erro-conta');
    erro.hidden = true;
    const cpf = document.getElementById('u-cpf').value;
    const telefone = document.getElementById('u-telefone').value;
    if (cpf && !cpfValido(cpf)) {
      erro.textContent = 'CPF inválido.';
      erro.hidden = false;
      return;
    }
    if (!telefoneValido(telefone)) {
      erro.textContent = 'Telefone inválido. Informe DDD e número.';
      erro.hidden = false;
      return;
    }

    const botao = evento.submitter || evento.currentTarget.querySelector('[type="submit"]');
    botao.disabled = true;
    try {
      const conta = await api('/conta', {
        method: 'PUT',
        body: {
          nome: document.getElementById('u-nome').value.trim(),
          cpf: cpf ? digitos(cpf) : '',
          telefone: digitos(telefone),
        },
      });
      salvarSessao(getToken(), conta);
      toast('Dados atualizados.');
    } catch (falha) {
      erro.textContent = falha.message;
      erro.hidden = false;
    } finally {
      botao.disabled = false;
    }
  });

  iniciarEnderecos();
  try {
    const conta = await api('/conta');
    salvarSessao(getToken(), conta);
    const linkEquipe = document.getElementById('link-pedidos-equipe');
    if (linkEquipe) linkEquipe.hidden = !['atendente', 'gerente'].includes(conta.role?.type);
    document.getElementById('u-nome').value = conta.nome || '';
    document.getElementById('u-email').value = conta.email || '';
    document.getElementById('u-cpf').value = mascaraCpf(conta.cpf || '');
    document.getElementById('u-telefone').value = mascaraTelefone(conta.telefone || '');
    await carregarEnderecos();
  } catch (erro) {
    if (/sessão|credenciais|401/i.test(erro.message)) {
      limparSessao();
      redirecionarLogin();
      return;
    }
    toast(erro.message, 'erro');
    document.getElementById('lista-enderecos').innerHTML = '<p class="small text-danger">Não foi possível carregar os endereços.</p>';
  }
}

if (montarLayout()) iniciarPerfil();
