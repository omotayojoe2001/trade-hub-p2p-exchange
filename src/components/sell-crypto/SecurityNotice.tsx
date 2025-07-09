import React from 'react';
import { Shield } from 'lucide-react';

const SecurityNotice = () => {
  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
      <div className="flex items-start">
        <Shield size={20} className="text-green-600 mr-3 mt-0.5" />
        <div>
          <h4 className="font-medium text-green-800 mb-1">Security Notice</h4>
          <p className="text-green-700 text-sm mb-2">
            Your crypto will be escrowed and released only when both parties confirm the trade completion.
          </p>
          <p className="text-green-700 text-sm">
            We don't hold your funds - this ensures maximum security.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SecurityNotice;