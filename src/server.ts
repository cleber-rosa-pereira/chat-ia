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

async function start() {
  await app.register(cors, { origin: true }); // agora o await fica dentro de uma função
  const PORT = 3333;
  await app.listen({ port: PORT, host: '0.0.0.0' });
  console.log(`🚀 API on http://localhost:${PORT}`);
}

start();
