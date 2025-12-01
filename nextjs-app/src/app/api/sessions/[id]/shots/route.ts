import { NextRequest, NextResponse } from 'next/server';
import { authenticateToken, AuthenticatedRequest } from '@/lib/middleware/auth';
import { getSessionShots } from '@/lib/services/meyton.service';
import { calculateShotAnalysis } from '@/lib/utils/shotAnalysis';
import mysql from 'mysql2/promise';

async function handler(
  req: AuthenticatedRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const sessionId = params.id;

    console.log(`📊 API: Fetching shots for session ${sessionId}`);

    // Get shots from Meyton
    const { shots } = await getSessionShots(sessionId);

    if (!shots || shots.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No shots found for this session'
      }, { status: 404 });
    }

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

    // Calculate analysis
    const analysis = calculateShotAnalysis(shots);
    
    // Use BesterTeiler01 from database if available, otherwise use calculated value
    let bestTeilerFromDb = null;
    if (sessionRows.length > 0 && sessionRows[0].best_teiler_from_db) {
      const parsed = parseFloat(sessionRows[0].best_teiler_from_db) / 10;  // Convert 1751 -> 175.1
      bestTeilerFromDb = !isNaN(parsed) && parsed > 0 ? parsed : null;
    }
    
    if (analysis && bestTeilerFromDb !== null) {
      // Override calculated teiler with database value
      analysis.teiler.best = bestTeilerFromDb;
    }
    
    const session = sessionRows.length > 0 ? {
      id: sessionRows[0].ScheibenID.toString(),
      shooter_name: `${sessionRows[0].Vorname} ${sessionRows[0].Nachname}`,
      discipline: sessionRows[0].discipline,
      date: sessionRows[0].date,
      shots_count: sessionRows[0].shots_count,
      total_score: sessionRows[0].total_score, // Normal ring
      total_score_decimal: (sessionRows[0].total_score_decimal / 10).toFixed(1), // Decimal ring
      best_teiler: bestTeilerFromDb ? bestTeilerFromDb.toFixed(1) : null
    } : null;

    console.log(`✅ API: Returning ${shots.length} shots with analysis`);

    // Close the pool
    await pool.end();

    return NextResponse.json({
      success: true,
      session,
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

