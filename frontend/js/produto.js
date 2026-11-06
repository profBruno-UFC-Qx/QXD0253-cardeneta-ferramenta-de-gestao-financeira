function mostrarErro(texto) {
  document.getElementById('produto').innerHTML = `
    <div class="detalhe-erro">
      <p class="mensagem erro">${escapar(texto)}</p>
      <a class="botao botao-secundario" href="index.html">Voltar ao cardápio</a>
    </div>`;
}

async function iniciar() {
  const id = new URLSearchParams(window.location.search).get('id');
  if (!id) {
    mostrarErro('Produto não informado.');
    return;
  }

  try {
    const resposta = await api(`/produtos/${encodeURIComponent(id)}?populate=*`);
    const produto = resposta.data;
    if (!produto) throw new Error('Produto não encontrado.');

    const imagem = urlImagem(produto.imagem);
    const media = imagem
      ? `<img class="detalhe-imagem" src="${escapar(imagem)}" alt="${escapar(produto.nome)}">`
      : '<div class="detalhe-imagem imagem-vazia" aria-hidden="true">🍽️</div>';
    document.title = `${produto.nome} | Cardápio`;
    document.getElementById('produto').innerHTML = `
      ${media}
      <div class="detalhe-conteudo">
        ${produto.categoria?.nome ? `<span class="produto-categoria">${escapar(produto.categoria.nome)}</span>` : ''}
        <h1>${escapar(produto.nome)}</h1>
        <p class="detalhe-preco">${dinheiro(produto.preco)}</p>
        ${produto.descricao ? `<p class="detalhe-descricao">${escapar(produto.descricao)}</p>` : ''}
        <p class="disponibilidade ${produto.disponivel ? 'disponivel' : 'indisponivel-texto'}">
          ${produto.disponivel ? 'Disponível para pedido' : 'Indisponível no momento'}
        </p>
        <a class="botao botao-principal" href="index.html">Voltar ao cardápio</a>
      </div>`;
  } catch (erro) {
    mostrarErro(erro.message || 'Não foi possível carregar este produto.');
  }
}

iniciar();
