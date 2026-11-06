function getToken() {
  return localStorage.getItem('token') || '';
}

function getUsuario() {
  try {
    return JSON.parse(localStorage.getItem('usuario'));
  } catch {
    return null;
  }
}

function salvarSessao(jwt, usuario) {
  localStorage.setItem('token', jwt);
  localStorage.setItem('usuario', JSON.stringify(usuario));
}

function limparSessao() {
  localStorage.removeItem('token');
  localStorage.removeItem('usuario');
}

function sair() {
  limparSessao();
  window.location.href = 'index.html';
}

function papel() {
  return getUsuario()?.role?.type || null;
}

function escapar(valor) {
  return String(valor ?? '').replace(/[&<>"']/g, (caractere) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[caractere]);
}

async function api(caminho, { method = 'GET', body, auth = true } = {}) {
  const headers = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const token = getToken();
  if (auth && token) headers.Authorization = `Bearer ${token}`;

  let resposta;
  try {
    resposta = await fetch(`${API_URL}${caminho}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new Error('Não foi possível conectar ao Strapi. Verifique se o backend está iniciado.');
  }

  if (resposta.status === 204) return null;
  const json = await resposta.json().catch(() => null);
  if (!resposta.ok) {
    if (resposta.status === 401 && auth && token) {
      limparSessao();
      throw new Error('Sessão expirada. Entre novamente.');
    }
    const mensagem = json?.error?.message || `Erro na requisição (${resposta.status})`;
    const traducoes = {
      'Invalid identifier or password': 'E-mail ou senha incorretos',
      'Email or Username are already taken': 'E-mail ou nome já cadastrado',
      'Email already taken': 'E-mail já cadastrado',
      'Your account has been blocked by an administrator': 'Sua conta está bloqueada',
      Forbidden: 'Você não tem permissão para isso',
      'Missing or invalid credentials': 'Sessão expirada. Entre novamente.',
    };
    throw new Error(traducoes[mensagem] || mensagem);
  }
  return json;
}

function digitos(valor) {
  return String(valor || '').replace(/\D/g, '');
}

function mascaraCpf(valor) {
  return digitos(valor).slice(0, 11)
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

function mascaraTelefone(valor) {
  const d = digitos(valor).slice(0, 11);
  if (!d) return '';
  if (d.length < 3) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  const corte = d.length > 10 ? 7 : 6;
  return `(${d.slice(0, 2)}) ${d.slice(2, corte)}-${d.slice(corte)}`;
}

function cpfValido(valor) {
  const d = digitos(valor);
  if (d.length !== 11 || /^(\d)\1+$/.test(d)) return false;
  const calcular = (n) => {
    let soma = 0;
    for (let i = 0; i < n; i++) soma += Number(d[i]) * (n + 1 - i);
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  };
  return calcular(9) === Number(d[9]) && calcular(10) === Number(d[10]);
}

function telefoneValido(valor) {
  const tamanho = digitos(valor).length;
  return tamanho === 10 || tamanho === 11;
}

function dinheiro(valor) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(valor) || 0);
}

function urlImagem(imagem) {
  if (!imagem?.url) return '';
  return imagem.url.startsWith('http') ? imagem.url : API_ORIGIN + imagem.url;
}

function toast(mensagem, tipo = 'sucesso') {
  let caixa = document.getElementById('toasts');
  if (!caixa) {
    caixa = document.createElement('div');
    caixa.id = 'toasts';
    caixa.className = 'toasts';
    caixa.setAttribute('aria-live', 'polite');
    document.body.appendChild(caixa);
  }
  const item = document.createElement('div');
  item.className = `toast ${tipo === 'erro' ? 'toast-erro' : 'toast-ok'}`;
  item.setAttribute('role', 'status');
  item.textContent = mensagem;
  caixa.appendChild(item);
  window.setTimeout(() => item.remove(), 4000);
}

document.addEventListener('input', (evento) => {
  const alvo = evento.target;
  if (alvo.dataset.mascara === 'cpf') alvo.value = mascaraCpf(alvo.value);
  if (alvo.dataset.mascara === 'telefone') alvo.value = mascaraTelefone(alvo.value);
});
