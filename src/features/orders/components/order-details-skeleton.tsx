import { Card } from '@/shared/components/ui/card';

export function OrderDetailsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-8 h-8 bg-gray-200 rounded"></div>
          <div>
            <div className="h-8 bg-gray-200 rounded w-48 mb-2"></div>
            <div className="flex items-center space-x-2">
              <div className="h-6 bg-gray-200 rounded w-20"></div>
              <div className="h-4 bg-gray-200 rounded w-32"></div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="h-9 bg-gray-200 rounded w-24"></div>
          <div className="h-9 bg-gray-200 rounded w-28"></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Information */}
          <Card>
            <div className="p-6">
              <div className="h-6 bg-gray-200 rounded w-40 mb-4"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center">
                      <div className="w-4 h-4 bg-gray-200 rounded mr-3"></div>
                      <div className="h-4 bg-gray-200 rounded w-32"></div>
                    </div>
                  ))}
                </div>
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center">
                      <div className="w-4 h-4 bg-gray-200 rounded mr-3"></div>
                      <div className="h-4 bg-gray-200 rounded w-40"></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* Order Items */}
          <Card>
            <div className="p-6">
              <div className="h-6 bg-gray-200 rounded w-24 mb-4"></div>
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gray-200 rounded"></div>
                      <div>
                        <div className="h-4 bg-gray-200 rounded w-24 mb-1"></div>
                        <div className="h-3 bg-gray-200 rounded w-16"></div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="h-3 bg-gray-200 rounded w-12 mb-1"></div>
                      <div className="h-4 bg-gray-200 rounded w-16"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Order Activity */}
          <Card>
            <div className="p-6">
              <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
              <div className="space-y-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex items-start space-x-3">
                    <div className="w-5 h-5 bg-gray-200 rounded-full"></div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <div className="h-4 bg-gray-200 rounded w-20"></div>
                        <div className="h-3 bg-gray-200 rounded w-16"></div>
                      </div>
                      <div className="h-4 bg-gray-200 rounded w-48"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Order Summary */}
          <Card>
            <div className="p-6">
              <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex justify-between">
                    <div className="h-4 bg-gray-200 rounded w-20"></div>
                    <div className="h-4 bg-gray-200 rounded w-16"></div>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Actions */}
          <Card>
            <div className="p-6">
              <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
              <div className="space-y-2">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="h-9 bg-gray-200 rounded w-full"></div>
                ))}
              </div>
            </div>
          </Card>

          {/* Documents */}
          <Card>
            <div className="p-6">
              <div className="h-6 bg-gray-200 rounded w-24 mb-4"></div>
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-9 bg-gray-200 rounded w-full"></div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}