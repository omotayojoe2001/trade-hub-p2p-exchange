import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Database, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSupabaseTest } from '@/hooks/useSupabaseTest';

const SupabaseTest = () => {
  const navigate = useNavigate();
  const { 
    isConnected, 
    testResults, 
    loading, 
    testConnection, 
    testUserService, 
    testTradeService, 
    testNotificationService 
  } = useSupabaseTest();

  const getStatusIcon = (status: string) => {
    if (status === 'Connected' || status.includes('Connected')) {
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    } else if (status.includes('Error') || status === 'Failed') {
      return <XCircle className="w-4 h-4 text-red-500" />;
    }
    return <Loader2 className="w-4 h-4 text-yellow-500" />;
  };

  const getStatusColor = (status: string) => {
    if (status === 'Connected' || status.includes('Connected')) {
      return 'bg-green-100 text-green-800';
    } else if (status.includes('Error') || status === 'Failed') {
      return 'bg-red-100 text-red-800';
    }
    return 'bg-yellow-100 text-yellow-800';
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/home')}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Home</span>
            </Button>
          </div>
          <div className="flex items-center space-x-2">
            <Database className="w-6 h-6 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">Supabase Integration Test</h1>
          </div>
        </div>

        {/* Connection Status */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Database className="w-5 h-5" />
              <span>Connection Status</span>
              {isConnected && <Badge className="bg-green-100 text-green-800">Connected</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={testConnection} 
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Testing Connection...
                </>
              ) : (
                'Test Supabase Connection'
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Test Results */}
        {Object.keys(testResults).length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Test Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(testResults).map(([service, status]) => (
                  <div key={service} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(status as string)}
                      <span className="font-medium capitalize">{service}</span>
                    </div>
                    <Badge className={getStatusColor(status as string)}>
                      {status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Service Tests */}
        {isConnected && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>User Service</CardTitle>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={testUserService} 
                  variant="outline" 
                  className="w-full"
                >
                  Test User Profile
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Trade Service</CardTitle>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={testTradeService} 
                  variant="outline" 
                  className="w-full"
                >
                  Test Trade Requests
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Notification Service</CardTitle>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={testNotificationService} 
                  variant="outline" 
                  className="w-full"
                >
                  Test Notifications
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Instructions */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>How to Use</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm text-gray-600">
              <p>1. <strong>Test Connection:</strong> Click the button above to verify all Supabase services are working</p>
              <p>2. <strong>Service Tests:</strong> Once connected, you can test individual services</p>
              <p>3. <strong>Check Console:</strong> Open browser console to see detailed logs</p>
              <p>4. <strong>Authentication:</strong> Some tests require you to be logged in</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SupabaseTest;
