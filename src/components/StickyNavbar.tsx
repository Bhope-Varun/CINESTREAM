import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Film, Heart, Home } from "lucide-react";

export function StickyNavbar() {
  const location = useLocation();

  return (
    <header className="sticky-navbar" id="main-header">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo" id="nav-logo">
          <Film className="logo-icon" size={28} />
          <span>Cine<span className="logo-accent">Stream</span></span>
        </Link>
        <nav className="navbar-links" id="nav-links">
          <Link
            to="/"
            className={`nav-link ${location.pathname === "/" ? "active" : ""}`}
            id="nav-link-home"
          >
            <Home size={18} />
            <span>Home</span>
          </Link>
          <Link
            to="/favorites"
            className={`nav-link ${location.pathname === "/favorites" ? "active" : ""}`}
            id="nav-link-favorites"
          >
            <Heart size={18} />
            <span>Favorites</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
