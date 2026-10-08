import React from 'react';
import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import InternshipQualityBadge from '../../components/career/InternshipQualityBadge';

// InternshipQualityBadge uses lucide-react (Shield) — no context dependencies

describe('InternshipQualityBadge', () => {
  test('renders without crashing', () => {
    const { container } = render(<InternshipQualityBadge />);
    expect(container.firstChild).toBeInTheDocument();
  });

  test('shows quality score as X/100', () => {
    render(<InternshipQualityBadge qualityScore={85} />);
    expect(screen.getByText('85/100')).toBeInTheDocument();
  });

  test('shows default quality score 0/100 when not provided', () => {
    render(<InternshipQualityBadge />);
    expect(screen.getByText('0/100')).toBeInTheDocument();
  });

  test('shows risk level label — low risk', () => {
    render(<InternshipQualityBadge riskLevel="low" />);
    expect(screen.getByText(/low risk/i)).toBeInTheDocument();
  });

  test('shows risk level label — high risk', () => {
    render(<InternshipQualityBadge riskLevel="high" />);
    expect(screen.getByText(/high risk/i)).toBeInTheDocument();
  });

  test('shows risk level label — medium risk by default', () => {
    render(<InternshipQualityBadge />);
    expect(screen.getByText(/medium risk/i)).toBeInTheDocument();
  });

  test('applies green color class for high quality score (>=70)', () => {
    render(<InternshipQualityBadge qualityScore={75} />);
    const scoreBadge = screen.getByTitle(/quality score: 75/i);
    expect(scoreBadge.className).toContain('bg-green-100');
  });

  test('applies amber color class for mid quality score (40-69)', () => {
    render(<InternshipQualityBadge qualityScore={55} />);
    const scoreBadge = screen.getByTitle(/quality score: 55/i);
    expect(scoreBadge.className).toContain('bg-amber-100');
  });

  test('applies red color class for low quality score (<40)', () => {
    render(<InternshipQualityBadge qualityScore={20} />);
    const scoreBadge = screen.getByTitle(/quality score: 20/i);
    expect(scoreBadge.className).toContain('bg-red-100');
  });

  test('shows ROI estimate when provided', () => {
    render(<InternshipQualityBadge roiEstimate="High ROI" />);
    expect(screen.getByText('High ROI')).toBeInTheDocument();
  });

  test('does not show ROI span when roiEstimate is not provided', () => {
    render(<InternshipQualityBadge qualityScore={50} />);
    // Only the score and risk badges should be present
    expect(screen.queryByTitle(/roi estimate/i)).not.toBeInTheDocument();
  });
});
