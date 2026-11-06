import { Route, Routes } from "react-router-dom";

import AppLayout from "./layouts/AppLayout";

import HomePage from "./pages/HomePage";
import MindDumpPage from "./pages/MindDumpPage";
import OrganizePage from "./pages/OrganizePage";
import CalendarPage from "./pages/CalendarPage";
import ArchivePage from "./pages/ArchivePage";
import SettingsPage from "./pages/SettingsPage";

import WelcomePage from "./pages/WelcomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";

import ProtectedRoute from "./routes/ProtectedRoute";

function App() {
  return (
    <Routes>
      {/* Pagine pubbliche */}
      <Route path="/benvenuto" element={<WelcomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/registrazione" element={<RegisterPage />} />

      {/* Pagine accessibili solo dopo il login */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<HomePage />} />

          <Route path="/svuota" element={<MindDumpPage />} />

          <Route path="/organizza" element={<OrganizePage />} />

          <Route path="/organizza/:category" element={<OrganizePage />} />

          <Route path="/calendario" element={<CalendarPage />} />

          <Route path="/archivio" element={<ArchivePage />} />

          <Route path="/impostazioni" element={<SettingsPage />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default App;
