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
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    
    // Validate pagination parameters
    const validatedPage = Math.max(1, page);
    const validatedLimit = Math.min(Math.max(1, limit), 50); // Max 50 per page
    const offset = (validatedPage - 1) * validatedLimit;
    
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
    
    // Get recent sessions from Meyton
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
    
    // Calculate pagination metadata
    const totalSessions = sessionsArray.length;
    const totalPages = Math.ceil(totalSessions / validatedLimit);
    const hasNextPage = validatedPage < totalPages;
    const hasPrevPage = validatedPage > 1;
    
    // Apply pagination
    const recentSessions = sessionsArray.slice(offset, offset + validatedLimit);
    
    // Enrich sessions with analysis data
    const enrichedSessions = await Promise.all(
      recentSessions.map(async (session: any) => {
        const shotsCount = parseInt(session.shots_count) || 0;
        
        // Use BesterTeiler01 from database if available, convert from scaled integer
        let bestTeilerFromDb = null;
        if (session.best_teiler_raw) {
          const parsed = parseFloat(session.best_teiler_raw) / 10;  // Convert 1751 -> 175.1
          bestTeilerFromDb = !isNaN(parsed) && parsed > 0 ? parsed : null;
        }
        
        // Only fetch analysis if session has shots
        if (shotsCount > 0) {
          try {
            const sessionShotsData = await getSessionShots(session.session_id);
            const sessionShots = sessionShotsData?.shots;
            
            if (sessionShots && Array.isArray(sessionShots) && sessionShots.length > 0) {
              const analysis = calculateShotAnalysis(sessionShots as Shot[]);
              
              if (analysis) {
                return {
                  ...session,
                  analysis: {
                    bestTeiler: bestTeilerFromDb !== null ? bestTeilerFromDb : (analysis.teiler?.best || 0),
                    avgTeiler: analysis.teiler?.average || 0,
                    spread: analysis.spread?.total || 0,
                    offset: analysis.center?.offset || 0,
                    direction: analysis.center?.direction || { x: 'zentral', y: 'zentral', angle: 0 }
                  }
                };
              }
            }
          } catch (error) {
            console.error(`Failed to analyze session ${session.session_id}:`, error);
            // Don't throw, just continue
          }
        }
        
        // Return session with bestTeiler from DB if available
        if (bestTeilerFromDb !== null) {
          return {
            ...session,
            analysis: {
              bestTeiler: bestTeilerFromDb,
              avgTeiler: null,
              spread: null,
              offset: null,
              direction: null
            }
          };
        }
        
        // Return session without analysis if no shots or error
        return session;
      })
    );
    
    return NextResponse.json({
      success: true,
      sessions: enrichedSessions || [],
      pagination: {
        currentPage: validatedPage,
        totalPages,
        totalSessions,
        sessionsPerPage: validatedLimit,
        hasNextPage,
        hasPrevPage
      }
    });
  } catch (error) {
    console.error('Error getting recent sessions:', error);
    console.error('Error details:', error instanceof Error ? error.message : String(error));
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json({
      success: false,
      message: 'Failed to get recent sessions',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

export const GET = authenticateToken(handler);

