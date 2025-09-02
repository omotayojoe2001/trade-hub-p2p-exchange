import React, { useState } from 'react';
import { ArrowLeft, Crown, MessageCircle, Phone, Mail, Clock, Star, Send } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import PremiumBottomNavigation from '@/components/premium/PremiumBottomNavigation';

const PremiumSupport = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedCategory, setSelectedCategory] = useState('');
  const [supportForm, setSupportForm] = useState({
    subject: '',
    message: '',
    priority: 'high'
  });

  const supportCategories = [
    { id: 'trading', name: 'Trading Issues', icon: '📈', description: 'Trade execution, matching, payments' },
    { id: 'account', name: 'Account & Security', icon: '🔐', description: 'Login, 2FA, account settings' },
    { id: 'payments', name: 'Payment Methods', icon: '💳', description: 'Bank transfers, crypto payments' },
    { id: 'technical', name: 'Technical Support', icon: '⚙️', description: 'App issues, bugs, performance' },
    { id: 'billing', name: 'Premium Billing', icon: '💰', description: 'Subscription, refunds, upgrades' },
    { id: 'other', name: 'Other', icon: '❓', description: 'General questions and feedback' }
  ];

  const handleSubmitTicket = () => {
    if (supportForm.subject && supportForm.message && selectedCategory) {
      toast({
        title: "Premium Support Ticket Created",
        description: "Your priority ticket has been submitted. Expected response: 15 minutes",
      });
      
      // Reset form
      setSupportForm({ subject: '', message: '', priority: 'high' });
      setSelectedCategory('');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Link to="/premium-settings" className="mr-4">
              <ArrowLeft size={24} className="text-gray-600" />
            </Link>
            <div>
              <h1 className="text-xl font-semibold text-gray-900 flex items-center">
                <MessageCircle size={24} className="mr-2 text-yellow-600" />
                Premium Support
              </h1>
              <p className="text-gray-600 text-sm">24/7 priority assistance for premium users</p>
            </div>
          </div>
          <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-medium flex items-center">
            <Crown size={12} className="mr-1" />
            Premium
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Premium Support Benefits */}
        <Card className="p-4 bg-gradient-to-r from-yellow-100 to-amber-100 border-yellow-200">
          <div className="flex items-center space-x-3 mb-3">
            <Crown size={24} className="text-yellow-600" />
            <div>
              <h3 className="font-semibold text-yellow-900">Premium Support Benefits</h3>
              <p className="text-sm text-yellow-700">Exclusive support features for premium members</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <Clock size={16} className="text-yellow-600" />
              <span className="text-yellow-800">15-min response time</span>
            </div>
            <div className="flex items-center space-x-2">
              <Phone size={16} className="text-yellow-600" />
              <span className="text-yellow-800">Direct phone support</span>
            </div>
            <div className="flex items-center space-x-2">
              <Star size={16} className="text-yellow-600" />
              <span className="text-yellow-800">Priority queue</span>
            </div>
            <div className="flex items-center space-x-2">
              <MessageCircle size={16} className="text-yellow-600" />
              <span className="text-yellow-800">Live chat available</span>
            </div>
          </div>
        </Card>

        {/* Quick Contact Options */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4 bg-white border-gray-200 text-center">
            <Phone size={32} className="mx-auto text-green-600 mb-2" />
            <h3 className="font-semibold text-gray-900">Call Us</h3>
            <p className="text-sm text-gray-600 mb-3">+234 800 PREMIUM</p>
            <Button className="w-full bg-green-600 hover:bg-green-700 text-white">
              Call Now
            </Button>
          </Card>
          
          <Card className="p-4 bg-white border-gray-200 text-center">
            <MessageCircle size={32} className="mx-auto text-blue-600 mb-2" />
            <h3 className="font-semibold text-gray-900">Live Chat</h3>
            <p className="text-sm text-gray-600 mb-3">Available 24/7</p>
            <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
              Start Chat
            </Button>
          </Card>
          
          <Card className="p-4 bg-white border-gray-200 text-center">
            <Mail size={32} className="mx-auto text-purple-600 mb-2" />
            <h3 className="font-semibold text-gray-900">Email</h3>
            <p className="text-sm text-gray-600 mb-3">premium@tradehub.com</p>
            <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white">
              Send Email
            </Button>
          </Card>
        </div>

        {/* Support Ticket Form */}
        <Card className="p-4 bg-white border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-4">Create Support Ticket</h3>
          
          {/* Category Selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <div className="grid grid-cols-2 gap-3">
              {supportCategories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`p-3 rounded-lg border-2 transition-colors text-left ${
                    selectedCategory === category.id
                      ? 'border-yellow-500 bg-yellow-50'
                      : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-lg">{category.icon}</span>
                    <span className="font-medium text-sm">{category.name}</span>
                  </div>
                  <p className="text-xs text-gray-600">{category.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Priority Level */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
            <div className="flex space-x-3">
              {[
                { value: 'high', label: 'High Priority', color: 'red' },
                { value: 'medium', label: 'Medium', color: 'yellow' },
                { value: 'low', label: 'Low', color: 'green' }
              ].map((priority) => (
                <button
                  key={priority.value}
                  onClick={() => setSupportForm({...supportForm, priority: priority.value})}
                  className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                    supportForm.priority === priority.value
                      ? `border-${priority.color}-500 bg-${priority.color}-50`
                      : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <span className="text-sm font-medium">{priority.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Subject */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
            <Input
              value={supportForm.subject}
              onChange={(e) => setSupportForm({...supportForm, subject: e.target.value})}
              placeholder="Brief description of your issue"
              className="border-yellow-200 focus:border-yellow-400"
            />
          </div>

          {/* Message */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
            <Textarea
              value={supportForm.message}
              onChange={(e) => setSupportForm({...supportForm, message: e.target.value})}
              placeholder="Describe your issue in detail..."
              rows={4}
              className="border-yellow-200 focus:border-yellow-400"
            />
          </div>

          <Button
            onClick={handleSubmitTicket}
            disabled={!supportForm.subject || !supportForm.message || !selectedCategory}
            className="w-full bg-yellow-600 hover:bg-yellow-700 text-white"
          >
            <Send size={16} className="mr-2" />
            Submit Premium Ticket
          </Button>
        </Card>

        {/* FAQ Section */}
        <Card className="p-4 bg-white border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-4">Frequently Asked Questions</h3>
          <div className="space-y-3">
            <details className="group">
              <summary className="flex justify-between items-center cursor-pointer p-3 bg-gray-50 rounded-lg">
                <span className="font-medium">How fast is premium support response?</span>
                <span className="group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <div className="p-3 text-sm text-gray-600">
                Premium users receive priority support with guaranteed response times: 15 minutes for high priority, 1 hour for medium, and 4 hours for low priority tickets.
              </div>
            </details>
            
            <details className="group">
              <summary className="flex justify-between items-center cursor-pointer p-3 bg-gray-50 rounded-lg">
                <span className="font-medium">Can I get phone support?</span>
                <span className="group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <div className="p-3 text-sm text-gray-600">
                Yes! Premium users have access to direct phone support during business hours (9 AM - 9 PM WAT) and emergency support 24/7.
              </div>
            </details>
            
            <details className="group">
              <summary className="flex justify-between items-center cursor-pointer p-3 bg-gray-50 rounded-lg">
                <span className="font-medium">What about trading issues?</span>
                <span className="group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <div className="p-3 text-sm text-gray-600">
                Trading issues are handled with highest priority. Our trading specialists are available 24/7 to resolve any trade-related problems immediately.
              </div>
            </details>
          </div>
        </Card>
      </div>

      <PremiumBottomNavigation />
    </div>
  );
};

export default PremiumSupport;
