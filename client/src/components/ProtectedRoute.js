import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const ProtectedRoute = ({ children }) => {
  const { token, loading } = useAuth();
  if (loading) {
    return (
      <div className="page-shell flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-400 text-sm">Loading…</p>
        </div>
      </div>
    );
  }
  if (!token) return <Navigate to="/login" replace />;
  return children;
};

export default ProtectedRoute;
