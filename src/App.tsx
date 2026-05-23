import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useCaptainAuth } from "./hooks/useCaptainAuth";
import CaptainLogin from "./routes/CaptainLogin";
import CaptainDashboard from "./routes/CaptainDashboard";
import CaptainSessionNew from "./routes/CaptainSessionNew";
import CaptainTeam from "./routes/CaptainTeam";
import TeammatePicker from "./routes/TeammatePicker";
import Footer from "./components/common/Footer";

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-base text-text-muted">
      <Loader2 className="w-5 h-5 animate-spin" />
    </div>
  );
}

function CaptainGate({
  email,
  loading,
  children,
}: {
  email: string | null;
  loading: boolean;
  children: React.ReactNode;
}) {
  if (loading) return <LoadingScreen />;
  if (!email) return <Navigate to="/captain/login" replace />;
  return <>{children}</>;
}

export default function App() {
  const auth = useCaptainAuth();

  return (
    <BrowserRouter>
      <div className="flex flex-col min-h-screen bg-surface-base">
        <div className="flex-1">
          <Routes>
        <Route
          path="/"
          element={
            auth.loading ? (
              <LoadingScreen />
            ) : auth.email ? (
              <Navigate to="/captain" replace />
            ) : (
              <Navigate to="/captain/login" replace />
            )
          }
        />

        <Route
          path="/captain/login"
          element={
            auth.email ? (
              <Navigate to="/captain" replace />
            ) : (
              <CaptainLogin onLoggedIn={auth.refresh} />
            )
          }
        />

        <Route
          path="/captain"
          element={
            <CaptainGate email={auth.email} loading={auth.loading}>
              <CaptainDashboard
                captainEmail={auth.email ?? ""}
                onLogout={auth.logout}
              />
            </CaptainGate>
          }
        />
        <Route
          path="/captain/teams/new"
          element={
            <CaptainGate email={auth.email} loading={auth.loading}>
              <CaptainSessionNew />
            </CaptainGate>
          }
        />
        <Route
          path="/captain/teams/:id"
          element={
            <CaptainGate email={auth.email} loading={auth.loading}>
              <CaptainTeam />
            </CaptainGate>
          }
        />

        <Route path="/t/:shareToken" element={<TeammatePicker />} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
        <Footer />
      </div>
    </BrowserRouter>
  );
}
