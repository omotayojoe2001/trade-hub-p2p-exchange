
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Link } from "react-router-dom";

const SignUp = () => {
  const [userType, setUserType] = useState<'customer' | 'merchant'>('customer');
  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
    referralCode: '',
    agreeToTerms: false
  });

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    console.log('Form submitted:', formData, 'User type:', userType);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 relative overflow-hidden">
      {/* Abstract crypto background */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-10 w-16 h-16 bg-blue-500 rounded-full animate-pulse"></div>
        <div className="absolute top-40 right-20 w-12 h-12 bg-gray-300 rounded-full animate-bounce"></div>
        <div className="absolute bottom-60 left-20 w-20 h-20 bg-blue-400 rounded-full opacity-50"></div>
        <div className="absolute bottom-32 right-10 w-14 h-14 bg-gray-400 rounded-full opacity-70"></div>
      </div>

      <div className="relative z-10 px-6 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-black mb-2" style={{ fontFamily: 'Poppins' }}>
            Create Account
          </h1>
          <p className="text-base text-gray-800 mb-1" style={{ fontFamily: 'Poppins' }}>
            Join CryptoHub
          </p>
          <p className="text-sm text-gray-600" style={{ fontFamily: 'Inter' }}>
            Create your account to start trading crypto securely
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Form Fields */}
          <div className="space-y-2">
            <Label htmlFor="fullName" className="text-sm font-medium text-gray-700" style={{ fontFamily: 'Inter' }}>
              Full Name
            </Label>
            <Input
              id="fullName"
              type="text"
              value={formData.fullName}
              onChange={(e) => handleInputChange('fullName', e.target.value)}
              className="h-12 bg-white border border-gray-300 rounded-xl px-4"
              placeholder="Enter your full name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="username" className="text-sm font-medium text-gray-700" style={{ fontFamily: 'Inter' }}>
              Username
            </Label>
            <Input
              id="username"
              type="text"
              value={formData.username}
              onChange={(e) => handleInputChange('username', e.target.value)}
              className="h-12 bg-white border border-gray-300 rounded-xl px-4"
              placeholder="Choose a username"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium text-gray-700" style={{ fontFamily: 'Inter' }}>
              Email Address
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className="h-12 bg-white border border-gray-300 rounded-xl px-4"
              placeholder="Enter your email"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone" className="text-sm font-medium text-gray-700" style={{ fontFamily: 'Inter' }}>
              Phone Number
            </Label>
            <div className="flex">
              <div className="flex items-center bg-white border border-gray-300 rounded-l-xl px-3">
                <span className="text-xl mr-2">🇳🇬</span>
                <span className="text-sm text-gray-600">+234</span>
              </div>
              <Input
                id="phone"
                type="tel"
                value={formData.phoneNumber}
                onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                className="h-12 bg-white border border-gray-300 rounded-r-xl border-l-0 px-4 flex-1"
                placeholder="8012345678"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium text-gray-700" style={{ fontFamily: 'Inter' }}>
              Password
            </Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              className="h-12 bg-white border border-gray-300 rounded-xl px-4"
              placeholder="Create a strong password"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700" style={{ fontFamily: 'Inter' }}>
              Confirm Password
            </Label>
            <Input
              id="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
              className="h-12 bg-white border border-gray-300 rounded-xl px-4"
              placeholder="Confirm your password"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="referralCode" className="text-sm font-medium text-gray-700" style={{ fontFamily: 'Inter' }}>
              Referral Code (Optional)
            </Label>
            <Input
              id="referralCode"
              type="text"
              value={formData.referralCode}
              onChange={(e) => handleInputChange('referralCode', e.target.value)}
              className="h-12 bg-white border border-gray-300 rounded-xl px-4"
              placeholder="Enter referral code"
            />
            <p className="text-xs text-gray-500 italic" style={{ fontFamily: 'Inter' }}>
              Enter a referral code if you have one. If not, cryptohub will be used by default.
            </p>
          </div>

          {/* Referral Banner */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
            <div className="flex items-start">
              <span className="text-base mr-2">📌</span>
              <p className="text-xs text-blue-600" style={{ fontFamily: 'Inter' }}>
                Earn with Referrals! You'll get a % commission on every trade made by users you refer.
              </p>
            </div>
          </div>

          {/* User Type Toggle */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-gray-700" style={{ fontFamily: 'Inter' }}>
              Account Type
            </Label>
            <div className="flex bg-gray-100 rounded-xl p-1">
              <button
                type="button"
                onClick={() => setUserType('customer')}
                className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all ${
                  userType === 'customer'
                    ? 'bg-blue-500 text-white shadow-sm'
                    : 'bg-transparent text-gray-600'
                }`}
                style={{ fontFamily: 'Inter' }}
              >
                Customer
              </button>
              <button
                type="button"
                onClick={() => setUserType('merchant')}
                className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all ${
                  userType === 'merchant'
                    ? 'bg-blue-500 text-white shadow-sm'
                    : 'bg-transparent text-gray-600'
                }`}
                style={{ fontFamily: 'Inter' }}
              >
                Merchant
              </button>
            </div>
          </div>

          {/* Terms Checkbox */}
          <div className="flex items-start space-x-3">
            <Checkbox
              id="terms"
              checked={formData.agreeToTerms}
              onCheckedChange={(checked) => handleInputChange('agreeToTerms', checked as boolean)}
              className="mt-1"
            />
            <Label htmlFor="terms" className="text-xs text-gray-600 leading-relaxed" style={{ fontFamily: 'Inter' }}>
              I agree to the Terms and Privacy Policy
            </Label>
          </div>

          {/* CTA Button */}
          <Button
            type="submit"
            className="w-full h-14 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-xl text-base"
            style={{ fontFamily: 'Poppins' }}
            disabled={!formData.agreeToTerms}
          >
            Create Account
          </Button>

          {/* Footer Link */}
          <div className="text-center pt-4">
            <p className="text-sm text-blue-500" style={{ fontFamily: 'Inter' }}>
              Already have an account?{' '}
              <Link to="/login" className="font-medium underline">
                Log In
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SignUp;
