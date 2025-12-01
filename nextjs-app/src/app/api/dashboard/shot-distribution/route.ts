import { NextRequest, NextResponse } from 'next/server';
import { authenticateToken, AuthenticatedRequest } from '@/lib/middleware/auth';
import { query } from '@/lib/db/postgres';
import { getShooterSessions, getSessionDetails } from '@/lib/services/meyton.service';

async function handler(req: AuthenticatedRequest) {
  try {
    const userId = req.user!.id;
    
    console.log(`Getting shot distribution for user ID: ${userId}`);
    
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
    console.log(`Found shooter ID: ${shooterId}`);
    
    if (!user.is_linked && !user.is_admin) {
      console.log('User is not linked to a Meyton shooter');
      return NextResponse.json({
        success: false,
        message: 'User is not linked to a Meyton shooter'
      }, { status: 400 });
    }
    
    if (!shooterId && !user.is_admin) {
      console.log('No shooter ID found and user is not admin');
      return NextResponse.json({
        success: false,
        message: 'User is not linked to a Meyton shooter'
      }, { status: 400 });
    }
    
    // Get sessions from Meyton
    const sessions: any = await getShooterSessions(shooterId);
    const sessionsArray = Array.isArray(sessions) ? sessions : [];
    console.log(`Found ${sessionsArray.length} sessions for shooter`);
    
    if (sessionsArray.length === 0) {
      console.log('No sessions found, returning empty data');
      return NextResponse.json({
        success: true,
        data: []
      });
    }
    
    // Get shot data for the most recent session
    const recentSession: any = sessionsArray[0];
    console.log(`Getting details for most recent session ID: ${recentSession.session_id}`);
    const sessionDetails = await getSessionDetails(recentSession.session_id);
    
    if (!sessionDetails || !sessionDetails.shots || sessionDetails.shots.length === 0) {
      console.log('No shot details found in session, returning empty data');
      return NextResponse.json({
        success: true,
        data: []
      });
    }
    
    console.log(`Found ${sessionDetails.shots.length} shots in the session`);
    
    // Count shots by score
    const distribution: Record<number, number> = {};
    sessionDetails.shots.forEach((shot: any) => {
      // Ring01: letzte Ziffer ist Nachkommastelle (105 = 10.5)
      const scoreRaw = shot.score_decimal || shot.score || 0;
      const scoreValue = parseFloat(scoreRaw) / 10;
      const score = Math.floor(scoreValue);
      
      if (!distribution[score]) {
        distribution[score] = 0;
      }
      distribution[score]++;
    });
    
    // Format data for chart
    const chartData = [];
    for (let i = 10; i >= 0; i--) {
      if (distribution[i]) {
        chartData.push({
          name: i.toString(),
          value: distribution[i]
        });
      }
    }
    
    if (chartData.length === 0) {
      console.log('No distribution data found, returning empty data');
      return NextResponse.json({
        success: true,
        data: []
      });
    }
    
    console.log('Returning shot distribution data:', chartData);
    return NextResponse.json({
      success: true,
      data: chartData
    });
  } catch (error) {
    console.error('Error getting shot distribution data:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to get shot distribution data'
    }, { status: 500 });
  }
}

export const GET = authenticateToken(handler);

