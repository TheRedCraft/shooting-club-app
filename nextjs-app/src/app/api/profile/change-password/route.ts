import { NextResponse } from 'next/server';
import { authenticateToken, AuthenticatedRequest } from '@/lib/middleware/auth';
import { query } from '@/lib/db/postgres';
import { comparePassword, hashPassword } from '@/lib/utils/auth';
import { validatePassword } from '@/lib/utils/passwordValidation';

async function handler(req: AuthenticatedRequest) {
  try {
    const userId = req.user!.id;
    const { currentPassword, newPassword } = await req.json();

    // Validate input
    if (!currentPassword || !newPassword) {
      return NextResponse.json({
        success: false,
        message: 'Current password and new password are required'
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

    // Get user from database
    const userResult = await query(
      'SELECT id, password_hash FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'User not found'
      }, { status: 404 });
    }

    const user = userResult.rows[0];
    const passwordHash = user.password_hash;

    if (!passwordHash) {
      console.error(`No password hash found for user ${userId}`);
      return NextResponse.json({
        success: false,
        message: 'Account configuration error: No password set'
      }, { status: 500 });
    }

    // Verify current password
    console.log(`Verifying password for user ${userId}`);
    const isMatch = await comparePassword(currentPassword, passwordHash);
    console.log(`Password match result: ${isMatch}`);
    
    if (!isMatch) {
      console.warn(`Password verification failed for user ${userId}`);
      return NextResponse.json({
        success: false,
        message: 'Current password is incorrect'
      }, { status: 401 });
    }

    // Hash new password
    const newPasswordHash = await hashPassword(newPassword);

    // Update password
    await query(
      'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
      [newPasswordHash, userId]
    );

    console.log(`✅ User ${userId} changed their password`);

    return NextResponse.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Error changing password:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to change password'
    }, { status: 500 });
  }
}

export const POST = authenticateToken(handler);

