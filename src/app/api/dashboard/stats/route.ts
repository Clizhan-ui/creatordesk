import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { DashboardStats } from '@/types';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = getDb();
  const userId = session.id;

  // 1. Content counts
  const contentCounts = db.prepare(`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN status = 'Published' THEN 1 ELSE 0 END) as published,
      SUM(CASE WHEN status = 'In Production' THEN 1 ELSE 0 END) as in_production
    FROM contents
    WHERE user_id = ?
  `).get(userId) as { total: number; published: number | null; in_production: number | null };

  // 2. Ideas count
  const ideasCount = db.prepare(`
    SELECT COUNT(*) as count FROM content_ideas WHERE user_id = ?
  `).get(userId) as { count: number };

  // 3. Analytics aggregations (total views, likes, comments, shares)
  const analyticsTotals = db.prepare(`
    SELECT 
      COALESCE(SUM(views), 0) as total_views,
      COALESCE(SUM(likes), 0) as total_likes,
      COALESCE(SUM(comments), 0) as total_comments,
      COALESCE(SUM(shares), 0) as total_shares
    FROM content_analytics
    WHERE user_id = ?
  `).get(userId) as {
    total_views: number;
    total_likes: number;
    total_comments: number;
    total_shares: number;
  };

  // 4. Platform breakdown
  const platformRows = db.prepare(`
    SELECT 
      c.platform, 
      COUNT(DISTINCT c.id) as count,
      COALESCE(SUM(a.views), 0) as views
    FROM contents c
    LEFT JOIN content_analytics a ON c.id = a.content_id
    WHERE c.user_id = ?
    GROUP BY c.platform
  `).all(userId) as { platform: string; count: number; views: number }[];

  // 5. Status breakdown
  const statusRows = db.prepare(`
    SELECT status, COUNT(*) as count
    FROM contents
    WHERE user_id = ?
    GROUP BY status
  `).all(userId) as { status: string; count: number }[];

  // 6. Upcoming schedules
  const upcomingSchedules = db.prepare(`
    SELECT * FROM content_plans
    WHERE user_id = ?
    ORDER BY scheduled_at ASC
    LIMIT 5
  `).all(userId);

  // 7. Recent / Top Content Performances
  const recentPerformances = db.prepare(`
    SELECT 
      c.id, c.title, c.platform, c.status, c.published_at,
      COALESCE(a.views, 0) as views,
      COALESCE(a.likes, 0) as likes,
      COALESCE(a.comments, 0) as comments,
      COALESCE(a.shares, 0) as shares
    FROM contents c
    LEFT JOIN (
      SELECT content_id, SUM(views) as views, SUM(likes) as likes, SUM(comments) as comments, SUM(shares) as shares
      FROM content_analytics
      GROUP BY content_id
    ) a ON c.id = a.content_id
    WHERE c.user_id = ?
    ORDER BY views DESC, c.created_at DESC
    LIMIT 5
  `).all(userId);

  // 8. Performance trend (mock/calculated from recorded analytics)
  const trendRows = db.prepare(`
    SELECT 
      strftime('%Y-%m-%d', recorded_at) as date,
      SUM(views) as views,
      SUM(likes + comments + shares) as engagement
    FROM content_analytics
    WHERE user_id = ?
    GROUP BY strftime('%Y-%m-%d', recorded_at)
    ORDER BY date ASC
    LIMIT 7
  `).all(userId) as { date: string; views: number; engagement: number }[];

  const stats: DashboardStats = {
    totalContent: contentCounts.total || 0,
    publishedContent: contentCounts.published || 0,
    inProductionContent: contentCounts.in_production || 0,
    totalIdeas: ideasCount.count || 0,
    totalViews: analyticsTotals.total_views || 0,
    totalLikes: analyticsTotals.total_likes || 0,
    totalComments: analyticsTotals.total_comments || 0,
    totalShares: analyticsTotals.total_shares || 0,
    platformBreakdown: platformRows,
    statusBreakdown: statusRows,
    upcomingSchedules: upcomingSchedules as any,
    recentPerformances: recentPerformances as any,
    performanceTrend: trendRows.length > 0 ? trendRows : [
      { date: 'Mon', views: 0, engagement: 0 },
      { date: 'Tue', views: 0, engagement: 0 },
      { date: 'Wed', views: 0, engagement: 0 },
      { date: 'Thu', views: 0, engagement: 0 },
      { date: 'Fri', views: 0, engagement: 0 },
      { date: 'Sat', views: 0, engagement: 0 },
      { date: 'Sun', views: 0, engagement: 0 },
    ],
  };

  return NextResponse.json({ stats });
}
