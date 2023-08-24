import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import  Badge  from   'react-bootstrap/Badge'
import "../index.css"
import Modal from "../screens/Modal";
import Cart from "../screens/Cart";

const Navbar = () => {
  const [cartView, setcartView] = useState(false)
  const navigate = useNavigate();
  const handleClick = ()=>{
    localStorage.removeItem('authToken');
    navigate('/');
  }
  return (
    <div>
      <nav className="navbar navbar-expand-lg text-danger fs-3 bg-success">
        <div className="container-fluid">
          <div className="d-flex align-items-center">
            <Link
              className="navbar-brand fs-1 text-white font-weight-bold"
              to="/"
            >
              GoFood
            </Link>
          </div>

          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarNav"
            aria-controls="navbarNav"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          <div
            className="collapse navbar-collapse justify-content-between"
            id="navbarNav"
          >
            <ul className="navbar-nav">
              <li className="nav-item">
                <Link
                  className="nav-link active text-white"
                  aria-current="page"
                  to="#"
                >
                  Home
                </Link>
              </li>
              {(localStorage.getItem('authToken')) ?
            <li className="nav-item">
            <Link
              className="nav-link active text-white"
              aria-current="page"
              to="#"
            >
              My Order
            </Link>
          </li> : "" 
            }
            </ul>

              {(!localStorage.getItem("authToken")) ? 
            <ul className="navbar-nav  ">
              <li className="nav-item">
              <button  className="btn btn-danger login-button ">

                <Link className="nav-link text-white" to="/login">
                  Login
                </Link>
                </button>
              </li>
              <li className="nav-item">
              <button  className="btn btn- login-button ">

                <Link className="nav-link text-white" to="/signup">
                  SignUp
                </Link>
                </button>
              </li>
              </ul> :
              <ul className="navbar-nav">
               <li className="nav-item">
                <button  className="btn btn-info login-button " onClick={()=>{setcartView(true)}} >
                  My Cart
                  <Badge   pill  bg="danger">2</Badge>
                </button>
              </li>
              {cartView ? <Modal onClose={()=>{setcartView(false)}}> <Cart/></Modal>: null}
               <li className="nav-item">
                <button  className="btn btn-info login-button " onClick={handleClick}>
                  LogOut
                </button>
              </li>
            </ul>
              }
              
          </div>
        </div>
      </nav>
    </div>
  );
};

export default Navbar;
