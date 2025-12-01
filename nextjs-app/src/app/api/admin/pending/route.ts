import { NextResponse } from 'next/server';
import { isAdmin, AuthenticatedRequest } from '@/lib/middleware/auth';
import { query } from '@/lib/db/postgres';

async function handler(req: AuthenticatedRequest) {
  try {
    // Get all users who are not linked to a Meyton shooter
    // We now store shooter_id directly in users table
    const result = await query(`
      SELECT 
        id, 
        username, 
        email, 
        is_linked,
        created_at
      FROM users
      WHERE is_linked = false AND is_admin = false
      ORDER BY created_at DESC
    `);
    
    console.log('Pending users found:', result.rows.length);
    
    // Return array directly for easier frontend handling
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error getting pending users:', error);
    return NextResponse.json(
      { message: 'Failed to get pending users' },
      { status: 500 }
    );
  }
}

export const GET = isAdmin(handler);

