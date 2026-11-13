let produtosBalcao = [];
let categoriasBalcao = [];
let categoriaBalcaoAtiva = '';
let lojaBalcao = null;
const itensBalcao = new Map();
let enviandoBalcao = false;

const elBalcao = (id) => document.getElementById(id);

function modalidadeBalcao() {
  return document.querySelector('input[name="modalidade"]:checked')?.value || 'retirada';
}

function renderCategoriasBalcao() {
  elBalcao('categorias').innerHTML = botoesCategoria(categoriasBalcao, categoriaBalcaoAtiva);
}

function renderProdutosBalcao() {
  const termo = elBalcao('busca').value.trim().toLocaleLowerCase('pt-BR');
  const lista = produtosBalcao.filter((p) => {
    const texto = `${p.nome} ${p.descricao || ''}`.toLocaleLowerCase('pt-BR');
    return p.disponivel && (!categoriaBalcaoAtiva || p.categoria?.nome === categoriaBalcaoAtiva) && texto.includes(termo);
  });

  elBalcao('lista').innerHTML = lista.length
    ? lista.map((p) => {
      const item = itensBalcao.get(p.documentId);
      const imagem = p.imagem?.url ? `<img src="${esc(urlImagem(p.imagem))}" alt="" class="h-100 w-100 object-fit-cover">` : semImagemHtml('h-100 w-100');
      return `<div class="col">
        <article class="card h-100 overflow-hidden border-0 shadow-sm">
          <div class="ratio ratio-4x3 bg-warning-subtle">${imagem}</div>
          <div class="vstack flex-fill gap-2 p-3">
            <div class="flex-fill">
              <p class="text-secondary small mb-1">${esc(p.categoria?.nome || 'Produto')}</p>
              <h2 class="fs-6 fw-semibold mb-1">${esc(p.nome)}</h2>
              <p class="text-secondary small mb-0">${dinheiro(p.preco)}</p>
            </div>
            <button type="button" class="btn btn-warning w-100 fw-semibold" data-adicionar="${esc(p.documentId)}">
              <span class="material-symbols-outlined align-middle fs-6">${item ? 'add' : 'add_shopping_cart'}</span>
              ${item ? `Adicionar mais · ${item.quantidade}` : 'Adicionar'}
            </button>
          </div>
        </article>
      </div>`;
    }).join('')
    : estadoVazio('search_off', 'Nenhum produto disponível');
}

function totalBalcao() {
  return [...itensBalcao.values()].reduce((soma, item) => soma + Number(item.produto.preco) * item.quantidade, 0);
}

function quantidadeTotalBalcao() {
  return [...itensBalcao.values()].reduce((soma, item) => soma + item.quantidade, 0);
}

function renderItensBalcao() {
  const itens = [...itensBalcao.values()];
  elBalcao('itens-vazios').classList.toggle('d-none', itens.length > 0);
  elBalcao('contador-itens').textContent = `${quantidadeTotalBalcao()} ${quantidadeTotalBalcao() === 1 ? 'item' : 'itens'}`;

  elBalcao('itens').innerHTML = itens.map(({ produto, quantidade }) => `<div class="d-flex align-items-center gap-2 border-bottom border-secondary-subtle pb-3">
    <div class="overflow-hidden flex-fill">
      <p class="text-truncate fw-semibold small mb-1">${esc(produto.nome)}</p>
      <p class="text-secondary small mb-0">${dinheiro(Number(produto.preco) * quantidade)}</p>
    </div>
    <div class="d-inline-flex align-items-center rounded-3 border border-secondary-subtle bg-white">
      <button type="button" class="btn btn-sm btn-light px-2" data-quantidade="-1" data-id="${esc(produto.documentId)}" aria-label="Diminuir ${esc(produto.nome)}"><span class="material-symbols-outlined fs-6">remove</span></button>
      <span class="px-2 small fw-semibold" aria-live="polite">${quantidade}</span>
      <button type="button" class="btn btn-sm btn-light px-2" data-quantidade="1" data-id="${esc(produto.documentId)}" aria-label="Aumentar ${esc(produto.nome)}"><span class="material-symbols-outlined fs-6">add</span></button>
    </div>
    <button type="button" class="btn btn-sm btn-outline-danger" data-remover="${esc(produto.documentId)}" aria-label="Remover ${esc(produto.nome)}"><span class="material-symbols-outlined fs-6">delete</span></button>
  </div>`).join('');

  const subtotal = totalBalcao();
  const taxa = modalidadeBalcao() === 'entrega' ? Number(lojaBalcao?.taxaEntrega || 0) : 0;
  elBalcao('subtotal').textContent = dinheiro(subtotal);
  elBalcao('linha-taxa').classList.toggle('d-none', modalidadeBalcao() !== 'entrega');
  elBalcao('linha-taxa').classList.toggle('d-flex', modalidadeBalcao() === 'entrega');
  elBalcao('taxa-entrega').textContent = taxa > 0 ? dinheiro(taxa) : 'Grátis';
  elBalcao('total').textContent = dinheiro(subtotal + taxa);
}

function atualizarFormularioBalcao() {
  const modalidade = modalidadeBalcao();
  const mesa = elBalcao('mesa');
  const nome = elBalcao('nome-cliente');
  const telefone = elBalcao('telefone-contato');
  const endereco = elBalcao('endereco-entrega');
  const entrega = modalidade === 'entrega';

  elBalcao('bloco-mesa').classList.toggle('d-none', modalidade !== 'mesa');
  elBalcao('bloco-entrega').classList.toggle('d-none', !entrega);
  mesa.required = modalidade === 'mesa';
  nome.required = entrega;
  telefone.required = entrega;
  endereco.required = entrega;
  elBalcao('nome-obrigatorio').textContent = entrega ? '(obrigatório)' : '(opcional)';
  elBalcao('telefone-obrigatorio').textContent = entrega ? '(obrigatório)' : '(opcional)';

  const fechada = lojaBalcao?.aberta === false;
  elBalcao('aviso-fechada').classList.toggle('d-none', !fechada);
  renderItensBalcao();
  const botao = elBalcao('btn-finalizar');
  botao.disabled = quantidadeTotalBalcao() === 0 || fechada || enviandoBalcao;
  botao.textContent = enviandoBalcao ? 'Registrando...' : fechada ? 'Lanchonete fechada' : 'Registrar pedido';
}

function atualizarBalcao() {
  renderProdutosBalcao();
  atualizarFormularioBalcao();
}

function adicionarProdutoBalcao(id, quantidade = 1) {
  const produto = produtosBalcao.find((p) => p.documentId === id);
  if (!produto?.disponivel) return;
  const atual = itensBalcao.get(id);
  const novaQuantidade = (atual?.quantidade || 0) + quantidade;
  if (novaQuantidade > 50) return toast('O limite é de 50 unidades por produto', 'erro');
  if (novaQuantidade <= 0) itensBalcao.delete(id);
  else itensBalcao.set(id, { produto, quantidade: novaQuantidade });
  atualizarBalcao();
}

async function enviarPedidoBalcao(evento) {
  evento.preventDefault();
  const form = elBalcao('form-balcao');
  form.classList.add('was-validated');
  if (!form.reportValidity()) return;
  if (!itensBalcao.size) return toast('Adicione ao menos um produto', 'erro');
  if (lojaBalcao?.aberta === false) return toast('A lanchonete está fechada', 'erro');

  const modalidade = modalidadeBalcao();
  const nome = elBalcao('nome-cliente').value.trim();
  const telefone = digitos(elBalcao('telefone-contato').value);
  if (modalidade === 'entrega' && !telefoneValido(telefone)) {
    return toast('Informe um telefone válido para a entrega', 'erro');
  }

  enviandoBalcao = true;
  atualizarFormularioBalcao();
  try {
    const resposta = await api('/pedidos', {
      method: 'POST',
      body: {
        data: {
          modalidade,
          mesa: modalidade === 'mesa' ? elBalcao('mesa').value.trim() : '',
          nomeCliente: nome,
          telefoneContato: telefone,
          entregaNome: modalidade === 'entrega' ? nome : '',
          entregaTelefone: modalidade === 'entrega' ? telefone : '',
          entregaEndereco: modalidade === 'entrega' ? elBalcao('endereco-entrega').value.trim() : '',
          formaPagamento: document.querySelector('input[name="pagamento"]:checked').value,
          observacoes: elBalcao('observacoes').value.trim(),
          itens: [...itensBalcao.values()].map(({ produto, quantidade }) => ({
            produto: produto.documentId,
            quantidade,
          })),
        },
      },
    });
    const numero = resposta?.data?.id || resposta?.data?.documentId;
    toast(numero ? `Pedido #${numero} registrado` : 'Pedido registrado');
    setTimeout(() => { window.location.href = 'pedidos.html'; }, 700);
  } catch (erro) {
    enviandoBalcao = false;
    atualizarFormularioBalcao();
    toast(erro.message, 'erro');
  }
}

async function iniciarBalcao() {
  elBalcao('busca').addEventListener('input', renderProdutosBalcao);
  elBalcao('categorias').addEventListener('click', (evento) => {
    const botao = evento.target.closest('[data-categoria]');
    if (!botao) return;
    categoriaBalcaoAtiva = botao.dataset.categoria;
    renderCategoriasBalcao();
    renderProdutosBalcao();
  });
  elBalcao('lista').addEventListener('click', (evento) => {
    const botao = evento.target.closest('[data-adicionar]');
    if (botao) adicionarProdutoBalcao(botao.dataset.adicionar);
  });
  elBalcao('itens').addEventListener('click', (evento) => {
    const quantidade = evento.target.closest('[data-quantidade]');
    const remover = evento.target.closest('[data-remover]');
    if (quantidade) adicionarProdutoBalcao(quantidade.dataset.id, Number(quantidade.dataset.quantidade));
    if (remover) {
      itensBalcao.delete(remover.dataset.remover);
      atualizarBalcao();
    }
  });
  elBalcao('form-balcao').addEventListener('change', atualizarFormularioBalcao);
  elBalcao('form-balcao').addEventListener('submit', enviarPedidoBalcao);

  try {
    const [categorias, produtos, loja] = await Promise.all([
      apiTodos('/categorias', { sort: 'nome:asc' }),
      apiTodos('/produtos', { populate: '*', sort: 'nome:asc' }),
      carregarLoja(),
    ]);
    categoriasBalcao = categorias;
    produtosBalcao = produtos;
    lojaBalcao = loja;
    renderCategoriasBalcao();
    atualizarBalcao();
  } catch (erro) {
    toast(erro.message, 'erro');
  }
}

if (montarLayout()) iniciarBalcao();
