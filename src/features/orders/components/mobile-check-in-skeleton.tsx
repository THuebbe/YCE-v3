import { Card } from '@/shared/components/ui/card';

export function MobileCheckInSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 pb-20 animate-pulse">
      {/* Mobile Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="flex items-center justify-between p-4">
          <div className="w-8 h-8 bg-gray-200 rounded"></div>
          <div className="text-center">
            <div className="h-5 bg-gray-200 rounded w-32 mb-1"></div>
            <div className="h-4 bg-gray-200 rounded w-24"></div>
          </div>
          <div className="w-8" />
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Order Summary Card */}
        <Card className="p-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="h-5 bg-gray-200 rounded w-32"></div>
              <div className="h-6 bg-gray-200 rounded w-20"></div>
            </div>
            
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center">
                  <div className="w-4 h-4 bg-gray-200 rounded mr-2"></div>
                  <div className="h-4 bg-gray-200 rounded flex-1"></div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Check-In Progress */}
        <Card className="p-4">
          <div className="h-5 bg-gray-200 rounded w-32 mb-3"></div>
          <div className="grid grid-cols-3 gap-4 text-center">
            {[...Array(3)].map((_, i) => (
              <div key={i}>
                <div className="h-8 bg-gray-200 rounded w-8 mx-auto mb-1"></div>
                <div className="h-4 bg-gray-200 rounded w-12 mx-auto"></div>
              </div>
            ))}
          </div>
        </Card>

        {/* Signs List */}
        <div className="space-y-4">
          <div className="h-5 bg-gray-200 rounded w-28"></div>
          
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="p-4">
              <div className="space-y-4">
                {/* Sign Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gray-200 rounded"></div>
                    <div>
                      <div className="h-4 bg-gray-200 rounded w-24 mb-1"></div>
                      <div className="h-3 bg-gray-200 rounded w-32"></div>
                    </div>
                  </div>
                  <div className="h-6 bg-gray-200 rounded w-16"></div>
                </div>

                {/* Condition Buttons */}
                <div className="grid grid-cols-3 gap-2">
                  {[...Array(3)].map((_, j) => (
                    <div key={j} className="h-10 bg-gray-200 rounded"></div>
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Additional Notes */}
        <Card className="p-4">
          <div className="h-5 bg-gray-200 rounded w-32 mb-3"></div>
          <div className="h-20 bg-gray-200 rounded w-full"></div>
        </Card>
      </div>

      {/* Fixed Bottom Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
        <div className="h-12 bg-gray-200 rounded w-full"></div>
      </div>
    </div>
  );
}