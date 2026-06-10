import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { LoginPage } from './pages/Login';
import { DashboardPage } from './pages/Dashboard';
import { InventoryPage } from './pages/Inventory';
import { WalletsPage } from './pages/Wallets';
import { BatchesPage } from './pages/Batches';
import { BatchDetailPage } from './pages/BatchDetail';
import { SettingsPage } from './pages/Settings';
import type { ReactNode } from 'react';

function Protected({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center text-platinum-400">
        Loading VaultBridge…
      </div>
    );
  }
  if (!session) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  const { session, loading } = useAuth();

  return (
    <Routes>
      <Route
        path="/login"
        element={!loading && session ? <Navigate to="/dashboard" replace /> : <LoginPage />}
      />
      <Route
        path="/dashboard"
        element={
          <Protected>
            <DashboardPage />
          </Protected>
        }
      />
      <Route
        path="/inventory"
        element={
          <Protected>
            <InventoryPage />
          </Protected>
        }
      />
      <Route
        path="/wallets"
        element={
          <Protected>
            <WalletsPage />
          </Protected>
        }
      />
      <Route
        path="/batches"
        element={
          <Protected>
            <BatchesPage />
          </Protected>
        }
      />
      <Route
        path="/batches/:id"
        element={
          <Protected>
            <BatchDetailPage />
          </Protected>
        }
      />
      <Route
        path="/settings"
        element={
          <Protected>
            <SettingsPage />
          </Protected>
        }
      />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
