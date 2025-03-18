import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Login from '../components/Login';
import { useAuth } from '../context/AuthContext';

const LoginPage = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  // Redirect to home if already authenticated
  useEffect(() => {
    if (isAuthenticated()) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);
  
  if (isAuthenticated()) {
    return null; // Will redirect in useEffect
  }
  
  return (
    <div className="auth-page login-page">
      <div className="page-header">
        <h1>Login</h1>
        <p>
          Login to your account to create canvases and place pixels.
        </p>
      </div>
      
      <div className="auth-container">
        <Login />
      </div>
    </div>
  );
};

export default LoginPage;