import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import ApiClient from "../factories/api/ApiClient";

const SignUp = () => {
  const [credential, setCredential] = useState({
    name: "",
    email: "",
    password: "",
    geolocation: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await ApiClient.post("/api/auth/signup", {
        name: credential.name,
        email: credential.email,
        password: credential.password,
        location: credential.geolocation || "",
      });
      navigate("/login");
    } catch (err) {
      setError(err.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  const getCurrentLocation = () => {
    if (!("geolocation" in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const res = await fetch(
            `https://api.opencagedata.com/geocode/v1/json?q=${latitude}+${longitude}&key=182cdc8c47cd4da7864864003692fd01`
          );
          const data = await res.json();
          if (data.results?.length > 0) {
            setCredential((prev) => ({ ...prev, geolocation: data.results[0].formatted }));
          }
        } catch (err) {
          console.error("Error fetching location:", err);
        }
      },
      (err) => console.error("Geolocation error:", err)
    );
  };

  const getValue = (e) => {
    setCredential({ ...credential, [e.target.name]: e.target.value });
  };

  return (
    <div className="page-shell flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="text-3xl font-bold text-red-500 hover:text-red-400">
            GoFood
          </Link>
          <p className="text-slate-400 mt-2">Create your account</p>
        </div>

        <div className="auth-card">
          {error && <div className="alert-error mb-4">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">
                Username
              </label>
              <input
                onChange={getValue}
                type="text"
                className="input-field"
                placeholder="Your name"
                name="name"
                value={credential.name}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">
                Email
              </label>
              <input
                onChange={getValue}
                type="email"
                className="input-field"
                placeholder="you@email.com"
                name="email"
                value={credential.email}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">
                Password
              </label>
              <input
                onChange={getValue}
                type="password"
                className="input-field"
                placeholder="Min. 6 characters"
                name="password"
                value={credential.password}
                minLength={6}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">
                Location <span className="normal-case text-slate-600">(optional)</span>
              </label>
              <div className="flex gap-2">
                <input
                  onChange={getValue}
                  type="text"
                  className="input-field flex-1"
                  placeholder="City or address"
                  name="geolocation"
                  value={credential.geolocation}
                />
                <button type="button" onClick={getCurrentLocation} className="btn-secondary whitespace-nowrap text-sm">
                  Locate
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full py-3 disabled:opacity-60">
              {loading ? "Creating account…" : "Sign up"}
            </button>
          </form>

          <p className="text-center mt-6 text-sm text-slate-400">
            Already have an account?{" "}
            <Link to="/login" className="text-red-400 hover:text-red-300 font-medium">
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
