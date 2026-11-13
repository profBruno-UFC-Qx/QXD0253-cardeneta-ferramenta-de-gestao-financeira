const TRADUCOES = {
  'Invalid identifier or password': 'E-mail ou senha incorretos',
  'Email or Username are already taken': 'E-mail ou nome já cadastrado',
  'Email already taken': 'E-mail já cadastrado',
  'Your account has been blocked by an administrator': 'Sua conta está bloqueada',
  Forbidden: 'Você não tem permissão para isso',
  'Missing or invalid credentials': 'Sessão expirada. Entre novamente',
};

function getToken() {
  return localStorage.getItem('token');
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

function nomeUsuario() {
  const u = getUsuario();
  return u?.nome || u?.username || '';
}

function papel() {
  return getUsuario()?.role?.type || null;
}

function mostrarErro(mensagem, rolar = false) {
  const erro = document.getElementById('erro');
  erro.textContent = mensagem;
  erro.classList.remove('d-none');
  if (rolar) erro.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function ehStaff() {
  return ['atendente', 'gerente'].includes(papel());
}

function paginaAtual() {
  const nome = window.location.pathname.split('/').pop() || 'index';
  return nome.endsWith('.html') ? nome : nome + '.html';
}

function paginaInicial() {
  return ehStaff() ? 'pedidos.html' : 'index.html';
}

function exigirPapel(papeis) {
  const atual = papel();
  if (!atual) {
    window.location.href = 'login.html?next=' + encodeURIComponent(paginaAtual());
    return false;
  }
  if (!papeis.includes(atual)) {
    window.location.href = paginaInicial();
    return false;
  }
  return true;
}

function qs(params) {
  const p = new URLSearchParams();
  Object.entries(params).forEach(([chave, valor]) => p.append(chave, valor));
  return '?' + p.toString();
}

async function api(caminho, { method = 'GET', body, auth = true } = {}) {
  const headers = {};
  if (body) headers['Content-Type'] = 'application/json';
  const token = getToken();
  if (auth && token) headers.Authorization = 'Bearer ' + token;

  const res = await fetch(API_URL + caminho, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 204) return null;
  const json = await res.json().catch(() => null);

  if (!res.ok) {
    if (res.status === 401 && auth && token) {
      limparSessao();
      if (document.body.dataset.papeis) {
        window.location.href = 'login.html?next=' + encodeURIComponent(paginaAtual());
      }
    }
    const mensagem = json?.error?.message || `Erro na requisição (${res.status})`;
    throw new Error(TRADUCOES[mensagem] || mensagem);
  }
  return json;
}

async function apiTodos(caminho, params = {}) {
  let pagina = 1;
  let total = 1;
  let itens = [];
  do {
    const res = await api(caminho + qs({ ...params, 'pagination[page]': pagina, 'pagination[pageSize]': 100 }));
    itens = itens.concat(res.data);
    total = res.meta.pagination.pageCount;
    pagina++;
  } while (pagina <= total);
  return itens;
}

async function enviarImagem(arquivo) {
  const form = new FormData();
  form.append('files', arquivo);
  const res = await fetch(API_URL + '/upload', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + getToken() },
    body: form,
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(json?.error?.message || 'Não foi possível enviar a imagem');
  return json[0];
}

function reduzirImagem(arquivo, maximo = 1000) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(arquivo);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const escala = Math.min(1, maximo / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * escala);
      canvas.height = Math.round(img.height * escala);
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => (blob
          ? resolve(new File([blob], 'imagem.jpg', { type: 'image/jpeg' }))
          : reject(new Error('Não foi possível processar a imagem'))),
        'image/jpeg',
        0.85,
      );
    };
    img.onerror = () => reject(new Error('Arquivo de imagem inválido'));
    img.src = url;
  });
}

function urlImagem(imagem) {
  if (!imagem?.url) return '';
  return imagem.url.startsWith('http') ? imagem.url : API_ORIGIN + imagem.url;
}

function ligarSeletorImagem({ input, previa, remover }) {
  const estado = { arquivo: null, removida: false };

  function mostrar(url) {
    previa.innerHTML = url
      ? `<img src="${esc(url)}" class="h-100 w-100 object-fit-cover" alt="Prévia da imagem">`
      : '<span class="material-symbols-outlined fs-2 text-secondary">add_photo_alternate</span>';
    remover.classList.toggle('d-none', !url);
  }

  input.addEventListener('change', async () => {
    const arquivo = input.files[0];
    if (!arquivo) return;
    if (!arquivo.type.startsWith('image/')) {
      toast('Escolha um arquivo de imagem', 'erro');
      input.value = '';
      return;
    }
    try {
      estado.arquivo = await reduzirImagem(arquivo);
      estado.removida = false;
      mostrar(URL.createObjectURL(estado.arquivo));
    } catch (erro) {
      toast(erro.message, 'erro');
    }
  });

  remover.addEventListener('click', () => {
    estado.arquivo = null;
    estado.removida = true;
    input.value = '';
    mostrar('');
  });

  estado.mostrar = mostrar;
  estado.reiniciar = (url) => {
    estado.arquivo = null;
    estado.removida = false;
    input.value = '';
    mostrar(url);
  };
  estado.aplicar = async (dados, campo) => {
    if (estado.arquivo) dados[campo] = (await enviarImagem(estado.arquivo)).id;
    else if (estado.removida) dados[campo] = null;
  };
  return estado;
}

let lojaCache;
function carregarLoja() {
  if (!lojaCache) {
    lojaCache = api('/lanchonete?populate=logo', { auth: false })
      .then((res) => res.data)
      .catch(() => null);
  }
  return lojaCache;
}

function esc(valor) {
  return String(valor ?? '').replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

const formatoReal = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

function dinheiro(valor) {
  return formatoReal.format(Number(valor) || 0);
}

function dataHora(iso) {
  return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

function tempoDecorrido(iso) {
  const minutos = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (minutos < 1) return 'agora';
  if (minutos < 60) return `há ${minutos} min`;
  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `há ${horas} h`;
  return dataHora(iso);
}

function dataIso(data) {
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  return `${data.getFullYear()}-${mes}-${dia}`;
}

const STATUS = {
  recebido: { rotulo: 'Recebido', classe: 'text-bg-secondary' },
  em_preparo: { rotulo: 'Em preparo', classe: 'text-bg-warning' },
  pronto: { rotulo: 'Pronto', classe: 'text-bg-info' },
  em_entrega: { rotulo: 'Saiu para entrega', classe: 'text-bg-primary' },
  entregue: { rotulo: 'Entregue', classe: 'text-bg-success' },
  cancelado: { rotulo: 'Cancelado', classe: 'text-bg-danger' },
};

const PAGAMENTOS = { pix: 'Pix', dinheiro: 'Dinheiro', cartao: 'Cartão' };

const MODALIDADES = {
  mesa: { rotulo: 'Mesa', icone: 'table_restaurant' },
  retirada: { rotulo: 'Retirada', icone: 'storefront' },
  entrega: { rotulo: 'Entrega', icone: 'delivery_dining' },
};

function botoesCategoria(categorias, ativa) {
  return [{ nome: 'Todos', valor: '' }, ...categorias.map((c) => ({ nome: c.nome, valor: c.nome }))]
    .map((c) => `<button type="button" class="categoria-btn ${c.valor === ativa ? 'active' : ''}" data-categoria="${esc(c.valor)}">${esc(c.nome)}</button>`)
    .join('');
}

function detalheModalidade(p, painel = false) {
  const modalidade = MODALIDADES[p.modalidade] || MODALIDADES.retirada;
  const numeroMesa = p.mesa || (painel ? '-' : '');
  const mesa = p.modalidade === 'mesa' && numeroMesa ? ` ${esc(numeroMesa)}` : '';
  const titulo = modalidade.rotulo + mesa;
  const entrega = p.modalidade === 'entrega'
    ? `<p class="${painel ? 'mt-2 small' : 'text-secondary mt-2 small'}">${painel ? `<strong>${esc(p.entregaNome)}</strong>` : esc(p.entregaNome)} · ${esc(p.entregaEndereco)}</p>`
    : '';

  if (painel) return `<div class="mt-2 rounded-3 bg-warning-subtle p-3">
    <p class="d-flex align-items-center gap-2 small fw-bold mb-0"><span class="material-symbols-outlined fs-5">${modalidade.icone}</span>${titulo}</p>${entrega}
  </div>`;
  return `<p class="mt-2 d-flex align-items-center gap-2 small fw-semibold"><span class="material-symbols-outlined fs-5 text-warning-emphasis">${modalidade.icone}</span>${titulo}</p>${entrega}`;
}

function badgeStatus(status) {
  const s = STATUS[status] || { rotulo: status, classe: 'text-bg-secondary' };
  return `<span class="badge ${s.classe}">${esc(s.rotulo)}</span>`;
}

function caixaDeToasts() {
  let caixa = document.getElementById('toasts');
  if (!caixa) {
    caixa = document.createElement('div');
    caixa.id = 'toasts';
    caixa.className = 'position-fixed end-0 top-0 d-flex flex-column gap-2 p-3 d-print-none z-3';
    document.body.appendChild(caixa);
  }
  caixa.setAttribute('aria-live', 'polite');
  return caixa;
}

function toast(mensagem, tipo = 'sucesso') {
  const caixa = caixaDeToasts();
  const cor = tipo === 'erro' ? 'alert-danger' : 'alert-light border';
  const icone = tipo === 'erro' ? 'error' : 'check_circle';
  const el = document.createElement('div');
  el.setAttribute('role', tipo === 'erro' ? 'alert' : 'status');
  el.className = `alert ${cor} d-flex align-items-center gap-2 mb-0 shadow-sm`;
  el.innerHTML = `<span class="material-symbols-outlined fs-5 ${tipo === 'erro' ? '' : 'text-warning-emphasis '} ">${icone}</span><span>${esc(mensagem)}</span>`;
  caixa.appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

function estadoVazio(icone, titulo, texto = '') {
  return `<div class="col-12 d-flex flex-column align-items-center gap-3 py-5 text-center">
    <span class="material-symbols-outlined display-6 text-secondary">${icone}</span>
    <p class="fw-semibold mb-0">${esc(titulo)}</p>
    ${texto ? `<p class="small text-secondary mb-0">${texto}</p>` : ''}
  </div>`;
}

function semImagemHtml(classes = '') {
  return `<div class="d-flex align-items-center justify-content-center bg-warning-subtle ${classes}"><span class="material-symbols-outlined fs-2 text-warning-emphasis">lunch_dining</span></div>`;
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
