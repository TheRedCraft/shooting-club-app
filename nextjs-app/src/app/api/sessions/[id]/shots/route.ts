import { NextRequest, NextResponse } from 'next/server';
import { authenticateToken, AuthenticatedRequest } from '@/lib/middleware/auth';
import { getSessionShots } from '@/lib/services/meyton.service';
import { calculateShotAnalysis } from '@/lib/utils/shotAnalysis';
import { query } from '@/lib/db/postgres';
import mysql from 'mysql2/promise';

async function handler(
  req: AuthenticatedRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const sessionId = params.id;
    const userId = req.user!.id;

    // SECURITY: Validate session ID format (should be numeric)
    if (!sessionId || !/^\d+$/.test(sessionId)) {
      return NextResponse.json({
        success: false,
        message: 'Invalid session ID format'
      }, { status: 400 });
    }

    console.log(`📊 API: Fetching shots for session ${sessionId} (user: ${userId})`);

    // SECURITY: Get user info to verify session ownership
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
    const isAdmin = user.is_admin;
    const shooterId = user.shooter_id;

    // Get session metadata from Scheiben table - create pool directly
    const pool = mysql.createPool({
      host: process.env.MEYTON_DB_HOST,
      port: parseInt(process.env.MEYTON_DB_PORT),
      database: process.env.MEYTON_DB_NAME,
      user: process.env.MEYTON_DB_USER,
      password: process.env.MEYTON_DB_PASSWORD,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });
    
    const [sessionRows]: any = await pool.query(`
      SELECT 
        ScheibenID,
        Nachname,
        Vorname,
        Disziplin as discipline,
        Zeitstempel as date,
        Trefferzahl as shots_count,
        TotalRing as total_score,
        TotalRing01 as total_score_decimal,
        BesterTeiler01 as best_teiler_from_db
      FROM Scheiben
      WHERE ScheibenID = ?
      LIMIT 1
    `, [sessionId]);

    // SECURITY: Verify session ownership (unless user is admin)
    if (sessionRows.length === 0) {
      await pool.end();
      return NextResponse.json({
        success: false,
        message: 'Session not found'
      }, { status: 404 });
    }

    const session = sessionRows[0];
    
    // Admins can access any session, but regular users can only access their own sessions
    if (!isAdmin) {
      if (!shooterId || !user.is_linked) {
        await pool.end();
        return NextResponse.json({
          success: false,
          message: 'User is not linked to a shooter'
        }, { status: 403 });
      }

      // Check if session belongs to this user
      // shooter_id format: "Nachname|Vorname"
      const [expectedLastName, expectedFirstName] = shooterId.split('|');
      const sessionLastName = session.Nachname;
      const sessionFirstName = session.Vorname;

      if (expectedLastName !== sessionLastName || expectedFirstName !== sessionFirstName) {
        await pool.end();
        console.warn(`⚠️  User ${userId} attempted to access session ${sessionId} belonging to ${sessionFirstName} ${sessionLastName}`);
        return NextResponse.json({
          success: false,
          message: 'Access denied. This session does not belong to you.'
        }, { status: 403 });
      }
    }

    // Get shots from Meyton (only after ownership verification)
    const { shots } = await getSessionShots(sessionId);

    if (!shots || shots.length === 0) {
      await pool.end();
      return NextResponse.json({
        success: false,
        message: 'No shots found for this session'
      }, { status: 404 });
    }

    // Calculate analysis
    const analysis = calculateShotAnalysis(shots);
    
    // Use BesterTeiler01 from database if available, otherwise use calculated value
    let bestTeilerFromDb = null;
    if (session.best_teiler_from_db) {
      const parsed = parseFloat(session.best_teiler_from_db) / 10;  // Convert 1751 -> 175.1
      bestTeilerFromDb = !isNaN(parsed) && parsed > 0 ? parsed : null;
    }
    
    if (analysis && bestTeilerFromDb !== null) {
      // Override calculated teiler with database value
      analysis.teiler.best = bestTeilerFromDb;
    }
    
    const sessionData = {
      id: session.ScheibenID.toString(),
      shooter_name: `${session.Vorname} ${session.Nachname}`,
      discipline: session.discipline,
      date: session.date,
      shots_count: session.shots_count,
      total_score: session.total_score, // Normal ring
      total_score_decimal: (session.total_score_decimal / 10).toFixed(1), // Decimal ring
      best_teiler: bestTeilerFromDb ? bestTeilerFromDb.toFixed(1) : null
    };

    console.log(`✅ API: Returning ${shots.length} shots with analysis`);

    // Close the pool
    await pool.end();

    return NextResponse.json({
      success: true,
      session: sessionData,
      shots,
      analysis
    });
  } catch (error) {
    console.error('Error fetching session shots:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch session shots'
    }, { status: 500 });
  }
}

export const GET = authenticateToken(handler);

