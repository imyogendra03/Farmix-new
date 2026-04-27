import { render, screen, fireEvent } from '@testing-library/react';
import OptimizedImage from './OptimizedImage';

describe('OptimizedImage', () => {
  test('renders image with lazy loading defaults', () => {
    render(<OptimizedImage src="/demo.png" alt="Demo image" />);

    const image = screen.getByAltText('Demo image');
    expect(image).toHaveAttribute('loading', 'lazy');
    expect(image).toHaveAttribute('decoding', 'async');
  });

  test('falls back to secondary source on error', () => {
    render(
      <OptimizedImage
        src="/broken.png"
        fallbackSrc="/fallback.png"
        alt="Fallback image"
      />
    );

    const image = screen.getByAltText('Fallback image');
    fireEvent.error(image);

    expect(image).toHaveAttribute('src', '/fallback.png');
  });
});
