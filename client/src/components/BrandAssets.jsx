import React from 'react';
import OptimizedImage from './OptimizedImage';

const publicUrl = process.env.PUBLIC_URL || '';

export const BRAND_NAME_SRC = `${publicUrl}/FarmixName.png`;
export const BRAND_LOGO_SRC = `${publicUrl}/Farmixlogo.png`;
export const BRAND_NAME_WEBP_SRC = `${publicUrl}/FarmixName.webp`;
export const BRAND_LOGO_WEBP_SRC = `${publicUrl}/Farmixlogo.webp`;

export const BrandWordmark = ({
  alt = 'Farmix',
  className = '',
  loading = 'eager',
  ...props
}) => (
  <OptimizedImage
    src={BRAND_NAME_SRC}
    alt={alt}
    webpSrc={undefined}
    loading={loading}
    width={344}
    height={74}
    imgClassName={`h-8 w-auto object-contain ${className}`.trim()}
    {...props}
  />
);

export const BrandLogo = ({
  alt = 'Farmix logo',
  className = '',
  loading = 'eager',
  ...props
}) => (
  <OptimizedImage
    src={BRAND_LOGO_SRC}
    alt={alt}
    webpSrc={undefined}
    loading={loading}
    width={512}
    height={512}
    imgClassName={`h-10 w-10 object-contain ${className}`.trim()}
    {...props}
  />
);
