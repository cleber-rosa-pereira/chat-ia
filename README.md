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

### GET /service_media
Lista mídias (imagens/vídeos) dos serviços. Filtra por empresa via relação com `services`.

**Query params**
- `service_id` (opcional): UUID do serviço.
- (indireto) `company_id`: use join implícito `service:services(...)` para filtrar pela empresa.

**Respostas**
- 200 + `[]` se não houver itens.
- 200 + lista com objetos `{ id, created_at, service_id, url, kind }`.

**Exemplos**
- Todas as mídias (com nome do serviço):
http://localhost:3333/service_media?select=id,kind,url,service:services(id,name)

diff
Copiar código
- Mídias de um serviço específico:
http://localhost:3333/service_media?service_id=EQ_SEU_SERVICE_ID&select=id,kind,url

sql
Copiar código

### GET /service_professional
Lista vínculos entre serviços e profissionais (N:N). Útil para saber quem executa cada serviço.

**Query params**
- `service_id` (opcional): UUID do serviço.
- `professional_id` (opcional): UUID do profissional.

**Respostas**
- 200 + `[]` se não houver itens.
- 200 + lista com objetos `{ service_id, professional_id, created_at }`.

**Exemplos**
- Vínculos com nomes (join implícito):
http://localhost:3333/service_professional?select=service:services(id,name),professional:professionals(id,name),created_at

diff
Copiar código
- Por serviço específico:
http://localhost:3333/service_professional?service_id=EQ_SEU_SERVICE_ID&select=professional:professionals(id,name)

diff
Copiar código
- Por profissional específico:
http://localhost:3333/service_professional?professional_id=EQ_SEU_PROFESSIONAL_ID&select=service:services(id,name)

sql
Copiar código

## POST /appointments

Cria um agendamento.

### Corpo (JSON)
```json
{
  "company_id": "UUID",
  "service_id": "UUID",
  "professional_id": "UUID",
  "customer_name": "string",
  "customer_phone": "string",
  "start_time": "ISO-8601 (UTC) ex.: 2025-10-21T17:00:00Z",
  "end_time": "ISO-8601 (UTC) ex.: 2025-10-21T18:00:00Z",
  "deposit_amount": 0,
  "deposit_status": "none",
  "notes": "string opcional"
}

### Debug (logs da API)
Para ver logs de diagnóstico do POST /appointments:

**PowerShell (Windows):**
```powershell
$env:DEBUG="1"; npm run dev

## GET /appointments/search

Lista agendamentos por **empresa** + **profissional** dentro de um **intervalo** (retorna os que **intersectam** o período).

### Query params (todos obrigatórios)
- `company_id` (UUID)
- `professional_id` (UUID)
- `from` (ISO-8601 UTC) — início do intervalo
- `to`   (ISO-8601 UTC) — fim do intervalo (precisa ser depois de `from`)

> Regra de interseção: `existing.start_time < to` **e** `existing.end_time > from`.

### Exemplo

```
GET /appointments/search?company_id=...&professional_id=...&from=2025-10-21T16:00:00Z&to=2025-10-21T21:00:00Z
```

### Respostas
- **200 OK**
```json
{
  "items": [
    {
      "id": "UUID",
      "company_id": "UUID",
      "professional_id": "UUID",
      "service_id": "UUID",
      "customer_name": "Cliente",
      "customer_phone": "5599...",
      "start_time": "2025-10-21T17:00:00Z",
      "end_time": "2025-10-21T18:00:00Z",
      "status": "scheduled",
      "deposit_amount": 0,
      "deposit_status": "none",
      "notes": "",
      "created_at": "2025-10-20T20:04:18.4934Z"
    }
  ]
}
```
#### Campos adicionais

- `count` (number) — **total** de agendamentos que batem com o filtro (independente de `limit`/`offset`).  
  Use para paginação: `totalPages = Math.ceil(count / limit)`.

- **400 Bad Request**
  - `faltando: ...` (query obrigatória ausente)
  - `invalid_time_range` (datas fora do formato ISO ou `to` ≤ `from`)

### Paginação

Parâmetros opcionais:

- `limit`  (número de itens por página — padrão `20`, mínimo `1`, máximo `100`)
- `offset` (deslocamento — padrão `0`)

Exemplo:
```
GET /appointments/search?company_id=...&professional_id=...&from=2025-10-21T16:00:00Z&to=2025-10-21T21:00:00Z&limit=2&offset=0
```
Retorna até **2** itens a partir do primeiro. Para a “próxima página”, use `offset=2` (mantendo `limit=2`).

### Filtro opcional por status

Use `status` para filtrar 1 ou mais estados (separados por vírgula). Valores aceitos:
`schedule`d, `confirmed`, `completed`, `cancelled`, `no_show`.

Exemplos:
```
GET /appointments/search?...&status=scheduled
GET /appointments/search?...&status=scheduled,confirmed
```
Se o parâmetro **não** for enviado, retornam **todos** os status.

## PATCH /appointments/:id/status

Atualiza o **status** de um agendamento existente.

### Body (JSON)
```json
{ "status": "cancelled" }
```

