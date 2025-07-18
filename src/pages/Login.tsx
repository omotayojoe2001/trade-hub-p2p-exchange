
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Fingerprint } from "lucide-react";
import ConfirmationSuccess from '@/components/ConfirmationSuccess';

const Login = () => {
  const [formData, setFormData] = useState({
    emailOrUsername: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const navigate = useNavigate();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Login submitted:', formData);
    setShowConfirmation(true);
  };

  const handleBiometricLogin = () => {
    console.log('Biometric login attempted');
    setShowConfirmation(true);
  };

  const handleConfirmationClose = () => {
    setShowConfirmation(false);
    navigate('/home');
  };

  return (
    <div className="min-h-screen bg-white px-4 py-8">
      <div className="max-w-sm mx-auto">
        {/* Welcome Message */}
        <div className="text-center mb-8">
          <div className="text-4xl mb-4">👋</div>
          <h1 className="text-2xl font-bold text-black mb-2">
            Welcome Back
          </h1>
          <p className="text-sm text-gray-600">
            Login to continue your crypto trades
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email/Username Input */}
          <div className="space-y-2">
            <Label htmlFor="emailOrUsername" className="text-sm font-medium text-gray-700">
              Email or Username
            </Label>
            <Input
              id="emailOrUsername"
              type="text"
              value={formData.emailOrUsername}
              onChange={(e) => handleInputChange('emailOrUsername', e.target.value)}
              className="h-12 bg-white border border-gray-300 rounded-lg px-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="sarah@example.com or sarah123"
            />
          </div>

          {/* Password Input */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                Password
              </Label>
              <Link to="/forgot-password" className="text-xs text-blue-500 font-medium">
                Forgot Password?
              </Link>
            </div>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                className="h-12 bg-white border border-gray-300 rounded-lg px-4 pr-12 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your password"
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

          {/* Biometric Option */}
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <button
              type="button"
              onClick={handleBiometricLogin}
              className="flex items-center justify-center space-x-2 mx-auto"
            >
              <Fingerprint size={20} className="text-blue-500" />
              <span className="text-sm font-medium text-gray-700">
                Tap to login with fingerprint
              </span>
            </button>
          </div>

          {/* CTA Button */}
          <Button
            type="submit"
            className="w-full h-12 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg text-sm"
          >
            Login to Account
          </Button>

          {/* Footer Link */}
          <div className="text-center pt-4">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link to="/signup" className="text-blue-500 font-medium">
                Create one
              </Link>
            </p>
          </div>

          {/* Security Note */}
          <div className="text-center pt-6">
            <p className="text-xs text-gray-500 italic">
              Your credentials are encrypted. Login is protected by 256-bit security
            </p>
          </div>
        </form>
      </div>

      <ConfirmationSuccess
        isOpen={showConfirmation}
        onClose={handleConfirmationClose}
        title="Login Successful!"
        message="Welcome back! You have been successfully logged in to your account."
      />
    </div>
  );
};

export default Login;
