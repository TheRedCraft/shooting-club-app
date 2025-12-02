import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db/postgres';
import { hashPassword, generateToken } from '@/lib/utils/auth';
import { validatePassword } from '@/lib/utils/passwordValidation';

export async function POST(req: NextRequest) {
  try {
    const { username, email, password } = await req.json();
    
    // Validate input
    if (!username || !email || !password) {
      return NextResponse.json(
        { success: false, message: 'Username, email, and password are required' },
        { status: 400 }
      );
    }

    // SECURITY: Password policy validation
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Password does not meet requirements',
          errors: passwordValidation.errors
        },
        { status: 400 }
      );
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, message: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Username validation (alphanumeric and underscore, 3-20 characters)
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    if (!usernameRegex.test(username)) {
      return NextResponse.json(
        { success: false, message: 'Username must be 3-20 characters and contain only letters, numbers, and underscores' },
        { status: 400 }
      );
    }
    
    // Check if username or email already exists
    const existingUser = await query(
      'SELECT * FROM users WHERE username = $1 OR email = $2',
      [username, email]
    );
    
    if (existingUser.rows.length > 0) {
      return NextResponse.json(
        { success: false, message: 'Username or email already exists' },
        { status: 400 }
      );
    }
    
    // Hash password
    const hashedPassword = await hashPassword(password);
    
    // Create user (not admin, not linked by default)
    const result = await query(
      `INSERT INTO users (
        username, 
        email, 
        password_hash, 
        is_admin, 
        is_linked, 
        created_at, 
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, NOW(), NOW()) 
      RETURNING id, username, email, is_admin, is_linked`,
      [username, email, hashedPassword, false, false]
    );
    
    const user = result.rows[0];
    
    console.log('New user registered:', { 
      id: user.id, 
      username: user.username, 
      email: user.email 
    });
    
    // Generate JWT token
    const token = generateToken({
      id: user.id,
      username: user.username,
      email: user.email,
      is_admin: false,
      is_linked: false,
      shooter_id: null
    });
    
    return NextResponse.json(
      {
        success: true,
        message: 'User registered successfully. Please wait for admin approval.',
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          is_admin: false,
          is_linked: false,
          shooter_id: null
        }
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error registering user:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to register user' },
      { status: 500 }
    );
  }
}

