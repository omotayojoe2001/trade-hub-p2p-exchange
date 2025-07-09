import React, { useState } from 'react';
import { ArrowLeft, MessageCircle, Mail, Phone, ChevronDown, ChevronUp, Search, Send } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';

const HelpSupport = () => {
  const [activeTab, setActiveTab] = useState('faq');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [chatMessage, setChatMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const faqs = [
    {
      id: 1,
      question: "How do I buy cryptocurrency?",
      answer: "To buy crypto, go to the Buy/Sell page, select your coin, enter the amount, choose a merchant, and complete the payment. Your crypto will be transferred to your wallet once payment is confirmed."
    },
    {
      id: 2,
      question: "What payment methods are accepted?",
      answer: "We accept bank transfers, debit cards, and mobile money transfers. You can manage your payment methods in Settings > Payment Methods."
    },
    {
      id: 3,
      question: "How long does a trade take?",
      answer: "Most trades are completed within 5-15 minutes. The exact time depends on payment method and merchant response time."
    },
    {
      id: 4,
      question: "What are the trading fees?",
      answer: "Trading fees vary by coin and payment method, typically 0.5-2%. Premium users get reduced fees. Check the trade preview for exact fees."
    },
    {
      id: 5,
      question: "How do I become a merchant?",
      answer: "Switch to merchant mode in settings, complete KYC verification, and deposit collateral. You'll then be able to create offers and serve customers."
    },
    {
      id: 6,
      question: "What is the referral program?",
      answer: "Earn 0.3% commission on every trade your referrals make. The more friends you invite, the more you earn. Visit the Referrals page to get started."
    }
  ];

  const filteredFaqs = faqs.filter(faq => 
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSendMessage = () => {
    if (chatMessage.trim()) {
      // Handle chat message
      setChatMessage('');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-6">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="flex items-center">
          <Link to="/settings" className="mr-3">
            <ArrowLeft size={24} className="text-gray-600" />
          </Link>
          <h1 className="text-xl font-semibold text-gray-900">Help & Support</h1>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200 px-4">
        <div className="flex space-x-8">
          <button
            onClick={() => setActiveTab('faq')}
            className={`py-4 text-sm font-medium border-b-2 ${
              activeTab === 'faq'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            FAQ
          </button>
          <button
            onClick={() => setActiveTab('contact')}
            className={`py-4 text-sm font-medium border-b-2 ${
              activeTab === 'contact'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Contact Us
          </button>
          <button
            onClick={() => setActiveTab('live-chat')}
            className={`py-4 text-sm font-medium border-b-2 ${
              activeTab === 'live-chat'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Live Chat
          </button>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* FAQ Tab */}
        {activeTab === 'faq' && (
          <>
            {/* Search */}
            <div className="relative">
              <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search FAQs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* FAQ List */}
            <div className="space-y-3">
              {filteredFaqs.map((faq) => (
                <Card key={faq.id} className="bg-white">
                  <button
                    onClick={() => setExpandedFaq(expandedFaq === faq.id ? null : faq.id)}
                    className="w-full p-4 text-left flex items-center justify-between"
                  >
                    <span className="font-medium text-gray-900">{faq.question}</span>
                    {expandedFaq === faq.id ? (
                      <ChevronUp size={20} className="text-gray-400" />
                    ) : (
                      <ChevronDown size={20} className="text-gray-400" />
                    )}
                  </button>
                  {expandedFaq === faq.id && (
                    <div className="px-4 pb-4">
                      <p className="text-gray-600">{faq.answer}</p>
                    </div>
                  )}
                </Card>
              ))}
            </div>

            {filteredFaqs.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500">No FAQs found matching your search.</p>
              </div>
            )}
          </>
        )}

        {/* Contact Us Tab */}
        {activeTab === 'contact' && (
          <div className="space-y-6">
            {/* Contact Methods */}
            <div className="grid gap-4">
              <Card className="bg-white p-6">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                    <Mail size={20} className="text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Email Support</h3>
                    <p className="text-sm text-gray-500">Get help via email</p>
                  </div>
                </div>
                <p className="text-blue-600 font-medium">support@cryptohub.com</p>
                <p className="text-sm text-gray-500 mt-1">Response time: 2-4 hours</p>
              </Card>

              <Card className="bg-white p-6">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-3">
                    <Phone size={20} className="text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Phone Support</h3>
                    <p className="text-sm text-gray-500">Call us directly</p>
                  </div>
                </div>
                <p className="text-green-600 font-medium">+234 800 123 4567</p>
                <p className="text-sm text-gray-500 mt-1">Available 24/7</p>
              </Card>

              <Card className="bg-white p-6">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                    <MessageCircle size={20} className="text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Live Chat</h3>
                    <p className="text-sm text-gray-500">Instant support</p>
                  </div>
                </div>
                <Button 
                  onClick={() => setActiveTab('live-chat')}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                >
                  Start Live Chat
                </Button>
              </Card>
            </div>

            {/* Contact Form */}
            <Card className="bg-white p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Send us a message</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                  <Input placeholder="What can we help you with?" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                  <Textarea 
                    placeholder="Describe your issue or question..."
                    rows={4}
                  />
                </div>
                <Button className="w-full">Send Message</Button>
              </div>
            </Card>
          </div>
        )}

        {/* Live Chat Tab */}
        {activeTab === 'live-chat' && (
          <Card className="bg-white p-6">
            <div className="flex items-center mb-4">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
              <h3 className="font-semibold text-gray-900">Live Chat Support</h3>
              <span className="ml-auto text-sm text-gray-500">Online</span>
            </div>

            {/* Chat Messages */}
            <div className="h-64 border rounded-lg p-4 mb-4 overflow-y-auto bg-gray-50">
              <div className="space-y-3">
                <div className="flex items-start">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mr-3">
                    <span className="text-white text-sm">S</span>
                  </div>
                  <div className="bg-white rounded-lg p-3 max-w-xs">
                    <p className="text-sm text-gray-900">Hello! How can I help you today?</p>
                    <span className="text-xs text-gray-500">Support • 2 min ago</span>
                  </div>
                </div>
                
                <div className="flex items-start justify-end">
                  <div className="bg-blue-600 text-white rounded-lg p-3 max-w-xs">
                    <p className="text-sm">Hi! I need help with a trade that's been pending for 30 minutes.</p>
                    <span className="text-xs text-blue-200">You • 1 min ago</span>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mr-3">
                    <span className="text-white text-sm">S</span>
                  </div>
                  <div className="bg-white rounded-lg p-3 max-w-xs">
                    <p className="text-sm text-gray-900">I'd be happy to help! Can you please share your trade ID?</p>
                    <span className="text-xs text-gray-500">Support • Just now</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Chat Input */}
            <div className="flex space-x-2">
              <Input
                placeholder="Type your message..."
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                className="flex-1"
              />
              <Button onClick={handleSendMessage} size="sm">
                <Send size={16} />
              </Button>
            </div>

            <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
              <p className="text-sm text-yellow-800">
                <span className="font-medium">Average response time:</span> 30 seconds
              </p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default HelpSupport;