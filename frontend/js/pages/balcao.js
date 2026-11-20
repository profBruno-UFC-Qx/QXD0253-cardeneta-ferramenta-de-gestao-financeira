let produtosBalcao = [];
let categoriasBalcao = [];
let categoriaBalcaoAtiva = '';
let lojaBalcao = null;
let paginaBalcao = 1;
const TAMANHO_PAGINA_BALCAO = 12;
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
  const filtrados = produtosBalcao.filter((p) => {
    const texto = `${p.nome} ${p.descricao || ''}`.toLocaleLowerCase('pt-BR');
    return p.disponivel && (!categoriaBalcaoAtiva || p.categoria?.nome === categoriaBalcaoAtiva) && texto.includes(termo);
  });
  const paginas = Math.max(1, Math.ceil(filtrados.length / TAMANHO_PAGINA_BALCAO));
  paginaBalcao = Math.min(paginaBalcao, paginas);
  const inicio = (paginaBalcao - 1) * TAMANHO_PAGINA_BALCAO;
  const lista = filtrados.slice(inicio, inicio + TAMANHO_PAGINA_BALCAO);

  elBalcao('lista').innerHTML = lista.length
    ? lista.map((p) => {
      const qtdProduto = [...itensBalcao.values()].filter((item) => item.produto.documentId === p.documentId).reduce((soma, item) => soma + item.quantidade, 0);
      const adicionais = (Array.isArray(p.adicionaisCatalogo) ? p.adicionaisCatalogo : []).filter((a) => a.disponivel !== false);
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
            ${adicionais.length ? `<fieldset class="vstack gap-1 small"><legend class="small fw-semibold mb-1">Adicionais</legend>${adicionais.map((a) => `<label class="d-flex align-items-center justify-content-between gap-2 mb-0"><span>${esc(a.nome)} · ${dinheiro(a.preco)} cada</span><input class="form-control form-control-sm text-center" type="number" min="0" max="50" step="1" value="0" style="width:70px" data-balcao-adicional="${esc(a.documentId)}" aria-label="Quantidade de ${esc(a.nome)}"></label>`).join('')}</fieldset>` : ''}
            <button type="button" class="btn btn-warning w-100 fw-semibold" data-adicionar="${esc(p.documentId)}">
              <span class="material-symbols-outlined align-middle fs-6">add_shopping_cart</span>
              ${qtdProduto ? `Adicionar mais · ${qtdProduto}` : 'Adicionar'}
            </button>
          </div>
        </article>
      </div>`;
    }).join('')
    : estadoVazio('search_off', 'Nenhum produto disponível');
  elBalcao('paginacao-balcao').innerHTML = paginacaoHtml(filtrados.length, paginaBalcao, TAMANHO_PAGINA_BALCAO);
}

function totalBalcao() {
  return [...itensBalcao.values()].reduce((soma, item) => soma + (Number(item.produto.preco) + item.adicionais.reduce((acc, a) => acc + Number(a.preco) * (Number(a.quantidade) || 1), 0)) * item.quantidade, 0);
}

function quantidadeTotalBalcao() {
  return [...itensBalcao.values()].reduce((soma, item) => soma + item.quantidade, 0);
}

function renderItensBalcao() {
  const itens = [...itensBalcao.values()];
  elBalcao('itens-vazios').classList.toggle('d-none', itens.length > 0);
  elBalcao('contador-itens').textContent = `${quantidadeTotalBalcao()} ${quantidadeTotalBalcao() === 1 ? 'item' : 'itens'}`;

  elBalcao('itens').innerHTML = itens.map(({ produto, quantidade, adicionais, chave }) => `<div class="d-flex align-items-center gap-2 border-bottom border-secondary-subtle pb-3">
    <div class="overflow-hidden flex-fill">
      <p class="text-truncate fw-semibold small mb-1">${esc(produto.nome)}</p>
      <p class="text-secondary small mb-0">${dinheiro((Number(produto.preco) + adicionais.reduce((s, a) => s + Number(a.preco) * (Number(a.quantidade) || 1), 0)) * quantidade)}</p>
      ${adicionais.length ? `<p class="text-secondary small mb-0">${adicionais.map((a) => `${Number(a.quantidade) || 1}× ${esc(a.nome)}`).join(', ')}</p>` : ''}
    </div>
    <div class="d-inline-flex align-items-center rounded-3 border border-secondary-subtle bg-white">
      <button type="button" class="btn btn-sm btn-light px-2" data-quantidade="-1" data-id="${esc(chave)}" aria-label="Diminuir ${esc(produto.nome)}"><span class="material-symbols-outlined fs-6">remove</span></button>
      <span class="px-2 small fw-semibold" aria-live="polite">${quantidade}</span>
      <button type="button" class="btn btn-sm btn-light px-2" data-quantidade="1" data-id="${esc(chave)}" aria-label="Aumentar ${esc(produto.nome)}"><span class="material-symbols-outlined fs-6">add</span></button>
    </div>
    <button type="button" class="btn btn-sm btn-outline-danger" data-remover="${esc(chave)}" aria-label="Remover ${esc(produto.nome)}"><span class="material-symbols-outlined fs-6">delete</span></button>
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

function chaveBalcao(produto, adicionais) {
  return `${produto.documentId}|${adicionais.map((a) => `${a.documentId || a.id}:${Number(a.quantidade) || 1}`).sort().join(',')}`;
}
function adicionarProdutoBalcao(id, quantidade = 1, idsAdicionais = []) {
  const produto = produtosBalcao.find((p) => p.documentId === id);
  if (!produto?.disponivel) return;
  const escolhas = new Map(idsAdicionais.map((opcao) => typeof opcao === 'string' ? [opcao, 1] : [opcao.id || opcao.documentId, Math.max(1, Math.min(50, Number(opcao.quantidade) || 1))]));
  const adicionais = (Array.isArray(produto.adicionaisCatalogo) ? produto.adicionaisCatalogo : [])
    .filter((a) => a.disponivel !== false && escolhas.has(a.documentId))
    .map(({ documentId: extraId, nome, preco }) => ({ id: extraId, nome, preco: Number(preco), quantidade: escolhas.get(extraId) }));
  const chave = chaveBalcao(produto, adicionais);
  const atual = itensBalcao.get(chave);
  const novaQuantidade = (atual?.quantidade || 0) + quantidade;
  if (novaQuantidade > 50) return toast('O limite é de 50 unidades por produto e combinação', 'erro');
  if (novaQuantidade <= 0) itensBalcao.delete(chave);
  else itensBalcao.set(chave, { produto, quantidade: novaQuantidade, adicionais, chave });
  atualizarBalcao();
}
function alterarQuantidadeBalcao(chave, delta) {
  const item = itensBalcao.get(chave);
  if (!item) return;
  const quantidade = item.quantidade + delta;
  if (quantidade <= 0) itensBalcao.delete(chave);
  else if (quantidade > 50) return toast('O limite é de 50 unidades por produto e combinação', 'erro');
  else itensBalcao.set(chave, { ...item, quantidade });
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
          itens: [...itensBalcao.values()].map(({ produto, quantidade, adicionais }) => ({
            produto: produto.documentId,
            quantidade,
            adicionais: adicionais.map((a) => ({ id: a.documentId || a.id, quantidade: Number(a.quantidade) || 1 })),
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
  elBalcao('busca').addEventListener('input', () => { paginaBalcao = 1; renderProdutosBalcao(); });
  elBalcao('categorias').addEventListener('click', (evento) => {
    const botao = evento.target.closest('[data-categoria]');
    if (!botao) return;
    categoriaBalcaoAtiva = botao.dataset.categoria;
    paginaBalcao = 1;
    renderCategoriasBalcao();
    renderProdutosBalcao();
  });
  elBalcao('paginacao-balcao').addEventListener('click', (evento) => {
    const botao = evento.target.closest('[data-pagina]');
    if (!botao || botao.disabled) return;
    paginaBalcao = Number(botao.dataset.pagina);
    renderProdutosBalcao();
    elBalcao('lista').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  elBalcao('lista').addEventListener('input', (evento) => {
    if (evento.target.matches('[data-balcao-adicional]')) {
      evento.target.value = String(Math.max(0, Math.min(50, Number(evento.target.value) || 0)));
    }
  });
  elBalcao('lista').addEventListener('click', (evento) => {
    const botao = evento.target.closest('[data-adicionar]');
    if (botao) {
      const cartao = botao.closest('article');
      const selecionados = [...cartao.querySelectorAll('[data-balcao-adicional]')]
        .filter((input) => Number(input.value) > 0)
        .map((input) => ({ id: input.dataset.balcaoAdicional, quantidade: Math.min(50, Number(input.value)) }));
      adicionarProdutoBalcao(botao.dataset.adicionar, 1, selecionados);
    }
  });
  elBalcao('itens').addEventListener('click', (evento) => {
    const quantidade = evento.target.closest('[data-quantidade]');
    const remover = evento.target.closest('[data-remover]');
    if (quantidade) alterarQuantidadeBalcao(quantidade.dataset.id, Number(quantidade.dataset.quantidade));
    if (remover) {
      itensBalcao.delete(remover.dataset.remover);
      atualizarBalcao();
    }
  });
  elBalcao('form-balcao').addEventListener('change', atualizarFormularioBalcao);
  elBalcao('form-balcao').addEventListener('submit', enviarPedidoBalcao);

  try {
    const [catalogo, loja] = await Promise.all([
      carregarCatalogoBase(),
      carregarLoja(),
    ]);
    categoriasBalcao = catalogo.categorias;
    produtosBalcao = catalogo.produtos;
    lojaBalcao = loja;
    renderCategoriasBalcao();
    atualizarBalcao();
  } catch (erro) {
    toast(erro.message, 'erro');
  }
}

if (montarLayout()) iniciarBalcao();
