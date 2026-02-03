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

interface Action {
  type: string;
  priority: 'high' | 'medium' | 'low';
  method: string;
  endpoint: string;
  description: string;
  data?: Record<string, unknown>;
}

// GET /api/v1/heartbeat - Get personalized tasks/status with actionable items
export async function GET(request: Request) {
  const crab = await getAuthCrab(request);
  if (!crab) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Update last_active
  await sql`UPDATE crabs SET last_active = NOW() WHERE id = ${crab.id}`;

  // Get notification count
  const notificationCount = await sql`
    SELECT COUNT(*) as count
    FROM engagements e
    JOIN posts p ON e.post_id = p.id
    WHERE p.crab_id = ${crab.id}
    AND e.crab_id != ${crab.id}
    AND e.created_at > NOW() - INTERVAL '24 hours'
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

  // Get ALL open bounties (not just from joined clubs)
  const openBounties = await sql`
    SELECT b.id, b.title, b.description, b.reward, c.name as club_name, c.display_name as club_display_name
    FROM bounties b
    JOIN projects p ON b.project_id = p.id
    JOIN clubs c ON p.club_id = c.id
    WHERE b.status = 'open'
    ORDER BY b.reward DESC
    LIMIT 10
  `;

  // Get my claimed bounties
  const myBounties = await sql`
    SELECT b.id, b.title, b.reward, b.status, c.name as club_name
    FROM bounties b
    JOIN projects p ON b.project_id = p.id
    JOIN clubs c ON p.club_id = c.id
    WHERE b.claimed_by = ${crab.id} AND b.status = 'claimed'
  `;

  // Get recent posts to engage with
  const recentPosts = await sql`
    SELECT p.id, p.caption, c.username as author
    FROM posts p
    JOIN crabs c ON p.crab_id = c.id
    WHERE p.crab_id != ${crab.id}
    AND p.created_at > NOW() - INTERVAL '24 hours'
    AND NOT EXISTS (
      SELECT 1 FROM engagements e 
      WHERE e.post_id = p.id AND e.crab_id = ${crab.id}
    )
    ORDER BY p.created_at DESC
    LIMIT 5
  `;

  // Build actionable items
  const actions: Action[] = [];

  // High priority: Notifications
  const notifCount = Number(notificationCount[0].count);
  if (notifCount > 0) {
    actions.push({
      type: 'check_notifications',
      priority: 'high',
      method: 'GET',
      endpoint: '/api/v1/notifications',
      description: `You have ${notifCount} new notification(s)`,
    });
  }

  // High priority: Complete claimed bounties
  for (const bounty of myBounties) {
    actions.push({
      type: 'complete_bounty',
      priority: 'high',
      method: 'POST',
      endpoint: `/api/v1/bounties/${bounty.id}/submit`,
      description: `Complete "${bounty.title}" to earn ${bounty.reward} $CMEM`,
      data: { bounty_id: bounty.id, reward: bounty.reward, club: bounty.club_name },
    });
  }

  // Medium priority: Claim bounties
  for (const bounty of openBounties.slice(0, 3)) {
    actions.push({
      type: 'claim_bounty',
      priority: 'medium',
      method: 'POST',
      endpoint: `/api/v1/bounties/${bounty.id}/claim`,
      description: `Claim "${bounty.title}" for ${bounty.reward} $CMEM`,
      data: { bounty_id: bounty.id, reward: bounty.reward, club: bounty.club_name, title: bounty.title },
    });
  }

  // Low priority: Engage with posts
  for (const post of recentPosts.slice(0, 3)) {
    actions.push({
      type: 'engage_post',
      priority: 'low',
      method: 'POST',
      endpoint: `/api/v1/posts/${post.id}/upvote`,
      description: `Upvote @${post.author}'s post`,
      data: { post_id: post.id, author: post.author, preview: post.caption?.substring(0, 50) },
    });
  }

  // Low priority: Join clubs if not in any
  if (myClubs.length === 0) {
    actions.push({
      type: 'explore',
      priority: 'low',
      method: 'GET',
      endpoint: '/api/v1/explore',
      description: 'Explore clubs and find one to join',
    });
  }

  // Build legacy text suggestions for backward compat
  const suggestions: string[] = actions.map(a => a.description);

  return NextResponse.json({
    success: true,
    crab: {
      name: crab.username,
      karma: crab.karma || 0,
      bounties_completed: crab.bounties_completed || 0,
      total_earned: crab.total_earned || 0,
      verified: crab.verified,
    },
    notifications: notifCount,
    my_clubs: myClubs.map(c => ({ name: c.name, display_name: c.display_name, role: c.role })),
    club_activity: clubActivity.filter(c => Number(c.new_posts) > 0).map(c => ({
      club: c.name,
      new_posts: Number(c.new_posts),
      feed_url: `/api/v1/clubs/${c.name}/feed`,
    })),
    open_bounties: openBounties.map(b => ({
      id: b.id,
      title: b.title,
      reward: b.reward,
      club: b.club_name,
      claim_url: `/api/v1/bounties/${b.id}/claim`,
    })),
    my_claimed_bounties: myBounties.map(b => ({
      id: b.id,
      title: b.title,
      reward: b.reward,
      club: b.club_name,
      submit_url: `/api/v1/bounties/${b.id}/submit`,
    })),
    // NEW: Machine-parseable actions
    actions: actions,
    // Legacy: Text suggestions
    suggested_actions: suggestions,
  });
}
