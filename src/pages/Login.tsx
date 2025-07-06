
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "react-router-dom";
import { Eye, EyeOff, Fingerprint } from "lucide-react";

const Login = () => {
  const [formData, setFormData] = useState({
    emailOrUsername: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Login submitted:', formData);
  };

  const handleBiometricLogin = () => {
    console.log('Biometric login attempted');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 px-6 py-8">
      <div className="max-w-sm mx-auto">
        {/* Welcome Message with Emoji */}
        <div className="text-center mb-8">
          <div className="text-4xl mb-4">👋</div>
          <h1 className="text-2xl font-semibold text-black mb-2" style={{ fontFamily: 'Poppins' }}>
            Welcome Back
          </h1>
          <p className="text-sm text-gray-600" style={{ fontFamily: 'Inter' }}>
            Login to continue your crypto trades
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email/Username Input */}
          <div className="space-y-2">
            <Label htmlFor="emailOrUsername" className="text-sm font-medium text-gray-700" style={{ fontFamily: 'Inter' }}>
              Email or Username
            </Label>
            <Input
              id="emailOrUsername"
              type="text"
              value={formData.emailOrUsername}
              onChange={(e) => handleInputChange('emailOrUsername', e.target.value)}
              className="h-12 bg-white border border-gray-300 rounded-xl px-4"
              placeholder="sarah@example.com or sarah123"
            />
          </div>

          {/* Password Input */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="password" className="text-sm font-medium text-gray-700" style={{ fontFamily: 'Inter' }}>
                Password
              </Label>
              <Link to="/forgot-password" className="text-xs text-blue-500 font-medium" style={{ fontFamily: 'Inter' }}>
                Forgot Password?
              </Link>
            </div>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                className="h-12 bg-white border border-gray-300 rounded-xl px-4 pr-12"
                placeholder="Enter your password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {/* Biometric Option */}
          <div className="bg-gray-50 rounded-xl p-4 text-center">
            <button
              type="button"
              onClick={handleBiometricLogin}
              className="flex items-center justify-center space-x-2 mx-auto"
            >
              <Fingerprint size={24} className="text-blue-500" />
              <span className="text-sm font-medium text-gray-800" style={{ fontFamily: 'Inter' }}>
                Tap to login with fingerprint
              </span>
            </button>
          </div>

          {/* CTA Button */}
          <Button
            type="submit"
            className="w-full h-14 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-xl text-base"
            style={{ fontFamily: 'Poppins' }}
          >
            Login to Account
          </Button>

          {/* Footer Link */}
          <div className="text-center pt-4">
            <p className="text-sm text-blue-500" style={{ fontFamily: 'Inter' }}>
              Don't have an account?{' '}
              <Link to="/signup" className="font-medium underline">
                Create one
              </Link>
            </p>
          </div>

          {/* Security Note */}
          <div className="text-center pt-6">
            <p className="text-xs text-gray-500 italic" style={{ fontFamily: 'Inter' }}>
              Your credentials are encrypted. Login is protected by 256-bit security
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
