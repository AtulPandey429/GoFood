import React from "react";
import { Link } from "react-router-dom"; // Import Link component
import "./Footer.css"; // Import your custom CSS for styling

const Footer = () => {
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth", // Smooth scroll behavior
    });
  };
  return (
    <footer className="gofood-footer">
      <div className="container">
        <div className="row">
          <div className="col-md-4">
            <h4 className="footer-heading">About GoFood</h4>
            <p className="footer-text">
              GoFood is your go-to destination for delicious and diverse
              culinary experiences. Explore a wide range of cuisines, from local
              favorites to international delights, all delivered to your
              doorstep. Discover the joy of great food with GoFood.
            </p>
          </div>
          <div className="col-md-4">
            <h4 className="footer-heading">Quick Links</h4>
            <ul className="footer-links">
              <li>
                <Link to="/">Home</Link>
              </li>

              <li>
                <Link to="/contact">Contact</Link>
              </li>
            </ul>
          </div>
          <div className="col-md-4">
            <h4 className="footer-heading">Contact Us</h4>
            <p className="footer-text">
              Email: contact@example.com
              <br />
              Phone: +1 (123) 456-7890
            </p>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <div className="container">
          <button className="scroll-to-top-button btn btn-success" onClick={scrollToTop}>
            Back to Top
          </button>
          <p className="text-center">
            &copy; {new Date().getFullYear()} GoFood
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
