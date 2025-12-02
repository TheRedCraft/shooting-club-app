import { NextResponse } from 'next/server';
import { authenticateToken, AuthenticatedRequest } from '@/lib/middleware/auth';
import { getSessionDetails } from '@/lib/services/meyton.service';
import { query } from '@/lib/db/postgres';
import mysql from 'mysql2/promise';

async function handler(req: AuthenticatedRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const sessionId = resolvedParams.id;
    const userId = req.user!.id;

    // SECURITY: Validate session ID format (should be numeric)
    if (!sessionId || !/^\d+$/.test(sessionId)) {
      return NextResponse.json({
        success: false,
        message: 'Invalid session ID format'
      }, { status: 400 });
    }

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
    
    // Get session details from Meyton
    const sessionDetails = await getSessionDetails(sessionId);
    
    if (!sessionDetails) {
      return NextResponse.json({
        success: false,
        message: 'Session not found'
      }, { status: 404 });
    }

    // SECURITY: Verify session ownership (unless user is admin)
    if (!isAdmin) {
      if (!shooterId || !user.is_linked) {
        return NextResponse.json({
          success: false,
          message: 'User is not linked to a shooter'
        }, { status: 403 });
      }

      // Check if session belongs to this user
      // shooter_id format: "Nachname|Vorname"
      // We need to check the session's shooter name
      // Since getSessionDetails doesn't return shooter name, we need to query it
      const pool = mysql.createPool({
        host: process.env.MEYTON_DB_HOST,
        port: parseInt(process.env.MEYTON_DB_PORT || '3306'),
        database: process.env.MEYTON_DB_NAME,
        user: process.env.MEYTON_DB_USER,
        password: process.env.MEYTON_DB_PASSWORD,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
      });

      const [sessionRows]: any = await pool.query(`
        SELECT Nachname, Vorname
        FROM Scheiben
        WHERE ScheibenID = ?
        LIMIT 1
      `, [sessionId]);

      await pool.end();

      if (sessionRows.length === 0) {
        return NextResponse.json({
          success: false,
          message: 'Session not found'
        }, { status: 404 });
      }

      const [expectedLastName, expectedFirstName] = shooterId.split('|');
      const sessionLastName = sessionRows[0].Nachname;
      const sessionFirstName = sessionRows[0].Vorname;

      if (expectedLastName !== sessionLastName || expectedFirstName !== sessionFirstName) {
        console.warn(`⚠️  User ${userId} attempted to access session ${sessionId} belonging to ${sessionFirstName} ${sessionLastName}`);
        return NextResponse.json({
          success: false,
          message: 'Access denied. This session does not belong to you.'
        }, { status: 403 });
      }
    }
    
    return NextResponse.json({
      success: true,
      session: sessionDetails
    });
  } catch (error) {
    console.error(`Error fetching session ${(await params).id}:`, error);
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch session details'
    }, { status: 500 });
  }
}

export const GET = authenticateToken(handler);

