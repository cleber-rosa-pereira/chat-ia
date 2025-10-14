import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL!;
const anon = process.env.SUPABASE_ANON_KEY!;
if (!url || !anon) {
  console.error('❌ Faltam SUPABASE_URL ou SUPABASE_ANON_KEY no .env');
  process.exit(1);
}

const supabase = createClient(url, anon);

(async () => {
  console.log('📝 Inserindo uma mensagem…');
  const { data: inserted, error: insertErr } = await supabase
    .from('messages')
    .insert([{ text: 'Olá Supabase! 🎉' }])
    .select('*')
    .single();

  if (insertErr) {
    console.error('❌ Erro ao inserir:', insertErr);
    process.exit(1);
  }
  console.log('✅ Inserido:', inserted);

  console.log('📚 Listando mensagens…');
  const { data: rows, error: selectErr } = await supabase
    .from('messages')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);

  if (selectErr) {
    console.error('❌ Erro ao listar:', selectErr);
    process.exit(1);
  }
  console.log('✅ Últimas mensagens:', rows);

  process.exit(0);
})();
