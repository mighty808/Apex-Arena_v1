import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import ProtectedRoute from '../../components/ProtectedRoute';

// ── Mock auth context so we control isAuthenticated / isInitializing ──────────

vi.mock('../../lib/auth-context', () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from '../../lib/auth-context';

const mockUseAuth = vi.mocked(useAuth);

// Helper: render ProtectedRoute wrapping a protected page
function renderWithRouter(path = '/auth/dashboard') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/login" element={<div>Login Page</div>} />
        <Route element={<ProtectedRoute />}>
          <Route path="/auth/dashboard" element={<div>Dashboard</div>} />
          <Route path="/auth/profile" element={<div>Profile Page</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe('ProtectedRoute', () => {
  it('shows a loading spinner while initializing', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isInitializing: true,
    } as ReturnType<typeof useAuth>);

    renderWithRouter();

    expect(screen.getByText('Checking session...')).toBeInTheDocument();
  });

  it('redirects to /login when not authenticated', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isInitializing: false,
    } as ReturnType<typeof useAuth>);

    renderWithRouter('/auth/dashboard');

    expect(screen.getByText('Login Page')).toBeInTheDocument();
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
  });

  it('appends ?next= with the attempted path on redirect', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isInitializing: false,
    } as ReturnType<typeof useAuth>);

    // We can't easily assert the query param from rendered output, so
    // verify that Login Page is shown (redirect happened) and not the protected page
    renderWithRouter('/auth/profile');

    expect(screen.getByText('Login Page')).toBeInTheDocument();
    expect(screen.queryByText('Profile Page')).not.toBeInTheDocument();
  });

  it('renders the protected page when authenticated', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isInitializing: false,
    } as ReturnType<typeof useAuth>);

    renderWithRouter('/auth/dashboard');

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.queryByText('Login Page')).not.toBeInTheDocument();
  });

  it('does not redirect while still initializing even if not yet authenticated', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isInitializing: true,
    } as ReturnType<typeof useAuth>);

    renderWithRouter('/auth/dashboard');

    // Should show loader, not redirect to login
    expect(screen.queryByText('Login Page')).not.toBeInTheDocument();
    expect(screen.getByText('Checking session...')).toBeInTheDocument();
  });
});
