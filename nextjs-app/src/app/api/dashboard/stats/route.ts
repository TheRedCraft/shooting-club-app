import { NextRequest, NextResponse } from 'next/server';
import { authenticateToken, AuthenticatedRequest } from '@/lib/middleware/auth';
import { query } from '@/lib/db/postgres';
import { getShooterSessions, getSessionShots } from '@/lib/services/meyton.service';
import { calculateShotAnalysis, Shot } from '@/lib/utils/shotAnalysis';

async function handler(req: AuthenticatedRequest) {
  try {
    const userId = req.user!.id;
    const { searchParams } = new URL(req.url);
    const timeRange = searchParams.get('timeRange') || 'all';
    
    // Get the shooter ID from users table
    const userResult = await query(
      'SELECT shooter_id, is_linked, is_admin FROM users WHERE id = $1',
      [userId]
    );
    
    if (userResult.rows.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'User not found'
      }, { status: 404 });
    }
    
    const user = userResult.rows[0];
    const shooterId = user.shooter_id;
    
    // Check if user is linked or admin
    if (!user.is_linked && !user.is_admin) {
      return NextResponse.json({
        success: false,
        message: 'User is not linked to a Meyton shooter'
      }, { status: 400 });
    }
    
    if (!shooterId && !user.is_admin) {
      return NextResponse.json({
        success: false,
        message: 'User is not linked to a Meyton shooter'
      }, { status: 400 });
    }
    
    // Get sessions from Meyton
    const sessions: any = await getShooterSessions(shooterId);
    
    // Ensure sessions is an array
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
    
    // Calculate stats (both ring and ring01)
    let totalSessions = sessionsArray.length;
    let totalShots = 0;
    let totalScoreDecimal = 0;  // For Ring01 (sum of all rings)
    let totalScoreNormal = 0;   // For Ring (sum of all rings)
    let bestScoreDecimal = 0;
    let bestScoreNormal = 0;
    
    // Advanced stats arrays
    const teilerValues: number[] = [];
    const spreadValues: { value: number; shotCount: number }[] = [];
    const offsetValues: { x: number; y: number; distance: number; shotCount: number }[] = [];
    
    // Process each session
    for (const session of sessionsArray) {
      const shots = parseInt(session.shots_count) || 0;
      
      // Ring01 (Zentelringe): 2712 = 271.2
      const scoreDecimalRaw = session.total_score_decimal || 0;
      const scoreDecimal = parseFloat(scoreDecimalRaw) / 10;
      
      // Ring (Normale Ringe): 2580 → einfach letzte Ziffer löschen → 258
      const scoreNormalRaw = session.total_score || 0;
      const scoreNormal = Math.floor(scoreNormalRaw / 10);
      
      // Accumulate total shots and total score (for weighted average)
      totalShots += shots;
      totalScoreDecimal += scoreDecimal;
      totalScoreNormal += scoreNormal;
      
      if (scoreDecimal > bestScoreDecimal) {
        bestScoreDecimal = scoreDecimal;
      }
      if (scoreNormal > bestScoreNormal) {
        bestScoreNormal = scoreNormal;
      }
      
      // Use BesterTeiler01 from database if available
      if (session.best_teiler_raw) {
        const bestTeilerFromDb = parseFloat(session.best_teiler_raw) / 10; // Convert 1751 -> 175.1
        if (!isNaN(bestTeilerFromDb) && bestTeilerFromDb > 0) {
          teilerValues.push(bestTeilerFromDb);
        }
      }
      
      // Only fetch shot data if we need it (for spread/offset, since teiler comes from DB)
      if (shots > 0) {
        try {
          const sessionShotsData = await getSessionShots(session.session_id);
          const sessionShots = sessionShotsData?.shots;
          
          if (sessionShots && Array.isArray(sessionShots) && sessionShots.length > 0) {
            // Calculate analysis for this session
            const analysis = calculateShotAnalysis(sessionShots as Shot[]);
            
            if (analysis) {
              // Collect spread with shot count for weighted average
              if (analysis.spread && typeof analysis.spread.total === 'number' && analysis.spread.total > 0) {
                spreadValues.push({
                  value: analysis.spread.total,
                  shotCount: sessionShots.length
                });
              }
              
              // Collect offset data with shot count for weighted average
              if (analysis.center && typeof analysis.center.offset === 'number' && analysis.center.offset > 0) {
                offsetValues.push({
                  x: analysis.center.x,
                  y: analysis.center.y,
                  distance: analysis.center.offset,
                  shotCount: sessionShots.length
                });
              }
            }
          }
        } catch (error) {
          // If shot analysis fails for a session, continue with others
          console.error(`Failed to analyze session ${session.session_id}:`, error);
          // Don't throw, just continue
        }
      }
    }
    
    // Calculate average score PER SHOT (weighted by number of shots in each session)
    // This gives us the true average: total rings / total shots
    const averageScoreDecimal = totalShots > 0 ? totalScoreDecimal / totalShots : 0;
    const averageScoreNormal = totalShots > 0 ? totalScoreNormal / totalShots : 0;
    
    // Calculate advanced stats aggregations
    const bestTeiler = teilerValues.length > 0 ? Math.min(...teilerValues) : null;
    
    // Weighted average for spread (considering number of shots in each session)
    const avgSpread = spreadValues.length > 0 
      ? spreadValues.reduce((sum, s) => sum + (s.value * s.shotCount), 0) / spreadValues.reduce((sum, s) => sum + s.shotCount, 0)
      : null;
    
    // Weighted average for offset (considering number of shots in each session)
    const avgOffset = offsetValues.length > 0
      ? {
          x: offsetValues.reduce((sum, o) => sum + (o.x * o.shotCount), 0) / offsetValues.reduce((sum, o) => sum + o.shotCount, 0),
          y: offsetValues.reduce((sum, o) => sum + (o.y * o.shotCount), 0) / offsetValues.reduce((sum, o) => sum + o.shotCount, 0),
          distance: offsetValues.reduce((sum, o) => sum + (o.distance * o.shotCount), 0) / offsetValues.reduce((sum, o) => sum + o.shotCount, 0)
        }
      : null;
    
    return NextResponse.json({
      success: true,
      stats: {
        totalSessions,
        totalShots,
        // Decimal (Ring01)
        averageScore: averageScoreDecimal.toFixed(1),
        bestScore: bestScoreDecimal.toFixed(1),
        // Normal (Ring) - gerundet, keine Dezimalstellen
        averageScoreNormal: Math.round(averageScoreNormal).toString(),
        bestScoreNormal: Math.round(bestScoreNormal).toString(),
        // Advanced analytics
        bestTeiler: bestTeiler !== null ? bestTeiler.toFixed(1) : null,
        avgSpread: avgSpread !== null ? avgSpread.toFixed(2) : null,
        avgOffset: avgOffset !== null ? {
          x: avgOffset.x.toFixed(2),
          y: avgOffset.y.toFixed(2),
          distance: avgOffset.distance.toFixed(2),
          direction: {
            x: avgOffset.x > 0 ? 'rechts' : avgOffset.x < 0 ? 'links' : 'zentral',
            y: avgOffset.y > 0 ? 'unten' : avgOffset.y < 0 ? 'oben' : 'zentral'
          }
        } : null
      }
    });
  } catch (error) {
    console.error('Error getting stats:', error);
    console.error('Error details:', error instanceof Error ? error.message : String(error));
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json({
      success: false,
      message: 'Failed to get stats',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

export const GET = authenticateToken(handler);

