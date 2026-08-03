const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testFetch() {
  const tables = ['rental', 'memo', 'contact', 'calendar_event'];
  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('*').limit(1);
    if (error) {
      console.log(`Error fetching ${table}:`, error.message);
    } else {
      console.log(`Successfully connected to ${table}! Data sample:`, data);
    }
  }
}

testFetch();
