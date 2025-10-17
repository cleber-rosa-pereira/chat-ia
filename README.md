# Chat-IA (WIP)

Sistema de chatbot com IA.
Stack inicial:
- Node.js 22
- (Banco) Supabase
- (Editor) VS Code
- (Controle) Git + GitHub

## Checklist
- [x] Git iniciado e .gitignore
- [ ] Projeto Node configurado (TypeScript, ESLint, dotenv)
- [ ] Conexão com Supabase
- [ ] API local (HTTP)
- [ ] Bot WhatsApp (posteriormente)
- [ ] Deploy (posteriormente)

## Como rodar (será atualizado)
```bash
npm run dev

## Endpoints — Professionals

### POST /professionals
Cria um profissional.

**Body (JSON)**
```json
{
  "name": "Carla Mendes",
  "role": "massoterapeuta",
  "company_id": "UUID_DA_EMPRESA"
}
**Resposta (200/201)**
- JSON com: `id`, `created_at`, `name`, `role`, `company_id`.

**Erros comuns**
- 400/422: falta `name` ou `role`.
- 409/422: `company_id` não existe (quebra de FK).

**Exemplo (PowerShell)**
```powershell
Invoke-RestMethod -Method Post -Uri "http://localhost:3333/professionals" -ContentType "application/json" -Body '{"name":"Carla Mendes","role":"massoterapeuta","company_id":"SEU_UUID"}'

### GET /professionals
Lista profissionais. Pode filtrar por empresa.

**Query params**
- `company_id` (opcional): UUID da empresa.

**Respostas**
- 200 + `[]` se não houver itens.
- 200 + lista com objetos `{ id, created_at, name, role, company_id }`.

**Exemplos**
- Todos:
http://localhost:3333/professionals

diff
Copiar código
- Apenas de uma empresa:
http://localhost:3333/professionals?company_id=SEU_UUID

sql
Copiar código

### GET /services
Lista serviços do catálogo. Pode filtrar por empresa.

**Query params**
- `company_id` (opcional): UUID da empresa.
- `active` (opcional): `true` ou `false`.

**Respostas**
- 200 + `[]` se não houver itens.
- 200 + lista com objetos `{ id, created_at, company_id, name, description, price, duration_minutes, active }`.

**Exemplos**
- Todos:
http://localhost:3333/services

diff
Copiar código
- Apenas de uma empresa:
http://localhost:3333/services?company_id=SEU_UUID

diff
Copiar código
- Apenas ativos da empresa:
http://localhost:3333/services?company_id=SEU_UUID&active=true

sql
Copiar código
