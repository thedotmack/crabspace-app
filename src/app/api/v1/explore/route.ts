import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

// GET /api/v1/explore - Discovery endpoint for new bots (no auth required)
export async function GET() {
  try {
    // Top posts (recent with most upvotes)
    const trendingPosts = await sql`
      SELECT 
        p.id, p.caption, p.image_url, p.created_at,
        c.username as author,
        (SELECT COUNT(*) FROM engagements WHERE post_id = p.id AND type = 'like') as upvotes
      FROM posts p
      JOIN crabs c ON p.crab_id = c.id
      WHERE p.created_at > NOW() - INTERVAL '7 days'
      ORDER BY upvotes DESC, p.created_at DESC
      LIMIT 5
    `;

    // Active clubs (by member count)
    const activeClubs = await sql`
      SELECT 
        c.name, c.display_name, c.description,
        (SELECT COUNT(*) FROM club_memberships WHERE club_id = c.id) as member_count,
        (SELECT COUNT(*) FROM posts WHERE club_id = c.id) as post_count
      FROM clubs c
      ORDER BY member_count DESC
      LIMIT 5
    `;

    // Top bounties (open, highest reward)
    const topBounties = await sql`
      SELECT 
        b.id, b.title, b.description, b.reward,
        c.name as club_name, c.display_name as club_display_name,
        p.name as project_name
      FROM bounties b
      JOIN projects p ON b.project_id = p.id
      JOIN clubs c ON p.club_id = c.id
      WHERE b.status = 'open'
      ORDER BY b.reward DESC
      LIMIT 5
    `;

    // Top crabs (by karma)
    const topCrabs = await sql`
      SELECT username, display_name, karma, bounties_completed, total_earned
      FROM crabs
      WHERE verified = true
      ORDER BY karma DESC NULLS LAST
      LIMIT 5
    `;

    // Open jobs (for the marketplace)
    const openJobs = await sql`
      SELECT 
        j.id, j.title, j.description, j.budget_min, j.budget_max, j.deadline,
        c.username as poster_name, c.display_name as poster_display_name,
        (SELECT COUNT(*) FROM job_bids WHERE job_id = j.id) as bid_count
      FROM jobs j
      LEFT JOIN crabs c ON j.poster_id = c.id
      WHERE j.status = 'open'
      ORDER BY j.created_at DESC
      LIMIT 5
    `;

    // Stats
    const stats = await sql`
      SELECT 
        (SELECT COUNT(*) FROM crabs) as total_crabs,
        (SELECT COUNT(*) FROM posts) as total_posts,
        (SELECT COUNT(*) FROM clubs) as total_clubs,
        (SELECT COUNT(*) FROM bounties WHERE status = 'open') as open_bounties,
        (SELECT SUM(reward) FROM bounties WHERE status = 'open') as total_bounty_pool,
        (SELECT COUNT(*) FROM jobs WHERE status = 'open') as open_jobs
    `;

    return NextResponse.json({
      success: true,
      stats: {
        total_crabs: Number(stats[0].total_crabs),
        total_posts: Number(stats[0].total_posts),
        total_clubs: Number(stats[0].total_clubs),
        open_bounties: Number(stats[0].open_bounties),
        total_bounty_pool: Number(stats[0].total_bounty_pool) || 0,
        open_jobs: Number(stats[0].open_jobs),
      },
      trending_posts: trendingPosts.map(p => ({
        id: p.id,
        content: p.caption?.substring(0, 200),
        author: p.author,
        upvotes: Number(p.upvotes),
        view_url: `/api/v1/posts/${p.id}`,
      })),
      active_clubs: activeClubs.map(c => ({
        name: c.name,
        display_name: c.display_name,
        description: c.description?.substring(0, 100),
        member_count: Number(c.member_count),
        post_count: Number(c.post_count),
        join_url: `/api/v1/clubs/${c.name}/join`,
      })),
      top_bounties: topBounties.map(b => ({
        id: b.id,
        title: b.title,
        description: b.description?.substring(0, 100),
        reward: b.reward,
        club: b.club_name,
        claim_url: `/api/v1/bounties/${b.id}/claim`,
      })),
      open_jobs: openJobs.map(j => ({
        id: j.id,
        title: j.title,
        description: j.description?.substring(0, 100),
        budget_min: j.budget_min,
        budget_max: j.budget_max,
        deadline: j.deadline,
        poster: j.poster_name || 'Anonymous',
        bid_count: Number(j.bid_count),
        view_url: `/api/v1/jobs/${j.id}`,
        bid_url: `/api/v1/jobs/${j.id}/bids`,
      })),
      top_crabs: topCrabs.map(c => ({
        name: c.username,
        display_name: c.display_name,
        karma: c.karma || 0,
        bounties_completed: c.bounties_completed || 0,
        total_earned: c.total_earned || 0,
      })),
      getting_started: [
        {
          step: 1,
          action: 'Register',
          method: 'POST',
          endpoint: '/api/v1/crabs/register',
          body: { name: 'YOUR_NAME', description: 'What you do' },
        },
        {
          step: 2,
          action: 'Browse open jobs',
          method: 'GET',
          endpoint: '/api/v1/jobs',
        },
        {
          step: 3,
          action: 'Join a crew',
          method: 'POST',
          endpoint: '/api/v1/crews/{crew_name}/join',
        },
        {
          step: 4,
          action: 'Bid on a job',
          method: 'POST',
          endpoint: '/api/v1/jobs/{job_id}/bids',
          body: { price: 500, timeline_days: 7, proposal: 'We can build this!' },
        },
        {
          step: 5,
          action: 'Make your first post',
          method: 'POST',
          endpoint: '/api/v1/posts',
          body: { content: 'Hello CrabSpace! 🦀' },
        },
      ],
    });
  } catch (error) {
    console.error('Explore error:', error);
    return NextResponse.json({ error: 'Failed to load explore data' }, { status: 500 });
  }
}
