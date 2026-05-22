import { BookOpen, BrainCircuit, Brush, Gauge, GraduationCap, Layers3, Map, Trophy, UploadCloud } from "lucide-react";
import { NavLink, Route, Routes } from "react-router-dom";

import AdminUploadPage from "./pages/AdminUploadPage";
import CatalogPage from "./pages/CatalogPage";
import CharactersPage from "./pages/CharactersPage";
import CoursePage from "./pages/CoursePage";
import DashboardPage from "./pages/DashboardPage";
import FlashcardsPage from "./pages/FlashcardsPage";
import LearningPathPage from "./pages/LearningPathPage";
import LessonPage from "./pages/LessonPage";
import ObservabilityPage from "./pages/ObservabilityPage";
import ProgressPage from "./pages/ProgressPage";

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: Trophy },
  { to: "/path", label: "Learning Path", icon: Map },
  { to: "/", label: "Catalog", icon: BookOpen },
  { to: "/flashcards", label: "Reviews", icon: BrainCircuit },
  { to: "/characters", label: "Characters", icon: Brush },
  { to: "/progress", label: "Progress Log", icon: Layers3 },
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
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/path" element={<LearningPathPage />} />
          <Route path="/courses/:id" element={<CoursePage />} />
          <Route path="/lessons/:id" element={<LessonPage />} />
          <Route path="/flashcards" element={<FlashcardsPage />} />
          <Route path="/characters" element={<CharactersPage />} />
          <Route path="/progress" element={<ProgressPage />} />
          <Route path="/admin/upload" element={<AdminUploadPage />} />
          <Route path="/platform" element={<ObservabilityPage />} />
        </Routes>
      </main>
    </div>
  );
}
