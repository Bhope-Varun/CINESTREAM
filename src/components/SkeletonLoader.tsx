import React from "react";

interface SkeletonLoaderProps {
  count?: number;
}

export function SkeletonLoader({ count = 6 }: SkeletonLoaderProps) {
  const skeletons = Array.from({ length: count });

  return (
    <div className="movies-grid skeleton-grid" id="skeleton-loader-grid">
      {skeletons.map((_, idx) => (
        <div className="skeleton-card" key={idx}>
          <div className="skeleton-poster shimmer"></div>
          <div className="skeleton-info">
            <div className="skeleton-line shimmer title-line"></div>
            <div className="skeleton-line shimmer meta-line"></div>
          </div>
        </div>
      ))}
    </div>
  );
}
