import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '../App';
import { vi } from 'vitest';

// We just want to check routing works, we can mock the components
vi.mock('../Dashboard', () => ({ default: () => <div data-testid="dashboard-view" /> }));
vi.mock('../Setup', () => ({ default: () => <div data-testid="setup-view" /> }));

import { ThemeContextProvider } from '../ThemeContext';

describe('App Routing', () => {
  test('renders Dashboard on root route', () => {
    // App already has BrowserRouter inside it, so we cannot wrap it in MemoryRouter.
    // Instead we can change window.location
    window.history.pushState({}, 'Dashboard', '/');
    render(
      <ThemeContextProvider>
        <App />
      </ThemeContextProvider>
    );
    expect(screen.getByTestId('dashboard-view')).toBeInTheDocument();
  });

  test('renders Setup on /setup route', () => {
    window.history.pushState({}, 'Setup', '/setup');
    render(
      <ThemeContextProvider>
        <App />
      </ThemeContextProvider>
    );
    expect(screen.getByTestId('setup-view')).toBeInTheDocument();
  });
});
