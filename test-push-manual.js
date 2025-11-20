// Manual push notification test
const sendPush = async () => {
  const response = await fetch('https://towffqxmmqyhbuyphkui.supabase.co/functions/v1/send-push-notification', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer YOUR_ANON_KEY'
    },
    body: JSON.stringify({
      userId: 'USER_ID_HERE',
      title: 'Test Notification',
      body: 'This is a manual test',
      data: { test: true }
    })
  });
  
  console.log(await response.json());
};

sendPush();