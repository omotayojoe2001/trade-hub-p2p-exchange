import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Phone, 
  MapPin, 
  DollarSign,
  Truck,
  User,
  Calendar
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { vendorJobService, VendorJob } from '@/services/vendorJobService';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

const VendorDashboard = () => {
  const [jobs, setJobs] = useState<VendorJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const { user } = useAuth();
  const [vendorId, setVendorId] = useState<string>('');
  const navigate = useNavigate();

  useEffect(() => {
    // Get vendor ID from localStorage
    const storedVendorId = localStorage.getItem('vendor_id');
    if (storedVendorId) {
      setVendorId(storedVendorId);
    }
  }, []);

  useEffect(() => {
    if (vendorId) {
      loadJobs();
    }
  }, [selectedStatus, vendorId]);

  const loadJobs = async () => {
    try {
      setLoading(true);
      if (!vendorId) {
        setError('Vendor ID not found. Please login again.');
        return;
      }

      const jobsData = await vendorJobService.getVendorJobs(
        vendorId,
        selectedStatus === 'all' ? undefined : selectedStatus
      );
      setJobs(jobsData);
    } catch (error: any) {
      setError(error.message || 'Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      localStorage.removeItem('vendor_id');
      localStorage.removeItem('vendor_user_id');
      navigate('/vendor/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending_payment':
        return 'bg-yellow-100 text-yellow-800';
      case 'payment_received':
        return 'bg-blue-100 text-blue-800';
      case 'awaiting_handoff':
        return 'bg-purple-100 text-purple-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'dispute':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending_payment':
        return <Clock className="w-4 h-4" />;
      case 'payment_received':
        return <CheckCircle className="w-4 h-4" />;
      case 'awaiting_handoff':
        return <Truck className="w-4 h-4" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      case 'cancelled':
      case 'dispute':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Package className="w-4 h-4" />;
    }
  };

  const formatStatus = (status: string) => {
    return status.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const getDeliveryTypeIcon = (type: string) => {
    switch (type) {
      case 'pickup':
        return <Package className="w-4 h-4 text-blue-600" />;
      case 'delivery':
        return <Truck className="w-4 h-4 text-green-600" />;
      case 'naira_to_usd':
        return <DollarSign className="w-4 h-4 text-purple-600" />;
      default:
        return <Package className="w-4 h-4" />;
    }
  };

  const formatDeliveryType = (type: string) => {
    switch (type) {
      case 'pickup':
        return 'Cash Pickup';
      case 'delivery':
        return 'Cash Delivery';
      case 'naira_to_usd':
        return 'Naira → USD';
      default:
        return type;
    }
  };

  const maskUserName = (name: string) => {
    if (!name) return 'User';
    const parts = name.split(' ');
    if (parts.length === 1) {
      return parts[0].charAt(0) + '***';
    }
    return parts[0] + ' ' + parts[1].charAt(0) + '.';
  };

  // Calculate dashboard stats
  const stats = {
    total: jobs.length,
    pending: jobs.filter(j => j.status === 'pending_payment').length,
    active: jobs.filter(j => ['payment_received', 'awaiting_handoff'].includes(j.status)).length,
    completed: jobs.filter(j => j.status === 'completed').length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading vendor dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Vendor Dashboard</h1>
            <p className="text-sm text-gray-600">Manage your delivery and pickup jobs</p>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              Vendor
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="text-red-600 border-red-200 hover:bg-red-50"
            >
              Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="p-4">
        {error && (
          <Alert className="mb-4 border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-red-800">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
              <div className="text-sm text-gray-600">Total Jobs</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
              <div className="text-sm text-gray-600">Pending Payment</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.active}</div>
              <div className="text-sm text-gray-600">Active Jobs</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
              <div className="text-sm text-gray-600">Completed</div>
            </CardContent>
          </Card>
        </div>

        {/* Filter Tabs */}
        <div className="flex space-x-2 mb-4 overflow-x-auto">
          {[
            { key: 'all', label: 'All Jobs' },
            { key: 'pending_payment', label: 'Pending Payment' },
            { key: 'payment_received', label: 'Payment Received' },
            { key: 'awaiting_handoff', label: 'Ready for Handoff' },
            { key: 'completed', label: 'Completed' },
          ].map((tab) => (
            <Button
              key={tab.key}
              variant={selectedStatus === tab.key ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedStatus(tab.key)}
              className="whitespace-nowrap"
            >
              {tab.label}
            </Button>
          ))}
        </div>

        {/* Jobs List */}
        <div className="space-y-4">
          {jobs.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Jobs Found</h3>
                <p className="text-gray-600">
                  {selectedStatus === 'all' 
                    ? 'No jobs assigned to you yet.' 
                    : `No jobs with status "${formatStatus(selectedStatus)}".`
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            jobs.map((job) => (
              <Card key={job.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      {getDeliveryTypeIcon(job.delivery_type)}
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {formatDeliveryType(job.delivery_type)}
                        </h3>
                        <p className="text-sm text-gray-600">
                          Job #{job.id.slice(0, 8)}
                        </p>
                      </div>
                    </div>
                    <Badge className={getStatusColor(job.status)}>
                      <div className="flex items-center space-x-1">
                        {getStatusIcon(job.status)}
                        <span>{formatStatus(job.status)}</span>
                      </div>
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <div className="flex items-center space-x-2 text-sm text-gray-600 mb-1">
                        <User className="w-4 h-4" />
                        <span>Customer</span>
                      </div>
                      <p className="font-medium">
                        {maskUserName(job.premium_user?.display_name || 'User')}
                      </p>
                      {job.premium_user?.phone_number && (
                        <a 
                          href={`tel:${job.premium_user.phone_number}`}
                          className="text-blue-600 text-sm flex items-center space-x-1 mt-1"
                        >
                          <Phone className="w-3 h-3" />
                          <span>Call Customer</span>
                        </a>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2 text-sm text-gray-600 mb-1">
                        <DollarSign className="w-4 h-4" />
                        <span>Amount</span>
                      </div>
                      <p className="font-medium">${job.amount_usd}</p>
                      {job.amount_naira_received && (
                        <p className="text-sm text-gray-600">
                          ₦{job.amount_naira_received.toLocaleString()} received
                        </p>
                      )}
                    </div>
                  </div>

                  {job.address_json && (
                    <div className="mb-4">
                      <div className="flex items-center space-x-2 text-sm text-gray-600 mb-1">
                        <MapPin className="w-4 h-4" />
                        <span>Location</span>
                      </div>
                      <p className="text-sm">
                        {job.address_json.street}, {job.address_json.city}
                      </p>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(job.created_at).toLocaleDateString()}</span>
                    </div>
                    {job.trade_id && (
                      <span className="text-blue-600">Trade #{job.trade_id.slice(0, 8)}</span>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-2">
                    {job.status === 'pending_payment' && (
                      <Button 
                        size="sm" 
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => {/* Navigate to confirm payment */}}
                      >
                        Confirm Payment
                      </Button>
                    )}
                    {job.status === 'payment_received' && (
                      <Button 
                        size="sm" 
                        className="bg-blue-600 hover:bg-blue-700"
                        onClick={() => {/* Navigate to handoff */}}
                      >
                        Ready for Handoff
                      </Button>
                    )}
                    {job.status === 'awaiting_handoff' && (
                      <Button 
                        size="sm" 
                        className="bg-purple-600 hover:bg-purple-700"
                        onClick={() => {/* Navigate to verification */}}
                      >
                        Enter Code
                      </Button>
                    )}
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {/* Navigate to job details */}}
                    >
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default VendorDashboard;
