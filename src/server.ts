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

async function start() {
  await app.register(cors, { origin: true }); // agora o await fica dentro de uma função
  const PORT = 3333;
  await app.listen({ port: PORT, host: '0.0.0.0' });
  console.log(`🚀 API on http://localhost:${PORT}`);
}

start();
