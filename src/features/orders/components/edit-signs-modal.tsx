'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/shared/components/feedback/modal';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Badge } from '@/shared/components/ui/badge';
import { 
  Package, 
  Plus, 
  Minus, 
  Search, 
  AlertTriangle,
  DollarSign,
  Trash2
} from 'lucide-react';
import { formatCurrency } from '../client-utils';
// import { editOrderSigns } from '../actions'; // Temporarily disabled to fix client/server import issue
import { useToast } from '@/shared/components/feedback/toast';

interface EditSignsModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: any;
}

interface SignEdit {
  signId: string;
  name: string;
  currentQuantity: number;
  newQuantity: number;
  unitPrice: number;
  imageUrl?: string;
  category: string;
}

interface AvailableSign {
  id: string;
  name: string;
  category: string;
  rentalPrice: number;
  imageUrl?: string;
}

export function EditSignsModal({ isOpen, onClose, order }: EditSignsModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [signEdits, setSignEdits] = useState<SignEdit[]>([]);
  const [availableSigns, setAvailableSigns] = useState<AvailableSign[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [reason, setReason] = useState('');
  const [showAddSignsSection, setShowAddSignsSection] = useState(false);
  const { toast } = useToast();

  // Initialize sign edits from order items
  useEffect(() => {
    if (order?.orderItems) {
      const edits: SignEdit[] = order.orderItems.map((item: any) => ({
        signId: item.signId,
        name: item.sign.name,
        currentQuantity: item.quantity,
        newQuantity: item.quantity,
        unitPrice: item.unitPrice,
        imageUrl: item.sign.imageUrl,
        category: item.sign.category
      }));
      setSignEdits(edits);
    }
  }, [order]);

  // Mock available signs - in real app, fetch from API
  useEffect(() => {
    // This would be replaced with actual API call
    const mockSigns: AvailableSign[] = [
      { id: '1', name: 'Happy Birthday', category: 'Birthday', rentalPrice: 2500, imageUrl: '/signs/birthday.jpg' },
      { id: '2', name: 'Graduation Congrats', category: 'Graduation', rentalPrice: 3000, imageUrl: '/signs/graduation.jpg' },
      { id: '3', name: 'Welcome Home', category: 'General', rentalPrice: 2000, imageUrl: '/signs/welcome.jpg' }
    ];
    setAvailableSigns(mockSigns);
  }, []);

  const updateSignQuantity = (signId: string, newQuantity: number) => {
    setSignEdits(prev => prev.map(edit => 
      edit.signId === signId 
        ? { ...edit, newQuantity: Math.max(0, newQuantity) }
        : edit
    ));
  };

  const removeSign = (signId: string) => {
    setSignEdits(prev => prev.map(edit => 
      edit.signId === signId 
        ? { ...edit, newQuantity: 0 }
        : edit
    ));
  };

  const addSign = (sign: AvailableSign) => {
    const existingEdit = signEdits.find(edit => edit.signId === sign.id);
    
    if (existingEdit) {
      // Increase quantity of existing sign
      updateSignQuantity(sign.id, existingEdit.newQuantity + 1);
    } else {
      // Add new sign
      const newEdit: SignEdit = {
        signId: sign.id,
        name: sign.name,
        currentQuantity: 0,
        newQuantity: 1,
        unitPrice: sign.rentalPrice,
        imageUrl: sign.imageUrl,
        category: sign.category
      };
      setSignEdits(prev => [...prev, newEdit]);
    }
  };

  const filteredAvailableSigns = availableSigns.filter(sign =>
    sign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sign.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const calculateChanges = () => {
    const changes = {
      add: [] as { signId: string; quantity: number }[],
      remove: [] as { signId: string; quantity: number }[],
      update: [] as { signId: string; newQuantity: number }[]
    };

    signEdits.forEach(edit => {
      const quantityDiff = edit.newQuantity - edit.currentQuantity;
      
      if (edit.currentQuantity === 0 && edit.newQuantity > 0) {
        // New sign
        changes.add.push({ signId: edit.signId, quantity: edit.newQuantity });
      } else if (edit.currentQuantity > 0 && edit.newQuantity === 0) {
        // Remove sign
        changes.remove.push({ signId: edit.signId, quantity: edit.currentQuantity });
      } else if (quantityDiff !== 0) {
        // Update quantity
        if (quantityDiff > 0) {
          changes.add.push({ signId: edit.signId, quantity: quantityDiff });
        } else {
          changes.remove.push({ signId: edit.signId, quantity: Math.abs(quantityDiff) });
        }
      }
    });

    return changes;
  };

  const calculateNewTotal = () => {
    return signEdits.reduce((total, edit) => 
      total + (edit.newQuantity * edit.unitPrice), 0
    );
  };

  const hasChanges = () => {
    return signEdits.some(edit => edit.newQuantity !== edit.currentQuantity);
  };

  const handleSave = async () => {
    if (!hasChanges()) {
      toast({
        title: 'No Changes',
        description: 'No changes were made to the order',
        variant: 'warning'
      });
      return;
    }

    setIsProcessing(true);
    try {
      const changes = calculateChanges();
      
      // Temporary mock action for demo purposes
      await new Promise(resolve => setTimeout(resolve, 1000));

      toast({
        title: 'Demo Mode - Signs Edit',
        description: 'Would update order signs - this is demo data',
        variant: 'success'
      });

      onClose();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update signs',
        variant: 'error'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const currentTotal = order.total;
  const newTotal = calculateNewTotal();
  const totalDifference = newTotal - currentTotal;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="xl"
      className="max-w-4xl"
    >
      <Modal.Header>
        <Modal.Title className="flex items-center">
          <Package className="h-5 w-5 mr-2" />
          Edit Signs - Order #{order.orderNumber}
        </Modal.Title>
        <Modal.Description>
          Modify the signs in this order. Changes will update the order total and create an activity log.
        </Modal.Description>
      </Modal.Header>

      <Modal.Content className="space-y-6 max-h-[70vh] overflow-y-auto">
        {/* Current Signs */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">Current Signs</h4>
          {signEdits.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Package className="h-12 w-12 mx-auto mb-2 text-gray-300" />
              <p>No signs in this order</p>
            </div>
          ) : (
            <div className="space-y-3">
              {signEdits.map((edit) => (
                <div 
                  key={edit.signId} 
                  className={`border rounded-lg p-4 transition-colors ${
                    edit.newQuantity !== edit.currentQuantity 
                      ? 'border-blue-200 bg-blue-50' 
                      : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {edit.imageUrl && (
                        <img
                          src={edit.imageUrl}
                          alt={edit.name}
                          className="w-12 h-12 object-cover rounded"
                        />
                      )}
                      <div>
                        <h5 className="font-medium text-gray-900">{edit.name}</h5>
                        <p className="text-sm text-gray-600">{edit.category}</p>
                        <p className="text-sm text-gray-600">
                          {formatCurrency(edit.unitPrice)} each
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      {/* Quantity Controls */}
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => updateSignQuantity(edit.signId, edit.newQuantity - 1)}
                          disabled={edit.newQuantity <= 0}
                          className="h-8 w-8 p-0"
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        
                        <Input
                          type="number"
                          value={edit.newQuantity}
                          onChange={(e) => updateSignQuantity(edit.signId, parseInt(e.target.value) || 0)}
                          className="w-16 text-center"
                          min="0"
                        />
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => updateSignQuantity(edit.signId, edit.newQuantity + 1)}
                          className="h-8 w-8 p-0"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Change Indicator */}
                      {edit.newQuantity !== edit.currentQuantity && (
                        <Badge variant="secondary" className="text-xs">
                          {edit.newQuantity > edit.currentQuantity ? '+' : ''}
                          {edit.newQuantity - edit.currentQuantity}
                        </Badge>
                      )}

                      {/* Remove Button */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeSign(edit.signId)}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add Signs Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-gray-900">Add Signs</h4>
            <Button
              variant="secondary"
              onClick={() => setShowAddSignsSection(!showAddSignsSection)}
              className="text-sm"
            >
              {showAddSignsSection ? 'Hide' : 'Show'} Available Signs
            </Button>
          </div>

          {showAddSignsSection && (
            <div className="space-y-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search signs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Available Signs List */}
              <div className="max-h-64 overflow-y-auto space-y-2">
                {filteredAvailableSigns.map((sign) => (
                  <div key={sign.id} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {sign.imageUrl && (
                          <img
                            src={sign.imageUrl}
                            alt={sign.name}
                            className="w-10 h-10 object-cover rounded"
                          />
                        )}
                        <div>
                          <h6 className="text-sm font-medium text-gray-900">{sign.name}</h6>
                          <p className="text-xs text-gray-600">{sign.category}</p>
                          <p className="text-xs text-gray-600">
                            {formatCurrency(sign.rentalPrice)} each
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => addSign(sign)}
                        className="text-sm"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Total Changes */}
        {hasChanges() && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h5 className="font-medium text-blue-900 mb-2">Order Changes</h5>
            <div className="space-y-1 text-sm text-blue-800">
              <div className="flex justify-between">
                <span>Current Total:</span>
                <span>{formatCurrency(currentTotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>New Total:</span>
                <span>{formatCurrency(newTotal)}</span>
              </div>
              <div className="flex justify-between font-medium border-t border-blue-300 pt-1">
                <span>Difference:</span>
                <span className={totalDifference >= 0 ? 'text-green-700' : 'text-red-700'}>
                  {totalDifference >= 0 ? '+' : ''}{formatCurrency(totalDifference)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Reason */}
        <div className="space-y-2">
          <Label htmlFor="reason">Reason for Changes (Optional)</Label>
          <textarea
            id="reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Enter reason for sign changes..."
            className="w-full p-3 border border-gray-300 rounded-md resize-none"
            rows={2}
            maxLength={200}
          />
          <div className="text-right text-xs text-gray-500">
            {reason.length}/200 characters
          </div>
        </div>

        {/* Warning for deployed orders */}
        {order.status === 'deployed' && hasChanges() && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start">
              <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 mr-2" />
              <div className="text-sm text-amber-800">
                <strong>Note:</strong> This order is currently deployed. 
                Sign changes may require field coordination and additional logistics.
              </div>
            </div>
          </div>
        )}
      </Modal.Content>

      <Modal.Footer>
        <Button
          variant="secondary"
          onClick={onClose}
          disabled={isProcessing}
        >
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={handleSave}
          disabled={isProcessing || !hasChanges()}
        >
          {isProcessing ? 'Saving...' : 'Save Changes'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}