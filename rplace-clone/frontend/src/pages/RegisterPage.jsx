import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Register from '../components/Register';
import { useAuth } from '../context/AuthContext';

const RegisterPage = () => {
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
    <div className="auth-page register-page">
      <div className="page-header">
        <h1>Register</h1>
        <p>
          Create an account to start creating canvases and placing pixels.
        </p>
      </div>
      
      <div className="auth-container">
        <Register />
      </div>
    </div>
  );
};

export default RegisterPage;