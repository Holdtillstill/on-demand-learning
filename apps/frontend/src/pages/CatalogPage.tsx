import { Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { api } from "../api";
import EmptyState from "../components/EmptyState";
import type { Course } from "../types";

export default function CatalogPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [error, setError] = useState("");

  useEffect(() => {
    api.courses("zhongwen").then(setCourses).catch((err) => setError(err.message));
  }, []);

  const categories = useMemo(() => ["All", ...Array.from(new Set(courses.map((course) => course.category)))], [courses]);
  const filtered = courses.filter((course) => {
    const matchesCategory = category === "All" || course.category === category;
    const searchable = `${course.title} ${course.description} ${course.era} ${course.category}`.toLowerCase();
    return matchesCategory && searchable.includes(query.toLowerCase());
  });

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Portfolio product surface</p>
          <h1>Mandarin, literature, art, and culture courses</h1>
        </div>
        <div className="search-box">
          <Search aria-hidden="true" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search Tang, Song, tones..." />
        </div>
      </header>

      <div className="filters" aria-label="Course category filters">
        {categories.map((item) => (
          <button key={item} className={item === category ? "selected" : ""} onClick={() => setCategory(item)}>
            {item}
          </button>
        ))}
      </div>

      {error && <EmptyState message={`API unavailable: ${error}`} />}
      <div className="course-grid">
        {filtered.map((course) => (
          <Link className="course-card" to={`/courses/${course.id}`} key={course.id}>
            <div className="card-meta">
              <span>{course.category}</span>
              <span>{course.era}</span>
            </div>
            <h2>{course.title}</h2>
            <p>{course.description}</p>
            <div className="card-footer">
              <span>{course.level}</span>
              <span>{course.subscription_tier === "free" ? "Free" : "Mock subscription"}</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
