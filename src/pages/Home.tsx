import React, { useState, useEffect, useRef } from "react";
import { Search, Sparkles, X, RotateCcw } from "lucide-react";
import { Movie } from "../types";
import { fetchPopularMovies, searchMovies, getSmartRecommendation } from "../api/movieApi";
import { MovieCard } from "../components/MovieCard";
import { SkeletonLoader } from "../components/SkeletonLoader";
import { useDebounce } from "../hooks/useDebounce";

interface HomeProps {
  favorites: Movie[];
  onToggleFavorite: (movie: Movie) => void;
  onSelectMovie: (movie: Movie) => void;
}

export function Home({ favorites, onToggleFavorite, onSelectMovie }: HomeProps) {
  // States for movies listing
  const [movies, setMovies] = useState<Movie[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [feedMode, setFeedMode] = useState<"popular" | "search">("popular");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Search and debounce states
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedQuery = useDebounce(searchQuery, 500);

  // Movie recommendation states
  const [recommendDesc, setRecommendDesc] = useState("");
  const [recommending, setRecommending] = useState(false);
  const [recError, setRecError] = useState<string | null>(null);
  const [recommendedMovie, setRecommendedMovie] = useState<Movie | null>(null);
  const [recommendedLabel, setRecommendedLabel] = useState<string>("");

  // Infinite scroll ref
  const observerTarget = useRef<HTMLDivElement | null>(null);

  // Check if a movie is favorite
  const isMovieFavorite = (movieId: number) => {
    return favorites.some((m) => m.id === movieId);
  };

  // Load popular movies on mount or mode change
  useEffect(() => {
    if (feedMode === "popular" && page === 1) {
      loadPopularMovies(1, false);
    }
  }, [feedMode]);

  // Search for movies on search input change
  useEffect(() => {
    if (debouncedQuery.trim()) {
      setFeedMode("search");
      setPage(1);
      setMovies([]);
      executeSearch(debouncedQuery, 1, false);
    } else {
      // If query is empty, reset back to popular mode
      if (feedMode === "search") {
        setFeedMode("popular");
        setPage(1);
        setMovies([]);
        loadPopularMovies(1, false);
      }
    }
  }, [debouncedQuery]);

  // Load popular movies
  const loadPopularMovies = async (pageNum: number, append: boolean) => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchPopularMovies(pageNum);
      
      setMovies((prev) => {
        // Prevent duplicate keys
        const existingIds = new Set(prev.map((m) => m.id));
        const filteredNew = data.results.filter((m) => !existingIds.has(m.id));
        return append ? [...prev, ...filteredNew] : data.results;
      });
      setTotalPages(data.total_pages);
    } catch (err: any) {
      setError("Failed to load movies. Please check your internet connection.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Search movies
  const executeSearch = async (query: string, pageNum: number, append: boolean) => {
    try {
      setLoading(true);
      setError(null);
      const data = await searchMovies(query, pageNum);

      setMovies((prev) => {
        const existingIds = new Set(prev.map((m) => m.id));
        const filteredNew = data.results.filter((m) => !existingIds.has(m.id));
        return append ? [...prev, ...filteredNew] : data.results;
      });
      setTotalPages(data.total_pages);
    } catch (err: any) {
      setError("Failed to find movies. Try again later.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Load next page for pagination
  const loadNextPage = () => {
    if (loading || page >= totalPages) return;
    const nextPage = page + 1;
    setPage(nextPage);

    if (feedMode === "popular") {
      loadPopularMovies(nextPage, true);
    } else if (feedMode === "search" && debouncedQuery.trim()) {
      executeSearch(debouncedQuery, nextPage, true);
    }
  };

  // Scroll observer setup
  useEffect(() => {
    const target = observerTarget.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading && page < totalPages) {
          loadNextPage();
        }
      },
      {
        rootMargin: "200px",
        threshold: 0.1,
      }
    );

    observer.observe(target);
    return () => {
      observer.unobserve(target);
    };
  }, [loading, page, totalPages, feedMode, debouncedQuery]);

  // Request movie recommendations
  const handleRecommendSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recommendDesc.trim()) return;

    try {
      setRecommending(true);
      setRecError(null);
      setRecommendedMovie(null);

      const response = await getSmartRecommendation(recommendDesc);
      
      if (response && response.movie) {
        setRecommendedMovie(response.movie);
        setRecommendedLabel(response.recommendation);
      } else {
        setRecError("No matching movie was found for that description.");
      }
    } catch (err: any) {
      console.error(err);
      setRecError(
        err.response?.data?.error || "We couldn't generate a recommendation. Try typing something else!"
      );
    } finally {
      setRecommending(false);
    }
  };

  // Reset recommendation states
  const clearRecommendation = () => {
    setRecommendedMovie(null);
    setRecommendDesc("");
    setRecError(null);
  };

  // Reset search
  const clearSearch = () => {
    setSearchQuery("");
  };

  return (
    <div className="home-container" id="home-page">
      {/* Hero Header Area */}
      <section className="hero-section">
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <h1 className="hero-title">Find Your Next Movie</h1>
          <p className="hero-subtitle">
            Search our library or describe what you want to watch for personalized recommendations.
          </p>

          {/* Dual Search Modules Container */}
          <div className="search-modules-container">
            {/* Standard Movie Search Box */}
            <div className="search-box-card">
              <h3>Search Library</h3>
              <div className="search-input-wrapper">
                <Search className="search-icon" size={20} />
                <input
                  type="text"
                  placeholder="Search popular movies..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                  id="movie-search-input"
                />
                {searchQuery && (
                  <button className="clear-search-btn" onClick={clearSearch} id="clear-search-btn">
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>

            {/* Smart Recommendation Box */}
            <div className="search-box-card recommendation-box-card">
              <div className="card-header-badge">
                <Sparkles size={14} className="sparkle-icon" />
                <span>Smart Search</span>
              </div>
              <h3>Movie Recommendation</h3>
              <form onSubmit={handleRecommendSubmit} className="recommendation-form">
                <div className="search-input-wrapper">
                  <input
                    type="text"
                    placeholder="Describe what kind of movie you'd like to watch..."
                    value={recommendDesc}
                    onChange={(e) => setRecommendDesc(e.target.value)}
                    className="search-input recommend-input"
                    id="recommend-input"
                    disabled={recommending}
                  />
                  <button
                    type="submit"
                    className="recommend-submit-btn"
                    id="recommend-submit-btn"
                    disabled={recommending || !recommendDesc.trim()}
                  >
                    {recommending ? "Finding..." : "Recommend"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Recommended Movie Spotlight Display */}
      {recommending && (
        <section className="recommendation-spotlight loading-spotlight">
          <div className="spotlight-loading-box">
            <div className="spotlight-spinner"></div>
            <p className="pulse-text">Finding recommendations...</p>
            <span className="scrolling-tagline">Searching our movie library...</span>
          </div>
        </section>
      )}

      {recError && (
        <section className="recommendation-spotlight error-spotlight">
          <div className="spotlight-error-box">
            <span className="error-badge">No Match Found</span>
            <p>{recError}</p>
            <button onClick={clearRecommendation} className="reset-rec-btn">
              Try Again
            </button>
          </div>
        </section>
      )}

      {recommendedMovie && !recommending && (
        <section className="recommendation-spotlight" id="recommendation-spotlight">
          <div className="spotlight-glow-effect"></div>
          <button className="close-spotlight-btn" onClick={clearRecommendation} aria-label="Clear recommendation">
            <X size={20} />
          </button>
          
          <div className="spotlight-header">
            <Sparkles size={18} className="sparkle-icon" />
            <span>Recommended Title: <strong>{recommendedLabel}</strong></span>
          </div>

          <div className="spotlight-grid">
            <div className="spotlight-poster-container">
              {recommendedMovie.poster_path ? (
                <img
                  src={`https://image.tmdb.org/t/p/w500${recommendedMovie.poster_path}`}
                  alt={recommendedMovie.title}
                  className="spotlight-poster"
                  loading="lazy"
                />
              ) : (
                <div className="spotlight-poster-placeholder">
                  <span>🎬</span>
                  <p>{recommendedMovie.title}</p>
                </div>
              )}
            </div>

            <div className="spotlight-details">
              <div className="spotlight-rating">
                <span className="rating-num">{(recommendedMovie.vote_average || 8.0).toFixed(1)}</span>
                <span className="rating-scale">/10 Rating</span>
              </div>
              <h2 className="spotlight-title">{recommendedMovie.title}</h2>
              {recommendedMovie.release_date && (
                <span className="spotlight-year">Released: {recommendedMovie.release_date.split("-")[0]}</span>
              )}
              <p className="spotlight-overview">{recommendedMovie.overview}</p>
              
              <div className="spotlight-actions">
                <button
                  className={`spotlight-favorite-btn ${isMovieFavorite(recommendedMovie.id) ? "active" : ""}`}
                  onClick={() => onToggleFavorite(recommendedMovie)}
                >
                  {isMovieFavorite(recommendedMovie.id) ? "Remove from Favorites" : "Add to Favorites"}
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Main Movie Listing Feed */}
      <section className="movie-listing-section">
        <div className="listing-header">
          <h2 className="section-heading" id="listing-title">
            {feedMode === "popular" ? "Popular Movies" : `Search Results for "${searchQuery}"`}
          </h2>
          {feedMode === "search" && (
            <button
              onClick={() => {
                clearSearch();
                setFeedMode("popular");
              }}
              className="reset-feed-btn"
            >
              <RotateCcw size={14} />
              <span>Back to Popular</span>
            </button>
          )}
        </div>

        {error && (
          <div className="error-alert-box" id="error-alert">
            <p>{error}</p>
            <button onClick={() => (feedMode === "popular" ? loadPopularMovies(1, false) : executeSearch(debouncedQuery, 1, false))} className="retry-btn">
              Retry Load
            </button>
          </div>
        )}

        {/* Movies Render Grid */}
        {movies.length > 0 ? (
          <div className="movies-grid" id="movies-list">
            {movies.map((movie) => (
              <MovieCard
                key={movie.id}
                movie={movie}
                isFavorite={isMovieFavorite(movie.id)}
                onToggleFavorite={() => onToggleFavorite(movie)}
                onClick={() => onSelectMovie(movie)}
              />
            ))}
          </div>
        ) : (
          !loading && !error && (
            <div className="no-results-box" id="no-movies-found">
              <span className="no-results-icon">🍿</span>
              <h3>No Movies Found</h3>
              <p>We couldn't find any movies matching your selection. Try a different query or look at our Popular feed!</p>
              <button
                onClick={() => {
                  clearSearch();
                  setFeedMode("popular");
                }}
                className="reset-feed-btn-large"
              >
                Explore Popular Movies
              </button>
            </div>
          )
        )}

        {/* Loading Skeleton / Loader */}
        {loading && <SkeletonLoader count={feedMode === "search" && movies.length === 0 ? 6 : 4} />}

        {/* Intersection Scroll Target Anchor */}
        <div ref={observerTarget} className="infinite-scroll-target" id="infinite-scroll-anchor">
          {loading && movies.length > 0 && <div className="scroll-loading-spinner"></div>}
        </div>
      </section>
    </div>
  );
}
