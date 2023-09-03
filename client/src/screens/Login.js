import React, { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { Link, useNavigate } from "react-router-dom";
import "./Login.css";
const Login = () => {
  const [credential, setCredential] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState(""); // State for error messages
  let navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); // Clear any previous error
    try {
      const res = await fetch(
        "https://gofood-ezlb.onrender.com/api/user/login",
        {
          method: "POST",
          headers: {
            "Content-type": "application/json",
          },
          body: JSON.stringify({
            email: credential.email,
            password: credential.password,
          }),
        }
      );

      const json = await res.json();
      if (json.success) {
        localStorage.setItem("userEmail", credential.email);
        localStorage.setItem("authToken", json.authToken);
        navigate("/");
      } else {
        setError("Invalid email or password"); // Set error message
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      setError("An error occurred while logging in"); // Set a generic error message
    }
  };

  const getValue = (v) => {
    setCredential({ ...credential, [v.target.name]: v.target.value });
  };

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card apple-login-card">
            {" "}
            {/* Apply custom CSS class */}
            <div className="card-header apple-login-header">
              {" "}
              {/* Apply custom CSS class */}
              <h2>Login</h2>
            </div>
            <div className="card-body">
              {error && <div className="alert alert-danger">{error}</div>}{" "}
              {/* Display error message */}
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <input
                    onChange={getValue}
                    type="email"
                    className="form-control apple-input"
                    placeholder="Email"
                    name="email"
                    value={credential.email}
                    required
                  />
                </div>
                <div className="mb-3">
                  <input
                    onChange={getValue}
                    type="password"
                    className="form-control apple-input"
                    placeholder="Password"
                    name="password"
                    value={credential.password}
                    required
                  />
                </div>
                <div className="mb-3 text-center">
                  <button type="submit" className="btn apple-login-button">
                    Login
                  </button>
                </div>
                <p className="text-center">
                  <Link to="/signup" className="apple-signup-link">
                    I am a new user
                  </Link>
                </p>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
