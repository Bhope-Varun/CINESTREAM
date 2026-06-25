import React from "react";
import { Link } from "react-router-dom";
import { Film, HeartCrack } from "lucide-react";
import { Movie } from "../types";
import { MovieCard } from "../components/MovieCard";

interface FavoritesProps {
  favorites: Movie[];
  onToggleFavorite: (movie: Movie) => void;
  onSelectMovie: (movie: Movie) => void;
}

export function Favorites({ favorites, onToggleFavorite, onSelectMovie }: FavoritesProps) {
  return (
    <div className="favorites-container" id="favorites-page">
      <div className="favorites-header">
        <h1 className="favorites-title">My Favorites List</h1>
        <p className="favorites-subtitle">
          Your saved movies, kept on this device.
        </p>
      </div>

      {favorites.length > 0 ? (
        <div className="movies-grid" id="favorites-grid">
          {favorites.map((movie) => (
            <MovieCard
              key={movie.id}
              movie={movie}
              isFavorite={true}
              onToggleFavorite={() => onToggleFavorite(movie)}
              onClick={() => onSelectMovie(movie)}
            />
          ))}
        </div>
      ) : (
        <div className="empty-favorites-box" id="empty-favorites-view">
          <HeartCrack className="empty-icon animate-bounce-slow" size={64} />
          <h2>Your list is empty</h2>
          <p>
            You haven't saved any movies to your favorites list yet. Explore popular releases, use our smart recommendation engine, and tap the heart icon on any movie card to save it here!
          </p>
          <Link to="/" className="explore-cta-button" id="browse-home-cta">
            <Film size={18} />
            <span>Explore CineStream Library</span>
          </Link>
        </div>
      )}
    </div>
  );
}
