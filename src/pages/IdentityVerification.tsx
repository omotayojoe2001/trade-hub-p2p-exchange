import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Shield, AlertCircle, FileCheck, User, Calendar, Phone, CreditCard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const IdentityVerification = () => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    bvn: "",
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    phoneNumber: ""
  });
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    if (!formData.bvn || formData.bvn.length !== 11) {
      toast({
        title: "Invalid BVN",
        description: "Please enter a valid 11-digit BVN",
        variant: "destructive"
      });
      return false;
    }

    if (!formData.firstName.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter your first name",
        variant: "destructive"
      });
      return false;
    }

    if (!formData.lastName.trim()) {
      toast({
        title: "Missing Information", 
        description: "Please enter your last name",
        variant: "destructive"
      });
      return false;
    }

    if (!formData.dateOfBirth) {
      toast({
        title: "Missing Information",
        description: "Please enter your date of birth",
        variant: "destructive"
      });
      return false;
    }

    if (!formData.phoneNumber.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter your phone number",
        variant: "destructive"
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      // Simulate BVN verification API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Store form data for face verification
      sessionStorage.setItem('identity-verification-data', JSON.stringify(formData));
      
      toast({
        title: "Details Verified",
        description: "Your details have been verified. Proceeding to face verification...",
      });

      // Redirect to face verification
      navigate('/face-verification');
      
    } catch (error) {
      toast({
        title: "Verification Failed",
        description: "Unable to verify your details. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-md mx-auto">
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/settings")}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-semibold ml-4">Identity Verification</h1>
        </div>

        <Card>
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileCheck className="w-8 h-8 text-primary" />
            </div>
            <CardTitle>Verify Your Identity</CardTitle>
            <p className="text-muted-foreground">
              Enter your details to verify your identity and comply with financial regulations
            </p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start">
                <Shield size={20} className="text-blue-600 mr-3 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-800 mb-1">Why we need your information</h4>
                  <ul className="text-blue-700 text-sm space-y-1">
                    <li>• Regulatory compliance with CBN guidelines</li>
                    <li>• Enhanced account security with biometric verification</li>
                    <li>• Fraud prevention and risk management</li>
                    <li>• Required for higher transaction limits</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="bvn" className="flex items-center">
                  <CreditCard className="w-4 h-4 mr-2" />
                  Bank Verification Number (BVN)
                </Label>
                <Input
                  id="bvn"
                  type="tel"
                  placeholder="Enter your 11-digit BVN"
                  value={formData.bvn}
                  onChange={(e) => handleInputChange("bvn", e.target.value.replace(/\D/g, '').slice(0, 11))}
                  maxLength={11}
                  className="text-center text-lg tracking-wider"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Dial *565*0# on any phone to get your BVN
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName" className="flex items-center">
                    <User className="w-4 h-4 mr-2" />
                    First Name
                  </Label>
                  <Input
                    id="firstName"
                    type="text"
                    placeholder="John"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange("firstName", e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    type="text"
                    placeholder="Doe"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange("lastName", e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="dateOfBirth" className="flex items-center">
                  <Calendar className="w-4 h-4 mr-2" />
                  Date of Birth
                </Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => handleInputChange("dateOfBirth", e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="phoneNumber" className="flex items-center">
                  <Phone className="w-4 h-4 mr-2" />
                  Phone Number
                </Label>
                <Input
                  id="phoneNumber"
                  type="tel"
                  placeholder="080xxxxxxxx"
                  value={formData.phoneNumber}
                  onChange={(e) => handleInputChange("phoneNumber", e.target.value)}
                />
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start">
                <AlertCircle size={20} className="text-amber-600 mr-3 mt-0.5" />
                <div>
                  <h4 className="font-medium text-amber-800 mb-1">Next Step: Face Verification</h4>
                  <p className="text-amber-700 text-sm">
                    After submitting your details, you'll be asked to complete a quick face verification 
                    for enhanced security and compliance.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-start">
                <Shield size={20} className="text-gray-600 mr-3 mt-0.5" />
                <div>
                  <h4 className="font-medium text-gray-800 mb-1">Privacy & Security</h4>
                  <p className="text-gray-700 text-sm">
                    Your personal information and biometric data are encrypted and stored securely. 
                    We comply with all data protection regulations.
                  </p>
                </div>
              </div>
            </div>

            <Button 
              onClick={handleSubmit} 
              className="w-full" 
              disabled={loading}
            >
              {loading ? "Verifying Details..." : "Continue to Face Verification"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default IdentityVerification;
