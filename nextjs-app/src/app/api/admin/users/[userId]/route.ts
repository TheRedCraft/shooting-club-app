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
    
    // SECURITY: Prevent users from deleting themselves
    if (req.user!.id === userId) {
      console.warn(`⚠️  User ${userId} attempted to delete themselves`);
      return NextResponse.json({
        success: false,
        message: 'You cannot delete yourself'
      }, { status: 403 });
    }
    
    // SECURITY: Check if this is the super admin (protected from deletion by others)
    const superAdminId = process.env.SUPER_ADMIN_ID;
    if (superAdminId && userId.toString() === superAdminId) {
      // Only allow the super admin to delete themselves (but they can't due to check above)
      console.warn(`⚠️  Admin ${req.user!.id} attempted to delete Super-Admin ${userId}`);
      return NextResponse.json({
        success: false,
        message: 'The Super-Administrator cannot be deleted by others'
      }, { status: 403 });
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
    
    // Delete user (CASCADE will delete related records)
    await query('DELETE FROM users WHERE id = $1', [userId]);
    
    console.log(`User ${userId} deleted successfully`);
    
    return NextResponse.json({
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to delete user'
    }, { status: 500 });
  }
}

export const DELETE = isAdmin(handler);

