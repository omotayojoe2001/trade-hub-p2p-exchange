import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to the main app page since we don't have a dedicated dashboard yet
    navigate('/', { replace: true });
  }, [navigate]);

  return null;
};

export default Dashboard;