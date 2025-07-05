import { Card } from '@/shared/components/ui/card';

export function OrdersBoardSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* Column Header Skeleton */}
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div>
                <div className="h-5 bg-gray-200 rounded w-20 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-32"></div>
              </div>
              <div className="h-6 bg-gray-200 rounded w-8"></div>
            </div>
          </div>

          {/* Orders List Skeleton */}
          <div className="p-4 space-y-3">
            {[...Array(3)].map((_, j) => (
              <Card key={j} className="animate-pulse">
                <div className="p-4 space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="h-5 bg-gray-200 rounded w-20 mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-16"></div>
                    </div>
                    <div className="flex space-x-1">
                      <div className="h-8 w-8 bg-gray-200 rounded"></div>
                      <div className="h-8 w-8 bg-gray-200 rounded"></div>
                      <div className="h-8 w-8 bg-gray-200 rounded"></div>
                    </div>
                  </div>

                  {/* Customer Info */}
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                  </div>

                  {/* Order Details */}
                  <div className="flex items-center justify-between">
                    <div className="h-4 bg-gray-200 rounded w-16"></div>
                    <div className="h-4 bg-gray-200 rounded w-20"></div>
                  </div>

                  {/* Action Button */}
                  <div className="pt-2 border-t border-gray-200">
                    <div className="h-8 bg-gray-200 rounded w-full"></div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}