import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { ArrowLeft, Banknote, Gem, ChevronDown, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import CryptoIcon from '@/components/CryptoIcon';

const Premium = () => {
  const navigate = useNavigate();
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setExpandedFaq(expandedFaq === index ? null : index);
  };

  const faqItems = [
    {
      question: "What happens after I subscribe?",
      answer: "You'll get immediate access to all premium features including priority support, faster transactions, and exclusive trading opportunities."
    },
    {
      question: "Can I cancel my subscription?",
      answer: "Yes, you can cancel your subscription at any time from your account settings. You'll continue to have access until the end of your billing period."
    },
    {
      question: "Is my payment information secure?",
      answer: "Absolutely. We use bank-level encryption and never store your payment details. All transactions are processed through secure, certified payment processors."
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="flex items-center p-4 border-b border-gray-100">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 -ml-2"
        >
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <h1 className="text-lg font-semibold text-black ml-2">
          Upgrade to Premium
        </h1>
      </div>

      <div className="px-4 py-6">
        {/* Description */}
        <p className="text-center text-gray-600 mb-8 leading-relaxed">
          Unlock exclusive features like buying crypto, 
          withdrawing cash dollars, priority merchant 
          matches, and lower fees. Elevate your 
          financial experience today!
        </p>

        {/* Features */}
        <div className="space-y-6 mb-8">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center flex-shrink-0">
              <Banknote size={24} className="text-red-500" />
            </div>
            <div>
              <h3 className="font-semibold text-black mb-1">
                Flexible Cash Withdrawals
              </h3>
              <p className="text-sm text-gray-600">
                Seamlessly access USD in cash anytime, anywhere.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center flex-shrink-0">
              <Gem size={24} className="text-red-500" />
            </div>
            <div>
              <h3 className="font-semibold text-black mb-1">
                Priority Support & Transactions
              </h3>
              <p className="text-sm text-gray-600">
                Receive 24/7 dedicated priority support and experience lightning-fast transactions.
              </p>
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-black mb-2">
            Premium Yearly Subscription
          </h2>
          <div className="flex items-baseline mb-2">
            <span className="text-4xl font-bold text-red-500">$99.99</span>
            <span className="text-gray-600 ml-2">/year</span>
          </div>
          <p className="text-sm text-gray-600">
            Billed annually. Save over $20 compared to the monthly plan.
          </p>
        </div>

        {/* Payment Options */}
        <div className="mb-8">
          <h3 className="font-semibold text-black mb-4">
            Secure Payment Options
          </h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center">
              <CryptoIcon symbol="BTC" size={32} />
            </div>
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center">
              <CryptoIcon symbol="USDT" size={32} />
            </div>
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center">
              <CryptoIcon symbol="ETH" size={32} />
            </div>
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center">
              <CryptoIcon symbol="XRP" size={32} />
            </div>
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center">
              <CryptoIcon symbol="BNB" size={32} />
            </div>
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center">
              <CryptoIcon symbol="DOGE" size={32} />
            </div>
          </div>
        </div>

        {/* Subscribe Button */}
        <Button 
          onClick={() => navigate('/premium-payment')}
          className="w-full h-14 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg text-base mb-8"
        >
          Subscribe Now
        </Button>

        {/* FAQ */}
        <div>
          <h3 className="font-bold text-black text-xl mb-4">
            Frequently Asked Questions
          </h3>
          <div className="space-y-1">
            {faqItems.map((item, index) => (
              <div key={index} className="border-b border-gray-100 last:border-b-0">
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full py-4 flex items-center justify-between text-left"
                >
                  <span className="font-medium text-black">{item.question}</span>
                  {expandedFaq === index ? (
                    <ChevronDown size={20} className="text-gray-500" />
                  ) : (
                    <ChevronRight size={20} className="text-gray-500" />
                  )}
                </button>
                {expandedFaq === index && (
                  <div className="pb-4">
                    <p className="text-gray-600 text-sm leading-relaxed">
                      {item.answer}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Terms */}
        <div className="mt-8 pt-6 border-t border-gray-100">
          <p className="text-xs text-gray-500 text-center leading-relaxed">
            By subscribing, you agree to automatic annual renewal. 
            You can manage or cancel your subscription anytime in 
            your account settings.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Premium;