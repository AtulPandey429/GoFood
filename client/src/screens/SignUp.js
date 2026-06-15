import React, { useState } from "react";
import axios from "axios";
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
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await ApiClient.post("/api/auth/signup", {
        name: credential.name,
        email: credential.email,
        password: credential.password,
        location: credential.geolocation,
      });
      navigate("/login");
    } catch (err) {
      setError(err.message || "Signup failed");
    }
  };

  const getCurrentLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          const apiKey = "182cdc8c47cd4da7864864003692fd01";
          try {
            const response = await axios.get(
              `https://api.opencagedata.com/geocode/v1/json?q=${latitude}+${longitude}&key=${apiKey}`
            );
            if (response.status === 200 && response.data.results.length > 0) {
              const location = response.data.results[0].formatted;
              setCredential({ ...credential, geolocation: location });
            }
          } catch (err) {
            console.error("Error fetching location data:", err);
          }
        },
        (err) => console.error("Error getting location:", err)
      );
    }
  };

  const getValue = (v) => {
    setCredential({ ...credential, [v.target.name]: v.target.value });
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="text-3xl font-bold text-red-500">GoFood</Link>
          <p className="text-slate-400 mt-2">Create your account</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          {error && (
            <div className="mb-4 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              onChange={getValue}
              type="text"
              className="input-field"
              placeholder="Username"
              name="name"
              value={credential.name}
              required
            />
            <input
              onChange={getValue}
              type="email"
              className="input-field"
              placeholder="Email"
              name="email"
              value={credential.email}
              required
            />
            <input
              onChange={getValue}
              type="password"
              className="input-field"
              placeholder="Password"
              name="password"
              value={credential.password}
              required
            />
            <div className="flex gap-2">
              <input
                onChange={getValue}
                type="text"
                className="input-field flex-1"
                placeholder="Location"
                name="geolocation"
                value={credential.geolocation}
                required
              />
              <button
                type="button"
                onClick={getCurrentLocation}
                className="btn-secondary whitespace-nowrap text-sm"
              >
                Locate
              </button>
            </div>
            <button type="submit" className="btn-primary w-full py-3">
              Sign up
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
