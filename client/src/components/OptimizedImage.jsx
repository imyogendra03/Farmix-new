import React from 'react';

const OptimizedImage = ({
  src,
  alt,
  webpSrc,
  fallbackSrc,
  className = '',
  imgClassName = '',
  loading = 'lazy',
  decoding = 'async',
  sizes,
  width,
  height,
  fetchPriority,
  onError,
  ...props
}) => {
  const handleError = (event) => {
    if (fallbackSrc && event.currentTarget.src !== fallbackSrc) {
      event.currentTarget.src = fallbackSrc;
    }

    if (typeof onError === 'function') {
      onError(event);
    }
  };

  return (
    <img
      src={src}
      alt={alt}
      loading={loading}
      decoding={decoding}
      sizes={sizes}
      width={width}
      height={height}
      fetchPriority={fetchPriority}
      onError={handleError}
      className={imgClassName}
      {...props}
    />
  );
};

export default OptimizedImage;
