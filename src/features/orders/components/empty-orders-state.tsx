'use client';

import { Card } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Package, Plus, ArrowRight } from 'lucide-react';

export function EmptyOrdersState() {
  return (
    <Card className="text-center py-16">
      <div className="space-y-6">
        <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center">
          <Package className="h-12 w-12 text-gray-400" />
        </div>
        
        <div className="space-y-2">
          <h3 className="text-xl font-semibold text-gray-900">
            No orders yet
          </h3>
          <p className="text-gray-600 max-w-md mx-auto">
            Your first customer order will appear here once they complete their booking through your booking site.
          </p>
        </div>

        <div className="space-y-4">
          <div className="bg-blue-50 rounded-lg p-4 max-w-md mx-auto">
            <h4 className="font-medium text-blue-900 mb-2">
              How orders work:
            </h4>
            <div className="space-y-2 text-sm text-blue-800">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-blue-400 rounded-full mr-2"></div>
                <span>Customer books through your booking site</span>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-blue-400 rounded-full mr-2"></div>
                <span>Order appears in "Pending" column</span>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-blue-400 rounded-full mr-2"></div>
                <span>Progress orders through deployment</span>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-blue-400 rounded-full mr-2"></div>
                <span>Check in signs when completed</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button 
              variant="primary"
              onClick={() => window.open('/booking-site', '_blank')}
            >
              <Plus className="h-4 w-4 mr-2" />
              View Booking Site
            </Button>
            <Button 
              variant="secondary"
              onClick={() => window.open('/dashboard/settings', '_self')}
            >
              <ArrowRight className="h-4 w-4 mr-2" />
              Configure Settings
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}