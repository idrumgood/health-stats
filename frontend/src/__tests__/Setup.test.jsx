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
    // Note: Setup.jsx does not actually render 'Checking connections...',
    // it renders the setup page immediately while the request is pending.
    axios.get.mockImplementation(() => new Promise(() => {}));

    render(
      <MemoryRouter>
        <Setup />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('⚙️ Setup')).toBeInTheDocument();
    });
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
      expect(screen.getByText('⚙️ Setup')).toBeInTheDocument();
    });

    // Wait for the status check to resolve and update the UI
    await waitFor(() => {
        expect(screen.getAllByText('Connected ✅', { exact: false }).length).toBe(1); // For Strava
        expect(screen.getAllByText('Disconnected ❌', { exact: false }).length).toBe(1); // For Whoop
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
      expect(screen.getByText('⚙️ Setup')).toBeInTheDocument();
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
