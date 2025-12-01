import { NextResponse } from 'next/server';
import { isAdmin, AuthenticatedRequest } from '@/lib/middleware/auth';
import { query } from '@/lib/db/postgres';

async function handler(req: AuthenticatedRequest) {
  try {
    const { userId, isAdminStatus } = await req.json();

    if (!userId || typeof isAdminStatus !== 'boolean') {
      return NextResponse.json({
        success: false,
        message: 'User ID and admin status are required'
      }, { status: 400 });
    }

    // Check if this is the super admin (protected from being demoted)
    const superAdminId = process.env.SUPER_ADMIN_ID;
    if (superAdminId && userId.toString() === superAdminId && !isAdminStatus) {
      return NextResponse.json({
        success: false,
        message: 'Der Super-Admin kann nicht degradiert werden'
      }, { status: 403 });
    }

    // Prevent user from removing their own admin status
    if (req.user!.id === userId && !isAdminStatus) {
      return NextResponse.json({
        success: false,
        message: 'Sie können sich nicht selbst das Admin-Recht entziehen'
      }, { status: 403 });
    }

    // Update user admin status
    await query(
      'UPDATE users SET is_admin = $1, updated_at = NOW() WHERE id = $2',
      [isAdminStatus, userId]
    );

    // Get updated user info
    const userResult = await query(
      'SELECT id, username, email, is_admin FROM users WHERE id = $1',
      [userId]
    );

    const action = isAdminStatus ? 'erteilt' : 'entzogen';
    console.log(`✅ Admin-Rechte ${action} für User ${userResult.rows[0].username}`);

    return NextResponse.json({
      success: true,
      message: `Admin-Rechte erfolgreich ${action}`,
      user: userResult.rows[0]
    });
  } catch (error) {
    console.error('Error toggling admin status:', error);
    return NextResponse.json({
      success: false,
      message: 'Fehler beim Ändern der Admin-Rechte'
    }, { status: 500 });
  }
}

export const POST = isAdmin(handler);

