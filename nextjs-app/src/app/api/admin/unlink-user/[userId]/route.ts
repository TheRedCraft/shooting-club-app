import { NextResponse } from 'next/server';
import { isAdmin, AuthenticatedRequest } from '@/lib/middleware/auth';
import { query } from '@/lib/db/postgres';

async function handler(
  req: AuthenticatedRequest, 
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const params = await context.params;
    const userId = parseInt(params.userId);
    
    if (isNaN(userId)) {
      return NextResponse.json(
        { message: 'Invalid user ID' },
        { status: 400 }
      );
    }
    
    // Check if user exists
    const userResult = await query(
      'SELECT id FROM users WHERE id = $1',
      [userId]
    );
    
    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }
    
    // Unlink user: set is_linked to false and clear shooter_id
    await query(
      'UPDATE users SET is_linked = false, shooter_id = NULL WHERE id = $1',
      [userId]
    );
    
    console.log(`User ${userId} unlinked successfully`);
    
    return NextResponse.json({
      message: 'User unlinked from Meyton shooter successfully'
    });
  } catch (error) {
    console.error('Error unlinking user from Meyton shooter:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to unlink user from Meyton shooter'
    }, { status: 500 });
  }
}

export const POST = isAdmin(handler);

