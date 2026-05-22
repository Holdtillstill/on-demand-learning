import { BookOpen, ChartNoAxesColumn, Gauge, GraduationCap, Layers3, UploadCloud } from "lucide-react";
import { NavLink, Route, Routes } from "react-router-dom";

import AdminUploadPage from "./pages/AdminUploadPage";
import CatalogPage from "./pages/CatalogPage";
import CoursePage from "./pages/CoursePage";
import FlashcardsPage from "./pages/FlashcardsPage";
import LessonPage from "./pages/LessonPage";
import ObservabilityPage from "./pages/ObservabilityPage";
import ProgressPage from "./pages/ProgressPage";

const nav = [
  { to: "/", label: "Catalog", icon: BookOpen },
  { to: "/flashcards", label: "Flashcards", icon: Layers3 },
  { to: "/progress", label: "Progress", icon: ChartNoAxesColumn },
  { to: "/admin/upload", label: "Admin Upload", icon: UploadCloud },
  { to: "/platform", label: "Platform", icon: Gauge }
];

export default function App() {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <GraduationCap aria-hidden="true" />
          <div>
            <strong>Zhongwen Cloud</strong>
            <span>Learning Platform</span>
          </div>
        </div>
        <nav>
          {nav.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink key={item.to} to={item.to} className={({ isActive }) => (isActive ? "nav-item active" : "nav-item")}>
                <Icon aria-hidden="true" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </aside>
      <main>
        <Routes>
          <Route path="/" element={<CatalogPage />} />
          <Route path="/courses/:id" element={<CoursePage />} />
          <Route path="/lessons/:id" element={<LessonPage />} />
          <Route path="/flashcards" element={<FlashcardsPage />} />
          <Route path="/progress" element={<ProgressPage />} />
          <Route path="/admin/upload" element={<AdminUploadPage />} />
          <Route path="/platform" element={<ObservabilityPage />} />
        </Routes>
      </main>
    </div>
  );
}
