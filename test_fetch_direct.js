const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

require('dotenv').config({ path: '.env.local' });

async function testFetchDirect() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const tables = ['rental', 'memo', 'contact', 'calendar_event'];

  for (const table of tables) {
    const res = await fetch(`${url}/rest/v1/${table}?select=*&limit=1`, {
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`
      }
    });
    if (!res.ok) {
      const err = await res.text();
      console.log(`Table ${table} check FAILED: ${res.status} ${res.statusText}`, err);
    } else {
      const data = await res.json();
      console.log(`Table ${table} check SUCCESS! Sample rows:`, data.length);
    }
  }
}

testFetchDirect();
