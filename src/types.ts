export interface Movie {
  id: number;
  title: string;
  release_date?: string;
  vote_average: number;
  overview: string;
  poster_path: string | null;
  backdrop_path?: string | null;
}

export interface SearchResponse {
  page: number;
  results: Movie[];
  total_pages: number;
  total_results: number;
}
