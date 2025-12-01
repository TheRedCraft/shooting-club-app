import { NextResponse } from 'next/server';
import { authenticateToken, AuthenticatedRequest } from '@/lib/middleware/auth';
import { query } from '@/lib/db/postgres';

async function handler(req: AuthenticatedRequest) {
  try {
    const userId = req.user!.id;
    
    // Get user profile with shooter info
    const result = await query(
      'SELECT id, username, email, is_admin, is_linked, shooter_id, created_at FROM users WHERE id = $1',
      [userId]
    );
    
    if (result.rows.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'User not found'
      }, { status: 404 });
    }
    
    const user = result.rows[0];
    
    // Add shooter info if linked
    if (user.shooter_id) {
      // Extract name from shooter_id (format: "Nachname|Vorname")
      const [lastName, firstName] = user.shooter_id.split('|');
      user.shooter = {
        first_name: firstName || '',
        last_name: lastName || '',
        shooter_id: user.shooter_id
      };
    }
    
    return NextResponse.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch profile'
    }, { status: 500 });
  }
}

export const GET = authenticateToken(handler);

