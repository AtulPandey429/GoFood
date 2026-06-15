import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const ProtectedRoute = ({ children }) => {
  const { token, loading } = useAuth();
  if (loading) return <div className="text-center mt-5">Loading...</div>;
  if (!token) return <Navigate to="/login" replace />;
  return children;
};

export default ProtectedRoute;
