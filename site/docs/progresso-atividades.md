# Progresso de atividades — etapa 1

Branch: `feat/registro-conclusao-atividades`.

Registra conclusões por criança e mostra ✓ no canto superior direito dos cards.
A criança pode repetir atividades; cada partida concluída gera outra realização.
Sequência diária, agregados por módulo, relatórios e IA ficam fora desta etapa.

## Fluxo e contratos

- O início efetivo, depois da contagem, cria o UUID da tentativa e captura a
  criança ativa. Abrir a página ou iniciar sem concluir não grava no banco.
- A chegada à tela `done`/`conclusao` envia POST autenticado. O backend verifica
  a relação usuário → responsável → criança antes de gravar ou consultar.
- `POST /api/activities/complete` recebe JSON com `childId`, `activityId`,
  `realizationId` e, opcionalmente, `resultado` (objeto de até 4 KB).
- Retorno 201: nova realização; 200: reenvio da mesma realização já salva.
  Erros: 400 dados inválidos; 401 sessão inválida; 403 criança de outra conta;
  404 atividade desconhecida; 409 UUID ocupado por outra criança/atividade;
  415 formato diferente de JSON; 503 catálogo não carregado.
- Usa INSERT na tabela física `realizações_atividades` (com acento), sem
  sobrescrever histórico. Grava `resultado.concluida = true`, `versao = 1`
  e data/hora fornecida pelo banco. Não coleta métricas de acertos/tempo.
- Reenviar após falha reutiliza a PK da tentativa; jogar novamente cria outro
  UUID. Assim, falha de rede não duplica uma conclusão confirmada.
- `GET /api/activities/progress/:childId` retorna
  `{ success, childId, completedActivityIds }`, com atividades distintas.
  A consulta é paginada, inclusive em históricos acima de mil realizações.
- O cliente mostra confirmação de salvamento ou erro com botão para reenviar.
  Os cards consultam o servidor; não usam flags locais de conclusão.
- Trocar criança, recarregar ou voltar à página atualiza os cards. Respostas
  atrasadas de outra criança são descartadas. O ✓ não bloqueia nova partida
  e tem a descrição acessível “Atividade concluída”.

## Banco e execução

`data/activities.json` define os IDs estáveis das dez atividades.
`supabase/seed_activities.sql` carrega o catálogo com INSERT e
`ON CONFLICT (id) DO NOTHING`. Foi aplicado ao Supabase TEKO em 11/09/2026;
foram verificados os dez registros e a ausência de realizações de teste.

Não foram alteradas tabelas, colunas ou políticas. RLS continua habilitada.
O backend usa o cliente administrativo já existente e as variáveis
`SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY`. A chave não vai para o navegador.
Como esse cliente ignora RLS, a verificação de propriedade no service é
obrigatória. `progresso_modulos` e `sequencia_atividades` não são atualizadas.

Em outra base, execute o seed antes de usar a branch. Módulos: 1 Emoções,
2 Comunicação, 3 Situações Sociais, 4 Rotina, 5 Refúgio.

Na pasta `site`, com as dependências instaladas:

```sh
node --test tests/*.test.js
npm start
```

Os 11 testes automatizados usam serviços externos simulados: verificam HTTP,
middleware de autenticação, autorização, validações, histórico, reenvio,
paginação, repetição, troca de perfil e marcação dos cards em DOM mínimo.
Não foi feito teste visual em navegador nem login com uma criança real.

Para testar manualmente: entrar, selecionar criança, concluir uma atividade,
esperar “Atividade concluída e salva!” e voltar aos cards. Recarregar preserva
o ✓; selecionar outra criança mostra somente as próprias conclusões.

Se salvar falhar, usar o reenvio na tela final. Não há fila offline persistente.
A conclusão é informada pelo cliente; as jogadas não são reexecutadas no
servidor. O código está na branch, sem merge em `main` nem deploy do site.

## Inventário de mudanças (caminhos relativos a `site/`)

| Estado | Arquivo | Mudança |
|---|---|---|
| Criado | `data/activities.json` | Catálogo das dez atividades. |
| Criado | `routes/activityRoutes.js` | Endpoints protegidos e respostas sem cache. |
| Criado | `services/activityService.js` | Validação e verificação de propriedade. |
| Criado | `services/activityRepository.js` | INSERT, idempotência e consulta paginada. |
| Criado | `supabase/seed_activities.sql` | Carga idempotente do catálogo. |
| Criado | `view/js/activity-progress.js` | Cliente de gravação, confirmação e reenvio. |
| Criado | `tests/activity-progress.test.js` | Testes backend/HTTP. |
| Criado | `tests/activity-progress-browser.test.js` | Testes de lógica frontend em DOM mínimo. |
| Criado | `docs/progresso-atividades.md` | Guia e inventário de alterações. |
| Alterado | `controller/activityController.js` | Implementa o controller antes vazio. |
| Alterado | `server.js` | Monta as rotas em `/api/activities`. |
| Alterado | `view/js/atividades/activity-core.js` | Eventos de início e conclusão compartilhados. |
| Alterado | `view/js/atividades.js` | Busca conclusões e atualiza os cards por perfil. |
| Alterado | `view/css/atividades.css` | ✓, status e botão de reenvio. |
| Alterado | `view/pages/atividades.html` | IDs dos cards, status e inclusão do cliente. |

As dez páginas abaixo receberam apenas `data-activity-id` no `body` e a
inclusão do cliente antes de `activity-core.js`:

- `view/pages/atividades/quebra-cabeca-emocoes.html`
- `view/pages/atividades/como-ele-pode-estar.html`
- `view/pages/atividades/monte-frase.html`
- `view/pages/atividades/oq-posso-dizer.html`
- `view/pages/atividades/oq-fazer-agora.html`
- `view/pages/atividades/minha-vez-sua-vez.html`
- `view/pages/atividades/oq-vem-depois.html`
- `view/pages/atividades/mudou-o-plano.html`
- `view/pages/atividades/respire-com-teko.html`
- `view/pages/atividades/oq-pode-me-ajudar.html`

Pastas novas: `site/data/`, `site/tests/` e `site/docs/`.
