# Progresso – Chat-IA

## Onde paramos
- API local rodando com Fastify.
- Rotas: `GET /health`, `GET /messages`, `POST /messages`.
- Supabase conectado e tabela `messages` funcional.
- CORS habilitado.

## Próximo passo quando voltar
- Criar a tabela `companies` no Supabase (dados da empresa para treinar o template da IA).

## Comandos úteis
- Rodar API: `npm run dev:api`
- Testar health: http://localhost:3000/health
- Listar mensagens: http://localhost:3000/messages

✔ 20E.4 — POST /professionals com company_id (ok)
✔ 20E.5 — GET /professionals?company_id=... (ok)
✔ 20E.6 — micro-commit (ok)
✔ 20E.7 — validações (A,B,C) ok
⏭ 20E.8 — documentar endpoints no README
    - Falta colar a seção do GET /professionals e salvar
