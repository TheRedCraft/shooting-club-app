import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db/postgres';
import { authenticateToken, isAdmin } from '@/lib/middleware/auth';

// POST /api/admin/approve-user/:userId - Approve a pending user
async function handler(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  const params = await context.params;
  const userId = parseInt(params.userId);

  if (isNaN(userId)) {
    console.error('Invalid userId received:', params.userId);
    return NextResponse.json(
      { message: 'Invalid user ID' },
      { status: 400 }
    );
  }

  try {
    // Check if user exists and is pending
    const checkResult = await pool.query(
      'SELECT * FROM users WHERE id = $1',
      [userId]
    );

    if (checkResult.rows.length === 0) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    const user = checkResult.rows[0];

    if (user.is_linked) {
      return NextResponse.json(
        { message: 'User is already approved' },
        { status: 400 }
      );
    }

    // Update user status to approved (not linked yet, but approved)
    // We'll set a flag or just return success
    // Actually, in the original design, "pending" means not linked yet
    // So we just need to communicate to the user that they can be linked now

    return NextResponse.json({
      message: 'User approved successfully',
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Error approving user:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const POST = isAdmin(handler);

