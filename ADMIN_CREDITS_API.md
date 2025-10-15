# Admin Credits Management API

## Base URL
```
https://towffqxmmqyhbuyphkui.supabase.co/functions/v1/admin-credits
```

## Authentication
All requests require admin authentication. Include `adminId` in request body.

## API Endpoints

### 1. Add Credits to Individual User
```javascript
// POST /admin-credits
{
  "action": "add_credits",
  "userId": "user-uuid-here",
  "credits": 100,
  "reason": "Promotional bonus",
  "adminId": "admin-uuid-here"
}

// Response
{
  "success": true,
  "newBalance": 150,
  "user": "John Doe"
}
```

### 2. Add Credits to All Users (Bulk)
```javascript
// POST /admin-credits
{
  "action": "bulk_add_credits",
  "credits": 50,
  "reason": "Platform launch bonus",
  "adminId": "admin-uuid-here"
}

// Response
{
  "success": true,
  "usersUpdated": 245,
  "creditsAdded": 50
}
```

### 3. Get User Credits
```javascript
// POST /admin-credits
{
  "action": "get_user_credits",
  "userId": "user-uuid-here",
  "adminId": "admin-uuid-here"
}

// Response
{
  "success": true,
  "credits": 75,
  "user": "John Doe"
}
```

## Next.js Implementation Examples

### 1. Add Credits to User
```javascript
// pages/api/admin/add-credits.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId, credits, reason } = req.body;
  const adminId = req.user.id; // Get from your auth system

  try {
    const response = await fetch('https://towffqxmmqyhbuyphkui.supabase.co/functions/v1/admin-credits', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'add_credits',
        userId,
        credits: parseInt(credits),
        reason,
        adminId
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error);
    }

    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
```

### 2. Bulk Add Credits Component
```javascript
// components/BulkCreditsForm.jsx
import { useState } from 'react';

export default function BulkCreditsForm() {
  const [credits, setCredits] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/admin/bulk-credits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          credits: parseInt(credits),
          reason
        })
      });

      const data = await response.json();
      
      if (data.success) {
        alert(`Added ${credits} credits to ${data.usersUpdated} users`);
        setCredits('');
        setReason('');
      }
    } catch (error) {
      alert('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label>Credits to Add:</label>
        <input
          type="number"
          value={credits}
          onChange={(e) => setCredits(e.target.value)}
          required
          className="border p-2 rounded"
        />
      </div>
      
      <div>
        <label>Reason:</label>
        <input
          type="text"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="e.g., Platform launch bonus"
          className="border p-2 rounded w-full"
        />
      </div>
      
      <button
        type="submit"
        disabled={loading}
        className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
      >
        {loading ? 'Adding...' : 'Add Credits to All Users'}
      </button>
    </form>
  );
}
```

### 3. Individual User Credits Management
```javascript
// components/UserCreditsManager.jsx
import { useState } from 'react';

export default function UserCreditsManager({ userId, userName }) {
  const [credits, setCredits] = useState('');
  const [currentCredits, setCurrentCredits] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchUserCredits = async () => {
    try {
      const response = await fetch('/api/admin/get-user-credits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId })
      });

      const data = await response.json();
      if (data.success) {
        setCurrentCredits(data.credits);
      }
    } catch (error) {
      console.error('Error fetching credits:', error);
    }
  };

  const addCredits = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/add-credits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          credits: parseInt(credits),
          reason: `Manual addition by admin`
        })
      });

      const data = await response.json();
      if (data.success) {
        setCurrentCredits(data.newBalance);
        setCredits('');
        alert(`Added ${credits} credits to ${userName}`);
      }
    } catch (error) {
      alert('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border p-4 rounded">
      <h3>{userName}</h3>
      <p>Current Credits: <strong>{currentCredits}</strong></p>
      
      <div className="flex gap-2 mt-2">
        <input
          type="number"
          value={credits}
          onChange={(e) => setCredits(e.target.value)}
          placeholder="Credits to add"
          className="border p-1 rounded"
        />
        <button
          onClick={addCredits}
          disabled={loading || !credits}
          className="bg-green-500 text-white px-3 py-1 rounded disabled:opacity-50"
        >
          Add Credits
        </button>
        <button
          onClick={fetchUserCredits}
          className="bg-blue-500 text-white px-3 py-1 rounded"
        >
          Refresh
        </button>
      </div>
    </div>
  );
}
```

## Database Tables

### profiles table
- `credits_balance` (INTEGER) - User's current credit balance

### credit_transactions table (audit trail)
- `user_id` (UUID) - User who received/lost credits
- `amount` (INTEGER) - Credits added/removed
- `type` (TEXT) - 'admin_add', 'admin_bulk_add', 'purchase', 'usage'
- `reason` (TEXT) - Why credits were added/removed
- `admin_id` (UUID) - Admin who performed the action
- `balance_before` (INTEGER) - Balance before transaction
- `balance_after` (INTEGER) - Balance after transaction

## Security Notes
- All operations require admin role verification
- Complete audit trail maintained
- CORS enabled for Next.js integration
- Service role key required for database access