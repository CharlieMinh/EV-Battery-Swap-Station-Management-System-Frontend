"use client";

import * as React from "react";
import { cn } from "../ui/utils";

const ERROR_IMG_SRC =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODgiIGhlaWdodD0iODgiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgc3Ryb2tlPSIjMDAwIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBvcGFjaXR5PSIuMyIgZmlsbD0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIzLjciPjxyZWN0IHg9IjE2IiB5PSIxNiIgd2lkdGg9IjU2IiBoZWlnaHQ9IjU2IiByeD0iNiIvPjxwYXRoIGQ9Im0xNiA1OCAxNi0xOCAzMiAzMiIvPjxjaXJjbGUgY3g9IjUzIiBjeT0iMzUiIHI9IjciLz48L3N2Zz4KCg==";

export interface ImageWithFallbackProps
  extends React.ImgHTMLAttributes<HTMLImageElement> {}

function ImageWithFallback({
  className,
  src,
  alt,
  style,
  ...props
}: ImageWithFallbackProps) {
  const [didError, setDidError] = React.useState(false);

  const handleError = () => setDidError(true);

  if (didError) {
    return (
      <div
        data-slot="image-fallback"
        className={cn(
          "inline-block bg-muted text-center align-middle",
          className
        )}
        style={style}
      >
        <div className="flex items-center justify-center w-full h-full">
          <img
            src={ERROR_IMG_SRC}
            alt="Error loading image"
            data-original-url={src}
            {...props}
          />
        </div>
      </div>
    );
  }

  return (
    <img
      data-slot="image"
      src={src}
      alt={alt}
      style={style}
      className={cn("object-cover", className)}
      onError={handleError}
      {...props}
    />
  );
}

export { ImageWithFallback };
