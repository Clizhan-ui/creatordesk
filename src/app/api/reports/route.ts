import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getDb } from '@/lib/db';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');
  const platform = searchParams.get('platform');
  const status = searchParams.get('status');

  const db = getDb();
  const userId = session.id;

  let query = `
    SELECT 
      c.id, c.title, c.platform, c.category, c.status, c.published_at, c.created_at,
      COALESCE(a.views, 0) as views,
      COALESCE(a.likes, 0) as likes,
      COALESCE(a.comments, 0) as comments,
      COALESCE(a.shares, 0) as shares,
      COALESCE(a.followers_count, 0) as followers_count
    FROM contents c
    LEFT JOIN (
      SELECT 
        content_id,
        SUM(views) as views,
        SUM(likes) as likes,
        SUM(comments) as comments,
        SUM(shares) as shares,
        MAX(followers_count) as followers_count
      FROM content_analytics
      GROUP BY content_id
    ) a ON c.id = a.content_id
    WHERE c.user_id = ?
  `;
  const params: any[] = [userId];

  if (platform && platform !== 'all') {
    query += ' AND c.platform = ?';
    params.push(platform);
  }

  if (status && status !== 'all') {
    query += ' AND c.status = ?';
    params.push(status);
  }

  if (startDate) {
    query += ' AND DATE(c.created_at) >= DATE(?)';
    params.push(startDate);
  }

  if (endDate) {
    query += ' AND DATE(c.created_at) <= DATE(?)';
    params.push(endDate);
  }

  query += ' ORDER BY views DESC, c.created_at DESC';

  const rows = db.prepare(query).all(...params) as any[];

  // Aggregations
  let totalViews = 0;
  let totalLikes = 0;
  let totalComments = 0;
  let totalShares = 0;
  const platformCounts: Record<string, { count: number; views: number }> = {};
  const statusCounts: Record<string, number> = {};

  rows.forEach((r) => {
    totalViews += r.views;
    totalLikes += r.likes;
    totalComments += r.comments;
    totalShares += r.shares;

    if (!platformCounts[r.platform]) {
      platformCounts[r.platform] = { count: 0, views: 0 };
    }
    platformCounts[r.platform].count++;
    platformCounts[r.platform].views += r.views;

    statusCounts[r.status] = (statusCounts[r.status] || 0) + 1;
  });

  const totalEngagement = totalLikes + totalComments + totalShares;
  const engagementRate = totalViews > 0
    ? Number(((totalEngagement / totalViews) * 100).toFixed(2))
    : 0;

  return NextResponse.json({
    summary: {
      totalContent: rows.length,
      totalViews,
      totalLikes,
      totalComments,
      totalShares,
      totalEngagement,
      engagementRate,
      platformCounts,
      statusCounts,
    },
    items: rows,
    filters: {
      startDate: startDate || null,
      endDate: endDate || null,
      platform: platform || 'all',
      status: status || 'all',
    },
  });
}
