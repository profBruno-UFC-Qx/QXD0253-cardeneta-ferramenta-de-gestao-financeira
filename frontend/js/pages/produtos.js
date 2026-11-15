let produtos = [];
let categorias = [];
let arquivoPrincipal = null;
let urlPrevista = null;
let arquivosGaleria = [];
const midiasRemovendo = new Set();
const gerente = papel() === 'gerente';

const porId = (id) => document.getElementById(id);

function produtoEditado() {
  const id = porId('dlg-produto-form').dataset.id;
  return produtos.find((p) => p.documentId === id);
}

function itensGaleria(produto) {
  if (Array.isArray(produto?.galeria)) return produto.galeria;
  return produto?.galeria?.data || [];
}

function produtosFiltrados() {
  const termo = porId('busca').value.trim().toLocaleLowerCase('pt-BR');
  const categoria = porId('filtro-categoria').value;
  return produtos.filter((p) => {
    const texto = `${p.nome} ${p.descricao || ''}`.toLocaleLowerCase('pt-BR');
    return (!termo || texto.includes(termo))
      && (!categoria || p.categoria?.documentId === categoria);
  });
}

function cartaoProduto(p) {
  const imagem = urlImagem(p.imagem) || urlImagem(itensGaleria(p)[0]);
  const quantidadeFotos = (p.imagem ? 1 : 0) + itensGaleria(p).length;
  const acoesGerente = gerente ? `<div class="d-flex gap-2">
      <button type="button" class="btn btn-sm btn-outline-secondary" data-acao="editar" data-id="${esc(p.documentId)}"><span class="material-symbols-outlined align-middle fs-6">edit</span> Editar</button>
      <button type="button" class="btn btn-sm btn-outline-danger" data-acao="excluir" data-id="${esc(p.documentId)}" aria-label="Excluir ${esc(p.nome)}"><span class="material-symbols-outlined align-middle fs-6">delete</span></button>
    </div>` : '';

  return `<div class="col"><article class="card h-100 border-0 shadow-sm overflow-hidden">
    <div class="ratio ratio-4x3 bg-warning-subtle">${imagem ? `<img src="${esc(imagem)}" class="img-produto" alt="${esc(p.nome)}" loading="lazy">` : semImagemHtml('h-100 w-100')}</div>
    <div class="card-body d-flex flex-column gap-2">
      <div class="d-flex justify-content-between gap-2"><div class="overflow-hidden flex-fill"><h2 class="fs-6 fw-semibold text-truncate mb-1">${esc(p.nome)}</h2><p class="text-secondary small text-truncate mb-0">${esc(p.categoria?.nome || 'Sem categoria')} · ${dinheiro(p.preco)}</p></div><span class="badge ${p.disponivel ? 'text-bg-success' : 'text-bg-secondary'} align-self-start">${p.disponivel ? 'Disponível' : 'Indisponível'}</span></div>
      <p class="text-secondary small mb-0">${quantidadeFotos} ${quantidadeFotos === 1 ? 'imagem' : 'imagens'}</p>
      <div class="d-flex align-items-center justify-content-between gap-2 mt-auto pt-2 border-top">
        <div class="form-check form-switch mb-0"><input class="form-check-input" type="checkbox" role="switch" data-acao="disponivel" data-id="${esc(p.documentId)}" ${p.disponivel ? 'checked' : ''} aria-label="Disponibilidade de ${esc(p.nome)}"><label class="form-check-label small">Disponível</label></div>
        ${acoesGerente}
      </div>
    </div>
  </article></div>`;
}

function renderProdutos() {
  const lista = produtosFiltrados();
  porId('grade').innerHTML = lista.length
    ? lista.map(cartaoProduto).join('')
    : estadoVazio('lunch_dining', 'Nenhum produto encontrado');
  const indisponiveis = produtos.filter((p) => !p.disponivel).length;
  porId('resumo').textContent = `${produtos.length} produtos · ${indisponiveis} indisponíveis`;
}

async function carregar() {
  const [cats, prods] = await Promise.all([
    apiTodos('/categorias', { sort: 'nome:asc' }),
    apiTodos('/produtos', { populate: '*', sort: 'nome:asc' }),
  ]);
  categorias = cats;
  produtos = prods;
  const opcoes = categorias.map((c) => `<option value="${esc(c.documentId)}">${esc(c.nome)}</option>`).join('');
  porId('p-categoria').innerHTML = '<option value="">Sem categoria</option>' + opcoes;
  porId('filtro-categoria').innerHTML = '<option value="">Todas as categorias</option>' + opcoes;
  renderProdutos();
}

function mostrarImagem(url) {
  const previa = porId('p-previa');
  previa.innerHTML = url
    ? `<img src="${esc(url)}" class="w-100 h-100 object-fit-cover" alt="Prévia da imagem">`
    : '<span class="material-symbols-outlined text-secondary fs-2">add_photo_alternate</span>';
}

function mostrarGaleriaNova() {
  porId('p-galeria-novas').innerHTML = arquivosGaleria.map((arquivo, i) => `<div class="d-flex justify-content-between align-items-center gap-2">
    <span class="text-truncate">${esc(arquivo.name)}</span><button class="btn btn-sm btn-link text-danger p-0" type="button" data-remover-galeria="${i}" aria-label="Remover ${esc(arquivo.name)} da seleção">Remover</button>
  </div>`).join('');
}

function mostrarGaleriaAtual(produto) {
  porId('p-galeria-atual').innerHTML = itensGaleria(produto).map((foto) => {
    const url = urlImagem(foto);
    if (!url) return '';
    return `<div class="position-relative">
      <img src="${esc(url)}" alt="Imagem cadastrada na galeria" class="rounded border object-fit-cover" style="width:72px;height:64px">
      <button type="button" class="btn btn-sm btn-danger position-absolute top-0 end-0 p-0" style="width:24px;height:24px" data-excluir-galeria="${esc(foto.id)}" aria-label="Excluir imagem da galeria"><span class="material-symbols-outlined fs-6">delete</span></button>
    </div>`;
  }).join('');
}

function abrir(produto = null) {
  const form = porId('dlg-produto-form');
  form.dataset.id = produto?.documentId || '';
  porId('dlg-produto-titulo').textContent = produto ? 'Editar produto' : 'Novo produto';
  porId('p-nome').value = produto?.nome || '';
  porId('p-descricao').value = produto?.descricao || '';
  porId('p-preco').value = produto?.preco ?? '';
  porId('p-categoria').value = produto?.categoria?.documentId || '';
  porId('p-disponivel').checked = produto ? Boolean(produto.disponivel) : true;
  porId('p-arquivo').value = '';
  porId('p-galeria-arquivos').value = '';
  arquivoPrincipal = null;
  arquivosGaleria = [];
  if (urlPrevista) URL.revokeObjectURL(urlPrevista);
  urlPrevista = null;
  mostrarImagem(urlImagem(produto?.imagem));
  porId('p-limpar-arquivo').classList.add('d-none');
  porId('p-remover-imagem').classList.toggle('d-none', !produto?.imagem?.id);
  mostrarGaleriaAtual(produto);
  mostrarGaleriaNova();
  porId('dlg-produto').showModal();
}

async function processarImagem(arquivo) {
  if (!arquivo.type.startsWith('image/')) throw new Error('Escolha somente arquivos de imagem');
  const reduzida = await reduzirImagem(arquivo);
  const nome = arquivo.name.replace(/\.[^.]+$/, '').slice(0, 80) || 'imagem';
  return new File([reduzida], `${nome}.jpg`, { type: 'image/jpeg' });
}

function urlArquivo(arquivo) {
  if (urlPrevista) URL.revokeObjectURL(urlPrevista);
  urlPrevista = arquivo ? URL.createObjectURL(arquivo) : null;
  mostrarImagem(urlPrevista || urlImagem(produtos.find((p) => p.documentId === porId('dlg-produto-form').dataset.id)?.imagem));
}

async function enviarMidias(produtoId, campo, arquivos) {
  if (!arquivos.length) return;
  if (!Number.isInteger(Number(produtoId))) throw new Error('O Strapi não retornou o ID numérico do produto');
  const form = new FormData();
  arquivos.forEach((arquivo) => form.append('files', arquivo, arquivo.name));
  form.append('ref', 'api::produto.produto');
  form.append('refId', String(produtoId));
  form.append('field', campo);
  const resposta = await fetch(API_URL + '/upload', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + localStorage.getItem('token') },
    body: form,
  });
  const json = await resposta.json().catch(() => null);
  if (!resposta.ok) throw new Error(json?.error?.message || `Falha ao enviar ${campo}`);
}

async function excluirMidiaSalva(arquivo, campo) {
  if (!arquivo?.id) return toast('Não foi possível identificar o arquivo de mídia', 'erro');
  const mediaId = String(arquivo.id);
  if (midiasRemovendo.has(mediaId)) return;
  const nome = arquivo.name || 'esta imagem';
  const confirmacao = `Excluir permanentemente "${nome}" da Biblioteca de mídia? Isso também remove o arquivo de qualquer outro produto que esteja usando a mesma imagem.`;
  if (!confirm(confirmacao)) return;

  midiasRemovendo.add(mediaId);
  try {
    await api(`/upload/files/${encodeURIComponent(mediaId)}`, { method: 'DELETE' });
    for (const produto of produtos) {
      if (String(produto.imagem?.id) === mediaId) produto.imagem = null;
      produto.galeria = itensGaleria(produto).filter((foto) => String(foto.id) !== mediaId);
    }
    const atual = produtoEditado();
    if (atual) {
      porId('p-remover-imagem').classList.toggle('d-none', !atual.imagem?.id);
      mostrarImagem(urlPrevista || urlImagem(atual.imagem));
      mostrarGaleriaAtual(atual);
    }
    renderProdutos();
    toast(campo === 'imagem' ? 'Imagem principal excluída' : 'Imagem da galeria excluída');
  } catch (erro) {
    toast(erro.message, 'erro');
  } finally {
    midiasRemovendo.delete(mediaId);
  }
}

async function salvar(evento) {
  evento.preventDefault();
  const form = evento.currentTarget;
  if (!form.reportValidity()) return;
  const id = form.dataset.id;
  const dados = {
    nome: porId('p-nome').value.trim(),
    descricao: porId('p-descricao').value.trim(),
    preco: Number(porId('p-preco').value),
    disponivel: porId('p-disponivel').checked,
    categoria: porId('p-categoria').value || null,
  };
  const botao = form.querySelector('[type="submit"]');
  botao.disabled = true;
  botao.textContent = 'Salvando...';

  let produto;
  try {
    const resposta = await api(id ? `/produtos/${encodeURIComponent(id)}` : '/produtos', {
      method: id ? 'PUT' : 'POST', body: { data: dados },
    });
    produto = resposta.data;
  } catch (erro) {
    toast(erro.message, 'erro');
    botao.disabled = false;
    botao.textContent = 'Salvar produto';
    return;
  }

  const falhas = [];
  try {
    if (arquivoPrincipal) await enviarMidias(produto.id, 'imagem', [arquivoPrincipal]);
  } catch (erro) { falhas.push(`imagem principal: ${erro.message}`); }
  try {
    if (arquivosGaleria.length) await enviarMidias(produto.id, 'galeria', arquivosGaleria);
  } catch (erro) { falhas.push(`galeria: ${erro.message}`); }

  porId('dlg-produto').close();
  await carregar().catch((erro) => toast(erro.message, 'erro'));
  toast(falhas.length ? `Produto salvo, mas houve falha no envio de ${falhas.join('; ')}` : 'Produto salvo', falhas.length ? 'erro' : 'sucesso');
  botao.disabled = false;
  botao.textContent = 'Salvar produto';
}

async function acaoProduto(evento) {
  const alvo = evento.target.closest('[data-acao]');
  if (!alvo) return;
  const produto = produtos.find((p) => p.documentId === alvo.dataset.id);
  if (alvo.dataset.acao === 'editar' && gerente) abrir(produto);
  if (alvo.dataset.acao === 'excluir' && gerente && produto && confirm(`Excluir o produto “${produto.nome}”?`)) {
    try {
      await api(`/produtos/${encodeURIComponent(produto.documentId)}`, { method: 'DELETE' });
      toast('Produto excluído');
      await carregar();
    } catch (erro) { toast(erro.message, 'erro'); }
  }
}

async function alternarDisponibilidade(evento) {
  const alvo = evento.target.closest('[data-acao="disponivel"]');
  if (!alvo) return;
  const anterior = !alvo.checked;
  try {
    await api(`/produtos/${encodeURIComponent(alvo.dataset.id)}`, { method: 'PUT', body: { data: { disponivel: alvo.checked } } });
    const produto = produtos.find((p) => p.documentId === alvo.dataset.id);
    if (produto) produto.disponivel = alvo.checked;
    renderProdutos();
  } catch (erro) {
    alvo.checked = anterior;
    toast(erro.message, 'erro');
  }
}

async function iniciar() {
  porId('btn-novo').classList.toggle('d-none', !gerente);
  porId('btn-novo').addEventListener('click', () => abrir());
  porId('dlg-produto-form').addEventListener('submit', salvar);
  porId('grade').addEventListener('click', acaoProduto);
  porId('grade').addEventListener('change', alternarDisponibilidade);
  porId('busca').addEventListener('input', renderProdutos);
  porId('filtro-categoria').addEventListener('change', renderProdutos);
  porId('p-arquivo').addEventListener('change', async (evento) => {
    const arquivo = evento.target.files[0];
    if (!arquivo) return;
    try {
      arquivoPrincipal = await processarImagem(arquivo);
      urlArquivo(arquivoPrincipal);
      porId('p-limpar-arquivo').classList.remove('d-none');
    } catch (erro) { toast(erro.message, 'erro'); }
  });
  porId('p-limpar-arquivo').addEventListener('click', () => {
    arquivoPrincipal = null;
    porId('p-arquivo').value = '';
    porId('p-limpar-arquivo').classList.add('d-none');
    urlArquivo(null);
  });
  porId('p-remover-imagem').addEventListener('click', () => {
    const produto = produtoEditado();
    if (produto?.imagem) excluirMidiaSalva(produto.imagem, 'imagem');
  });
  porId('p-galeria-atual').addEventListener('click', (evento) => {
    const botao = evento.target.closest('[data-excluir-galeria]');
    if (!botao) return;
    const foto = itensGaleria(produtoEditado()).find((item) => String(item.id) === botao.dataset.excluirGaleria);
    if (foto) excluirMidiaSalva(foto, 'galeria');
  });
  porId('p-galeria-arquivos').addEventListener('change', async (evento) => {
    for (const arquivo of evento.target.files) {
      try { arquivosGaleria.push(await processarImagem(arquivo)); }
      catch (erro) { toast(`${arquivo.name}: ${erro.message}`, 'erro'); }
    }
    evento.target.value = '';
    mostrarGaleriaNova();
  });
  porId('p-galeria-novas').addEventListener('click', (evento) => {
    const botao = evento.target.closest('[data-remover-galeria]');
    if (!botao) return;
    arquivosGaleria.splice(Number(botao.dataset.removerGaleria), 1);
    mostrarGaleriaNova();
  });
  try { await carregar(); }
  catch (erro) { toast(erro.message, 'erro'); }
}

if (montarLayout()) iniciar();
