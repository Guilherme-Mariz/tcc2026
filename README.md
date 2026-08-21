# TEKO

Plataforma de educação socioemocional para crianças com TEA de 6 a 10 anos.

## Tecnologias

- HTML, CSS e JavaScript
- Node.js e Express
- Supabase
- Groq
- GSAP e ScrollTrigger armazenados localmente

## Como executar

Entre na pasta `site`, instale as dependências e inicie o servidor:

```bash
cd site
npm install
npm start
```

A aplicação ficará disponível em `http://localhost:3000`.

## Estrutura principal

- `site/view/pages`: páginas HTML
- `site/view/css`: estilos compartilhados e estilos específicos
- `site/view/js`: scripts das páginas e componentes compartilhados
- `site/view/js/atividades`: núcleo e lógica das atividades
- `site/view/js/vendor`: bibliotecas usadas no navegador
- `site/view/img`: imagens, fundos e artes das atividades
- `site/routes`: rotas da aplicação
- `site/controller`: controladores
- `site/services`: serviços e acesso a dados

## Organização do frontend

- `shell.css`: estrutura compartilhada da área interna
- `site-shell.js`: navegação, menu mobile, avatar e logout
- `session-switch.js`: escolha e troca da sessão da criança
- `activity-core.js`: transições e componentes comuns das atividades
- Cada página mantém seu próprio CSS e JavaScript apenas para comportamentos específicos.

## Dependências locais do navegador

Os computadores da escola podem bloquear CDNs. Por isso, GSAP e ScrollTrigger devem ser carregados somente destes arquivos:

- `site/view/js/vendor/gsap.min.js`
- `site/view/js/vendor/ScrollTrigger.min.js`

Consulte [TODO.md](TODO.md) para as pendências atuais.
