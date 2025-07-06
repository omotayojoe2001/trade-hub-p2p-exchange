
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Link } from "react-router-dom";
import { User, AtSign, Mail, Phone, Eye, EyeOff, Check } from "lucide-react";

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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted:', formData, 'User type:', userType);
  };

  return (
    <div className="min-h-screen bg-white px-4 py-6">
      <div className="max-w-sm mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-black mb-1">
            Create Account
          </h1>
          <h2 className="text-xl font-semibold text-black mb-2">
            Join CryptoHub
          </h2>
          <p className="text-sm text-gray-600">
            Create your account to start trading crypto securely
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name Input */}
          <div className="space-y-1">
            <Label htmlFor="fullName" className="text-sm font-medium text-gray-700">
              Full Name
            </Label>
            <div className="relative">
              <User size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                id="fullName"
                type="text"
                value={formData.fullName}
                onChange={(e) => handleInputChange('fullName', e.target.value)}
                className="h-12 bg-white border border-gray-300 rounded-lg pl-10 pr-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your full name"
              />
            </div>
          </div>

          {/* Username Input */}
          <div className="space-y-1">
            <Label htmlFor="username" className="text-sm font-medium text-gray-700">
              Username
            </Label>
            <div className="relative">
              <AtSign size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                id="username"
                type="text"
                value={formData.username}
                onChange={(e) => handleInputChange('username', e.target.value)}
                className="h-12 bg-white border border-gray-300 rounded-lg pl-10 pr-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Choose a username"
              />
            </div>
          </div>

          {/* Email Input */}
          <div className="space-y-1">
            <Label htmlFor="email" className="text-sm font-medium text-gray-700">
              Email Address
            </Label>
            <div className="relative">
              <Mail size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="h-12 bg-white border border-gray-300 rounded-lg pl-10 pr-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your email"
              />
            </div>
          </div>

          {/* Phone Input */}
          <div className="space-y-1">
            <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
              Phone Number
            </Label>
            <div className="flex">
              <div className="flex items-center bg-white border border-gray-300 border-r-0 rounded-l-lg px-3">
                <span className="text-lg mr-1">🇳🇬</span>
                <span className="text-sm text-gray-600">+234</span>
              </div>
              <div className="relative flex-1">
                <Phone size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                  className="h-12 bg-white border border-gray-300 rounded-r-lg border-l-0 pl-10 pr-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="8012345678"
                />
              </div>
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-1">
            <Label htmlFor="password" className="text-sm font-medium text-gray-700">
              Password
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                className="h-12 bg-white border border-gray-300 rounded-lg px-4 pr-12 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Create a strong password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Confirm Password Input */}
          <div className="space-y-1">
            <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
              Confirm Password
            </Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                className="h-12 bg-white border border-gray-300 rounded-lg px-4 pr-12 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Confirm your password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400"
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Referral Code Input */}
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <Label htmlFor="referralCode" className="text-sm font-medium text-gray-700">
                Referral Code (Optional)
              </Label>
              <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                <Check size={10} className="text-white" />
              </div>
            </div>
            <Input
              id="referralCode"
              type="text"
              value={formData.referralCode}
              onChange={(e) => handleInputChange('referralCode', e.target.value)}
              className="h-12 bg-white border border-gray-300 rounded-lg px-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter referral code"
            />
            <p className="text-xs text-gray-500">
              Enter a referral code if you have one. If not, cryptohub will be used by default.
            </p>
          </div>

          {/* Referral Banner */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <div className="flex items-start">
              <span className="text-sm mr-2">📌</span>
              <p className="text-xs text-blue-700">
                Earn with Referrals! You'll get a % commission on every trade made by users you refer.
              </p>
            </div>
          </div>

          {/* User Type Toggle */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">
              Account Type
            </Label>
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                type="button"
                onClick={() => setUserType('customer')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                  userType === 'customer'
                    ? 'bg-blue-500 text-white shadow-sm'
                    : 'bg-transparent text-gray-600'
                }`}
              >
                Customer
              </button>
              <button
                type="button"
                onClick={() => setUserType('merchant')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                  userType === 'merchant'
                    ? 'bg-blue-500 text-white shadow-sm'
                    : 'bg-transparent text-gray-600'
                }`}
              >
                Merchant
              </button>
            </div>
          </div>

          {/* Terms Checkbox */}
          <div className="flex items-start space-x-2 py-2">
            <Checkbox
              id="terms"
              checked={formData.agreeToTerms}
              onCheckedChange={(checked) => handleInputChange('agreeToTerms', checked as boolean)}
              className="mt-1"
            />
            <Label htmlFor="terms" className="text-xs text-gray-600 leading-relaxed">
              I agree to the Terms and Privacy Policy
            </Label>
          </div>

          {/* CTA Button */}
          <Button
            type="submit"
            className="w-full h-12 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg text-sm"
            disabled={!formData.agreeToTerms}
          >
            Create Account
          </Button>

          {/* Footer Link */}
          <div className="text-center pt-4">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="text-blue-500 font-medium">
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
