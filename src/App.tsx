import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Movie } from "./types";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { StickyNavbar } from "./components/StickyNavbar";
import { BackToTop } from "./components/BackToTop";
import { MovieDetailsModal } from "./components/MovieDetailsModal";
import { Home } from "./pages/Home";
import { Favorites } from "./pages/Favorites";
import { NotFound } from "./pages/NotFound";

export default function App() {
  // Favorites state persisted in localStorage
  const [favorites, setFavorites] = useState<Movie[]>(() => {
    try {
      const saved = localStorage.getItem("cinestream_favorites");
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Failed to parse favorites from local storage", e);
      return [];
    }
  });

  // Movie details modal state
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);

  // Keep localStorage in sync with favorites state
  useEffect(() => {
    localStorage.setItem("cinestream_favorites", JSON.stringify(favorites));
  }, [favorites]);

  // Toggle favorite movie
  const handleToggleFavorite = (movie: Movie) => {
    setFavorites((prev) => {
      const exists = prev.some((m) => m.id === movie.id);
      if (exists) {
        return prev.filter((m) => m.id !== movie.id);
      } else {
        return [...prev, movie];
      }
    });
  };

  return (
    <ErrorBoundary>
      <Router>
        <div className="app-viewport">
          <StickyNavbar />
          
          <main className="main-content-flow">
            <Routes>
              <Route
                path="/"
                element={
                  <Home
                    favorites={favorites}
                    onToggleFavorite={handleToggleFavorite}
                    onSelectMovie={setSelectedMovie}
                  />
                }
              />
              <Route
                path="/favorites"
                element={
                  <Favorites
                    favorites={favorites}
                    onToggleFavorite={handleToggleFavorite}
                    onSelectMovie={setSelectedMovie}
                  />
                }
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>

          <footer className="cinestream-footer" id="app-footer">
            <div className="footer-container">
              <div className="footer-brand">
                <h3>Cine<span>Stream</span></h3>
                <p>Your personal cinema catalog. Save your favorites and find your next movie to watch.</p>
              </div>
              <div className="footer-copy">
                <p>© 2026 CineStream. All rights reserved.</p>
                <p className="legal-disclaimers">Powered by TMDB and Gemini.</p>
              </div>
            </div>
          </footer>

          <BackToTop />

          <MovieDetailsModal
            movie={selectedMovie}
            onClose={() => setSelectedMovie(null)}
            isFavorite={selectedMovie ? favorites.some((m) => m.id === selectedMovie.id) : false}
            onToggleFavorite={() => selectedMovie && handleToggleFavorite(selectedMovie)}
          />
        </div>
      </Router>
    </ErrorBoundary>
  );
}
