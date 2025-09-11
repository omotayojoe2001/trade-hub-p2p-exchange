import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Upload, FileText, Hash } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const UploadPaymentProof = () => {
  const navigate = useNavigate();
  const { tradeId } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [trade, setTrade] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [proofType, setProofType] = useState<'file' | 'hash'>('file');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [paymentHash, setPaymentHash] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (tradeId) {
      fetchTradeDetails();
    }
  }, [tradeId]);

  const fetchTradeDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('trades')
        .select('*')
        .eq('id', tradeId)
        .single();

      if (error) throw error;
      setTrade(data);
    } catch (error) {
      console.error('Error fetching trade:', error);
      toast({
        title: "Error",
        description: "Failed to load trade details",
        variant: "destructive"
      });
      navigate('/my-trades');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Invalid File Type",
          description: "Please upload JPEG, PNG, or PDF files only",
          variant: "destructive"
        });
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "Please upload files smaller than 5MB",
          variant: "destructive"
        });
        return;
      }
      
      setSelectedFile(file);
    }
  };

  const uploadFile = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `payment-proof-${tradeId}-${Date.now()}.${fileExt}`;
    
    const { data, error } = await supabase.storage
      .from('payment-proofs')
      .upload(fileName, file);

    if (error) throw error;
    
    const { data: { publicUrl } } = supabase.storage
      .from('payment-proofs')
      .getPublicUrl(fileName);
    
    return publicUrl;
  };

  const handleSubmit = async () => {
    if (proofType === 'file' && !selectedFile) {
      toast({
        title: "Missing File",
        description: "Please select a file to upload",
        variant: "destructive"
      });
      return;
    }

    if (proofType === 'hash' && !paymentHash.trim()) {
      toast({
        title: "Missing Hash",
        description: "Please enter the transaction hash",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    try {
      let proofUrl = null;
      
      if (proofType === 'file' && selectedFile) {
        proofUrl = await uploadFile(selectedFile);
      }

      const { data, error } = await supabase.rpc('upload_payment_proof', {
        trade_id_param: tradeId,
        user_id_param: user?.id,
        proof_url_param: proofUrl,
        payment_hash_param: proofType === 'hash' ? paymentHash : null
      });

      if (error) throw error;

      // Add notes if provided
      if (notes.trim()) {
        await supabase
          .from('trades')
          .update({ 
            payment_notes: notes 
          })
          .eq('id', tradeId);
      }

      toast({
        title: "Payment Proof Uploaded!",
        description: "The crypto sender will be notified to confirm payment received.",
      });

      navigate('/my-trades');
    } catch (error: any) {
      console.error('Error uploading payment proof:', error);
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload payment proof",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading trade details...</p>
        </div>
      </div>
    );
  }

  if (!trade) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground mb-4">Trade not found</p>
            <Button onClick={() => navigate('/my-trades')}>
              Back to My Trades
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 bg-card border-b p-4 flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={() => navigate('/my-trades')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="text-center">
          <h1 className="text-lg font-bold">Upload Payment Proof</h1>
          <p className="text-xs text-muted-foreground">Trade #{trade.id.slice(0, 8)}</p>
        </div>
        <div className="w-10" />
      </div>

      <div className="p-4 space-y-6">
        {/* Trade Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Trade Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Amount:</span>
              <span className="font-semibold">{trade.amount} {trade.coin_type}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Paid:</span>
              <span className="font-semibold">₦{trade.naira_amount?.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Trade Type:</span>
              <span className="font-semibold capitalize">{trade.trade_type}</span>
            </div>
          </CardContent>
        </Card>

        {/* Proof Type Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Choose Proof Type</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <Button
                variant={proofType === 'file' ? 'default' : 'outline'}
                onClick={() => setProofType('file')}
                className="flex-1"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload File
              </Button>
              <Button
                variant={proofType === 'hash' ? 'default' : 'outline'}
                onClick={() => setProofType('hash')}
                className="flex-1"
              >
                <Hash className="w-4 h-4 mr-2" />
                Transaction Hash
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* File Upload */}
        {proofType === 'file' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Upload Payment Receipt</CardTitle>
              <p className="text-xs text-muted-foreground">
                Upload screenshot or photo of your bank transfer receipt
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="file-upload">Select File (JPEG, PNG, PDF - Max 5MB)</Label>
                <Input
                  id="file-upload"
                  type="file"
                  accept=".jpg,.jpeg,.png,.pdf"
                  onChange={handleFileSelect}
                  className="mt-2"
                />
              </div>
              
              {selectedFile && (
                <div className="p-3 bg-muted rounded-lg">
                  <div className="flex items-center">
                    <FileText className="w-4 h-4 mr-2" />
                    <span className="text-sm font-medium">{selectedFile.name}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Size: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Transaction Hash */}
        {proofType === 'hash' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Transaction Hash</CardTitle>
              <p className="text-xs text-muted-foreground">
                Enter the transaction hash from your bank transfer
              </p>
            </CardHeader>
            <CardContent>
              <div>
                <Label htmlFor="payment-hash">Transaction Hash</Label>
                <Input
                  id="payment-hash"
                  value={paymentHash}
                  onChange={(e) => setPaymentHash(e.target.value)}
                  placeholder="Enter transaction hash or reference number"
                  className="mt-2"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Additional Notes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Additional Notes (Optional)</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any additional information about your payment..."
              rows={3}
            />
          </CardContent>
        </Card>

        {/* Submit Button */}
        <Button
          onClick={handleSubmit}
          disabled={uploading || (proofType === 'file' && !selectedFile) || (proofType === 'hash' && !paymentHash.trim())}
          className="w-full"
          size="lg"
        >
          {uploading ? 'Uploading...' : 'Submit Payment Proof'}
        </Button>

        {/* Warning */}
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800 font-medium mb-2">Important:</p>
          <ul className="text-xs text-yellow-700 space-y-1">
            <li>• Only upload genuine payment receipts</li>
            <li>• False proof will result in account suspension</li>
            <li>• Crypto sender will verify your payment before releasing crypto</li>
            <li>• Contact support if you have payment issues</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default UploadPaymentProof;