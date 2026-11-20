const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = __dirname;
const HOST = '127.0.0.1';
const PORT = Number(process.env.FRONTEND_PORT || 5500);
const API_ORIGIN = new URL(process.env.STRAPI_ORIGIN || 'http://localhost:1337');
const CODIGOS_HTML = new Set([400, 401, 403, 404, 500, 503]);
const TIPOS = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.pdf': 'application/pdf',
};

function enviar(res, status, texto, tipo = 'text/plain; charset=utf-8') {
  res.writeHead(status, {
    'Content-Type': tipo,
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  });
  res.end(texto);
}

function enviarPaginaErro(res, status, method = 'GET') {
  const codigo = CODIGOS_HTML.has(status) ? status : 500;
  const pagina = path.join(ROOT, `${codigo}.html`);
  fs.readFile(pagina, (erro, html) => {
    if (erro) {
      const mensagem = JSON.stringify({ error: { status: codigo, message: `Erro ${codigo}` } });
      return enviar(res, codigo, mensagem, 'application/json; charset=utf-8');
    }
    res.writeHead(codigo, {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    });
    res.end(method === 'HEAD' ? undefined : html);
  });
}

function aceitaHtml(req) {
  return (req.headers.accept || '').toLowerCase().includes('text/html');
}

function caminhoSeguro(urlPath) {
  let pathname;
  try {
    pathname = decodeURIComponent(urlPath);
  } catch {
    return null;
  }
  const relativo = pathname.replace(/^\/+/, '');
  const arquivo = path.resolve(ROOT, relativo || 'index.html');
  if (arquivo !== ROOT && !arquivo.startsWith(ROOT + path.sep)) return null;
  return arquivo;
}

function rotaDePagina(pathname) {
  return !path.extname(pathname) || path.extname(pathname).toLowerCase() === '.html';
}

function responderBackendIndisponivel(res, req) {
  if (aceitaHtml(req)) return enviarPaginaErro(res, 503, req.method);
  const corpo = JSON.stringify({
    data: null,
    error: {
      status: 503,
      name: 'ServiceUnavailableError',
      message: 'O serviço está temporariamente indisponível. Verifique se o Strapi está iniciado em localhost:1337 e tente novamente.',
      details: { code: 'STRAPI_UNAVAILABLE' },
    },
  });
  enviar(res, 503, corpo, 'application/json; charset=utf-8');
}

function encaminharParaStrapi(req, res, pathname) {
  const headers = { ...req.headers, host: API_ORIGIN.host };
  delete headers.origin;
  delete headers.referer;
  const upstream = http.request({
    protocol: API_ORIGIN.protocol,
    hostname: API_ORIGIN.hostname,
    port: API_ORIGIN.port || 80,
    method: req.method,
    path: pathname + new URL(req.url, 'http://localhost').search,
    headers,
  }, (apiRes) => {
    const status = apiRes.statusCode || 502;
    if (status >= 400 && aceitaHtml(req) && CODIGOS_HTML.has(status)) {
      apiRes.resume();
      return enviarPaginaErro(res, status, req.method);
    }
    const responseHeaders = { ...apiRes.headers, 'cache-control': 'no-store' };
    delete responseHeaders['access-control-allow-origin'];
    delete responseHeaders['access-control-allow-credentials'];
    res.writeHead(status, responseHeaders);
    apiRes.pipe(res);
  });

  upstream.setTimeout(15000, () => upstream.destroy(new Error('Tempo limite ao conectar ao Strapi')));
  upstream.on('error', () => {
    if (!res.headersSent) responderBackendIndisponivel(res, req);
    else res.destroy();
  });
  req.pipe(upstream);
}

const servidor = http.createServer((req, res) => {
  let pathname;
  try {
    pathname = new URL(req.url, `http://${req.headers.host || 'localhost'}`).pathname;
  } catch {
    return aceitaHtml(req) ? enviarPaginaErro(res, 400, req.method) : enviar(res, 400, 'URL inválida');
  }

  if (pathname === '/api' || pathname.startsWith('/api/') || pathname.startsWith('/uploads/')) {
    return encaminharParaStrapi(req, res, pathname);
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.setHeader('Allow', 'GET, HEAD');
    return enviar(res, 405, 'Método não permitido');
  }

  const arquivo = caminhoSeguro(pathname);
  if (!arquivo) {
    return aceitaHtml(req) ? enviarPaginaErro(res, 400, req.method) : enviar(res, 400, 'Caminho inválido');
  }

  fs.stat(arquivo, (erro, stat) => {
    if (!erro && stat.isDirectory()) {
      const index = path.join(arquivo, 'index.html');
      fs.stat(index, (erroIndex, statIndex) => {
        if (!erroIndex && statIndex.isFile()) return servirArquivo(index, req, res);
        return redirecionarOuNotFound(pathname, req, res);
      });
      return;
    }
    if (!erro && stat.isFile()) return servirArquivo(arquivo, req, res);
    return redirecionarOuNotFound(pathname, req, res);
  });
});

function redirecionarOuNotFound(pathname, req, res) {
  if (rotaDePagina(pathname)) return enviarPaginaErro(res, 404, req.method);
  enviar(res, 404, 'Arquivo não encontrado');
}

function servirArquivo(arquivo, req, res) {
  const tipo = TIPOS[path.extname(arquivo).toLowerCase()] || 'application/octet-stream';
  const nome = path.basename(arquivo);
  const statusHtml = /^([0-9]{3})\.html$/i.exec(nome);
  const status = statusHtml && CODIGOS_HTML.has(Number(statusHtml[1])) ? Number(statusHtml[1]) : 200;
  const stream = fs.createReadStream(arquivo);
  res.writeHead(status, {
    'Content-Type': tipo,
    'Cache-Control': status === 200 ? 'no-cache' : 'no-store',
    'X-Content-Type-Options': 'nosniff',
  });
  if (req.method === 'HEAD') {
    stream.destroy();
    res.end();
    return;
  }
  stream.on('error', () => {
    if (!res.headersSent) return enviarPaginaErro(res, 500);
    res.destroy();
  });
  stream.pipe(res);
}

servidor.listen(PORT, HOST, () => {
  console.log(`Frontend local em http://localhost:${PORT}`);
  console.log(`API Strapi via proxy: ${API_ORIGIN.origin}`);
  console.log('Ctrl+C para encerrar.');
});
