import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL!;
const key = process.env.SUPABASE_ANON_KEY!; // usando anon no dev
const supabase = createClient(url, key);

async function main() {
  const payload = {
    name: 'Studio Bela Vida',
    business_type: 'estetica',
    niche: 'massagem e skincare',
    years_in_business: 2,
    hours: 'terça a sábado, 11–21h',
    address: 'Av. Central, 123 – Centro',
    map_url: 'https://maps.google.com/?q=Av.+Central,+123',
    website: 'https://studiobelavida.example',
    social_links: { instagram: '@studiobelavida' },
    script_notes: 'Atender com tom gentil; oferecer combo massagem+limpeza.',
    faq: 'Forma de pagamento? Pix e cartão. Pode reagendar até 12h antes.',
  };

  const { data, error } = await supabase
    .from('companies')
    .insert(payload)
    .select('id, created_at, name')
    .single();

  if (error) {
    console.error('❌ Erro ao inserir:', error);
    process.exit(1);
  }
  console.log('✅ Inserido:', data);
}

main();
