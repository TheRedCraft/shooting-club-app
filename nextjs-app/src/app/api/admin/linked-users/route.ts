import { NextResponse } from 'next/server';
import { isAdmin, AuthenticatedRequest } from '@/lib/middleware/auth';
import { query } from '@/lib/db/postgres';
import { getShooterById } from '@/lib/services/meyton.service';

async function handler(req: AuthenticatedRequest) {
  try {
    // Get all users (both linked and unlinked)
    // We now store shooter_id directly in users table
    const result = await query(`
      SELECT 
        id, 
        username, 
        email, 
        is_admin,
        is_linked,
        shooter_id,
        created_at
      FROM users
      ORDER BY username
    `);

    
    // Get shooter details for linked users
    const users = await Promise.all(result.rows.map(async (user) => {
      let shooter_name = null;
      
      // If user is linked, try to get shooter name from Meyton
      if (user.is_linked && user.shooter_id) {
        try {
          const shooterInfo = await getShooterById(user.shooter_id);
          if (shooterInfo) {
            shooter_name = `${shooterInfo.Firstname || ''} ${shooterInfo.Lastname || ''}`.trim();
          }
        } catch (error) {
          console.error(`Error fetching shooter info for ID ${user.shooter_id}:`, error);
        }
      }
      
      return {
        id: user.id,
        username: user.username,
        email: user.email,
        is_admin: user.is_admin,
        is_linked: user.is_linked,
        shooter_id: user.shooter_id,
        shooter_name: shooter_name,
        created_at: user.created_at
      };
    }));
    
    // Return array directly
    return NextResponse.json(users);
  } catch (error) {
    console.error('Error getting linked users:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to get linked users'
    }, { status: 500 });
  }
}

export const GET = isAdmin(handler);

