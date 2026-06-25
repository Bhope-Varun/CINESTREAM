import React, { useState } from "react";
import { Heart, Star } from "lucide-react";
import { Movie } from "../types";

interface MovieCardProps {
  movie: Movie;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onClick?: () => void;
  key?: React.Key;
}

export function MovieCard({ movie, isFavorite, onToggleFavorite, onClick }: MovieCardProps) {
  const [imageError, setImageError] = useState(false);

  // Extract release year
  const getReleaseYear = (dateStr?: string) => {
    if (!dateStr) return "N/A";
    const parts = dateStr.split("-");
    return parts[0] || "N/A";
  };

  // Build the TMDB poster URL if path is present, otherwise show custom placeholder
  const posterUrl =
    movie.poster_path && !imageError
      ? movie.poster_path.startsWith("http")
        ? movie.poster_path
        : `https://image.tmdb.org/t/p/w500${movie.poster_path}`
      : null;

  return (
    <div
      className="movie-card"
      id={`movie-card-${movie.id}`}
      onClick={onClick}
      style={{ cursor: onClick ? "pointer" : "default" }}
    >
      <div className="poster-container">
        {posterUrl ? (
          <img
            src={posterUrl}
            alt={movie.title}
            loading="lazy"
            onError={() => setImageError(true)}
            className="movie-poster"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="poster-placeholder">
            <span className="placeholder-icon">🎬</span>
            <span className="placeholder-title">{movie.title}</span>
          </div>
        )}
        <button
          className={`favorite-btn ${isFavorite ? "active" : ""}`}
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite();
          }}
          aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
          id={`fav-btn-${movie.id}`}
        >
          <Heart className="heart-icon" size={20} fill={isFavorite ? "#E50914" : "none"} color={isFavorite ? "#E50914" : "#ffffff"} />
        </button>
        <div className="rating-badge">
          <Star className="star-icon" size={12} fill="#ffc107" color="#ffc107" />
          <span>{movie.vote_average ? movie.vote_average.toFixed(1) : "N/A"}</span>
        </div>
      </div>
      <div className="movie-info">
        <h3 className="movie-title" title={movie.title}>
          {movie.title}
        </h3>
        <div className="movie-meta">
          <span className="movie-year">{getReleaseYear(movie.release_date)}</span>
        </div>
      </div>
    </div>
  );
}
