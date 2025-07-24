import { NextRequest, NextResponse } from 'next/server';
import { InventoryService } from '@/features/booking/services/inventory';

/**
 * Cron job endpoint to clean up expired inventory holds
 * This should be called periodically (e.g., every 15 minutes) by a cron service
 * 
 * In production, this would be triggered by:
 * - Vercel Cron Jobs
 * - External cron service (GitHub Actions, etc.)
 * - Database triggers
 */
export async function GET(request: NextRequest) {
  try {
    // Verify the request is from a trusted source
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || 'dev-secret';
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('🧹 Starting expired holds cleanup...');
    
    const inventoryService = new InventoryService();
    const cleanedCount = await inventoryService.cleanupExpiredHolds();
    
    const response = {
      success: true,
      cleanedCount,
      timestamp: new Date().toISOString(),
      message: `Cleaned up ${cleanedCount} expired holds`
    };

    console.log('✅ Expired holds cleanup completed:', response);
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('❌ Error in expired holds cleanup:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to clean up expired holds',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

/**
 * Alternative POST endpoint for manual cleanup triggers
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Verify admin access for manual triggers
    if (body.adminKey !== process.env.ADMIN_SECRET) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('🧹 Manual expired holds cleanup triggered...');
    
    const inventoryService = new InventoryService();
    const cleanedCount = await inventoryService.cleanupExpiredHolds();
    
    const response = {
      success: true,
      cleanedCount,
      timestamp: new Date().toISOString(),
      message: `Manually cleaned up ${cleanedCount} expired holds`,
      triggeredBy: 'admin'
    };

    console.log('✅ Manual expired holds cleanup completed:', response);
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('❌ Error in manual expired holds cleanup:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to clean up expired holds',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}