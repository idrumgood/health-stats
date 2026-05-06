import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import Dashboard from '../Dashboard';
import axios from 'axios';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';

vi.mock('axios');

// Mock react-chartjs-2 to avoid canvas issues in jsdom
vi.mock('react-chartjs-2', () => ({
  Line: () => <div data-testid="line-chart" />,
  Bar: () => <div data-testid="bar-chart" />
}));

describe('Dashboard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders loading state initially', () => {
    axios.get.mockImplementation(() => new Promise(() => {}));

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    // Dashboard actually shows "Loading insights..." but renders the rest of the page instantly
    expect(screen.getByText('Loading insights...')).toBeInTheDocument();
  });

  test('renders dashboard data and insights', async () => {
    const mockData = {
      strava: [{ id: 1, start_date: '2023-01-01', type: 'Run', distance: 5000 }],
      whoop: [{ id: 1, date: '2023-01-01', strain: 10, recovery_score: 50, sleep_performance: 80 }]
    };

    axios.get.mockImplementation((url) => {
      if (url === 'http://localhost:3000/api/data') {
        return Promise.resolve({ data: mockData });
      }
      if (url === 'http://localhost:3000/api/insights') {
        return Promise.resolve({ data: { text: 'You are doing great!' } });
      }
      return Promise.reject(new Error('not found'));
    });

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('🤖 AI Insights')).toBeInTheDocument();
    });

    expect(screen.getByText('You are doing great!')).toBeInTheDocument();
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
  });
});
