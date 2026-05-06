import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Setup from '../Setup';
import axios from 'axios';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';

vi.mock('axios');

describe('Setup Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders loading initially', async () => {
    // We updated Setup to actually display a CircularProgress while loading status
    axios.get.mockImplementation(() => new Promise(() => {}));

    render(
      <MemoryRouter>
        <Setup />
      </MemoryRouter>
    );

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  test('displays status and connect buttons correctly', async () => {
    // Mock the status endpoint
    axios.get.mockResolvedValueOnce({ data: { strava: true, whoop: false } });

    render(
      <MemoryRouter>
        <Setup />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Integrations Setup')).toBeInTheDocument();
    });

    // Wait for the status check to resolve and update the UI
    await waitFor(() => {
        expect(screen.getByText('Connected')).toBeInTheDocument(); // For Strava
        expect(screen.getByText('Disconnected')).toBeInTheDocument(); // For Whoop
    });
  });

  test('triggers sync when Sync Now is clicked', async () => {
    axios.get.mockResolvedValueOnce({ data: { strava: true, whoop: true } });
    axios.post.mockResolvedValueOnce({ data: { message: 'Sync complete' } });

    render(
      <MemoryRouter>
        <Setup />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Integrations Setup')).toBeInTheDocument();
    });

    const syncButton = screen.getByText('Sync Now');
    fireEvent.click(syncButton);

    expect(screen.getAllByText(/Syncing/i).length).toBeGreaterThan(0);

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith('http://localhost:3000/api/sync');
    });
  });

  test('fetches connect urls when connect button is clicked', async () => {
    axios.get.mockResolvedValueOnce({ data: { strava: false, whoop: false } });
    axios.get.mockResolvedValueOnce({ data: { url: 'http://strava.auth' } });

    // Mock window.open
    const originalOpen = window.open;
    window.open = vi.fn();

    render(
      <MemoryRouter>
        <Setup />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Connect Strava')).toBeInTheDocument();
    });

    const stravaButton = screen.getByText('Connect Strava');
    fireEvent.click(stravaButton);

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith('http://localhost:3000/api/auth/strava');
      expect(window.open).toHaveBeenCalledWith('http://strava.auth', '_blank');
    });

    // Restore window.open
    window.open = originalOpen;
  });
});
