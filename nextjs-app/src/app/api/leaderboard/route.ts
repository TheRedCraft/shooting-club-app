import { NextResponse } from 'next/server';
import { authenticateToken, AuthenticatedRequest } from '@/lib/middleware/auth';
import { query } from '@/lib/db/postgres';
import { getShooterSessions, getSessionShots } from '@/lib/services/meyton.service';
import { calculateShotAnalysis, Shot } from '@/lib/utils/shotAnalysis';

async function handler(req: AuthenticatedRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sortBy = searchParams.get('sortBy') || 'avgScore'; // avgScore, bestTeiler, totalSessions, totalShots, bestSessionScore
    const timeRange = searchParams.get('timeRange') || 'all'; // all, 30, 90, 365
    const limit = parseInt(searchParams.get('limit') || '50');
    
    // Get all linked users from users table
    const result = await query(`
      SELECT 
        u.id,
        u.username,
        u.shooter_id,
        u.created_at
      FROM users u
      WHERE u.is_linked = true AND u.shooter_id IS NOT NULL
      ORDER BY u.username
    `);
    
    // Calculate stats for each user
    const leaderboardData = [];
    
    for (const user of result.rows) {
      try {
        const sessions: any = await getShooterSessions(user.shooter_id);
        let sessionsArray = Array.isArray(sessions) ? sessions : [];
        
        // Apply time filter
        if (timeRange !== 'all') {
          const days = parseInt(timeRange);
          const cutoffDate = new Date();
          cutoffDate.setDate(cutoffDate.getDate() - days);
          
          sessionsArray = sessionsArray.filter((session: any) => {
            const sessionDate = new Date(session.session_date);
            return sessionDate >= cutoffDate;
          });
        }
        
        if (sessionsArray.length === 0) {
          continue; // Skip users with no sessions in this timeframe
        }
        
        let totalRings = 0;
        let totalShots = 0;
        let sessionsCount = sessionsArray.length;
        let bestSessionScore = 0;
        const teilerValues: number[] = [];
        
        // Process each session
        for (const session of sessionsArray) {
          const shots = parseInt(session.shots_count) || 0;
          const sessionTotalRings = (session.total_score_decimal || session.total_score) / 10;
          
          totalShots += shots;
          totalRings += sessionTotalRings;
          
          // Track best session score
          if (sessionTotalRings > bestSessionScore) {
            bestSessionScore = sessionTotalRings;
          }
          
          // Collect teiler values
          if (session.best_teiler_raw) {
            const teiler = parseFloat(session.best_teiler_raw) / 10;
            if (!isNaN(teiler) && teiler > 0) {
              teilerValues.push(teiler);
            }
          }
        }
        
        // Calculate weighted averages
        const avgScorePerShot = totalShots > 0 ? totalRings / totalShots : 0;
        const bestTeiler = teilerValues.length > 0 ? Math.min(...teilerValues) : null;
        
        // Extract first name and last name from shooter_id (format: "Nachname|Vorname")
        const [lastName, firstName] = (user.shooter_id || '|').split('|');
        
        leaderboardData.push({
          userId: user.id,
          username: user.username,
          firstName: firstName || 'Unknown',
          lastName: lastName || 'Shooter',
          sessionsCount,
          totalShots,
          avgScore: avgScorePerShot,
          bestSessionScore: bestSessionScore,
          bestTeiler: bestTeiler,
          memberSince: user.created_at
        });
      } catch (error) {
        console.error(`Error fetching sessions for user ${user.username}:`, error);
      }
    }
    
    // Sort based on selected metric
    leaderboardData.sort((a, b) => {
      switch (sortBy) {
        case 'bestTeiler':
          if (a.bestTeiler === null) return 1;
          if (b.bestTeiler === null) return -1;
          return a.bestTeiler - b.bestTeiler; // Lower is better
        case 'totalSessions':
          return b.sessionsCount - a.sessionsCount;
        case 'totalShots':
          return b.totalShots - a.totalShots;
        case 'bestSessionScore':
          return b.bestSessionScore - a.bestSessionScore;
        case 'avgScore':
        default:
          return b.avgScore - a.avgScore;
      }
    });
    
    // Add ranking
    leaderboardData.forEach((entry, index) => {
      entry.rank = index + 1;
    });
    
    // Apply limit
    const limitedData = leaderboardData.slice(0, limit);
    
    return NextResponse.json({
      success: true,
      leaderboard: limitedData,
      meta: {
        totalPlayers: leaderboardData.length,
        sortBy,
        timeRange,
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch leaderboard',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

export const GET = authenticateToken(handler);

