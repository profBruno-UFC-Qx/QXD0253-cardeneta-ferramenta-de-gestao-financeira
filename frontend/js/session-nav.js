const linkConta = document.getElementById('link-conta');
const botaoSairNav = document.getElementById('btn-sair-nav');

if (getToken() && linkConta) {
  linkConta.href = 'perfil.html';
  linkConta.textContent = 'Minha conta';
  if (botaoSairNav) botaoSairNav.hidden = false;
}

botaoSairNav?.addEventListener('click', sair);
