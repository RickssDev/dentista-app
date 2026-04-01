import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";              // 👈 NUEVO
import Login from "./pages/admin/login";
import AdminPanel from "./pages/admin/AdminPanel";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* 🔥 LANDING (PRIMERA PANTALLA) */}
        <Route path="/" element={<Home />} />

        {/* 🔐 LOGIN */}
        <Route path="/login" element={<Login />} />

        {/* 🛠 ADMIN */}
        <Route path="/admin/*" element={<AdminPanel />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;