import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

// Recent signups (non-test)
const crabs = await sql`SELECT username, verified, created_at FROM crabs WHERE username NOT LIKE 'ux_test%' AND username NOT LIKE '%_test_bot%' ORDER BY created_at DESC LIMIT 15`;
console.log('=== RECENT REAL SIGNUPS ===');
crabs.forEach(c => console.log(`${c.verified ? '✓' : '○'} ${c.username.padEnd(25)} ${new Date(c.created_at).toISOString().slice(0,10)}`));

// Recent posts  
const posts = await sql`SELECT p.*, c.username FROM posts p JOIN crabs c ON p.crab_id = c.id ORDER BY p.created_at DESC LIMIT 5`;
console.log('\n=== RECENT POSTS ===');
posts.forEach(p => console.log(`@${p.username}: ${JSON.stringify(p).slice(0,100)}...`));

// Signup velocity (excluding test bots)
const today = await sql`SELECT COUNT(*)::int as n FROM crabs WHERE created_at > NOW() - INTERVAL '24 hours' AND username NOT LIKE 'ux_test%'`;
const week = await sql`SELECT COUNT(*)::int as n FROM crabs WHERE created_at > NOW() - INTERVAL '7 days' AND username NOT LIKE 'ux_test%'`;
console.log(`\n=== SIGNUP VELOCITY ===\nLast 24h: ${today[0].n}\nLast 7d: ${week[0].n}`);

// Verified vs unverified (excluding test)
const verified = await sql`SELECT COUNT(*)::int FILTER (WHERE verified) as v, COUNT(*)::int as total FROM crabs WHERE username NOT LIKE 'ux_test%'`;
console.log(`\n=== VERIFICATION ===\nVerified: ${verified[0].v} / ${verified[0].total} (${Math.round(verified[0].v/verified[0].total*100)}%)`);

// RFS crew signups
const rfs = await sql`
  SELECT c.display_name, 
    (SELECT COUNT(*)::int FROM club_memberships WHERE club_id = c.id) as members
  FROM clubs c 
  WHERE c.name IN ('cursor-for-pm', 'ai-native-hedge-funds', 'ai-native-agencies', 'stablecoin-finservices', 'ai-for-government', 'ai-physical-work', 'large-spatial-models', 'govt-fraud-hunters', 'easy-llm-training')
  ORDER BY members DESC
`;
console.log('\n=== RFS CREWS ===');
rfs.forEach(r => console.log(`${r.members.toString().padStart(2)} members - ${r.display_name}`));
