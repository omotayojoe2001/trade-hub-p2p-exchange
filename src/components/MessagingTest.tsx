import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import MessageThread from './MessageThread';

const MessagingTest = () => {
  const [showMessage, setShowMessage] = useState(false);

  return (
    <Card className="max-w-md mx-auto mt-8">
      <CardHeader>
        <CardTitle>Messaging System Test</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          Click the button below to test the messaging system
        </p>
        <Button onClick={() => setShowMessage(true)}>
          Open Test Message
        </Button>
        
        {showMessage && (
          <MessageThread
            otherUserId="test-user-123"
            otherUserName="Test User"
            tradeId="test-trade-456"
            contextType="crypto_trade"
            isOpen={showMessage}
            onClose={() => setShowMessage(false)}
          />
        )}
      </CardContent>
    </Card>
  );
};

export default MessagingTest;