# TEKO

Plataforma de educação socioemocional para crianças com TEA de 6 a 10 anos

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
(Na escola tem q usar o setPATH - para rodar local)

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

## Configuração e diagnóstico do chat

A aplicação carrega `site/.env` independentemente da pasta de execução. Variáveis
já definidas no ambiente do servidor têm prioridade. Mantenha as configurações
Supabase existentes e configure `GROQ_API_KEY` com uma chave válida do projeto
[Groq](https://console.groq.com/keys). Não coloque a chave no frontend ou no Git.
Depois de alterar a variável, reinicie o servidor.

Na pasta `site`, execute `npm run check:groq`. A verificação lista os modelos sem
enviar conversas nem imprimir a credencial. Ela distingue chave ausente, recusada
e falta de permissão. Um resultado positivo comprova a autenticação e a listagem
do modelo; ainda é necessário testar uma conversa para conferir permissões de
geração, limites de uso e qualidade das respostas. Um 401 da Groq não é uma
expiração do login do TEKO: confira a variável no mesmo ambiente que executa o site.

O chat usa `openai/gpt-oss-20b` com
[Structured Outputs](https://console.groq.com/docs/structured-outputs), validação
no backend, prazo de 20 segundos e sem repetição automática das chamadas Groq.
Emoção e tendência usam campos separados. A confiança é uma estimativa da IA,
não uma probabilidade validada: abaixo de 0,65, a emoção fica incerta e não há
recomendação. Sinalização de risco também impede recomendação; a resposta deve
priorizar acolhimento e um adulto de confiança. Essas regras precisam de avaliação
com respostas reais; o formato estruturado não garante a interpretação correta.

As categorias em `site/services/aiContract.js` apontam para jogos do catálogo real.
A resposta atual entrega uma atividade ou `null`, separada da memória anterior.
O botão “Agora não” comunica a recusa ao chat; a criança pode continuar conversando.
Memória temporária só recebe o par de mensagens depois de salvar a conversa.
O bloqueio de envios simultâneos é por criança e por processo Node; uma implantação
com vários processos exigirá coordenação compartilhada antes de escalar.

Testes locais: `node --test site/tests/*.test.js` a partir da raiz. Os provedores
externos são simulados: esses testes não consomem a Groq nem inserem dados reais.
O teste opcional `site/tests/responsavel-browser.check.cjs` requer Playwright e
Chromium e inclui carregamento após PIN, erro/retry e bloqueio com resposta pendente.
