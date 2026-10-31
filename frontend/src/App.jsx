import { Route, Routes } from "react-router-dom";

import AppLayout from "./layouts/AppLayout";
import HomePage from "./pages/HomePage";
import MindDumpPage from "./pages/MindDumpPage";
import ArchivePage from "./pages/ArchivePage";
import WelcomePage from "./pages/WelcomePage";
import LoginPage from "./pages/LoginPage";
import ProtectedRoute from "./routes/ProtectedRoute";
import RegisterPage from "./pages/RegisterPage";
import OrganizePage from "./pages/OrganizePage";
function App() {
  return (
    <Routes>
      {/* Pagine pubbliche */}
      <Route path="/benvenuto" element={<WelcomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/registrazione" element={<RegisterPage />} />

      {/* Pagine protette */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/svuota" element={<MindDumpPage />} />
          <Route path="/organizza" element={<OrganizePage />} />
          <Route path="/organizza/:category" element={<OrganizePage />} />
          <Route path="/archivio" element={<ArchivePage />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default App;
