import { Route, Routes } from "react-router-dom";

import AppLayout from "./layouts/AppLayout";
import HomePage from "./pages/HomePage";
import MindDumpPage from "./pages/MindDumpPage";
import ArchivePage from "./pages/ArchivePage";
import WelcomePage from "./pages/WelcomePage";

function App() {
  return (
    <Routes>
      {/* Schermata pubblica */}
      <Route path="/benvenuto" element={<WelcomePage />} />

      {/* Pagine attuali dell'app */}
      <Route element={<AppLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/svuota" element={<MindDumpPage />} />
        <Route path="/archivio" element={<ArchivePage />} />
      </Route>
    </Routes>
  );
}

export default App;
