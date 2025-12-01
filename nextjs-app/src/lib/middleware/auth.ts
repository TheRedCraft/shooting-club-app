import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, extractToken, JWTPayload } from '../utils/auth';

export interface AuthenticatedRequest extends NextRequest {
  user?: JWTPayload;
}

/**
 * Middleware to authenticate JWT token
 */
export const authenticateToken = (handler: (req: AuthenticatedRequest, context?: any) => Promise<NextResponse>) => {
  return async (req: AuthenticatedRequest, context?: any): Promise<NextResponse> => {
    const authHeader = req.headers.get('authorization');
    const token = extractToken(authHeader);
    
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Access denied. No token provided.' },
        { status: 401 }
      );
    }
    
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return NextResponse.json(
        { success: false, message: 'Invalid token' },
        { status: 403 }
      );
    }
    
    req.user = decoded;
    return handler(req, context);
  };
};

/**
 * Middleware to check if user is an admin
 */
export const isAdmin = (handler: (req: AuthenticatedRequest, context?: any) => Promise<NextResponse>) => {
  return authenticateToken(async (req: AuthenticatedRequest, context?: any): Promise<NextResponse> => {
    if (!req.user?.is_admin) {
      return NextResponse.json(
        { success: false, message: 'Access denied. Admin role required.' },
        { status: 403 }
      );
    }
    
    return handler(req, context);
  });
};

/**
 * Middleware to check if user is linked to a Meyton shooter
 */
export const isLinked = (handler: (req: AuthenticatedRequest, context?: any) => Promise<NextResponse>) => {
  return authenticateToken(async (req: AuthenticatedRequest, context?: any): Promise<NextResponse> => {
    if (!req.user?.is_linked && !req.user?.is_admin) {
      return NextResponse.json(
        { success: false, message: 'Access denied. Your account is not linked to a shooter profile.' },
        { status: 403 }
      );
    }
    
    return handler(req, context);
  });
};

