import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  User, 
  Phone, 
  MapPin, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  DollarSign,
  Truck
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { premiumTradeService, type VendorJob } from '@/services/premiumTradeService';
import { supabase } from '@/integrations/supabase/client';

const VendorDashboard: React.FC = () => {
  const [jobs, setJobs] = useState<VendorJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [verificationCode, setVerificationCode] = useState('');
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadVendorJobs();
    setupRealTimeSubscription();
  }, []);

  const loadVendorJobs = async () => {
    try {
      const vendorJobs = await premiumTradeService.getVendorJobs();
      setJobs(vendorJobs);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const setupRealTimeSubscription = () => {
    const subscription = supabase
      .channel('vendor_jobs_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'vendor_jobs'
        },
        () => {
          loadVendorJobs();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  };

  const updateJobStatus = async (jobId: string, status: string) => {
    try {
      await premiumTradeService.updateVendorJobStatus(jobId, status);
      await loadVendorJobs();
      
      toast({
        title: "Status Updated",
        description: `Job status updated to ${status.replace('_', ' ')}`
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const verifyTradeCode = async (jobId: string) => {
    if (!verificationCode) {
      toast({
        title: "Code Required",
        description: "Please enter the trade code",
        variant: "destructive"
      });
      return;
    }

    try {
      const isValid = await premiumTradeService.verifyTradeCode(verificationCode, jobId);
      
      if (isValid) {
        toast({
          title: "Code Verified",
          description: "Trade completed successfully"
        });
        setVerificationCode('');
        setActiveJobId(null);
        await loadVendorJobs();
      } else {
        toast({
          title: "Invalid Code",
          description: "The trade code is incorrect or already used",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending_payment': return 'bg-yellow-500';
      case 'payment_confirmed': return 'bg-blue-500';
      case 'in_progress': return 'bg-orange-500';
      case 'completed': return 'bg-green-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const renderJobCard = (job: VendorJob) => (
    <Card key={job.id} className="p-4 space-y-4">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-semibold flex items-center">
            <DollarSign className="h-4 w-4 mr-1" />
            ${job.amount_usd} USD
          </h3>
          <p className="text-sm text-muted-foreground">
            {new Date(job.created_at).toLocaleDateString()}
          </p>
        </div>
        <Badge 
          variant="secondary" 
          className={`${getStatusColor(job.status)} text-white`}
        >
          {job.status.replace('_', ' ')}
        </Badge>
      </div>

      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <User className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">{job.premium_user?.display_name}</span>
        </div>
        <div className="flex items-center space-x-2">
          <Phone className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">{job.premium_user?.phone_number}</span>
        </div>
        <div className="flex items-center space-x-2">
          <Truck className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm capitalize">{job.delivery_type}</span>
        </div>
        {job.address_json && (
          <div className="flex items-start space-x-2">
            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div className="text-sm">
              {JSON.parse(job.address_json).street}, {JSON.parse(job.address_json).city}
            </div>
          </div>
        )}
      </div>

      <div className="space-y-2">
        {job.status === 'pending_payment' && (
          <Button 
            onClick={() => updateJobStatus(job.id, 'payment_confirmed')}
            className="w-full"
            size="sm"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Confirm Payment Received
          </Button>
        )}
        
        {job.status === 'payment_confirmed' && (
          <Button 
            onClick={() => updateJobStatus(job.id, 'in_progress')}
            className="w-full"
            size="sm"
          >
            <Truck className="h-4 w-4 mr-2" />
            Start Delivery/Pickup
          </Button>
        )}

        {job.status === 'in_progress' && (
          <div className="space-y-2">
            <div className="bg-primary/10 p-3 rounded text-center">
              <div className="text-sm text-muted-foreground">Customer's Trade Code</div>
              <div className="font-mono font-bold text-lg">{job.verification_code}</div>
            </div>
            
            <Input
              placeholder="Enter code from customer"
              value={activeJobId === job.id ? verificationCode : ''}
              onChange={(e) => {
                setVerificationCode(e.target.value);
                setActiveJobId(job.id);
              }}
            />
            <Button 
              onClick={() => verifyTradeCode(job.id)}
              className="w-full"
              size="sm"
            >
              Complete Trade
            </Button>
          </div>
        )}

        {job.status === 'completed' && (
          <div className="text-center p-3 bg-green-50 rounded">
            <CheckCircle className="h-5 w-5 text-green-500 mx-auto mb-1" />
            <div className="text-sm text-green-600 font-medium">Completed</div>
          </div>
        )}
      </div>
    </Card>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading vendor dashboard...</p>
        </div>
      </div>
    );
  }

  const activeJobs = jobs.filter(job => 
    ['pending_payment', 'payment_confirmed', 'in_progress'].includes(job.status)
  );
  const completedJobs = jobs.filter(job => job.status === 'completed');

  return (
    <div className="min-h-screen bg-background">
      <div className="p-4 border-b">
        <h1 className="text-2xl font-bold">Vendor Dashboard</h1>
        <p className="text-muted-foreground">Manage premium delivery and pickup requests</p>
      </div>

      <div className="p-4">
        <Tabs defaultValue="active" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="active" className="flex items-center space-x-2">
              <Clock className="h-4 w-4" />
              <span>Active Jobs ({activeJobs.length})</span>
            </TabsTrigger>
            <TabsTrigger value="completed" className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4" />
              <span>Completed ({completedJobs.length})</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="mt-6">
            <div className="space-y-4">
              {activeJobs.length === 0 ? (
                <Card className="p-8 text-center">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Active Jobs</h3>
                  <p className="text-muted-foreground">
                    You'll receive notifications when premium users request services
                  </p>
                </Card>
              ) : (
                activeJobs.map(renderJobCard)
              )}
            </div>
          </TabsContent>

          <TabsContent value="completed" className="mt-6">
            <div className="space-y-4">
              {completedJobs.length === 0 ? (
                <Card className="p-8 text-center">
                  <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Completed Jobs</h3>
                  <p className="text-muted-foreground">
                    Completed jobs will appear here
                  </p>
                </Card>
              ) : (
                completedJobs.map(renderJobCard)
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default VendorDashboard;