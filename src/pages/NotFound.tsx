import React from "react";
import { Link } from "react-router-dom";
import { Compass, Film } from "lucide-react";

export function NotFound() {
  return (
    <div className="not-found-container" id="not-found-page">
      <div className="not-found-card">
        <Compass className="not-found-icon" size={72} />
        <h1 className="not-found-code">404</h1>
        <h2>Projection Lost</h2>
        <p>
          The page you are trying to view does not exist in CineStream's library. It may have been relocated, or never released. Let's get you back to safety.
        </p>
        <Link to="/" className="back-home-button" id="not-found-back-btn">
          <Film size={18} />
          <span>Back to CineStream Home</span>
        </Link>
      </div>
    </div>
  );
}
