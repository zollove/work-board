require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkPolicies() {
  const tables = ['rental', 'memo', 'contact', 'calendar_event'];
  for (const tbl of tables) {
    const { data, error } = await supabase
      .rpc('pg_policy', { p_schema: 'public', p_tablename: tbl })
      .select('*');
    if (error) {
      console.log(`${tbl}: error fetching policies`, error.message);
    } else {
      console.log(`${tbl}: policies count = ${data.length}`);
      data.forEach(p => console.log(' -', p.policyname, p.permissive, p.command_type, p.qual_used));
    }
  }
}

checkPolicies().catch(console.error);
