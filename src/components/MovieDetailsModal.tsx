import React, { useEffect } from "react";
import { X, Star, Heart, Calendar } from "lucide-react";
import { Movie } from "../types";

interface MovieDetailsModalProps {
  movie: Movie | null;
  onClose: () => void;
  isFavorite: boolean;
  onToggleFavorite: () => void;
}

export function MovieDetailsModal({ movie, onClose, isFavorite, onToggleFavorite }: MovieDetailsModalProps) {
  useEffect(() => {
    if (!movie) return;

    // Close on Escape key press
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    // Prevent background scrolling while modal is open
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [movie, onClose]);

  if (!movie) return null;

  const posterUrl = movie.poster_path
    ? movie.poster_path.startsWith("http")
      ? movie.poster_path
      : `https://image.tmdb.org/t/p/w500${movie.poster_path}`
    : null;

  const backdropUrl = movie.backdrop_path
    ? movie.backdrop_path.startsWith("http")
      ? movie.backdrop_path
      : `https://image.tmdb.org/t/p/w1280${movie.backdrop_path}`
    : posterUrl;

  const getReleaseYear = (dateStr?: string) => {
    if (!dateStr) return "N/A";
    return dateStr.split("-")[0] || "N/A";
  };

  return (
    <div className="modal-backdrop" onClick={onClose} id="movie-details-modal">
      <div className="modal-wrapper" onClick={(e) => e.stopPropagation()}>
        {backdropUrl && (
          <div
            className="modal-banner-bg"
            style={{ backgroundImage: `url(${backdropUrl})` }}
          />
        )}
        <div className="modal-banner-overlay" />

        <button className="modal-close-btn" onClick={onClose} aria-label="Close modal" id="close-modal-btn">
          <X size={20} />
        </button>

        <div className="modal-body-layout">
          <div className="modal-poster-side">
            {posterUrl ? (
              <img src={posterUrl} alt={movie.title} className="modal-poster-img" />
            ) : (
              <div className="modal-poster-placeholder">
                <span className="placeholder-icon">🎬</span>
                <span className="placeholder-title">{movie.title}</span>
              </div>
            )}
          </div>

          <div className="modal-content-side">
            <div className="modal-meta-row">
              <span className="modal-badge-rating">
                <Star size={14} fill="#ffc107" color="#ffc107" />
                <span>{movie.vote_average ? movie.vote_average.toFixed(1) : "N/A"} / 10</span>
              </span>
              {movie.release_date && (
                <span className="modal-badge-year">
                  <Calendar size={14} />
                  <span>{getReleaseYear(movie.release_date)}</span>
                </span>
              )}
            </div>

            <h2 className="modal-movie-title">{movie.title}</h2>
            
            <p className="modal-section-title">Overview</p>
            <p className="modal-movie-overview">
              {movie.overview || "No overview available for this movie."}
            </p>

            <div className="modal-actions-panel">
              <button
                className={`modal-fav-action-btn ${isFavorite ? "active" : ""}`}
                onClick={onToggleFavorite}
                id="modal-fav-toggle-btn"
              >
                <Heart size={16} fill={isFavorite ? "#ffffff" : "none"} />
                <span>{isFavorite ? "Remove from Favorites" : "Add to Favorites"}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
