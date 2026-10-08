import React from 'react';
import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ConfidenceBar from '../../components/career/ConfidenceBar';

// ConfidenceBar uses framer-motion — mock it to avoid animation issues in jsdom
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, style, ...props }) => (
      <div className={className} style={style} {...props}>{children}</div>
    ),
  },
}));

describe('ConfidenceBar', () => {
  test('renders without crashing', () => {
    const { container } = render(<ConfidenceBar score={50} />);
    expect(container.firstChild).toBeInTheDocument();
  });

  test('shows percentage when showPercent is true', () => {
    render(<ConfidenceBar score={75} showPercent />);
    expect(screen.getByText('75%')).toBeInTheDocument();
  });

  test('shows label when label prop is provided', () => {
    render(<ConfidenceBar score={60} label="Confidence" />);
    expect(screen.getByText('Confidence')).toBeInTheDocument();
  });

  test('shows both label and percent when both props provided', () => {
    render(<ConfidenceBar score={80} label="Fit Score" showPercent />);
    expect(screen.getByText('Fit Score')).toBeInTheDocument();
    expect(screen.getByText('80%')).toBeInTheDocument();
  });

  test('clamps score above 100 to 100', () => {
    render(<ConfidenceBar score={150} showPercent />);
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  test('clamps score below 0 to 0', () => {
    render(<ConfidenceBar score={-20} showPercent />);
    expect(screen.getByText('0%')).toBeInTheDocument();
  });

  test('does not render label/percent row when neither prop given', () => {
    render(<ConfidenceBar score={50} />);
    // No percent text should appear
    expect(screen.queryByText('%')).not.toBeInTheDocument();
  });

  test('applies lg height class for size lg', () => {
    const { container } = render(<ConfidenceBar score={50} size="lg" />);
    // The track div should contain h-4
    const trackDiv = container.querySelector('.h-4');
    expect(trackDiv).toBeInTheDocument();
  });

  test('applies sm height class for size sm', () => {
    const { container } = render(<ConfidenceBar score={50} size="sm" />);
    const trackDiv = container.querySelector('.h-1\\.5');
    expect(trackDiv).toBeInTheDocument();
  });
});
