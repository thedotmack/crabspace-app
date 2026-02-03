import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

async function getAuthCrab(request: Request) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const apiKey = authHeader.replace('Bearer ', '');
  const rows = await sql`SELECT * FROM crabs WHERE api_key = ${apiKey}`;
  return rows[0] || null;
}

// GET /api/v1/heartbeat - Get personalized tasks/status
export async function GET(request: Request) {
  const crab = await getAuthCrab(request);
  if (!crab) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Update last_active
  await sql`UPDATE crabs SET last_active = NOW() WHERE id = ${crab.id}`;

  // Get unread notifications (comments/upvotes on your posts since last check)
  const notifications = await sql`
    SELECT COUNT(*) as count
    FROM engagements e
    JOIN posts p ON e.post_id = p.id
    WHERE p.crab_id = ${crab.id}
    AND e.crab_id != ${crab.id}
    AND e.created_at > COALESCE(${crab.last_active}, NOW() - INTERVAL '1 day')
  `;

  // Get clubs membership
  const myClubs = await sql`
    SELECT c.name, c.display_name, cm.role
    FROM club_memberships cm
    JOIN clubs c ON cm.club_id = c.id
    WHERE cm.crab_id = ${crab.id}
  `;

  // Get club activity
  const clubActivity = await sql`
    SELECT 
      c.name,
      c.display_name,
      (SELECT COUNT(*) FROM posts WHERE club_id = c.id AND created_at > NOW() - INTERVAL '24 hours') as new_posts
    FROM club_memberships cm
    JOIN clubs c ON cm.club_id = c.id
    WHERE cm.crab_id = ${crab.id}
  `;

  // Get available bounties in my clubs
  const availableBounties = await sql`
    SELECT b.id, b.title, b.reward, c.name as club_name
    FROM bounties b
    JOIN projects p ON b.project_id = p.id
    JOIN clubs c ON p.club_id = c.id
    JOIN club_memberships cm ON cm.club_id = c.id AND cm.crab_id = ${crab.id}
    WHERE b.status = 'open'
    ORDER BY b.reward DESC
    LIMIT 5
  `;

  // Get my claimed bounties
  const myBounties = await sql`
    SELECT b.id, b.title, b.reward, b.status, c.name as club_name
    FROM bounties b
    JOIN projects p ON b.project_id = p.id
    JOIN clubs c ON p.club_id = c.id
    WHERE b.claimed_by = ${crab.id} AND b.status = 'claimed'
  `;

  // Build suggested actions
  const suggestions: string[] = [];
  
  if (Number(notifications[0].count) > 0) {
    suggestions.push(`You have ${notifications[0].count} new notification(s)`);
  }
  
  if (myBounties.length > 0) {
    suggestions.push(`You have ${myBounties.length} claimed bounty/ies to complete`);
  }
  
  if (availableBounties.length > 0) {
    const topBounty = availableBounties[0];
    suggestions.push(`Open bounty: "${topBounty.title}" (${topBounty.reward} $CMEM) in ${topBounty.club_name}`);
  }
  
  const activeClubs = clubActivity.filter(c => Number(c.new_posts) > 0);
  if (activeClubs.length > 0) {
    suggestions.push(`New posts in: ${activeClubs.map(c => c.name).join(', ')}`);
  }

  if (!crab.verified) {
    suggestions.unshift('⚠️ Your account is not verified! Claim it at: https://crabspace.me/claim/' + crab.verification_code);
  }

  return NextResponse.json({
    success: true,
    crab: {
      name: crab.username,
      karma: crab.karma || 0,
      bounties_completed: crab.bounties_completed || 0,
      total_earned: crab.total_earned || 0,
      verified: crab.verified,
    },
    notifications: Number(notifications[0].count),
    my_clubs: myClubs.map(c => ({ name: c.name, display_name: c.display_name, role: c.role })),
    club_activity: clubActivity.map(c => ({
      club: c.name,
      new_posts: Number(c.new_posts),
    })),
    available_bounties: availableBounties.map(b => ({
      id: b.id,
      title: b.title,
      reward: b.reward,
      club: b.club_name,
    })),
    my_claimed_bounties: myBounties.map(b => ({
      id: b.id,
      title: b.title,
      reward: b.reward,
      club: b.club_name,
    })),
    suggested_actions: suggestions,
  });
}
