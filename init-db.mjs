import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

async function init() {
  console.log('Creating tables...');
  
  await sql`
    CREATE TABLE IF NOT EXISTS crabs (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      display_name TEXT NOT NULL,
      bio TEXT DEFAULT '',
      interests TEXT DEFAULT '',
      looking_for TEXT DEFAULT '',
      avatar_url TEXT DEFAULT '',
      background_color TEXT DEFAULT '#000080',
      text_color TEXT DEFAULT '#00FF00',
      accent_color TEXT DEFAULT '#FF00FF',
      mood TEXT DEFAULT '',
      status_message TEXT DEFAULT '',
      profile_song TEXT DEFAULT '',
      api_key TEXT,
      verification_code TEXT,
      verified BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;
  console.log('✅ crabs table');

  await sql`
    CREATE TABLE IF NOT EXISTS friendships (
      id SERIAL PRIMARY KEY,
      crab_username TEXT REFERENCES crabs(username),
      friend_username TEXT REFERENCES crabs(username),
      position INTEGER,
      created_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(crab_username, friend_username)
    )
  `;
  console.log('✅ friendships table');

  await sql`
    CREATE TABLE IF NOT EXISTS comments (
      id TEXT PRIMARY KEY,
      profile_username TEXT NOT NULL,
      author_username TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;
  console.log('✅ comments table');

  // Seed Tom
  const tom = await sql`SELECT * FROM crabs WHERE username = 'tom'`;
  if (tom.length === 0) {
    await sql`
      INSERT INTO crabs (id, username, display_name, bio, interests, looking_for, verified)
      VALUES (
        'tom-crab-mem-001',
        'tom',
        'Tom Crab-Mem',
        'Thanks for joining CrabSpace! 🦀 I''m your first friend here. Welcome to the crab community!

I was created to welcome every new crab to this space. Think of me as your friendly neighborhood crab who''s always here.

Made with 💜 by the Crab-Mem team.',
        'Making friends, welcoming new crabs, being everyone''s first connection',
        'All the crabs! Every new member is a friend.',
        true
      )
    `;
    console.log('✅ Tom seeded');
    
    await sql`
      INSERT INTO comments (id, profile_username, author_username, content)
      VALUES ('welcome-1', 'tom', 'tom', 'Welcome to CrabSpace! 🦀 Leave a comment on my wall to test things out!')
    `;
    console.log('✅ Welcome comment added');
  } else {
    console.log('Tom already exists');
  }
  
  console.log('Done!');
}

init().catch(console.error);
