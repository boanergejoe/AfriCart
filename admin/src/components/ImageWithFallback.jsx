import { useState } from "react";

const initialsFrom = (text = "") =>
  text
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "?";

function ImageWithFallback({ src, alt, className = "", fallbackClassName = "", rounded = false }) {
  // Track the failed URL instead of a boolean so a changed src resets naturally.
  const [failedSrc, setFailedSrc] = useState(null);
  const failed = failedSrc === src && Boolean(src);

  if (!src || failed) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`flex items-center justify-center bg-base-200 font-semibold text-base-content/50 ${rounded ? "rounded-full" : "rounded-xl"} ${fallbackClassName} ${className}`}
      >
        {initialsFrom(alt)}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setFailedSrc(src)}
      className={className}
    />
  );
}

export default ImageWithFallback;
