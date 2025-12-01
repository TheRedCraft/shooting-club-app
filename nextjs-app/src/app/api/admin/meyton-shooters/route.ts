import { NextResponse } from 'next/server';
import { isAdmin, AuthenticatedRequest } from '@/lib/middleware/auth';
import { getAllShooters } from '@/lib/services/meyton.service';

async function handler(req: AuthenticatedRequest) {
  try {
    const shooters = await getAllShooters();
    
    // Return array directly
    return NextResponse.json(shooters || []);
  } catch (error) {
    console.error('Error fetching Meyton shooters:', error);
    return NextResponse.json(
      { message: 'Failed to get Meyton shooters. Please check the Meyton database connection.' },
      { status: 500 }
    );
  }
}

export const GET = isAdmin(handler);

