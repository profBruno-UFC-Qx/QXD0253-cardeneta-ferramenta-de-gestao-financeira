# :package: Entrega Final

## :computer: Como executar o projeto

A Caderneta é um sistema local de cardápio, pedidos, atendimento e gestão para a BG Lanches. Os requisitos do cliente e as imagens de ideação do dashboard, cardápio e página de produto estão no [documento de requisitos](https://docs.google.com/document/d/15ulKBwjAzIrtcCmsGuz9EDwB7E96fxrD1t4Ps2cXpuo/edit). A funcionalidade de adicionais foi acrescentada: o gerente associa adicionais aos produtos, e o sistema valida e calcula os valores no pedido.

**Pré-requisitos:** Node.js 22 ou superior, dentro do intervalo `>=22.0.0` e `<=26.x.x`, npm e para instalar as dependências do Strapi. O backend usa Strapi 5.61.0 e SQLite. O Bootstrap está incluído no frontend.

1. Coloque a base de demonstração em `backend-strapi/.tmp/data.db`.

2. Se for iniciar com um banco novo, crie `backend-strapi/.env` com os segredos aleatórios exigidos pelo Strapi (`APP_KEYS`, `API_TOKEN_SALT`, `ADMIN_JWT_SECRET`, `TRANSFER_TOKEN_SALT`, `ENCRYPTION_KEY` e `JWT_SECRET`). Para criar as contas de teste automaticamente, inclua `SEED_DEMO=true` e `DEMO_USER_PASSWORD=Caderneta123`.

3. No primeiro terminal, execute:

   ```bash
   cd backend-strapi
   npm install
   npm run develop
   ```

4. No segundo terminal, execute:

   ```bash
   cd frontend
   node servidor.js
   ```

5. Acesse `http://localhost:5500`. Mantenha os dois terminais abertos e use `localhost`. Para encerrar, pressione `Ctrl+C` nos dois terminais.

O servidor local do frontend encaminha `/api` e `/uploads` para o Strapi em `http://localhost:1337`. A configuração de SQLite usa `backend/.tmp/data.db`. O bootstrap cria as contas de demonstração apenas quando `SEED_DEMO=true` e não altera a senha de contas já existentes.


## :key: Credenciais de acesso para teste

Acesse `http://localhost:5500/login.html`:

- **Gerente:** `gerente@caderneta.com` — senha `Caderneta123`

- **Atendente:** `atendente@caderneta.com` — senha `Caderneta123`

- **Cliente:** `cliente@caderneta.com` — senha `Caderneta123`

As contas precisam estar na base SQLite. O visitante pode consultar o cardápio sem login; cliente, atendente e gerente têm permissões diferentes. O cliente acessa os próprios pedidos, o atendente opera pedidos e balcão, e o gerente acessa a gestão, a equipe e o financeiro.

## :robot: Uso de ferramentas de Inteligência Artificial

Foi utilizado o Deepseek para integrar os tutorias citados, templates e a depuração. A ferramenta ajudou com sugestões e revisão de código, investigação de erros de integração com o Strapi.

## :construction: Maiores dificuldades encontradas

As principais dificuldades foram configurar permissões diferentes para cada papel, proteger pedidos e dados financeiros na API, integrar o frontend local ao Strapi e validar as relações entre produtos, pedidos e adicionais. Também foi necessário tratar erros do frontend e do backend sem perder as respostas JSON usadas pela aplicação.

## :warning: Limitações conhecidas

- O pagamento é presencial; não há integração com gateway de pagamento.

- O sistema foi preparado para execução local, sem publicação em nuvem.

- Não há outros bugs pendentes conhecidos pelo responsável até a preparação deste documento.

<!-- kit:fim-secoes-genericas -->

## :desktop_computer: Tecnologias e bibliotecas utilizadas

HTML5, CSS3 e JavaScript puro; Bootstrap CSS 5.3.8; Node.js; Strapi 5.61.0 com API REST e autenticação JWT; SQLite com `better-sqlite3` 12.11.1; Google Fonts (Inter e Material Symbols). Os relatórios permitem exportação CSV e impressão pelo navegador.

**Referências relacionadas para estudo e comparação** Elas ajudam a contextualizar padrões de cardápio, pedidos, autenticação e interface.

- **Projetos semelhantes:** [Food Ordering App — Strapi e Next.js](https://github.com/divofred/food-ordering-app), exemplo de frontend de pedidos integrado ao Strapi, mas com Next.js, GraphQL e outra arquitetura. [Rannaghor — Restaurant Ordering System](https://github.com/tamimtxd/restaurant-ordering-system), menu, carrinho e operação de pedidos com JavaScript puro, mas usando Supabase em vez de Strapi.

- **Tutoriais no YouTube:** [JWT Authentication with Login and Registration Views — Strapi Course #6](https://www.youtube.com/watch?v=r9JCuUkcuBU), sobre login, cadastro e JWT no Strapi, com exemplos em Next.js e versão anterior do Strapi. [Restaurant Website com Bootstrap 5](https://www.youtube.com/watch?v=F9rt3Gy11kU), referência de interface.

- **Documentação:** [Strapi 5 Users & Permissions REST API](https://docs.strapi.io/cms/features/users-permissions/rest-api), sobre autenticação, usuários e permissões; [Strapi 5 REST API Relations](https://docs.strapi.io/cms/api/rest/relations), sobre conectar e atualizar relações entre entidades.

- **Templates semelhantes:** [Restoran — template gratuito de restaurante em Bootstrap 5](https://themewagon.com/themes/restoran-free-responsive-bootstrap-5-restaurant-website-template/), referência para cardápio e interface, com atribuição exigida na versão gratuita; [Aprycot Lite — dashboard de restaurante no Figma Community](https://www.figma.com/community/file/1030081993174248723/aprycot-lite-free-restaurant-html5-admin-dashboard-template), referência visual de administração, disponibilizada sob CC BY 4.0.
