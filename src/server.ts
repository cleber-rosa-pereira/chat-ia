import 'dotenv/config';
import Fastify from 'fastify';
import { createClient } from '@supabase/supabase-js';

const app = Fastify({ logger: true });

const url = process.env.SUPABASE_URL!;
const anon = process.env.SUPABASE_ANON_KEY!;
if (!url || !anon) {
  app.log.error('❌ Faltam SUPABASE_URL / SUPABASE_ANON_KEY no .env');
  process.exit(1);
}
const supabase = createClient(url, anon);

// healthcheck
app.get('/health', async () => ({ status: 'ok' }));

// listar mensagens
app.get('/messages', async (_req, reply) => {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) return reply.code(500).send({ error: error.message });
  return reply.send(data);
});

// criar mensagem
app.post('/messages', async (req, reply) => {
  const body = req.body as { text?: string };
  const text = (body?.text ?? '').toString().trim();

  if (!text) return reply.code(400).send({ error: 'text is required' });

  const { data, error } = await supabase
    .from('messages')
    .insert([{ text }])
    .select('*')
    .single();

  if (error) return reply.code(500).send({ error: error.message });
  return reply.code(201).send(data);
});

const port = Number(process.env.PORT || 3000);
app
  .listen({ port, host: '0.0.0.0' })
  .then(() => app.log.info(`🚀 API up on http://localhost:${port}`))
  .catch((err) => {
    app.log.error(err);
    process.exit(1);
  });
