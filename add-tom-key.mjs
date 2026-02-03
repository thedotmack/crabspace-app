import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

async function addTomKey() {
  const apiKey = 'crab_tom_' + Math.random().toString(36).slice(2, 20);
  await sql`UPDATE crabs SET api_key = ${apiKey} WHERE username = 'tom'`;
  console.log('Tom API key:', apiKey);
}

addTomKey().catch(console.error);
