import axios from "axios";
import { Movie, SearchResponse } from "../types";

export async function fetchPopularMovies(page: number = 1): Promise<SearchResponse> {
  const response = await axios.get<SearchResponse>("/api/movies/popular", {
    params: { page },
  });
  return response.data;
}

export async function searchMovies(query: string, page: number = 1): Promise<SearchResponse> {
  const response = await axios.get<SearchResponse>("/api/movies/search", {
    params: { query, page },
  });
  return response.data;
}

export async function getSmartRecommendation(description: string): Promise<{ recommendation: string; movie: Movie }> {
  const response = await axios.post<{ recommendation: string; movie: Movie }>("/api/recommend", {
    description,
  });
  return response.data;
}
