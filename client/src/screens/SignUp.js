import React, { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";

const SignUp = () => {
  const [credential, setCredential] = useState({
    name: "",
    email: "",
    password: "",
    geolocation: "",
  });
  const history = useNavigate(); // Initialize the history object

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(
        "https://gofood-ezlb.onrender.com/api/user/signup",
        {
          method: "POST",
          headers: {
            "Content-type": "application/json",
          },
          body: JSON.stringify({
            name: credential.name,
            email: credential.email,
            password: credential.password,
            location: credential.geolocation,
          }),
        }
      );

      if (res.status === 200) {
        // Successful signup, navigate to the home page
        history("/login"); // Change "/" to the actual route of your home page
      } else {
        const json = await res.json();
        console.error("Error signing up:", json);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };
  const getCurrentLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const latitude = position.coords.latitude;
          const longitude = position.coords.longitude;
          const apiKey = "182cdc8c47cd4da7864864003692fd01"; // Replace with your actual OpenCage API key

          try {
            const response = await axios.get(
              `https://api.opencagedata.com/geocode/v1/json?q=${latitude}+${longitude}&key=${apiKey}`
            );

            if (response.status === 200 && response.data.results.length > 0) {
              const location = response.data.results[0].formatted;

              // Update the state with the retrieved location
              setCredential({ ...credential, geolocation: location });
            }
          } catch (error) {
            console.error("Error fetching location data:", error);
          }
        },
        (error) => {
          console.error("Error getting location:", error);
        }
      );
    } else {
      console.error("Geolocation is not available in this browser.");
    }
  };

  const getValue = (v) => {
    setCredential({ ...credential, [v.target.name]: v.target.value });
  };

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card swiggy-signup-card"> {/* Apply custom CSS class */}
            <div className="card-header swiggy-signup-header"> {/* Apply custom CSS class */}
              <h2>Signup</h2>
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <input
                    onChange={getValue}
                    type="text"
                    className="form-control"
                    placeholder="Username"
                    name="name"
                    value={credential.name}
                    required
                  />
                </div>
                <div className="mb-3">
                  <input
                    onChange={getValue}
                    type="email"
                    className="form-control"
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
                    className="form-control"
                    placeholder="Password"
                    name="password"
                    value={credential.password}
                    required
                  />
                </div>
                <div className="mb-3 input-group">
                  <input
                    onChange={getValue}
                    type="text"
                    className="form-control"
                    placeholder="Location"
                    name="geolocation"
                    value={credential.geolocation}
                    required
                  />
                  <button
                    onClick={getCurrentLocation}
                    className="btn btn-secondary"
                  >
                    Get Location
                  </button>
                </div>

                <div className="mb-3 text-center">
                  <button type="submit" className="btn swiggy-signup-button"> {/* Apply custom CSS class */}
                    Signup
                  </button>
                </div>
                <p className="text-center">
                  Already a user?{" "}
                  <Link to="/login" className="btn btn-danger">
                    Login
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
export default SignUp;
