import { NextResponse } from 'next/server';
import { isAdmin, AuthenticatedRequest } from '@/lib/middleware/auth';
import { query } from '@/lib/db/postgres';
import { getShooterById } from '@/lib/services/meyton.service';

async function handler(req: AuthenticatedRequest) {
  try {
    const { userId, shooterId } = await req.json();
    console.log('Backend received link request:', { userId, shooterId });
    
    if (!userId || !shooterId) {
      return NextResponse.json({
        success: false,
        message: 'User ID and shooter ID are required'
      }, { status: 400 });
    }
    
    // Check if user exists
    const userResult = await query(
      'SELECT id FROM users WHERE id = $1',
      [userId]
    );
    
    if (userResult.rows.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'User not found'
      }, { status: 404 });
    }
    
    // Check if shooter exists in Meyton database
    let shooterName = '';
    try {
      const shooterInfo = await getShooterById(shooterId);
      
      if (!shooterInfo) {
        return NextResponse.json(
          { message: 'Shooter not found in Meyton database' },
          { status: 404 }
        );
      }
      
      shooterName = `${shooterInfo.Firstname} ${shooterInfo.Lastname}`;
      console.log(`✅ Shooter found: ${shooterName}`);
    } catch (error) {
      console.error('Error checking shooter in Meyton database:', error);
      return NextResponse.json(
        { message: 'Failed to verify shooter in Meyton database' },
        { status: 500 }
      );
    }
    
    // Update user: set is_linked = true and shooter_id
    await query(
      'UPDATE users SET is_linked = $1, shooter_id = $2 WHERE id = $3',
      [true, shooterId, userId]
    );
    
    console.log(`✅ User ${userId} successfully linked to shooter ${shooterId} (${shooterName})`);
    
    return NextResponse.json({
      message: 'User linked to Meyton shooter successfully'
    });
  } catch (error) {
    console.error('Error linking user to Meyton shooter:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to link user to Meyton shooter'
    }, { status: 500 });
  }
}

export const POST = isAdmin(handler);

