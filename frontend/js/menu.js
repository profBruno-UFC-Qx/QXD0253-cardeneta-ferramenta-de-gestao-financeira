let todosProdutos = [];
let categoriaSelecionada = '';
let termoBusca = '';

function mostrarErro(elemento, texto) {
  elemento.innerHTML = `<p class="mensagem erro cartao">${escapar(texto)}</p>`;
}

function renderLoja(loja) {
  const caixa = document.getElementById('loja-info');
  if (!loja) {
    mostrarErro(caixa, 'As informações da lanchonete ainda não foram cadastradas.');
    return;
  }

  document.title = `Cardápio | ${loja.nome || 'LancheFácil'}`;
  document.getElementById('nome-loja-topo').textContent = loja.nome || 'LancheFácil';
  const imagem = urlImagem(loja.logo);
  const logo = imagem
    ? `<img class="loja-logo" src="${escapar(imagem)}" alt="Logo de ${escapar(loja.nome)}">`
    : '<span class="loja-logo logo-vazio" aria-hidden="true">logo loja</span>';
  const status = loja.aberta === false
    ? '<span class="status status-fechada"><span></span>Fechada no momento</span>'
    : '<span class="status status-aberta"><span></span>Aberta</span>';
  const detalhes = [loja.horario, loja.telefone, loja.endereco]
    .filter(Boolean)
    .map((texto) => `<span>${escapar(texto)}</span>`)
    .join('');

  caixa.innerHTML = `
    ${logo}
    <div class="loja-conteudo">
      <div class="linha-titulo"><h1>${escapar(loja.nome || 'Lanchonete')}</h1>${status}</div>
      ${loja.descricao ? `<p class="loja-descricao">${escapar(loja.descricao)}</p>` : ''}
      ${detalhes ? `<div class="loja-detalhes">${detalhes}</div>` : ''}
    </div>`;
}

function renderCategorias(categorias) {
  const caixa = document.getElementById('categorias');
  const itens = [{ nome: 'Todos', valor: '' }, ...categorias.map((categoria) => ({
    nome: categoria.nome,
    valor: categoria.documentId,
  }))];

  caixa.innerHTML = itens.map((categoria) => `
    <button class="filtro ${categoria.valor === categoriaSelecionada ? 'ativo' : ''}"
      type="button" data-categoria="${escapar(categoria.valor)}"
      aria-pressed="${categoria.valor === categoriaSelecionada}">
      ${escapar(categoria.nome)}
    </button>`).join('');
}

function cartaoProduto(produto) {
  const imagem = urlImagem(produto.imagem);
  const media = imagem
    ? `<img class="produto-imagem" src="${escapar(imagem)}" alt="${escapar(produto.nome)}" loading="lazy">`
    : '<div class="produto-imagem imagem-vazia" aria-hidden="true">imagem produto</div>';
  const indisponivel = !produto.disponivel;
  return `
    <article class="produto-cartao ${indisponivel ? 'indisponivel' : ''}">
      <a class="produto-link" href="/produto?id=${encodeURIComponent(produto.documentId)}" aria-label="Ver ${escapar(produto.nome)}">
        ${media}
        <div class="produto-info">
          <div class="produto-linha">
            <h2>${escapar(produto.nome)}</h2>
            <strong>${dinheiro(produto.preco)}</strong>
          </div>
          ${produto.categoria?.nome ? `<span class="produto-categoria">${escapar(produto.categoria.nome)}</span>` : ''}
          ${produto.descricao ? `<p>${escapar(produto.descricao)}</p>` : ''}
          <span class="produto-acao">${indisponivel ? 'Indisponível' : 'Ver detalhes →'}</span>
        </div>
      </a>
    </article>`;
}

function renderProdutos() {
  const lista = document.getElementById('lista-produtos');
  const filtrados = todosProdutos.filter((produto) => {
    const categoriaOk = !categoriaSelecionada || produto.categoria?.documentId === categoriaSelecionada;
    const buscaOk = !termoBusca || `${produto.nome} ${produto.descricao || ''}`
      .toLocaleLowerCase('pt-BR').includes(termoBusca);
    return categoriaOk && buscaOk;
  });

  document.getElementById('resultado').textContent = `${filtrados.length} ${filtrados.length === 1 ? 'produto' : 'produtos'}`;
  lista.innerHTML = filtrados.length
    ? filtrados.map(cartaoProduto).join('')
    : '<p class="mensagem cartao">Nenhum produto encontrado. Tente outra busca ou categoria.</p>';
}

async function iniciar() {
  const lista = document.getElementById('lista-produtos');
  try {
    const [lojaResposta, categoriasResposta, produtosResposta] = await Promise.all([
      api('/lanchonete?populate=logo', { auth: false }),
      api('/categorias?sort=nome:asc&pagination[pageSize]=100', { auth: false }),
      api('/produtos?populate=*&sort=nome:asc&pagination[pageSize]=100', { auth: false }),
    ]);
    const loja = lojaResposta.data;
    const categorias = categoriasResposta.data || [];
    todosProdutos = produtosResposta.data || [];

    renderLoja(loja);
    renderCategorias(categorias);
    renderProdutos();
  } catch (erro) {
    mostrarErro(lista, erro.message);
    document.getElementById('loja-info').innerHTML = '<p class="mensagem">Não foi possível carregar a lanchonete.</p>';
  }

  document.getElementById('categorias').addEventListener('click', (evento) => {
    const botao = evento.target.closest('[data-categoria]');
    if (!botao) return;
    categoriaSelecionada = botao.dataset.categoria;
    document.querySelectorAll('.filtro').forEach((filtro) => {
      const ativo = filtro.dataset.categoria === categoriaSelecionada;
      filtro.classList.toggle('ativo', ativo);
      filtro.setAttribute('aria-pressed', String(ativo));
    });
    renderProdutos();
  });

  document.getElementById('busca').addEventListener('input', (evento) => {
    termoBusca = evento.target.value.trim().toLocaleLowerCase('pt-BR');
    renderProdutos();
  });
}

iniciar();
