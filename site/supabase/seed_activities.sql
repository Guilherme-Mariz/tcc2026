-- Catálogo estável da etapa 1. Execute uma vez; repetir não altera registros existentes.
-- Módulos: 1 Emoções, 2 Comunicação, 3 Situações Sociais, 4 Rotina, 5 Refúgio.
BEGIN;
INSERT INTO public.atividades (id, modulo_id, titulo, descricao, ordem) VALUES
  ('510649ed-be45-5c7e-ac9f-8cde6209ad41', 1, 'Detetive das Emoções', 'Atividade Detetive das Emoções', 1),
  ('7190e012-82a7-5cf2-999f-4741887dbd9f', 1, 'Como Ele Pode Estar?', 'Atividade Como Ele Pode Estar?', 2),
  ('6b7bdd07-2fd4-5b0a-9241-4b58d9a5daaf', 2, 'Monte a Frase', 'Atividade Monte a Frase', 1),
  ('ec5188fa-cb84-5de9-8595-e34132123097', 2, 'O que Posso Dizer?', 'Atividade O que Posso Dizer?', 2),
  ('a55cdd22-f518-50f9-bfff-72e99c7591f8', 3, 'O que Fazer Agora?', 'Atividade O que Fazer Agora?', 1),
  ('5705e581-fbfd-5377-8cc2-b2208626434a', 3, 'Minha vez, Sua vez', 'Atividade Minha vez, Sua vez', 2),
  ('5e94471f-2742-5590-8d4e-81340d33c47a', 4, 'O que Vem Depois?', 'Atividade O que Vem Depois?', 1),
  ('969a6acc-7e70-5cf1-84f5-e08421ec9eae', 4, 'Mudou o Plano!', 'Atividade Mudou o Plano!', 2),
  ('93088b29-2388-594b-a2a3-070a2bfdb875', 5, 'Respire com o Teko', 'Atividade Respire com o Teko', 1),
  ('11fceddd-18e2-5761-9c89-f842c8c85e22', 5, 'O que Pode me Ajudar?', 'Atividade O que Pode me Ajudar?', 2)
ON CONFLICT (id) DO NOTHING;
COMMIT;
