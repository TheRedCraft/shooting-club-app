import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

const JWT_SECRET: string = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

export interface JWTPayload {
  id: number;
  username: string;
  email: string;
  is_admin: boolean;
  is_linked?: boolean;
  shooter_id?: string | null;
}

/**
 * Generate JWT token
 */
export const generateToken = (payload: JWTPayload): string => {
  return jwt.sign(payload, JWT_SECRET as jwt.Secret, { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions);
};

/**
 * Verify JWT token
 */
export const verifyToken = (token: string): JWTPayload | null => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded as JWTPayload;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
};

/**
 * Hash password
 */
export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

/**
 * Compare password
 */
export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

/**
 * Extract token from Authorization header
 */
export const extractToken = (authHeader: string | null): string | null => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.split(' ')[1];
};

