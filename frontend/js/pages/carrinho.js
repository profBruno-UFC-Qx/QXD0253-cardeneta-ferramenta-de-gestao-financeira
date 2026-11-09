function renderItensCarrinho() {
  const itens = getCarrinho();
  const vazio = document.getElementById('vazio');
  const corpo = document.getElementById('corpo-carrinho');
  vazio.hidden = itens.length > 0;
  corpo.hidden = itens.length === 0;
  document.getElementById('itens').innerHTML = itens.map((item) => `
    <article class="item-carrinho">
      ${item.imagem
      ? `<img class="imagem-carrinho" src="${escapar(item.imagem)}" alt="${escapar(item.nome)}">`
      : '<div class="imagem-carrinho imagem-vazia" aria-hidden="true">imagem produto</div>'}
      <div class="item-carrinho-info">
        <h2>${escapar(item.nome)}</h2>
        <p>${dinheiro(item.preco)} cada</p>
        <div class="acoes-carrinho">${seletorCarrinho(item.documentId, item.quantidade)}
          <button class="remover-item" type="button" data-carrinho-acao="remover" data-id="${escapar(item.documentId)}">Remover</button>
        </div>
      </div>
      <strong class="preco-linha">${dinheiro(item.preco * item.quantidade)}</strong>
    </article>`).join('');
}

async function iniciarCarrinho() {
  let loja = null;
  try {
    const resposta = await api('/lanchonete?populate=logo', { auth: false });
    loja = resposta.data;
  } catch (erro) {
    toast('Não foi possível carregar a taxa da lanchonete: ' + erro.message, 'erro');
  }

  renderItensCarrinho();
  const checkout = montarCheckout(loja, () => window.location.assign('meus-pedidos.html?novo=1'));
  document.getElementById('itens').addEventListener('click', (evento) => {
    const botao = evento.target.closest('[data-carrinho-acao]');
    if (!botao) return;
    const { id } = botao.dataset;
    if (botao.dataset.carrinhoAcao === 'mais') alterarQuantidade(id, 1);
    if (botao.dataset.carrinhoAcao === 'menos') alterarQuantidade(id, -1);
    if (botao.dataset.carrinhoAcao === 'remover') removerDoCarrinho(id);
  });
  document.addEventListener('carrinho:atualizado', () => {
    renderItensCarrinho();
    checkout.atualizar();
  });
}

iniciarCarrinho();
