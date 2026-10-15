# :checkered_flag: Caderneta - Comanda, Gestão e Atendimento para pequenas lanchonetes online.

Sistema web para pequenas lanchonetes, desenvolvido em parceria com a **BG Lanches** (Quixeramobim-CE, [@bglanchesqxb](https://www.instagram.com/bglanchesqxb/)), que reúne, em um só lugar, cardápio digital, carrinho de compras, gestão de pedidos e controle financeiro básico. A aplicação permite que o cliente monte e acompanhe seu pedido online, enquanto o dono e os funcionários organizam a operação do dia a dia sem depender de cadernos, planilhas ou aplicativos de delivery com taxas altas.

## :technologist: Membros da equipe

| Matrícula  | Nome                        | Curso |
|------------| ----------------------------|-------|
| 578206     | Halyson Deyvison Lima Nunes | REDES |

## :bulb: Objetivo Geral
Desenvolver uma aplicação web (frontend em HTML, CSS e JavaScript/TypeScript, consumindo uma API REST em Strapi) que digitalize o atendimento e a gestão de pequenas lanchonetes, permitindo a divulgação do cardápio, o recebimento e o acompanhamento de pedidos e o controle das receitas e despesas do estabelecimento.

## :eyes: Público-Alvo
- A **BG Lanches**, lanchonete de Quixeramobim-CE que atuará como parceira e primeira usuária real do sistema, ajudando a validar os requisitos com o dia a dia do negócio.
- Donos e donas de pequenas lanchonetes, carrinhos de lanche e microempreendedores do ramo de alimentação, especialmente os que ainda controlam pedidos e finanças de forma manual.
- Funcionários que atendem e preparam os pedidos.
- Clientes dessas lanchonetes (comunidade local, estudantes, trabalhadores da região) que desejam consultar o cardápio e fazer pedidos de forma rápida.

## :star2: Impacto Esperado
- Reduzir erros e perdas no atendimento, com pedidos registrados de forma organizada e com status acompanhável.
- Dar ao pequeno empreendedor uma visão clara de vendas, despesas e lucro, apoiando decisões como quais produtos destacar e quando repor estoque.
- Ampliar a visibilidade do negócio local por meio de um cardápio digital acessível a qualquer pessoa, sem a necessidade de pagar taxas de grandes plataformas de delivery.
- Oferecer ao cliente mais comodidade: consultar preços, montar o pedido e saber em que etapa ele está.
- Fortalecer a relação entre universidade e comunidade (viés de extensão): a BG Lanches, empreendimento familiar de Quixeramobim, receberá uma ferramenta de baixo custo adaptada à sua realidade, e o modelo poderá ser replicado por outras lanchonetes da região.
- Ampliar a presença digital da BG Lanches, hoje concentrada nas redes sociais, com um cardápio e um canal de pedidos próprios.

## :people_holding_hands: Papéis ou tipos de usuário da aplicação

| Papel | Autenticado? | Permissões principais |
|-------|--------------|------------------------|
| **Visitante**  | Não | Ver a página inicial, o cardápio (produtos e categorias) e as informações da lanchonete; cadastrar-se e fazer login. |
| **Cliente** | Sim | Tudo o que o visitante pode, além de usar o carrinho, finalizar pedidos, acompanhar o status e consultar o histórico dos próprios pedidos; editar o próprio perfil. |
| **Funcionário**  | Sim | Visualizar todos os pedidos, alterar o status (recebido, em preparo, pronto, entregue, cancelado), registrar pedidos feitos no balcão e marcar produtos como indisponíveis. Não acessa o módulo financeiro nem gerencia usuários. |
| **Gerente** | Sim | Tudo o que o atendente pode, além de gerenciar cardápio (CRUD de categorias e produtos), registrar e consultar despesas, ver relatórios financeiros e gerenciar os funcionários. |


## :triangular_flag_on_post:	 Principais funcionalidades da aplicação

**Área pública (acessível a todos):**
- Página inicial com apresentação da lanchonete (horário, endereço, contato).
- Cardápio digital com busca e filtro por categoria.
- Cadastro de conta e login.
**Área restrita (usuários autenticados):**
 
*Cliente*
- Carrinho de compras (adicionar, remover e alterar quantidade de itens, com cálculo do total).
- Finalização do pedido, com observações (ex.: "sem cebola") e forma de pagamento.
- Acompanhamento do status do pedido e histórico de pedidos.
- Edição do perfil.
*Atendente*
- Painel de pedidos do dia, com atualização de status.
- Registro de pedidos de balcão.
- Ativar/desativar a disponibilidade de produtos.
*Gerente / Dono*
- CRUD de categorias e produtos do cardápio.
- CRUD de despesas (compras de insumos, contas fixas etc.).
- Painel financeiro: faturamento por período, despesas, lucro estimado e produtos mais vendidos.
- Gerenciamento dos funcionários (definição do papel de cada usuário).
**Requisitos técnicos atendidos:**
- Autenticação com JWT fornecida pelo Strapi e controle de acesso por papel no frontend e no backend.
- Barra de navegação com links que se adaptam ao papel do usuário e opção de logout sempre visível.
- Dados persistidos em banco de dados via API REST (Strapi).


## :spiral_calendar: Entidades ou tabelas do sistema


1. **Usuário** (users-permissions do Strapi): nome, e-mail, telefone, senha e papel.
2. **Categoria**: nome, descrição.
3. **Produto**: nome, descrição, preço, imagem, disponível (sim/não), pertence a uma **Categoria**.
4. **Pedido**: data/hora, status, forma de pagamento, observações, valor total, tipo (online ou balcão), pertence a um **Usuário** (cliente).
5. **ItemPedido**: quantidade, preço unitário no momento da compra, pertence a um **Pedido** e a um **Produto**.
6. **Despesa**: descrição, valor, data, tipo (insumo, conta fixa, outros), registrada por um **Usuário**.
