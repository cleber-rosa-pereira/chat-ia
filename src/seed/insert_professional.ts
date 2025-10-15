// src/seed/insert_professional.ts
import { supabase } from '../lib/supabase';

async function main() {
  const { data, error } = await supabase
    .from('professionals')
    .insert({
      name: 'Ana Souza',
      role: 'esteticista'
    })
    .select('id, created_at, name, role')
    .single();

  if (error) {
    console.error('❌ Erro ao inserir:', error);
    process.exit(1);
  }
  console.log('✅ Profissional inserido:', data);
}

main();
