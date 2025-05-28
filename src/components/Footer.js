// frontend/src/components/Footer.js
import React, { useState } from "react";
import "./Footer.css";
import { FaGithub, FaTwitter, FaLinkedin } from "react-icons/fa";

const Footer = () => {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = () => {
    if (!email || !email.includes("@")) {
      alert("Please enter a valid email address.");
      return;
    }

    // Simulate sending email (you can hook this to a backend or Mailchimp)
    console.log("Subscribed:", email);
    setSubscribed(true);
    setEmail("");
  };

  return (
    <footer className="footer">
      <div className="footer-content">

        <div className="footer-links">
          <a href="#">Home</a>
          <a href="#">About</a>
          <a href="#">Contact</a>
        </div>

        <div className="newsletter">
          <p>Subscribe to our newsletter</p>
          {subscribed ? (
            <span className="confirmation">Thanks for subscribing!</span>
          ) : (
            <div className="newsletter-form">
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <button onClick={handleSubscribe}>Subscribe</button>
            </div>
          )}
        </div>

        <div className="social-icons">
          <a href="https://github.com/" target="_blank" rel="noopener noreferrer">
            <FaGithub />
          </a>
          <a href="https://twitter.com/" target="_blank" rel="noopener noreferrer">
            <FaTwitter />
          </a>
          <a href="https://linkedin.com/" target="_blank" rel="noopener noreferrer">
            <FaLinkedin />
          </a>
          
        </div>
         <p>© {new Date().getFullYear()} EasyWebScrape. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
