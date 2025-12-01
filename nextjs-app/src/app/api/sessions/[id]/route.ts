import { NextResponse } from 'next/server';
import { authenticateToken, AuthenticatedRequest } from '@/lib/middleware/auth';
import { getSessionDetails } from '@/lib/services/meyton.service';

async function handler(req: AuthenticatedRequest, { params }: { params: { id: string } }) {
  try {
    const sessionId = params.id;
    
    // Get session details from Meyton
    const sessionDetails = await getSessionDetails(sessionId);
    
    if (!sessionDetails) {
      return NextResponse.json({
        success: false,
        message: 'Session not found'
      }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      session: sessionDetails
    });
  } catch (error) {
    console.error(`Error fetching session ${params.id}:`, error);
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch session details'
    }, { status: 500 });
  }
}

export const GET = authenticateToken(handler);

