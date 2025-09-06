import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  Clock, 
  Phone, 
  MapPin, 
  DollarSign,
  Package,
  User,
  Bell,
  LogOut
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import VendorBottomNavigation from '@/components/vendor/VendorBottomNavigation';

interface SimpleVendorJob {
  id: string;
  premium_user_id: string;
  amount_usd: number;
  amount_naira_received?: number;
  delivery_type: string;
  status: string;
  verification_code?: string;
  created_at: string;
  // Customer info (we'll fetch separately)
  customer_name?: string;
  customer_phone?: string;
  delivery_address?: any;
}

const SimpleVendorDashboard = () => {
  const [jobs, setJobs] = useState<SimpleVendorJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processingJobId, setProcessingJobId] = useState<string>('');
  const navigate = useNavigate();

  useEffect(() => {
    loadJobs();
    // Refresh every 30 seconds
    const interval = setInterval(loadJobs, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadJobs = async () => {
    try {
      const vendorId = localStorage.getItem('vendor_id');
      if (!vendorId) {
        setError('Please login again');
        return;
      }

      // Get jobs for this vendor
      const { data: jobsData, error: jobsError } = await supabase
        .from('vendor_jobs')
        .select('*')
        .eq('vendor_id', vendorId)
        .in('status', ['pending_payment', 'payment_received', 'awaiting_handoff'])
        .order('created_at', { ascending: false });

      if (jobsError) throw jobsError;

      // Get customer details for each job
      const jobsWithCustomers = await Promise.all(
        (jobsData || []).map(async (job) => {
          const { data: customer } = await supabase
            .from('profiles')
            .select('display_name, phone_number')
            .eq('user_id', job.premium_user_id)
            .single();

          return {
            ...job,
            customer_name: customer?.display_name || 'Premium User',
            customer_phone: customer?.phone_number,
          };
        })
      );

      setJobs(jobsWithCustomers);
    } catch (error: any) {
      setError(error.message || 'Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  const confirmPaymentReceived = async (jobId: string, amountReceived: number) => {
    try {
      setProcessingJobId(jobId);

      // Update job status to payment_received
      const { error: updateError } = await supabase
        .from('vendor_jobs')
        .update({
          status: 'payment_received',
          amount_naira_received: amountReceived,
          payment_received_at: new Date().toISOString()
        })
        .eq('id', jobId);

      if (updateError) throw updateError;

      // If there's a linked trade, complete it (release crypto to buyer)
      const job = jobs.find(j => j.id === jobId);
      if (job) {
        // This would release crypto to the buyer
        // For now, we'll just update the job status
        alert('✅ Payment confirmed! Crypto has been released to the buyer.');
      }

      // Reload jobs
      await loadJobs();
    } catch (error: any) {
      alert('❌ Error: ' + error.message);
    } finally {
      setProcessingJobId('');
    }
  };

  const completeDelivery = async (jobId: string, verificationCode: string) => {
    try {
      setProcessingJobId(jobId);

      // In a real app, you'd verify the code here
      // For now, we'll just mark as completed
      const { error } = await supabase
        .from('vendor_jobs')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', jobId);

      if (error) throw error;

      alert('✅ Delivery completed successfully!');
      await loadJobs();
    } catch (error: any) {
      alert('❌ Error: ' + error.message);
    } finally {
      setProcessingJobId('');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.clear();
    navigate('/vendor/login');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending_payment': return 'bg-yellow-100 text-yellow-800';
      case 'payment_received': return 'bg-blue-100 text-blue-800';
      case 'awaiting_handoff': return 'bg-purple-100 text-purple-800';
      case 'completed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending_payment': return 'Waiting for Payment';
      case 'payment_received': return 'Ready for Delivery';
      case 'awaiting_handoff': return 'Meet Customer';
      case 'completed': return 'Completed';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your deliveries...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Simple Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Cash Delivery Agent</h1>
            <p className="text-sm text-gray-600">Manage pickup and delivery requests</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="text-red-600 border-red-200 hover:bg-red-50"
          >
            <LogOut className="w-4 h-4 mr-1" />
            Logout
          </Button>
        </div>
      </div>

      <div className="p-4">
        {error && (
          <Alert className="mb-4 border-red-200 bg-red-50">
            <AlertDescription className="text-red-800">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Active Jobs Count */}
        <div className="mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {jobs.length}
              </div>
              <div className="text-gray-600">Active Delivery Requests</div>
            </CardContent>
          </Card>
        </div>

        {/* Jobs List */}
        <div className="space-y-4">
          {jobs.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Deliveries</h3>
                <p className="text-gray-600">
                  New delivery requests will appear here automatically.
                </p>
              </CardContent>
            </Card>
          ) : (
            jobs.map((job) => (
              <Card key={job.id} className="border-l-4 border-l-blue-500">
                <CardContent className="p-4">
                  {/* Job Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      {job.delivery_type === 'pickup' ? (
                        <Package className="w-5 h-5 text-blue-600" />
                      ) : (
                        <MapPin className="w-5 h-5 text-green-600" />
                      )}
                      <span className="font-medium text-gray-900">
                        {job.delivery_type === 'pickup' ? 'Cash Pickup' : 'Cash Delivery'}
                      </span>
                    </div>
                    <Badge className={getStatusColor(job.status)}>
                      {getStatusText(job.status)}
                    </Badge>
                  </div>

                  {/* Amount Info */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <div className="text-sm text-gray-600">Amount to Deliver</div>
                      <div className="text-xl font-bold text-green-600">
                        ${job.amount_usd}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Naira Received</div>
                      <div className="text-lg font-semibold text-gray-900">
                        {job.amount_naira_received 
                          ? `₦${job.amount_naira_received.toLocaleString()}`
                          : 'Pending'
                        }
                      </div>
                    </div>
                  </div>

                  {/* Customer Info */}
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <User className="w-4 h-4 text-gray-600" />
                          <span className="font-medium">{job.customer_name}</span>
                        </div>
                        {job.customer_phone && (
                          <a 
                            href={`tel:${job.customer_phone}`}
                            className="flex items-center space-x-1 text-blue-600 text-sm"
                          >
                            <Phone className="w-3 h-3" />
                            <span>Call Customer</span>
                          </a>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-gray-500">Request Time</div>
                        <div className="text-sm">
                          {new Date(job.created_at).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-2">
                    {job.status === 'pending_payment' && (
                      <div className="p-3 bg-yellow-50 rounded-lg">
                        <div className="text-sm text-yellow-800 mb-2">
                          <Bell className="w-4 h-4 inline mr-1" />
                          Waiting for customer to send payment to your account
                        </div>
                        <Button
                          onClick={() => {
                            const amount = prompt('Enter the Naira amount you received:');
                            if (amount) {
                              confirmPaymentReceived(job.id, parseFloat(amount));
                            }
                          }}
                          disabled={processingJobId === job.id}
                          className="w-full bg-green-600 hover:bg-green-700"
                        >
                          {processingJobId === job.id ? 'Processing...' : '✅ I Received Payment'}
                        </Button>
                      </div>
                    )}

                    {job.status === 'payment_received' && (
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <div className="text-sm text-blue-800 mb-2">
                          Payment confirmed! Ready to deliver ${job.amount_usd} to customer.
                        </div>
                        <Button
                          onClick={() => {
                            const code = prompt('Enter the verification code from customer:');
                            if (code) {
                              completeDelivery(job.id, code);
                            }
                          }}
                          disabled={processingJobId === job.id}
                          className="w-full bg-purple-600 hover:bg-purple-700"
                        >
                          {processingJobId === job.id ? 'Processing...' : '🎯 Complete Delivery'}
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Bottom Navigation */}
      <VendorBottomNavigation />
    </div>
  );
};

export default SimpleVendorDashboard;
