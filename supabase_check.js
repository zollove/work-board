require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase env vars not set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const tables = ['rental', 'memo', 'contact', 'calendar_event'];
  for (const t of tables) {
    const { data, error, count } = await supabase
      .from(t)
      .select('*', { count: 'exact', head: false })
      .limit(1);
    if (error) {
      console.log(`${t}: ERROR -`, error.message);
    } else {
      console.log(`${t}: OK (sample count ${data.length})`);
    }
  }
}

check().catch(e => console.error(e));
