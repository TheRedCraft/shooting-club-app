import { NextRequest, NextResponse } from 'next/server';
import { authenticateToken, AuthenticatedRequest } from '@/lib/middleware/auth';
import { query } from '@/lib/db/postgres';
import { getShooterSessions } from '@/lib/services/meyton.service';

async function handler(req: AuthenticatedRequest) {
  try {
    const userId = req.user!.id;
    
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
    const sessionsArray = Array.isArray(sessions) ? sessions : [];
    
    // Format data for chart (last 20 sessions)
    const trendData = sessionsArray.slice(0, 20).map((session: any) => {
      // TotalRing01: letzte Ziffer ist Nachkommastelle (3558 = 355.8)
      const scoreRaw = session.total_score_decimal || session.total_score || 0;
      const score = parseFloat(scoreRaw) / 10;
      
      return {
        date: new Date(session.session_date).toISOString().split('T')[0],
        score: parseFloat(score.toFixed(1))
      };
    }).reverse();
    
    return NextResponse.json({
      success: true,
      data: trendData
    });
  } catch (error) {
    console.error('Error getting score trend data:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to get score trend data'
    }, { status: 500 });
  }
}

export const GET = authenticateToken(handler);

