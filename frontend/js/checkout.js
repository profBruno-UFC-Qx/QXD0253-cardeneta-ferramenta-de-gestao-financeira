function htmlCheckout() {
  const modalidade = (valor, rotulo, icone) => {
    const id = `modalidade-${valor}`;
    return `<div class="col"><input id="${id}" type="radio" name="modalidade" value="${valor}" class="btn-check" ${valor === 'retirada' ? 'checked' : ''}>
      <label for="${id}" class="btn btn-outline-secondary w-100 h-100 py-3 rounded-3"><span class="material-symbols-outlined d-block mb-2">${icone}</span>${rotulo}</label></div>`;
  };
  const pagamento = (valor, rotulo) => {
    const id = `pagamento-${valor}`;
    return `<div class="col"><input id="${id}" type="radio" name="pagamento" value="${valor}" class="btn-check" ${valor === 'pix' ? 'checked' : ''}>
      <label for="${id}" class="btn btn-outline-secondary w-100 rounded-3">${rotulo}</label></div>`;
  };

  return `<form id="form-pedido" class="card border-0 shadow-sm h-auto vstack gap-3 p-3" novalidate>
    <div id="aviso" class="d-none rounded-3 bg-warning-subtle p-3 small text-warning-emphasis" role="alert"></div>
    <div>
      <span class="form-label fw-semibold">Como será o pedido?</span>
      <div class="row row-cols-2 g-3">${modalidade('retirada', 'Retirada', 'storefront')}${modalidade('entrega', 'Entrega', 'delivery_dining')}</div>
    </div>
    <div id="bloco-entrega" class="d-none vstack gap-3">
      <div><label class="form-label" for="c-entrega-nome">Quem vai receber</label><input id="c-entrega-nome" class="form-control" required></div>
      <div><label class="form-label" for="c-entrega-telefone">Telefone de quem recebe</label><input id="c-entrega-telefone" class="form-control" inputmode="tel" data-mascara="telefone" placeholder="(88) 99999-9999" required></div>
      <div><label class="form-label" for="c-entrega-endereco">Endereço de entrega</label><textarea id="c-entrega-endereco" class="form-control" rows="2" placeholder="Rua, número, bairro e referência" required></textarea></div>
    </div>
    <div>
      <span class="form-label fw-semibold">Forma de pagamento</span>
      <div class="row row-cols-3 g-2">${pagamento('pix', 'Pix')}${pagamento('dinheiro', 'Dinheiro')}${pagamento('cartao', 'Cartão')}</div>
      <p class="text-secondary mt-2 small">O pagamento é realizado pessoalmente.</p>
    </div>
    <div><label class="form-label" for="c-observacoes">Observações</label><textarea id="c-observacoes" class="form-control" rows="2" placeholder="Ex: sem cebola"></textarea></div>
    <div class="vstack gap-3 border-top border-secondary-subtle pt-3 small">
      <div class="d-flex justify-content-between"><span class="text-secondary">Subtotal</span><span id="c-subtotal">R$ 0,00</span></div>
      <div id="c-linha-taxa" class="d-none justify-content-between"><span class="text-secondary">Taxa de entrega</span><span id="c-taxa">R$ 0,00</span></div>
      <div class="d-flex justify-content-between fs-6 fw-bold"><span>Total</span><span id="c-total">R$ 0,00</span></div>
    </div>
    <button id="btn-finalizar" type="submit" class="btn btn-warning w-100 fw-semibold">Finalizar pedido</button>
  </form>`;
}

async function iniciarCheckout({ loja, aoSucesso }) {
  const raiz = document.getElementById('checkout');
  raiz.innerHTML = htmlCheckout();
  const form = document.getElementById('form-pedido');
  const el = (id) => document.getElementById(id);
  const taxa = Number(loja?.taxaEntrega || 0);
  const modalidade = () => form.querySelector('input[name="modalidade"]:checked').value;

  function atualizar() {
    const tipo = modalidade();
    const itens = getCarrinho();
    const subtotal = totalCarrinho();
    const frete = tipo === 'entrega' ? taxa : 0;
    el('bloco-entrega').classList.toggle('d-none', tipo !== 'entrega');
    for (const id of ['c-entrega-nome', 'c-entrega-telefone', 'c-entrega-endereco']) {
      el(id).required = tipo === 'entrega';
    }
    el('c-linha-taxa').classList.toggle('d-none', tipo !== 'entrega');
    el('c-linha-taxa').classList.toggle('d-flex', tipo === 'entrega');
    el('c-subtotal').textContent = dinheiro(subtotal);
    el('c-taxa').textContent = taxa > 0 ? dinheiro(taxa) : 'Grátis';
    el('c-total').textContent = dinheiro(subtotal + frete);

    const fechada = loja && loja.aberta === false;
    const aviso = el('aviso');
    aviso.textContent = 'A lanchonete está fechada no momento e não está recebendo pedidos.';
    aviso.classList.toggle('d-none', !fechada);
    el('btn-finalizar').disabled = fechada || itens.length === 0;
    el('btn-finalizar').textContent = getUsuario() ? 'Finalizar pedido' : 'Entrar para finalizar';
  }

  async function enviar(e) {
    e.preventDefault();
    if (!getUsuario()) {
      window.location.href = 'login.html?next=' + encodeURIComponent(paginaAtual());
      return;
    }
    const tipo = modalidade();
    if (tipo === 'entrega') {
      if (!el('c-entrega-nome').value.trim() || !el('c-entrega-endereco').value.trim()) {
        return toast('Informe quem vai receber e o endereço', 'erro');
      }
      if (!telefoneValido(el('c-entrega-telefone').value)) return toast('Informe um telefone válido para a entrega', 'erro');
    }

    const botao = el('btn-finalizar');
    botao.disabled = true;
    try {
      await api('/pedidos', {
        method: 'POST',
        body: {
          data: {
            modalidade: tipo,
            entregaNome: el('c-entrega-nome').value.trim(),
            entregaTelefone: digitos(el('c-entrega-telefone').value),
            entregaEndereco: el('c-entrega-endereco').value.trim(),
            formaPagamento: form.querySelector('input[name="pagamento"]:checked').value,
            observacoes: el('c-observacoes').value.trim(),
            itens: getCarrinho().map((i) => ({ produto: i.documentId, quantidade: i.quantidade })),
          },
        },
      });
      limparCarrinho();
      aoSucesso();
    } catch (erro) {
      toast(erro.message, 'erro');
      botao.disabled = false;
    }
  }

  form.addEventListener('change', atualizar);
  form.addEventListener('submit', enviar);

  if (getUsuario()) {
    el('c-entrega-nome').value = nomeUsuario();
    el('c-entrega-telefone').value = mascaraTelefone(getUsuario()?.telefone);
  }
  atualizar();
  return { atualizar };
}
