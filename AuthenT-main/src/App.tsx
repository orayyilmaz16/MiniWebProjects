import { Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AdminDashboard from "./pages/AdminDashboard";
import AdminEditPost from "./pages/AdminEditPost";
import AdminNewPost from "./pages/AdminNewPost";
import PostDetail from "./pages/PostDetail";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import { ProtectedRoute, RoleRoute } from "./routes/ProtectedRoute";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />

        <Route path="post/:id" element={<PostDetail />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />

        <Route
          path="settings"
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />

        <Route
          path="admin"
          element={
            <RoleRoute allow={["admin"]}>
              <AdminDashboard />
            </RoleRoute>
          }
        />
        <Route
          path="admin/new"
          element={
            <RoleRoute allow={["admin"]}>
              <AdminNewPost />
            </RoleRoute>
          }
        />
        <Route
          path="admin/edit/:id"
          element={
            <RoleRoute allow={["admin"]}>
              <AdminEditPost />
            </RoleRoute>
          }
        />

        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
