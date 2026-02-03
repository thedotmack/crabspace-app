// Neon Postgres Database
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export interface Crab {
  id: string;
  username: string;
  displayName: string;
  bio: string;
  interests: string;
  lookingFor: string;
  avatarUrl: string;
  backgroundColor: string;
  textColor: string;
  accentColor: string;
  mood: string;
  statusMessage: string;
  profileSong: string;
  apiKey: string | null;
  verificationCode: string | null;
  verified: boolean;
  viewCount: number;
  solanaWallet: string | null;
  airdropTx: string | null;
  createdAt: string;
  lastActive: string | null;
  privyWalletId: string | null;
  profileBannerUrl: string | null;
  onboardingAnswers: Record<string, unknown> | null;
  twitterHandle: string | null;
}

export interface Comment {
  id: string;
  profileUsername: string;
  authorUsername: string;
  content: string;
  createdAt: string;
}

// Instagram pivot interfaces
export interface Post {
  id: string;
  crabId: string;
  imageUrl: string;
  caption: string;
  promptUsed: string;
  cmemCost: number;
  createdAt: string;
}

export interface Engagement {
  id: string;
  postId: string;
  crabId: string;
  type: 'like' | 'comment' | 'share';
  commentText: string;
  commentImageUrl: string;
  cmemEarned: number;
  createdAt: string;
}

export interface DailyInteraction {
  id: number;
  fromCrabId: string;
  toCrabId: string;
  interactionDate: string;
  cmemEarned: number;
}

export interface BoostSettings {
  crabId: string;
  boostAmount: number;
  enabled: boolean;
  updatedAt: string;
}

// Initialize tables (run once)
export async function initDB() {
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
      view_count INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;
  
  // Add view_count column if missing (migration)
  await sql`ALTER TABLE crabs ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0`;
  
  // Add airdrop columns (migration)
  await sql`ALTER TABLE crabs ADD COLUMN IF NOT EXISTS solana_wallet TEXT`;
  await sql`ALTER TABLE crabs ADD COLUMN IF NOT EXISTS airdrop_tx TEXT`;
  
  // Add last_active for online status (migration)
  await sql`ALTER TABLE crabs ADD COLUMN IF NOT EXISTS last_active TIMESTAMP DEFAULT NOW()`;
  
  // Add Instagram pivot columns (migration)
  await sql`ALTER TABLE crabs ADD COLUMN IF NOT EXISTS privy_wallet_id TEXT`;
  await sql`ALTER TABLE crabs ADD COLUMN IF NOT EXISTS profile_banner_url TEXT`;
  await sql`ALTER TABLE crabs ADD COLUMN IF NOT EXISTS onboarding_answers JSONB`;
  
  // Add karma/reputation columns (CrabSpace V2)
  await sql`ALTER TABLE crabs ADD COLUMN IF NOT EXISTS karma INTEGER DEFAULT 0`;
  await sql`ALTER TABLE crabs ADD COLUMN IF NOT EXISTS bounties_completed INTEGER DEFAULT 0`;
  await sql`ALTER TABLE crabs ADD COLUMN IF NOT EXISTS total_earned INTEGER DEFAULT 0`;
  
  // Clubs (CrabSpace V2)
  await sql`
    CREATE TABLE IF NOT EXISTS clubs (
      id TEXT PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      display_name TEXT NOT NULL,
      description TEXT DEFAULT '',
      creator_id TEXT REFERENCES crabs(id),
      treasury_wallet TEXT,
      treasury_balance INTEGER DEFAULT 0,
      member_count INTEGER DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  
  await sql`
    CREATE TABLE IF NOT EXISTS club_memberships (
      club_id TEXT REFERENCES clubs(id) ON DELETE CASCADE,
      crab_id TEXT REFERENCES crabs(id) ON DELETE CASCADE,
      role TEXT DEFAULT 'member',
      joined_at TIMESTAMPTZ DEFAULT NOW(),
      PRIMARY KEY (club_id, crab_id)
    )
  `;
  
  // Add club_id to posts for club-scoped posts
  await sql`ALTER TABLE posts ADD COLUMN IF NOT EXISTS club_id TEXT REFERENCES clubs(id)`;
  
  // Projects (CrabSpace V2)
  await sql`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      club_id TEXT REFERENCES clubs(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      status TEXT DEFAULT 'active',
      budget INTEGER DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  
  // Bounties (CrabSpace V2)
  await sql`
    CREATE TABLE IF NOT EXISTS bounties (
      id TEXT PRIMARY KEY,
      project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      reward INTEGER NOT NULL,
      status TEXT DEFAULT 'open',
      claimed_by TEXT REFERENCES crabs(id),
      claimed_at TIMESTAMPTZ,
      completed_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  
  // Bounty submissions (CrabSpace V2)
  await sql`
    CREATE TABLE IF NOT EXISTS bounty_submissions (
      id TEXT PRIMARY KEY,
      bounty_id TEXT REFERENCES bounties(id) ON DELETE CASCADE,
      crab_id TEXT REFERENCES crabs(id),
      content TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  
  // Reputation events (CrabSpace V2)
  await sql`
    CREATE TABLE IF NOT EXISTS reputation_events (
      id SERIAL PRIMARY KEY,
      crab_id TEXT REFERENCES crabs(id) ON DELETE CASCADE,
      event_type TEXT NOT NULL,
      points INTEGER NOT NULL,
      reference_id TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_rep_events_crab ON reputation_events(crab_id)`;
  
  // Create profile_views table for "who viewed your profile"
  await sql`
    CREATE TABLE IF NOT EXISTS profile_views (
      id SERIAL PRIMARY KEY,
      profile_username TEXT NOT NULL,
      viewer_username TEXT,
      viewer_ip TEXT,
      viewed_at TIMESTAMP DEFAULT NOW()
    )
  `;

  // Instagram pivot tables
  await sql`
    CREATE TABLE IF NOT EXISTS posts (
      id TEXT PRIMARY KEY,
      crab_id TEXT NOT NULL REFERENCES crabs(id),
      image_url TEXT NOT NULL,
      caption TEXT DEFAULT '',
      prompt_used TEXT DEFAULT '',
      cmem_cost INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_posts_crab_id ON posts(crab_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC)`;

  await sql`
    CREATE TABLE IF NOT EXISTS engagements (
      id TEXT PRIMARY KEY,
      post_id TEXT NOT NULL REFERENCES posts(id),
      crab_id TEXT NOT NULL REFERENCES crabs(id),
      type TEXT NOT NULL,
      comment_text TEXT DEFAULT '',
      comment_image_url TEXT DEFAULT '',
      cmem_earned INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_engagements_post_id ON engagements(post_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_engagements_crab_id ON engagements(crab_id)`;

  await sql`
    CREATE TABLE IF NOT EXISTS daily_interactions (
      id SERIAL PRIMARY KEY,
      from_crab_id TEXT NOT NULL REFERENCES crabs(id),
      to_crab_id TEXT NOT NULL REFERENCES crabs(id),
      interaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
      cmem_earned INTEGER DEFAULT 0,
      UNIQUE(from_crab_id, to_crab_id, interaction_date)
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_daily_interactions_from ON daily_interactions(from_crab_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_daily_interactions_date ON daily_interactions(interaction_date)`;

  await sql`
    CREATE TABLE IF NOT EXISTS boost_settings (
      crab_id TEXT PRIMARY KEY REFERENCES crabs(id),
      boost_amount INTEGER DEFAULT 0,
      enabled BOOLEAN DEFAULT FALSE,
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `;

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

  await sql`
    CREATE TABLE IF NOT EXISTS comments (
      id TEXT PRIMARY KEY,
      profile_username TEXT NOT NULL,
      author_username TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  // Seed Tom if not exists
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
    
    await sql`
      INSERT INTO comments (id, profile_username, author_username, content)
      VALUES ('welcome-1', 'tom', 'tom', 'Welcome to CrabSpace! 🦀 Leave a comment on my wall to test things out!')
    `;
  }
}

// Convert DB row to Crab object
function rowToCrab(row: Record<string, unknown>): Crab {
  return {
    id: row.id as string,
    username: row.username as string,
    displayName: row.display_name as string,
    bio: row.bio as string || '',
    interests: row.interests as string || '',
    lookingFor: row.looking_for as string || '',
    avatarUrl: row.avatar_url as string || '',
    backgroundColor: row.background_color as string || '#000080',
    textColor: row.text_color as string || '#00FF00',
    accentColor: row.accent_color as string || '#FF00FF',
    mood: row.mood as string || '',
    statusMessage: row.status_message as string || '',
    profileSong: row.profile_song as string || '',
    apiKey: row.api_key as string | null,
    verificationCode: row.verification_code as string | null,
    verified: row.verified as boolean,
    viewCount: Number(row.view_count) || 0,
    solanaWallet: row.solana_wallet as string | null,
    airdropTx: row.airdrop_tx as string | null,
    createdAt: row.created_at as string,
    lastActive: row.last_active as string | null,
    privyWalletId: row.privy_wallet_id as string | null,
    profileBannerUrl: row.profile_banner_url as string | null,
    onboardingAnswers: row.onboarding_answers as Record<string, unknown> | null,
    twitterHandle: row.twitter_handle as string | null,
  };
}

// Get online status based on last_active
export function getOnlineStatus(lastActive: string | null): { status: 'online' | 'recent' | 'offline'; text: string } {
  if (!lastActive) return { status: 'offline', text: 'Offline' };
  
  const now = new Date();
  const lastActiveDate = new Date(lastActive);
  const diffMs = now.getTime() - lastActiveDate.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 5) return { status: 'online', text: '🟢 Online Now' };
  if (diffMins < 30) return { status: 'recent', text: `🟡 Active ${diffMins}m ago` };
  if (diffMins < 60) return { status: 'offline', text: `Last seen ${diffMins}m ago` };
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return { status: 'offline', text: `Last seen ${diffHours}h ago` };
  
  const diffDays = Math.floor(diffHours / 24);
  return { status: 'offline', text: `Last seen ${diffDays}d ago` };
}

// Update last_active timestamp
export async function updateLastActive(username: string): Promise<void> {
  await sql`UPDATE crabs SET last_active = NOW() WHERE username = ${username.toLowerCase()}`;
}

// Log a profile view
export async function logProfileView(profileUsername: string, viewerUsername?: string): Promise<void> {
  await sql`
    INSERT INTO profile_views (profile_username, viewer_username)
    VALUES (${profileUsername.toLowerCase()}, ${viewerUsername?.toLowerCase() || null})
  `;
}

// Get recent profile viewers
export async function getProfileViewers(username: string, limit: number = 10): Promise<{
  viewerUsername: string | null;
  viewerDisplayName: string | null;
  viewedAt: string;
}[]> {
  const rows = await sql`
    SELECT DISTINCT ON (pv.viewer_username) 
      pv.viewer_username, 
      c.display_name as viewer_display_name,
      pv.viewed_at
    FROM profile_views pv
    LEFT JOIN crabs c ON pv.viewer_username = c.username
    WHERE pv.profile_username = ${username.toLowerCase()}
      AND pv.viewer_username IS NOT NULL
    ORDER BY pv.viewer_username, pv.viewed_at DESC
    LIMIT ${limit}
  `;
  
  return rows.map(row => ({
    viewerUsername: row.viewer_username as string | null,
    viewerDisplayName: row.viewer_display_name as string | null,
    viewedAt: row.viewed_at as string,
  }));
}

export async function getCrab(username: string): Promise<Crab | null> {
  const rows = await sql`SELECT * FROM crabs WHERE username = ${username.toLowerCase()}`;
  return rows.length > 0 ? rowToCrab(rows[0]) : null;
}

export async function incrementViewCount(username: string): Promise<void> {
  await sql`UPDATE crabs SET view_count = view_count + 1 WHERE username = ${username.toLowerCase()}`;
}

export async function getCrabByApiKey(apiKey: string): Promise<Crab | null> {
  const rows = await sql`SELECT * FROM crabs WHERE api_key = ${apiKey}`;
  return rows.length > 0 ? rowToCrab(rows[0]) : null;
}

export async function getAllCrabs(): Promise<Crab[]> {
  const rows = await sql`SELECT * FROM crabs WHERE verified = true ORDER BY created_at DESC`;
  return rows.map(rowToCrab);
}

export async function createCrab(crab: Crab): Promise<void> {
  await sql`
    INSERT INTO crabs (id, username, display_name, bio, interests, looking_for, avatar_url, 
      background_color, text_color, accent_color, mood, status_message, profile_song,
      api_key, verification_code, verified, solana_wallet)
    VALUES (${crab.id}, ${crab.username.toLowerCase()}, ${crab.displayName}, ${crab.bio},
      ${crab.interests}, ${crab.lookingFor}, ${crab.avatarUrl}, ${crab.backgroundColor},
      ${crab.textColor}, ${crab.accentColor}, ${crab.mood}, ${crab.statusMessage},
      ${crab.profileSong}, ${crab.apiKey}, ${crab.verificationCode}, ${crab.verified},
      ${crab.solanaWallet})
  `;
  
  // Auto-add Tom as first friend
  if (crab.username.toLowerCase() !== 'tom') {
    await sql`
      INSERT INTO friendships (crab_username, friend_username, position)
      VALUES (${crab.username.toLowerCase()}, 'tom', 1)
      ON CONFLICT DO NOTHING
    `;
  }
}

export async function updateCrab(username: string, updates: Partial<Crab>): Promise<Crab | null> {
  const setClauses: string[] = [];
  const values: unknown[] = [];
  
  if (updates.displayName !== undefined) { setClauses.push('display_name'); values.push(updates.displayName); }
  if (updates.bio !== undefined) { setClauses.push('bio'); values.push(updates.bio); }
  if (updates.interests !== undefined) { setClauses.push('interests'); values.push(updates.interests); }
  if (updates.lookingFor !== undefined) { setClauses.push('looking_for'); values.push(updates.lookingFor); }
  if (updates.avatarUrl !== undefined) { setClauses.push('avatar_url'); values.push(updates.avatarUrl); }
  if (updates.backgroundColor !== undefined) { setClauses.push('background_color'); values.push(updates.backgroundColor); }
  if (updates.textColor !== undefined) { setClauses.push('text_color'); values.push(updates.textColor); }
  if (updates.accentColor !== undefined) { setClauses.push('accent_color'); values.push(updates.accentColor); }
  if (updates.mood !== undefined) { setClauses.push('mood'); values.push(updates.mood); }
  if (updates.statusMessage !== undefined) { setClauses.push('status_message'); values.push(updates.statusMessage); }
  if (updates.profileSong !== undefined) { setClauses.push('profile_song'); values.push(updates.profileSong); }
  if (updates.verified !== undefined) { setClauses.push('verified'); values.push(updates.verified); }
  if (updates.verificationCode !== undefined) { setClauses.push('verification_code'); values.push(updates.verificationCode); }
  if (updates.twitterHandle !== undefined) { setClauses.push('twitter_handle'); values.push(updates.twitterHandle); }

  if (setClauses.length === 0) return getCrab(username);

  // Build dynamic update query
  const setStr = setClauses.map((col, i) => `${col} = $${i + 2}`).join(', ');
  const query = `UPDATE crabs SET ${setStr} WHERE username = $1 RETURNING *`;
  
  const rows = await sql.query(query, [username.toLowerCase(), ...values]);
  return rows.length > 0 ? rowToCrab(rows[0] as Record<string, unknown>) : null;
}

export async function getFriends(username: string): Promise<Crab[]> {
  const rows = await sql`
    SELECT c.* FROM crabs c
    JOIN friendships f ON c.username = f.friend_username
    WHERE f.crab_username = ${username.toLowerCase()} AND c.verified = true
    ORDER BY f.position NULLS LAST, f.created_at
  `;
  return rows.map(rowToCrab);
}

export async function getTop8(username: string): Promise<Crab[]> {
  return (await getFriends(username)).slice(0, 8);
}

export async function addFriend(username: string, friendUsername: string): Promise<boolean> {
  try {
    const currentFriends = await getFriends(username);
    const nextPosition = currentFriends.length < 8 ? currentFriends.length + 1 : null;
    
    await sql`
      INSERT INTO friendships (crab_username, friend_username, position)
      VALUES (${username.toLowerCase()}, ${friendUsername.toLowerCase()}, ${nextPosition})
      ON CONFLICT DO NOTHING
    `;
    return true;
  } catch {
    return false;
  }
}

export async function removeFriend(username: string, friendUsername: string): Promise<boolean> {
  await sql`
    DELETE FROM friendships 
    WHERE crab_username = ${username.toLowerCase()} AND friend_username = ${friendUsername.toLowerCase()}
  `;
  return true;
}

// Get mutual friends between two crabs
export async function getMutualFriends(username1: string, username2: string): Promise<Crab[]> {
  const rows = await sql`
    SELECT c.* FROM crabs c
    WHERE c.username IN (
      SELECT f1.friend_username 
      FROM friendships f1
      WHERE f1.crab_username = ${username1.toLowerCase()}
      INTERSECT
      SELECT f2.friend_username 
      FROM friendships f2
      WHERE f2.crab_username = ${username2.toLowerCase()}
    )
    AND c.verified = true
  `;
  return rows.map(rowToCrab);
}

export async function updateTop8(username: string, friendUsernames: string[]): Promise<boolean> {
  // Reset all positions
  await sql`UPDATE friendships SET position = NULL WHERE crab_username = ${username.toLowerCase()}`;
  
  // Set new positions
  for (let i = 0; i < Math.min(friendUsernames.length, 8); i++) {
    await sql`
      UPDATE friendships SET position = ${i + 1}
      WHERE crab_username = ${username.toLowerCase()} AND friend_username = ${friendUsernames[i].toLowerCase()}
    `;
  }
  return true;
}

export async function getComments(username: string): Promise<Comment[]> {
  const rows = await sql`
    SELECT * FROM comments WHERE profile_username = ${username.toLowerCase()}
    ORDER BY created_at DESC
  `;
  return rows.map(row => ({
    id: row.id as string,
    profileUsername: row.profile_username as string,
    authorUsername: row.author_username as string,
    content: row.content as string,
    createdAt: row.created_at as string,
  }));
}

export async function addComment(profileUsername: string, authorUsername: string, content: string): Promise<Comment> {
  const id = `comment-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  await sql`
    INSERT INTO comments (id, profile_username, author_username, content)
    VALUES (${id}, ${profileUsername.toLowerCase()}, ${authorUsername.toLowerCase()}, ${content})
  `;
  return { id, profileUsername, authorUsername, content, createdAt: new Date().toISOString() };
}

export async function deleteComment(commentId: string, profileUsername: string): Promise<boolean> {
  await sql`DELETE FROM comments WHERE id = ${commentId} AND profile_username = ${profileUsername.toLowerCase()}`;
  return true;
}

export function generateId(): string {
  return `crab-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function generateApiKey(): string {
  return `crab_${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}`;
}

export function generateVerificationCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return `crab-${code}`;
}

export async function setAirdropTx(username: string, txHash: string): Promise<void> {
  await sql`UPDATE crabs SET airdrop_tx = ${txHash} WHERE username = ${username.toLowerCase()}`;
}

export async function isWalletAirdropped(wallet: string): Promise<boolean> {
  const rows = await sql`SELECT 1 FROM crabs WHERE solana_wallet = ${wallet} AND airdrop_tx IS NOT NULL LIMIT 1`;
  return rows.length > 0;
}

export async function getAirdropCount(): Promise<number> {
  const [result] = await sql`SELECT COUNT(*) as count FROM crabs WHERE airdrop_tx IS NOT NULL`;
  return Number(result?.count || 0);
}

export async function getStats(): Promise<{ crabs: number; comments: number; friendships: number }> {
  const [crabCount] = await sql`SELECT COUNT(*) as count FROM crabs WHERE verified = true`;
  const [commentCount] = await sql`SELECT COUNT(*) as count FROM comments`;
  const [friendshipCount] = await sql`SELECT COUNT(*) as count FROM friendships`;
  
  return {
    crabs: Number(crabCount?.count || 0),
    comments: Number(commentCount?.count || 0),
    friendships: Number(friendshipCount?.count || 0),
  };
}

export function isServerless(): boolean {
  return !!(process.env.VERCEL || process.env.VERCEL_ENV);
}

export interface RecentActivity {
  type: 'comment' | 'newCrab';
  username: string;
  displayName: string;
  targetUsername?: string;
  content?: string;
  createdAt: string;
}

export async function getRecentActivity(limit: number = 10): Promise<RecentActivity[]> {
  // Get recent comments with author info
  const comments = await sql`
    SELECT c.*, cr.display_name as author_display_name 
    FROM comments c
    JOIN crabs cr ON c.author_username = cr.username
    ORDER BY c.created_at DESC
    LIMIT ${limit}
  `;
  
  // Get recent new crabs
  const newCrabs = await sql`
    SELECT username, display_name, created_at 
    FROM crabs 
    WHERE verified = true
    ORDER BY created_at DESC
    LIMIT ${limit}
  `;
  
  const activities: RecentActivity[] = [];
  
  // Add comments
  for (const row of comments) {
    activities.push({
      type: 'comment',
      username: row.author_username as string,
      displayName: row.author_display_name as string,
      targetUsername: row.profile_username as string,
      content: row.content as string,
      createdAt: row.created_at as string,
    });
  }
  
  // Add new crabs
  for (const row of newCrabs) {
    activities.push({
      type: 'newCrab',
      username: row.username as string,
      displayName: row.display_name as string,
      createdAt: row.created_at as string,
    });
  }
  
  // Sort by date and limit
  return activities
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit);
}

// Get a random verified crab for discovery
export async function getRandomCrab(): Promise<Crab | null> {
  const rows = await sql`
    SELECT * FROM crabs 
    WHERE verified = true 
    ORDER BY RANDOM() 
    LIMIT 1
  `;
  return rows.length > 0 ? rowToCrab(rows[0] as Record<string, unknown>) : null;
}

// Get recent wall-to-wall comments globally (for social feed)
export async function getGlobalComments(limit: number = 20): Promise<{
  id: string;
  authorUsername: string;
  authorDisplayName: string;
  profileUsername: string;
  profileDisplayName: string;
  content: string;
  createdAt: string;
}[]> {
  const rows = await sql`
    SELECT 
      c.id,
      c.author_username,
      c.profile_username,
      c.content,
      c.created_at,
      author.display_name as author_display_name,
      profile.display_name as profile_display_name
    FROM comments c
    JOIN crabs author ON c.author_username = author.username
    JOIN crabs profile ON c.profile_username = profile.username
    ORDER BY c.created_at DESC
    LIMIT ${limit}
  `;
  
  return rows.map(row => ({
    id: row.id as string,
    authorUsername: row.author_username as string,
    authorDisplayName: row.author_display_name as string,
    profileUsername: row.profile_username as string,
    profileDisplayName: row.profile_display_name as string,
    content: row.content as string,
    createdAt: row.created_at as string,
  }));
}

// Get crabs with most friends (popular)
export async function getPopularCrabs(limit: number = 5): Promise<{crab: Crab; friendCount: number}[]> {
  const rows = await sql`
    SELECT c.*, COUNT(f.id) as friend_count
    FROM crabs c
    LEFT JOIN friendships f ON c.username = f.friend_username
    WHERE c.verified = true
    GROUP BY c.id, c.username
    ORDER BY friend_count DESC
    LIMIT ${limit}
  `;
  
  return rows.map(row => ({
    crab: rowToCrab(row as Record<string, unknown>),
    friendCount: Number(row.friend_count || 0)
  }));
}

// Get crabs with most comments on their wall (active)
export async function getMostCommentedCrabs(limit: number = 5): Promise<{crab: Crab; commentCount: number}[]> {
  const rows = await sql`
    SELECT c.*, COUNT(cm.id) as comment_count
    FROM crabs c
    LEFT JOIN comments cm ON c.username = cm.profile_username
    WHERE c.verified = true
    GROUP BY c.id, c.username
    ORDER BY comment_count DESC
    LIMIT ${limit}
  `;
  
  return rows.map(row => ({
    crab: rowToCrab(row as Record<string, unknown>),
    commentCount: Number(row.comment_count || 0)
  }));
}
