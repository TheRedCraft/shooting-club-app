import { NextResponse } from 'next/server';
import { isAdmin, AuthenticatedRequest } from '@/lib/middleware/auth';
import { query } from '@/lib/db/postgres';
import { hashPassword } from '@/lib/utils/auth';
import { validatePassword } from '@/lib/utils/passwordValidation';

async function handler(req: AuthenticatedRequest) {
  try {
    const { userId, newPassword } = await req.json();

    // Validate input
    if (!userId || !newPassword) {
      return NextResponse.json({
        success: false,
        message: 'User ID and new password are required'
      }, { status: 400 });
    }

    // SECURITY: Validate new password policy
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      return NextResponse.json({
        success: false,
        message: 'New password does not meet requirements',
        errors: passwordValidation.errors
      }, { status: 400 });
    }

    // SECURITY: Check if this is the super admin (protected from password changes by others)
    const superAdminId = process.env.SUPER_ADMIN_ID;
    if (superAdminId && userId.toString() === superAdminId) {
      console.warn(`⚠️  Admin ${req.user!.id} attempted to change password for Super-Admin ${userId}`);
      return NextResponse.json({
        success: false,
        message: 'The Super-Administrator password cannot be changed by others'
      }, { status: 403 });
    }

    // Check if target user exists
    const userResult = await query(
      'SELECT id, username, email FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'User not found'
      }, { status: 404 });
    }

    const targetUser = userResult.rows[0];

    // Hash new password
    const newPasswordHash = await hashPassword(newPassword);

    // Update password
    await query(
      'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
      [newPasswordHash, userId]
    );

    console.log(`✅ Admin ${req.user!.id} changed password for user ${userId} (${targetUser.username})`);

    return NextResponse.json({
      success: true,
      message: `Password changed successfully for user ${targetUser.username}`
    });
  } catch (error) {
    console.error('Error changing password:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to change password'
    }, { status: 500 });
  }
}

export const POST = isAdmin(handler);

