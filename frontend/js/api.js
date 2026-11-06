async function api(caminho) {
  let resposta;
  try {
    resposta = await fetch(`${API_URL}${caminho}`, {
      headers: { Accept: 'application/json' },
    });
  } catch {
    throw new Error('Não foi possível conectar ao Strapi. Verifique se o backend está iniciado.');
  }

  const json = await resposta.json().catch(() => null);
  if (!resposta.ok) {
    const detalhe = json?.error?.message || `Erro HTTP ${resposta.status}`;
    throw new Error(detalhe);
  }
  return json;
}

function escapar(valor) { // protecao contra XSS
  return String(valor ?? '').replace(/[&<>"']/g, (caractere) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[caractere]);
}

function dinheiro(valor) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Number(valor) || 0);
}

function urlImagem(imagem) {
  const url = imagem?.url;
  if (!url) return '';
  return url.startsWith('http') ? url : `${API_ORIGIN}${url}`;
}
