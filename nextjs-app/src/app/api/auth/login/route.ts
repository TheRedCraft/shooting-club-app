import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db/postgres';
import { comparePassword, generateToken } from '@/lib/utils/auth';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    
    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Email and password are required' },
        { status: 400 }
      );
    }
    
    // Check if user exists
    const result = await query(
      'SELECT * FROM users WHERE email = $1 OR username = $1',
      [email]
    );
    
    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Invalid email or password' },
        { status: 401 }
      );
    }
    
    const user = result.rows[0];
    
    // Check password (support both 'password' and 'password_hash' for migration)
    const passwordHash = user.password_hash || user.password;
    if (!passwordHash) {
      console.error('No password found for user:', user.id);
      return NextResponse.json(
        { success: false, message: 'Account configuration error' },
        { status: 500 }
      );
    }
    
    const isMatch = await comparePassword(password, passwordHash);
    
    if (!isMatch) {
      return NextResponse.json(
        { success: false, message: 'Invalid email or password' },
        { status: 401 }
      );
    }
    
    // Check if user is linked (we store shooter_id directly in users table now)
    const isLinked = !!user.shooter_id && user.is_linked;
    const shooterId = user.shooter_id;
    
    // Generate JWT token with is_admin flag
    const token = generateToken({
      id: user.id,
      username: user.username,
      email: user.email,
      is_admin: user.is_admin,
      is_linked: isLinked,
      shooter_id: shooterId
    });
    
    // Don't send password in response
    delete user.password_hash;
    
    console.log(`User ${user.id} (${user.username}) logged in. Admin: ${user.is_admin}, Linked: ${isLinked}`);
    
    return NextResponse.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        is_admin: user.is_admin,
        is_linked: isLinked,
        shooter_id: shooterId
      }
    });
  } catch (error) {
    console.error('Error logging in:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to log in' },
      { status: 500 }
    );
  }
}

