import { Navigate, Outlet } from 'react-router-dom';
import PropTypes from 'prop-types';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ redirectPath = '/login' }) => {
  const { isAuthenticated, loading } = useAuth();
  
  // If still loading auth state, show nothing
  if (loading) {
    return null;
  }
  
  // If not authenticated, redirect to login
  if (!isAuthenticated()) {
    return <Navigate to={redirectPath} replace />;
  }
  
  // If authenticated, render the child routes
  return <Outlet />;
};

ProtectedRoute.propTypes = {
  redirectPath: PropTypes.string,
};

export default ProtectedRoute;