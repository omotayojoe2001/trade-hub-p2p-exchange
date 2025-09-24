import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import BottomNavigation from '@/components/BottomNavigation';

const Messages = () => {
  return (
    <div className="min-h-screen bg-background font-['Inter'] pb-20">
      {/* Header */}
      <div className="bg-card border-b border-border px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Link to="/home" className="mr-3">
              <ArrowLeft size={20} className="text-muted-foreground" />
            </Link>
            <h1 className="text-lg font-semibold text-foreground">Messages</h1>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <Card className="bg-card p-6 text-center">
          <h3 className="text-lg font-semibold text-foreground mb-2">No Messages Yet</h3>
          <p className="text-muted-foreground mb-4">
            Your trade messages will appear here when you start trading.
          </p>
          <Button asChild>
            <Link to="/buy-sell">Start Trading</Link>
          </Button>
        </Card>
      </div>

      <BottomNavigation />
    </div>
  );
};

export default Messages;