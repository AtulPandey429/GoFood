import React, { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { Link } from "react-router-dom";
const SignUp = () => {
  const [credential, setCredential] = useState({
    name: "",
    email: "",
    password: "",
    geolocation: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("https://gofood-ezlb.onrender.com/api/user/signup", {
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
      });

      const json = await res.json();
      console.log(json);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const getValue = (v) => {
    setCredential({ ...credential, [v.target.name]: v.target.value });
  };

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card">
            <div className="card-header bg-primary text-white">Signup</div>
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                <div className="mb-3 row">
                  <label htmlFor="username" className="col-sm-4 col-form-label">
                    Username
                  </label>
                  <div className="col-sm-8">
                    <input
                      onChange={getValue}
                      type="text"
                      className="form-control"
                      id="username"
                      name="name"
                      value={credential.name}
                      required
                    />
                  </div>
                </div>
                <div className="mb-3 row">
                  <label htmlFor="email" className="col-sm-4 col-form-label">
                    Email
                  </label>
                  <div className="col-sm-8">
                    <input
                      onChange={getValue}
                      type="email"
                      className="form-control"
                      id="email"
                      name="email"
                      value={credential.email}
                      required
                    />
                  </div>
                </div>
                <div className="mb-3 row">
                  <label htmlFor="password" className="col-sm-4 col-form-label">
                    Password
                  </label>
                  <div className="col-sm-8">
                    <input
                      onChange={getValue}
                      type="password"
                      className="form-control"
                      id="password"
                      name="password"
                      value={credential.password}
                      required
                    />
                  </div>
                </div>
                <div className="mb-3 row">
                  <label
                    htmlFor="geolocation"
                    className="col-sm-4 col-form-label"
                  >
                    Location
                  </label>
                  <div className="col-sm-8">
                    <input
                      onChange={getValue}
                      type="text"
                      className="form-control"
                      id="geolocation"
                      name="geolocation"
                      value={credential.geolocation}
                      required
                    />
                  </div>
                </div>
                <div className="mb-3">
                  <button type="submit" className="btn btn-primary ">
                    Signup
                  </button>
                  <Link className=" m-3 btn btn-danger" to="/login">
                    Already a user
                  </Link>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default SignUp;
