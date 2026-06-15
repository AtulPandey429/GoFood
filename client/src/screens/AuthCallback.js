import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import ApiClient from "../factories/api/ApiClient";
import { useAuth } from "../contexts/AuthContext";

const AuthCallback = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    const token = params.get("token");
    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    localStorage.setItem("authToken", token);
    ApiClient.get("/api/auth/me")
      .then((data) => {
        login(token, data.user);
        navigate("/", { replace: true });
      })
      .catch(() => {
        localStorage.removeItem("authToken");
        navigate("/login", { replace: true });
      });
  }, [params, login, navigate]);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
      Completing sign in...
    </div>
  );
};

export default AuthCallback;
