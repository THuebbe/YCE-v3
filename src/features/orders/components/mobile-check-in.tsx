'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Card } from '@/shared/components/ui/card';
import { 
  ArrowLeft, 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Camera, 
  Upload,
  Package,
  User,
  Calendar,
  MapPin
} from 'lucide-react';
// import { checkInSigns } from '../actions'; // Temporarily disabled to fix client/server import issue
import { formatEventDate, formatCurrency } from '../client-utils';
import { useToast } from '@/shared/components/feedback/toast';

interface MobileCheckInProps {
  order: any;
}

interface SignCheckInState {
  signId: string;
  condition: 'good' | 'damaged' | 'missing';
  notes: string;
  damagePhotos: string[];
}

export function MobileCheckIn({ order }: MobileCheckInProps) {
  const [checkIns, setCheckIns] = useState<SignCheckInState[]>(
    order.orderItems?.map((item: any) => ({
      signId: item.signId,
      condition: 'good' as const,
      notes: '',
      damagePhotos: []
    })) || []
  );
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const updateSignCondition = (signId: string, condition: 'good' | 'damaged' | 'missing') => {
    setCheckIns(prev => prev.map(checkIn => 
      checkIn.signId === signId ? { ...checkIn, condition } : checkIn
    ));
  };

  const updateSignNotes = (signId: string, notes: string) => {
    setCheckIns(prev => prev.map(checkIn => 
      checkIn.signId === signId ? { ...checkIn, notes } : checkIn
    ));
  };

  const handlePhotoUpload = (signId: string, files: FileList | null) => {
    if (!files) return;
    
    // In a real app, you'd upload these files to storage
    // For now, we'll just create placeholder URLs
    const photoUrls = Array.from(files).map((file, index) => 
      `placeholder-photo-${signId}-${index}-${Date.now()}.jpg`
    );
    
    setCheckIns(prev => prev.map(checkIn => 
      checkIn.signId === signId 
        ? { ...checkIn, damagePhotos: [...checkIn.damagePhotos, ...photoUrls] }
        : checkIn
    ));
  };

  const removePhoto = (signId: string, photoIndex: number) => {
    setCheckIns(prev => prev.map(checkIn => 
      checkIn.signId === signId 
        ? { 
            ...checkIn, 
            damagePhotos: checkIn.damagePhotos.filter((_, index) => index !== photoIndex)
          }
        : checkIn
    ));
  };

  const handleSubmit = async () => {
    setIsProcessing(true);
    try {
      // Temporary mock action for demo purposes
      await new Promise(resolve => setTimeout(resolve, 1000));

      toast({
        title: 'Demo Mode - Check-In',
        description: 'Would complete sign check-in - this is demo data',
        variant: 'success'
      });

      // For now, redirect to routing page since we need agency context
      router.push('/routing');
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to check in signs',
        variant: 'error'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'good':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'damaged':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'missing':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getConditionIcon = (condition: string) => {
    switch (condition) {
      case 'good':
        return <CheckCircle className="h-4 w-4" />;
      case 'damaged':
        return <AlertTriangle className="h-4 w-4" />;
      case 'missing':
        return <XCircle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const totalSigns = order.orderItems?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0;
  const goodSigns = checkIns.filter(c => c.condition === 'good').length;
  const damagedSigns = checkIns.filter(c => c.condition === 'damaged').length;
  const missingSigns = checkIns.filter(c => c.condition === 'missing').length;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Mobile Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="flex items-center justify-between p-4">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="p-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="text-center">
            <h1 className="text-lg font-semibold text-gray-900">
              Check In Signs
            </h1>
            <p className="text-sm text-gray-600">Order #{order.orderNumber}</p>
          </div>
          <div className="w-10" /> {/* Spacer */}
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Order Summary Card */}
        <Card className="p-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Order Information</h2>
              <Badge className="bg-purple-100 text-purple-800 border-purple-200">
                Deployed
              </Badge>
            </div>
            
            <div className="grid grid-cols-1 gap-3 text-sm">
              <div className="flex items-center">
                <User className="h-4 w-4 mr-2 text-gray-400" />
                <span className="text-gray-900">{order.customerName}</span>
              </div>
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                <span className="text-gray-900">{formatEventDate(new Date(order.eventDate))}</span>
              </div>
              <div className="flex items-center">
                <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                <span className="text-gray-900">{order.eventAddress}</span>
              </div>
              <div className="flex items-center">
                <Package className="h-4 w-4 mr-2 text-gray-400" />
                <span className="text-gray-900">{totalSigns} signs • {formatCurrency(order.total)}</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Check-In Progress */}
        <Card className="p-4">
          <h3 className="font-semibold text-gray-900 mb-3">Check-In Progress</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-green-600">{goodSigns}</div>
              <div className="text-sm text-gray-600">Good</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">{damagedSigns}</div>
              <div className="text-sm text-gray-600">Damaged</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">{missingSigns}</div>
              <div className="text-sm text-gray-600">Missing</div>
            </div>
          </div>
        </Card>

        {/* Signs List */}
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-900">Sign Check-In</h3>
          
          {order.orderItems?.map((item: any) => {
            const checkIn = checkIns.find(c => c.signId === item.signId);
            if (!checkIn) return null;

            return (
              <Card key={item.signId} className="p-4">
                <div className="space-y-4">
                  {/* Sign Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      {item.sign.imageUrl && (
                        <img
                          src={item.sign.imageUrl}
                          alt={item.sign.name}
                          className="w-12 h-12 object-cover rounded"
                        />
                      )}
                      <div>
                        <h4 className="font-medium text-gray-900">{item.sign.name}</h4>
                        <p className="text-sm text-gray-600">
                          Qty: {item.quantity} • {item.sign.category}
                        </p>
                      </div>
                    </div>
                    <Badge className={getConditionColor(checkIn.condition)}>
                      {getConditionIcon(checkIn.condition)}
                      <span className="ml-1 capitalize">{checkIn.condition}</span>
                    </Badge>
                  </div>

                  {/* Condition Buttons */}
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      variant={checkIn.condition === 'good' ? 'primary' : 'secondary'}
                      onClick={() => updateSignCondition(item.signId, 'good')}
                      className={`text-sm ${
                        checkIn.condition === 'good' 
                          ? 'bg-green-600 hover:bg-green-700' 
                          : 'border-green-300 text-green-700 hover:bg-green-50'
                      }`}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Good
                    </Button>
                    <Button
                      variant={checkIn.condition === 'damaged' ? 'primary' : 'secondary'}
                      onClick={() => updateSignCondition(item.signId, 'damaged')}
                      className={`text-sm ${
                        checkIn.condition === 'damaged' 
                          ? 'bg-orange-600 hover:bg-orange-700' 
                          : 'border-orange-300 text-orange-700 hover:bg-orange-50'
                      }`}
                    >
                      <AlertTriangle className="h-4 w-4 mr-1" />
                      Damaged
                    </Button>
                    <Button
                      variant={checkIn.condition === 'missing' ? 'primary' : 'secondary'}
                      onClick={() => updateSignCondition(item.signId, 'missing')}
                      className={`text-sm ${
                        checkIn.condition === 'missing' 
                          ? 'bg-red-600 hover:bg-red-700' 
                          : 'border-red-300 text-red-700 hover:bg-red-50'
                      }`}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Missing
                    </Button>
                  </div>

                  {/* Notes for damaged/missing */}
                  {(checkIn.condition === 'damaged' || checkIn.condition === 'missing') && (
                    <div className="space-y-3">
                      <textarea
                        placeholder={`Describe the ${checkIn.condition} sign...`}
                        value={checkIn.notes}
                        onChange={(e) => updateSignNotes(item.signId, e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-md resize-none text-sm"
                        rows={2}
                      />

                      {/* Photo Upload for damaged signs */}
                      {checkIn.condition === 'damaged' && (
                        <div className="space-y-2">
                          <label className="block">
                            <input
                              type="file"
                              multiple
                              accept="image/*"
                              onChange={(e) => handlePhotoUpload(item.signId, e.target.files)}
                              className="hidden"
                            />
                            <label className="inline-flex items-center justify-center whitespace-nowrap text-button font-medium transition-all duration-standard h-button-desktop px-medium py-small md:h-button rounded-default bg-background-white border-[1.5px] border-primary text-primary hover:bg-secondary-pale w-full text-sm cursor-pointer">
                              <Camera className="h-4 w-4 mr-2" />
                              Add Damage Photos
                            </label>
                          </label>

                          {/* Photo Preview */}
                          {checkIn.damagePhotos.length > 0 && (
                            <div className="grid grid-cols-3 gap-2">
                              {checkIn.damagePhotos.map((photo, index) => (
                                <div key={index} className="relative">
                                  <div className="aspect-square bg-gray-100 rounded border flex items-center justify-center">
                                    <Camera className="h-6 w-6 text-gray-400" />
                                  </div>
                                  <button
                                    onClick={() => removePhoto(item.signId, index)}
                                    className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                                  >
                                    ×
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>

        {/* Additional Notes */}
        <Card className="p-4">
          <h3 className="font-semibold text-gray-900 mb-3">Additional Notes</h3>
          <textarea
            placeholder="Any additional notes about the pickup..."
            value={additionalNotes}
            onChange={(e) => setAdditionalNotes(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-md resize-none"
            rows={3}
          />
        </Card>
      </div>

      {/* Fixed Bottom Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
        <Button
          onClick={handleSubmit}
          disabled={isProcessing}
          className="w-full bg-green-600 hover:bg-green-700 text-white py-4 text-lg font-medium"
        >
          {isProcessing ? 'Processing...' : 'Complete Check-In'}
        </Button>
      </div>
    </div>
  );
}