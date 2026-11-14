import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { ContentAnalytics } from '@/types';

// GET /api/analytics - Get aggregated metrics, charts data, and logs
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const platform = searchParams.get('platform');
  const db = getDb();
  const userId = session.id;

  // 1. Overall Aggregated Totals
  const totals = db.prepare(`
    SELECT 
      COALESCE(SUM(views), 0) as total_views,
      COALESCE(SUM(likes), 0) as total_likes,
      COALESCE(SUM(comments), 0) as total_comments,
      COALESCE(SUM(shares), 0) as total_shares,
      COALESCE(MAX(followers_count), 0) as latest_followers
    FROM content_analytics
    WHERE user_id = ?
  `).get(userId) as {
    total_views: number;
    total_likes: number;
    total_comments: number;
    total_shares: number;
    latest_followers: number;
  };

  // Engagement Rate = (likes + comments + shares) / views * 100
  const totalEngagement = totals.total_likes + totals.total_comments + totals.total_shares;
  const avgEngagementRate = totals.total_views > 0
    ? Number(((totalEngagement / totals.total_views) * 100).toFixed(2))
    : 0;

  // 2. Cross-Platform Comparison
  const platformComparison = db.prepare(`
    SELECT 
      c.platform,
      COALESCE(SUM(a.views), 0) as views,
      COALESCE(SUM(a.likes), 0) as likes,
      COALESCE(SUM(a.comments), 0) as comments,
      COALESCE(SUM(a.shares), 0) as shares,
      COUNT(DISTINCT c.id) as content_count
    FROM contents c
    LEFT JOIN content_analytics a ON c.id = a.content_id
    WHERE c.user_id = ?
    GROUP BY c.platform
  `).all(userId);

  // 3. Top Performing Content Ranking
  const topContent = db.prepare(`
    SELECT 
      c.id, c.title, c.platform, c.category, c.thumbnail_url,
      COALESCE(SUM(a.views), 0) as views,
      COALESCE(SUM(a.likes), 0) as likes,
      COALESCE(SUM(a.comments), 0) as comments,
      COALESCE(SUM(a.shares), 0) as shares
    FROM contents c
    JOIN content_analytics a ON c.id = a.content_id
    WHERE c.user_id = ?
    GROUP BY c.id
    ORDER BY views DESC
    LIMIT 5
  `).all(userId);

  // 4. Timeline / Historical trend
  const timeline = db.prepare(`
    SELECT 
      strftime('%Y-%m-%d', recorded_at) as date,
      SUM(views) as views,
      SUM(likes + comments + shares) as engagement,
      MAX(followers_count) as followers
    FROM content_analytics
    WHERE user_id = ?
    GROUP BY strftime('%Y-%m-%d', recorded_at)
    ORDER BY date ASC
    LIMIT 14
  `).all(userId);

  // 5. Recent Analytics Entry Logs
  const logs = db.prepare(`
    SELECT 
      a.*,
      c.title as content_title,
      c.platform
    FROM content_analytics a
    JOIN contents c ON a.content_id = c.id
    WHERE a.user_id = ?
    ORDER BY a.recorded_at DESC
    LIMIT 20
  `).all(userId) as ContentAnalytics[];

  return NextResponse.json({
    totals: {
      ...totals,
      total_engagement: totalEngagement,
      avg_engagement_rate: avgEngagementRate,
    },
    platformComparison,
    topContent,
    timeline: timeline.length > 0 ? timeline : [
      { date: 'Day 1', views: 0, engagement: 0, followers: 0 },
      { date: 'Day 2', views: 0, engagement: 0, followers: 0 },
      { date: 'Day 3', views: 0, engagement: 0, followers: 0 },
      { date: 'Day 4', views: 0, engagement: 0, followers: 0 },
      { date: 'Day 5', views: 0, engagement: 0, followers: 0 },
    ],
    logs,
  });
}

// POST /api/analytics - Record new metric entry
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { content_id, views, likes, comments, shares, followers_count, recorded_at } = body;

    const contentId = Number(content_id);
    if (!contentId || isNaN(contentId)) {
      return NextResponse.json({ error: 'Valid content ID is required' }, { status: 400 });
    }

    const db = getDb();

    // Verify user owns this content (IDOR protection)
    const content = db.prepare('SELECT id, user_id FROM contents WHERE id = ?').get(contentId) as
      | { id: number; user_id: number }
      | undefined;

    if (!content) {
      return NextResponse.json({ error: 'Content item not found' }, { status: 404 });
    }

    if (content.user_id !== session.id) {
      return NextResponse.json({ error: 'Forbidden: You do not own this content' }, { status: 403 });
    }

    const dateVal = recorded_at || new Date().toISOString();

    const result = db.prepare(`
      INSERT INTO content_analytics (content_id, user_id, views, likes, comments, shares, followers_count, recorded_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      contentId,
      session.id,
      Math.max(0, Number(views) || 0),
      Math.max(0, Number(likes) || 0),
      Math.max(0, Number(comments) || 0),
      Math.max(0, Number(shares) || 0),
      Math.max(0, Number(followers_count) || 0),
      dateVal
    );

    const inserted = db.prepare('SELECT * FROM content_analytics WHERE id = ?').get(result.lastInsertRowid);

    return NextResponse.json({ log: inserted, message: 'Analytics recorded successfully' }, { status: 201 });
  } catch (error: any) {
    console.error('Error logging analytics:', error);
    return NextResponse.json({ error: 'Failed to record analytics' }, { status: 500 });
  }
}
