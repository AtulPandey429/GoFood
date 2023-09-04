import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Badge from "@material-ui/core/Badge";
import ShoppingCartIcon from "@material-ui/icons/ShoppingCart";
import "./navbar.css";
import Modal from "../screens/Modal";
import Cart from "../screens/Cart";
import { useCart } from "./ContextReducer";

const Navbar = () => {
  const [cartView, setCartView] = useState(false);
  const [isNavCollapsed, setIsNavCollapsed] = useState(true); // Add state to track collapsed status
  const navigate = useNavigate();
  const handleClick = () => {
    localStorage.removeItem("authToken");
    navigate("/");
  };
  const loadCart = () => {
    setCartView(true);
  };

  const items = useCart();

  // Function to toggle the navigation menu
  const handleNavCollapse = () => {
    setIsNavCollapsed(!isNavCollapsed);
  };

  return (
    <div>
      <nav className="navbar navbar-expand-lg navbar-light">
        <div className="container-fluid">
          <Link className="navbar-brand text-danger" to="/">
            <strong>GoFood</strong>
          </Link>

          {/* Add "collapsed" class to collapse button based on isNavCollapsed state */}
          <button
            className={`navbar-toggler ${isNavCollapsed ? "collapsed" : ""}`}
            type="button"
            aria-controls="navbarNav"
            aria-expanded={!isNavCollapsed}
            aria-label="Toggle navigation"
            onClick={handleNavCollapse}
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          <div
            className={`collapse navbar-collapse justify-content-end ${
              isNavCollapsed ? "" : "show" // Show or hide based on isNavCollapsed state
            }`}
            id="navbarNav"
          >
            <ul className="navbar-nav">
              <li className="nav-item">
                <Link className="nav-link text-black" to="/">
                  Home
                </Link>
              </li>
              {localStorage.getItem("authToken") ? (
                <li className="nav-item">
                  <Link className="nav-link text-dark" to="/myOrder">
                    My Order
                  </Link>
                </li>
              ) : null}
            </ul>

            {!localStorage.getItem("authToken") ? (
              <ul className="navbar-nav">
                <li className="nav-item">
                  <button className="btn btn-danger my-1">
                    <Link className="nav-link text-white" to="/login">
                      Login
                    </Link>
                  </button>
                </li>
                <li className="nav-item">
                  <button className="btn btn-success my-1">
                    <Link className="nav-link text-white" to="/signup">
                      SignUp
                    </Link>
                  </button>
                </li>
              </ul>
            ) : (
              <ul className="navbar-nav">
                <li className="nav-item m-2">
                  <button className="btn btn-danger" onClick={loadCart}>
                    <Badge color="secondary" badgeContent={items.length}>
                      <ShoppingCartIcon />
                    </Badge>
                    Cart
                  </button>
                </li>
                <li className="nav-item m-2">
                  <button
                    className="btn btn-primary text-white"
                    onClick={handleClick}
                  >
                    LogOut
                  </button>
                </li>
              </ul>
            )}
          </div>
        </div>
      </nav>

      {cartView && (
        <Modal
          onClose={() => {
            setCartView(false);
          }}
        >
          <Cart />
        </Modal>
      )}
    </div>
  );
};

export default Navbar;
