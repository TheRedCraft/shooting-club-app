import { NextRequest, NextResponse } from 'next/server';
import { authenticateToken, AuthenticatedRequest } from '@/lib/middleware/auth';
import { query } from '@/lib/db/postgres';
import { getShooterSessions, getSessionShots } from '@/lib/services/meyton.service';
import { calculateShotAnalysis, Shot } from '@/lib/utils/shotAnalysis';

async function handler(req: AuthenticatedRequest) {
  try {
    const userId = req.user!.id;
    const { searchParams } = new URL(req.url);
    const metric = searchParams.get('metric') || 'avgScore'; // avgScore, bestScore, bestTeiler, avgSpread, avgOffset
    const period = searchParams.get('period') || 'monthly'; // daily, weekly, monthly
    const limit = parseInt(searchParams.get('limit') || '12'); // Last N periods
    
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
    
    // Get all sessions from Meyton
    const sessions: any = await getShooterSessions(shooterId);
    const sessionsArray = Array.isArray(sessions) ? sessions : [];
    
    if (sessionsArray.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        metric,
        period
      });
    }
    
    // Group sessions by period
    const groupedData = groupSessionsByPeriod(sessionsArray, period, limit);
    
    // Calculate metrics for each period
    const trendData = await Promise.all(groupedData.map(async group => {
      const periodSessions = group.sessions;
      
      let value = 0;
      let label = group.label;
      
      switch (metric) {
        case 'avgScore':
          // Average score PER SHOT (total rings / total shots)
          let totalRings = 0;
          let totalShotsForScore = 0;
          
          for (const session of periodSessions) {
            const shotsCount = parseInt(session.shots_count) || 0;
            const sessionTotalRings = (session.total_score_decimal || session.total_score) / 10;
            
            if (shotsCount > 0 && sessionTotalRings > 0) {
              totalRings += sessionTotalRings;
              totalShotsForScore += shotsCount;
            }
          }
          
          // Average rings per shot
          value = totalShotsForScore > 0 ? totalRings / totalShotsForScore : 0;
          break;
          
        case 'bestScore':
          // Best score in period
          if (periodSessions.length > 0) {
            value = Math.max(...periodSessions.map((s: any) => 
              (s.total_score_decimal || s.total_score) / 10
            ));
          }
          break;
          
        case 'bestTeiler':
          // Best Teiler in period (lowest value is best)
          const teilerValues = periodSessions
            .map((s: any) => s.best_teiler_raw ? parseFloat(s.best_teiler_raw) / 10 : null)
            .filter((t: any) => t !== null && t > 0);
          
          if (teilerValues.length > 0) {
            value = Math.min(...teilerValues);
          }
          break;
          
        case 'avgSpread':
          // Average spread - weighted by number of shots in each session
          let totalSpreadWeighted = 0;
          let totalShotsForSpread = 0;
          
          for (const session of periodSessions) {
            const shotsCount = parseInt(session.shots_count) || 0;
            if (shotsCount > 0) {
              try {
                const sessionShotsData = await getSessionShots(session.session_id);
                const sessionShots = sessionShotsData?.shots;
                
                if (sessionShots && Array.isArray(sessionShots) && sessionShots.length > 0) {
                  const analysis = calculateShotAnalysis(sessionShots as Shot[]);
                  if (analysis?.spread?.total) {
                    // Gewichteter Durchschnitt: Wert * Anzahl Schüsse
                    totalSpreadWeighted += analysis.spread.total * sessionShots.length;
                    totalShotsForSpread += sessionShots.length;
                  }
                }
              } catch (error) {
                console.error(`Error analyzing session ${session.session_id}:`, error);
              }
            }
          }
          
          if (totalShotsForSpread > 0) {
            value = totalSpreadWeighted / totalShotsForSpread;
          }
          break;
          
        case 'avgOffset':
          // Average offset from center - weighted by number of shots in each session
          let totalOffsetWeighted = 0;
          let totalShotsForOffset = 0;
          
          for (const session of periodSessions) {
            const shotsCount = parseInt(session.shots_count) || 0;
            if (shotsCount > 0) {
              try {
                const sessionShotsData = await getSessionShots(session.session_id);
                const sessionShots = sessionShotsData?.shots;
                
                if (sessionShots && Array.isArray(sessionShots) && sessionShots.length > 0) {
                  const analysis = calculateShotAnalysis(sessionShots as Shot[]);
                  if (analysis?.center?.offset) {
                    // Gewichteter Durchschnitt: Wert * Anzahl Schüsse
                    totalOffsetWeighted += analysis.center.offset * sessionShots.length;
                    totalShotsForOffset += sessionShots.length;
                  }
                }
              } catch (error) {
                console.error(`Error analyzing session ${session.session_id}:`, error);
              }
            }
          }
          
          if (totalShotsForOffset > 0) {
            value = totalOffsetWeighted / totalShotsForOffset;
          }
          break;
          
        default:
          value = 0;
      }
      
      return {
        period: label,
        value: parseFloat(value.toFixed(2)),
        count: periodSessions.length,
        date: group.date
      };
    }));
    
    return NextResponse.json({
      success: true,
      data: trendData,
      metric,
      period,
      totalSessions: sessionsArray.length
    });
  } catch (error) {
    console.error('Error getting trend data:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to get trend data',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

// Helper function to group sessions by period
function groupSessionsByPeriod(sessions: any[], period: string, limit: number) {
  const now = new Date();
  const groups: { [key: string]: { label: string; sessions: any[]; date: Date } } = {};
  
  sessions.forEach((session: any) => {
    const sessionDate = new Date(session.session_date);
    let key = '';
    let label = '';
    let groupDate = new Date(sessionDate);
    
    switch (period) {
      case 'daily':
        key = sessionDate.toISOString().split('T')[0];
        label = sessionDate.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
        break;
        
      case 'weekly':
        const weekStart = new Date(sessionDate);
        weekStart.setDate(sessionDate.getDate() - sessionDate.getDay());
        key = weekStart.toISOString().split('T')[0];
        label = `KW ${getWeekNumber(sessionDate)}`;
        groupDate = weekStart;
        break;
        
      case 'monthly':
        key = `${sessionDate.getFullYear()}-${String(sessionDate.getMonth() + 1).padStart(2, '0')}`;
        label = sessionDate.toLocaleDateString('de-DE', { month: 'short', year: '2-digit' });
        groupDate = new Date(sessionDate.getFullYear(), sessionDate.getMonth(), 1);
        break;
        
      default:
        key = sessionDate.toISOString().split('T')[0];
        label = sessionDate.toLocaleDateString('de-DE');
    }
    
    if (!groups[key]) {
      groups[key] = { label, sessions: [], date: groupDate };
    }
    groups[key].sessions.push(session);
  });
  
  // Sort by date and limit to last N periods
  const sortedGroups = Object.values(groups)
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(-limit);
  
  return sortedGroups;
}

// Helper function to get week number
function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

// Helper function to calculate standard deviation
function calculateStdDev(values: number[]): number {
  if (values.length === 0) return 0;
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  const squareDiffs = values.map(value => Math.pow(value - avg, 2));
  const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / squareDiffs.length;
  return Math.sqrt(avgSquareDiff);
}

export const GET = authenticateToken(handler);

