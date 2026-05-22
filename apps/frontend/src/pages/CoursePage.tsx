import { ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { api } from "../api";
import EmptyState from "../components/EmptyState";
import type { Course } from "../types";

export default function CoursePage() {
  const { id = "" } = useParams();
  const [course, setCourse] = useState<Course | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.course(id).then(setCourse).catch((err) => setError(err.message));
  }, [id]);

  if (error) return <EmptyState message={`Course unavailable: ${error}`} />;
  if (!course) return <EmptyState message="Loading course..." />;

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">{course.category} / {course.era} / {course.level}</p>
          <h1>{course.title}</h1>
          <p className="lead">{course.description}</p>
        </div>
      </header>

      <div className="lesson-list">
        {course.lessons.map((lesson) => (
          <Link className="lesson-row" to={`/lessons/${lesson.id}`} key={lesson.id}>
            <div>
              <span>Lesson {lesson.sequence}</span>
              <h2>{lesson.title}</h2>
              <p>{lesson.summary}</p>
            </div>
            <ArrowRight aria-hidden="true" />
          </Link>
        ))}
      </div>
    </section>
  );
}
