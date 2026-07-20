import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Home from "./pages/Home";
import Login from "./pages/admin/login";
import AdminPanel from "./pages/admin/AdminPanel";

// 🔐 PROTECTOR
function PrivateRoute({ children }) {
  const token = localStorage.getItem("token");
  return token ? children : <Navigate to="/login" replace />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* 🔥 REDIRECCIÓN INICIAL */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* 🔐 LOGIN */}
        <Route path="/login" element={<Login />} />

        {/* (opcional) HOME si lo quieres usar después */}
        <Route path="/home" element={<Home />} />

        {/* 🛠 ADMIN PROTEGIDO */}
        <Route
          path="/admin/*"
          element={
            <PrivateRoute>
              <AdminPanel />
            </PrivateRoute>
          }
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;