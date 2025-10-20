// src/server.ts
import Fastify from 'fastify';
import cors from '@fastify/cors';
import { supabase } from './lib/supabase';

const app = Fastify();

// saúde
app.get('/health', async () => ({ ok: true }));

// GET /companies
app.get('/companies', async (request, reply) => {
  const { data, error } = await supabase
    .from('companies')
    .select('id, created_at, name')
    .order('created_at', { ascending: false });

  if (error) return reply.code(500).send({ error: error.message });
  return reply.send(data);
});
// GET /companies/:id - busca 1 empresa pelo id
app.get('/companies/:id', async (request, reply) => {
  const { id } = request.params as { id: string };

  const { data, error } = await supabase
    .from('companies')
    .select('id, created_at, name, business_type')
    .eq('id', id)
    .single();

  if (error) return reply.code(404).send({ error: error.message });
  return reply.send(data);
});

// POST /companies
app.post('/companies', async (request, reply) => {
  const body = request.body as {
    name: string;
    business_type?: string;
  };

  const { data, error } = await supabase
    .from('companies')
    .insert({
      name: body?.name,
      business_type: body?.business_type ?? null,
    })
    .select('id, created_at, name')
    .single();

  if (error) return reply.code(500).send({ error: error.message });
  return reply.code(201).send(data);
});

// GET /professionals - lista profissionais (pode filtrar por company_id)
app.get('/professionals', async (req, reply) => {
  const { company_id } = (req.query as { company_id?: string }) || {};

  const query = supabase
    .from('professionals')
    .select('id, created_at, name, role, company_id')
    .order('created_at', { ascending: false });

  const { data, error } = company_id
    ? await query.eq('company_id', company_id)
    : await query;

  if (error) return reply.code(500).send({ error: error.message });
  return reply.send(data);
});

// GET /professionals/:id - busca 1 profissional
app.get('/professionals/:id', async (request, reply) => {
  const { id } = request.params as { id: string };

  const { data, error } = await supabase
    .from('professionals')
    .select('id, created_at, name, role')
    .eq('id', id)
    .single();

  if (error) return reply.code(404).send({ error: error.message });
  return reply.send(data);
});

// POST /professionals - cria profissional
app.post('/professionals', async (request, reply) => {
  const body = request.body as { name: string; role?: string; company_id?: string };

  const { data, error } = await supabase
    .from('professionals')
    .insert({
      name: body?.name,
      role: body?.role ?? null,
      company_id: body?.company_id ?? null
    })
    .select('id, created_at, name, role, company_id')
    .single();

  if (error) return reply.code(500).send({ error: error.message });
  return reply.code(201).send(data);
});

// ===== 22B.1 — GET /services (proxy -> Supabase REST) =====
const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY!; // Publishable (anon)

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('[config] Faltam SUPABASE_URL e/ou SUPABASE_ANON_KEY no .env');
}

/**
 * GET /services
 * ?company_id=<uuid>&active=<true|false|1|0>
 */
app.get('/services', async (req, reply) => {
  try {
    const { company_id, active } = (req.query ?? {}) as {
      company_id?: string;
      active?: string;
    };

    // Monta a query string para o PostgREST
    const qs = new URLSearchParams();
    qs.set('select', 'id,company_id,name,price,duration_minutes,active,created_at');

    if (company_id) {
      qs.set('company_id', `eq.${company_id}`);
    }
    if (typeof active !== 'undefined') {
      const norm =
        active === 'true' || active === '1'
          ? 'true'
          : active === 'false' || active === '0'
          ? 'false'
          : active;
      qs.set('active', `eq.${norm}`);
    }

    const authHeader = (req.headers['authorization'] ?? '') as string;

    const upstream = await fetch(`${SUPABASE_URL}/rest/v1/services?${qs.toString()}`, {
      method: 'GET',
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: authHeader, // repassa o Bearer <JWT> do cliente
        Accept: 'application/json',
        Prefer: 'count=none',
      },
    });

    const status = upstream.status;
    const data = await upstream.json().catch(() => ({}));
    return reply.code(status).send(data);
  } catch (err) {
    req.log?.error(err);
    return reply.code(500).send({ error: 'internal_error' });
  }
});
// ===== fim 22B.1 =====

app.get('/services-test', async () => {
  return { ok: true, when: new Date().toISOString() };
});

// ===== 22B.2 — GET /service_media (proxy -> Supabase REST) =====
/**
 * GET /service_media
 * Query:
 *  - service_id (opcional): UUID
 *  - include=service (opcional): inclui nome/ids do serviço (join implícito)
 *
 * Ex.: /service_media?include=service
 */
app.get('/service_media', async (req, reply) => {
  try {
    const { service_id, include } = (req.query ?? {}) as {
      service_id?: string;
      include?: string;
    };

    const qs = new URLSearchParams();

    // Select básico
    let select = 'id,service_id,kind,url,created_at';

    // Se pedir include=service, anexamos o join implícito com services
    if ((include ?? '').toLowerCase() === 'service') {
      select = 'id,kind,url,created_at,service:services(id,name,company_id)';
    }
    qs.set('select', select);

    if (service_id) {
      qs.set('service_id', `eq.${service_id}`);
    }

    const authHeader = (req.headers['authorization'] ?? '') as string;

    const upstream = await fetch(`${SUPABASE_URL}/rest/v1/service_media?${qs.toString()}`, {
      method: 'GET',
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: authHeader,
        Accept: 'application/json',
        Prefer: 'count=none',
      },
    });

    const status = upstream.status;
    const data = await upstream.json().catch(() => ({}));
    return reply.code(status).send(data);
  } catch (err) {
    req.log?.error(err);
    return reply.code(500).send({ error: 'internal_error' });
  }
});
// ===== fim 22B.2 =====

app.get('/service_media-test', async () => {
  return { ok: true, when: new Date().toISOString() };
});

// ===== 22B.3 — GET /service_professional (proxy -> Supabase REST) =====
/**
 * GET /service_professional
 * Query:
 *  - service_id (opcional): UUID
 *  - professional_id (opcional): UUID
 *  - include (opcional): "service", "professional" ou "service,professional"
 *
 * Exemplos:
 *  /service_professional?include=service
 *  /service_professional?include=professional
 *  /service_professional?include=service,professional
 */
app.get('/service_professional', async (req, reply) => {
  try {
    const { service_id, professional_id, include } = (req.query ?? {}) as {
      service_id?: string;
      professional_id?: string;
      include?: string;
    };

    // monta select básico
    const wants = new Set(
      (include ?? '')
        .toLowerCase()
        .split(',')
        .map(s => s.trim())
        .filter(Boolean)
    );

    let select = 'service_id,professional_id,created_at';

    if (wants.has('service') && wants.has('professional')) {
      select =
        'created_at,service:services(id,name,company_id),professional:professionals(id,name,company_id)';
    } else if (wants.has('service')) {
      select = 'service_id,professional_id,created_at,service:services(id,name,company_id)';
    } else if (wants.has('professional')) {
      select = 'service_id,professional_id,created_at,professional:professionals(id,name,company_id)';
    }

    const qs = new URLSearchParams();
    qs.set('select', select);

    if (service_id) qs.set('service_id', `eq.${service_id}`);
    if (professional_id) qs.set('professional_id', `eq.${professional_id}`);

    const authHeader = (req.headers['authorization'] ?? '') as string;

    const upstream = await fetch(`${SUPABASE_URL}/rest/v1/service_professional?${qs.toString()}`, {
      method: 'GET',
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: authHeader, // repassa o Bearer <JWT> do cliente
        Accept: 'application/json',
        Prefer: 'count=none',
      },
    });

    const status = upstream.status;
    const data = await upstream.json().catch(() => ({}));
    return reply.code(status).send(data);
  } catch (err) {
    req.log?.error(err);
    return reply.code(500).send({ error: 'internal_error' });
  }
});
// ===== fim 22B.3 ===== // ===== 23A.3 — GET /appointments (proxy -> Supabase REST) =====
app.get('/appointments', async (req, reply) => {
  try {
    const { company_id, service_id, professional_id, from, to, limit } = (req.query ?? {}) as {
      company_id?: string;
      service_id?: string;
      professional_id?: string;
      from?: string;  // ISO ex.: 2025-10-19T00:00:00Z
      to?: string;    // ISO
      limit?: string; // número como texto
    };

    const qs = new URLSearchParams();
    qs.set('select', 'id,company_id,service_id,professional_id,customer_name,customer_phone,start_time,end_time,status,deposit_amount,deposit_status,created_at');
    qs.set('order', 'start_time.asc');

    if (company_id)      qs.set('company_id',      `eq.${company_id}`);
    if (service_id)      qs.set('service_id',      `eq.${service_id}`);
    if (professional_id) qs.set('professional_id', `eq.${professional_id}`);
    if (from)            qs.set('start_time',      `gte.${from}`);
    if (to)              qs.append('start_time',   `lte.${to}`);
    if (limit)           qs.set('limit',           `${parseInt(limit ?? '50', 10) || 50}`);

    const authHeader = (req.headers['authorization'] ?? '') as string;

    const upstream = await fetch(`${SUPABASE_URL}/rest/v1/appointments?${qs.toString()}`, {
      method: 'GET',
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: authHeader, // repassa Bearer do cliente
        Accept: 'application/json',
        Prefer: 'count=none',
      },
    });

    const status = upstream.status;
    const data = await upstream.json().catch(() => ({}));
    return reply.code(status).send(data);
  } catch (err) {
    req.log?.error(err);
    return reply.code(500).send({ error: 'internal_error' });
  }
});
// ===== fim 23A.3 =====

// ===== 23A.6 — POST /appointments (proxy -> Supabase REST) =====
app.post('/appointments', async (req, reply) => {
  try {
    const body = (req.body ?? {}) as {
      company_id: string;
      service_id: string;
      professional_id: string;
      customer_name: string;
      customer_phone: string;
      start_time: string;  // ISO ex.: 2025-10-19T01:15:00Z
      end_time: string;    // ISO
      status?: 'scheduled'|'confirmed'|'completed'|'cancelled'|'no_show';
      deposit_amount?: number;                 // ex.: 50.00
      deposit_status?: 'none'|'required'|'pending'|'paid'|'refunded'|'failed';
      notes?: string;
    };

    // validação mínima (bem simples, só pra dev)
    const required = ['company_id','service_id','professional_id','customer_name','customer_phone','start_time','end_time'] as const;
    for (const k of required) {
      if (!(body as any)[k]) {
        return reply.code(400).send({ error: 'bad_request', message: `campo obrigatório: ${k}` });
      }
    }
// ... aqui termina o for dos campos obrigatórios
// === validação: end_time > start_time (ISO/UTC) ===
const startMs = Date.parse((body as any).start_time);
const endMs   = Date.parse((body as any).end_time);

if (!Number.isFinite(startMs) || !Number.isFinite(endMs)) {
  return reply.code(400).send({
    error: 'bad_request',
    message: 'start_time e end_time precisam estar em formato ISO-8601 (ex.: 2025-10-21T17:00:00Z).'
  });
}

if (endMs <= startMs) {
  return reply.code(400).send({
    error: 'invalid_time_range',
    message: 'end_time deve ser depois de start_time.'
  });
}
// === fim validação tempo ===

// === checagem anti "duas reservas" (cole aqui) ===
const { company_id, professional_id, start_time, end_time } = body as {
  company_id: string; professional_id: string; start_time: string; end_time: string;
};

const { data: conflicts, error: conflictErr } = await supabase
  .from('appointments')
  .select('id,start_time,end_time,status')
  .eq('company_id', company_id)
  .eq('professional_id', professional_id)
  .neq('status', 'cancelled')
  .lt('start_time', end_time)
  .gt('end_time', start_time);
if (process.env.DEBUG === '1') {
  console.log('[DBG] conflict-check', {
    company_id, professional_id, start_time, end_time,
    conflictsLen: conflicts?.length ?? 0, conflictErr
  });
}

if (conflictErr) {
  return reply.code(500).send({ error: 'conflict_check_failed', details: conflictErr.message });
}
if (conflicts && conflicts.length > 0) {
  const c = conflicts[0];

  const requested = { start_time, end_time };
  const existing  = { start_time: c.start_time, end_time: c.end_time };

  const humanMsg =
    `Conflito de horário: você pediu ${requested.start_time} → ${requested.end_time}, ` +
    `mas já existe ${existing.start_time} → ${existing.end_time} para este profissional. ` +
    `Escolha outro horário livre.`;

    if (process.env.DEBUG === '1') {
  console.log('[DBG] returning-409', { requested, existing });
}
 
  return reply.code(409).send({
    error: 'double_booking',
    message: humanMsg,
    requested,
    existing,
    conflict: { id: c.id, status: c.status }
  });
}

// === fim checagem ===

// (AGORA SIM vem a linha de baixo)
const authHeader = (req.headers['authorization'] ?? '') as string;

    const upstream = await fetch(`${SUPABASE_URL}/rest/v1/appointments`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: authHeader,          // repassa Bearer do cliente (RLS checa company_id)
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify({
        company_id: body.company_id,
        service_id: body.service_id,
        professional_id: body.professional_id,
        customer_name: body.customer_name,
        customer_phone: body.customer_phone,
        start_time: body.start_time,
        end_time: body.end_time,
        status: body.status ?? 'scheduled',
        deposit_amount: body.deposit_amount ?? 0,
        deposit_status: body.deposit_status ?? 'none',
        notes: body.notes ?? null,
      }),
    });

    const status = upstream.status;
    const data = await upstream.json().catch(() => ({}));
    return reply.code(status).send(data);
  } catch (err) {
    req.log?.error(err);
    return reply.code(500).send({ error: 'internal_error' });
  }
});
// ===== fim 23A.6 =====

// ===== 23A.10 — PATCH /appointments/:id/deposit (atualiza depósito) =====
app.patch('/appointments/:id/deposit', async (req, reply) => {
  try {
    const { id } = req.params as { id: string };

    const body = (req.body ?? {}) as {
      deposit_amount?: number; // opcional
      deposit_status?: 'none' | 'required' | 'pending' | 'paid' | 'refunded' | 'failed'; // opcional
    };

    if (!id) {
      return reply.code(400).send({ error: 'bad_request', message: 'id é obrigatório na URL' });
    }
    if (body.deposit_status && !['none','required','pending','paid','refunded','failed'].includes(body.deposit_status)) {
      return reply.code(400).send({ error: 'bad_request', message: 'deposit_status inválido' });
    }

    const update: any = {};
    if (typeof body.deposit_amount === 'number') update.deposit_amount = body.deposit_amount;
    if (typeof body.deposit_status === 'string') update.deposit_status = body.deposit_status;

    if (Object.keys(update).length === 0) {
      return reply.code(400).send({ error: 'bad_request', message: 'nada para atualizar' });
    }

    const authHeader = (req.headers['authorization'] ?? '') as string;

    // PATCH no PostgREST (usa Prefer return=representation para devolver o registro atualizado)
    const upstream = await fetch(`${SUPABASE_URL}/rest/v1/appointments?id=eq.${id}`, {
      method: 'PATCH',
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: authHeader,
        'Content-Type': 'application/json',
        Prefer: 'return=representation'
      },
      body: JSON.stringify(update),
    });

    const status = upstream.status;
    const data = await upstream.json().catch(() => ({}));
    return reply.code(status).send(data);
  } catch (err) {
    req.log?.error(err);
    return reply.code(500).send({ error: 'internal_error' });
  }
});
// ===== fim 23A.10 =====

// ===== 23B.1 — POST /webhooks/payment (simular provedor de pagamento) =====
// Segurança simples de DEV: cabeçalho X-Webhook-Secret deve bater com .env PAYMENT_WEBHOOK_SECRET
// Se não existir no .env, usa "dev-secret" como padrão.
app.post('/webhooks/payment', async (req, reply) => {
  try {
    const secretExpected = process.env.PAYMENT_WEBHOOK_SECRET ?? 'dev-secret';
    const secretGot = String(req.headers['x-webhook-secret'] ?? '');
    if (secretGot !== secretExpected) {
      return reply.code(401).send({ error: 'unauthorized', message: 'invalid webhook secret' });
    }

    // Corpo esperado (exemplos):
    // { "appointment_id": "uuid", "event": "payment_pending", "amount": 30.00 }
    // { "appointment_id": "uuid", "event": "payment_paid",    "amount": 30.00 }
    // { "appointment_id": "uuid", "event": "payment_failed" }
    const body = (req.body ?? {}) as {
      appointment_id?: string;
      event?: 'payment_pending' | 'payment_paid' | 'payment_failed';
      amount?: number;
    };

    if (!body.appointment_id || !body.event) {
      return reply.code(400).send({ error: 'bad_request', message: 'appointment_id e event são obrigatórios' });
    }

    // Converte evento -> novo status de depósito
let newStatus: 'pending' | 'paid' | 'failed';
if (body.event === 'payment_pending') newStatus = 'pending';
else if (body.event === 'payment_paid') newStatus = 'paid';
else newStatus = 'failed';

// Monta payload do PATCH
const update: any = { deposit_status: newStatus };
if (typeof body.amount === 'number') update.deposit_amount = body.amount;

// Regra de negócio: se pagou, confirmamos o agendamento
if (newStatus === 'paid') {
  update.status = 'confirmed';
}

    // Chama PostgREST direto usando o ANON da API (RLS já restringe por company_id)
    const upstream = await fetch(`${SUPABASE_URL}/rest/v1/appointments?id=eq.${body.appointment_id}`, {
      method: 'PATCH',
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation'
      },
      body: JSON.stringify(update),
    });

    const status = upstream.status;
    const data = await upstream.json().catch(() => ({}));
    return reply.code(status).send(data);
  } catch (err) {
    req.log?.error(err);
    return reply.code(500).send({ error: 'internal_error' });
  }
});
// ===== fim 23B.1 =====

// ===== 23A.13b — GET /appointments/:id (proxy -> Supabase REST) =====
app.get('/appointments/:id', async (req, reply) => {
  try {
    const { id } = req.params as { id: string };
    if (!id) {
      return reply.code(400).send({ error: 'bad_request', message: 'id é obrigatório' });
    }

    const authHeader = (req.headers['authorization'] ?? '') as string;

    const upstream = await fetch(
      `${SUPABASE_URL}/rest/v1/appointments?id=eq.${id}&select=id,company_id,service_id,professional_id,customer_name,customer_phone,start_time,end_time,status,deposit_amount,deposit_status,created_at`,
      {
        method: 'GET',
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: authHeader,
          Accept: 'application/json',
          Prefer: 'count=none',
        },
      }
    );

    const status = upstream.status;
    const data = await upstream.json().catch(() => ({}));
    return reply.code(status).send(data);
  } catch (err) {
    req.log?.error(err);
    return reply.code(500).send({ error: 'internal_error' });
  }
});
// ===== fim 23A.13b =====

async function start() {
  await app.register(cors, { origin: true }); // agora o await fica dentro de uma função
  const PORT = 3333;
  await app.listen({ port: PORT, host: '0.0.0.0' });
  console.log(`🚀 API on http://localhost:${PORT}`);
}

start();
