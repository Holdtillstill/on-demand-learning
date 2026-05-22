import { useState } from "react";

import { api } from "../api";
import type { CourseCreate } from "../types";

const sampleCourse: CourseCreate = {
  slug: "calligraphy-orchid-preface-demo",
  title: "Calligraphy: Orchid Pavilion Upload Demo",
  era: "Eastern Jin",
  level: "Advanced",
  category: "Art",
  description: "A self-service authoring sample that exercises the course upload API with calligraphy content.",
  subscription_tier: "mock_active",
  lessons: [
    {
      title: "Reading 行书 as Movement",
      summary: "Use calligraphy to connect Chinese text, cultural gathering, and visual rhythm.",
      body_simplified: "《兰亭集序》表现了书法的节奏、聚会的雅趣和时间的感叹。",
      body_traditional: "《蘭亭集序》表現了書法的節奏、聚會的雅趣和時間的感嘆。",
      pinyin: "Lántíng jí xù biǎoxiàn le shūfǎ de jiézòu, jùhuì de yǎqù hé shíjiān de gǎntàn.",
      audio_url: null,
      video_url: "https://example.com/media/orchid-preface.mp4",
      vocabulary: [
        { simplified: "书法", traditional: "書法", pinyin: "shūfǎ", definition: "calligraphy" },
        { simplified: "节奏", traditional: "節奏", pinyin: "jiézòu", definition: "rhythm" },
        { simplified: "雅趣", traditional: "雅趣", pinyin: "yǎqù", definition: "refined pleasure" }
      ],
      flashcards: [
        { prompt: "What does 书法 mean?", answer: "calligraphy", pinyin: "shūfǎ", difficulty: "intermediate" },
        { prompt: "Which text is associated with Wang Xizhi?", answer: "兰亭集序 / 蘭亭集序", pinyin: "Lántíng jí xù", difficulty: "advanced" }
      ]
    }
  ]
};

export default function AdminUploadPage() {
  const [jsonText, setJsonText] = useState(JSON.stringify(sampleCourse, null, 2));
  const [status, setStatus] = useState<string>("Paste a course JSON payload or use the sample, then upload.");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submitCourse() {
    setIsSubmitting(true);
    setStatus("Uploading course...");
    try {
      const parsed = JSON.parse(jsonText) as CourseCreate;
      const created = await api.createCourse(parsed);
      setStatus(`Created course #${created.id}: ${created.title}`);
    } catch (error) {
      setStatus(error instanceof Error ? `Upload failed: ${error.message}` : "Upload failed: unknown error");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Admin/course authoring flow</p>
          <h1>Upload structured course content</h1>
          <p>
            This demo exercises the same backend path an internal authoring tool would use. It is intentionally simple, but it
            proves validation, duplicate-slug handling, nested lessons, vocabulary, and flashcards end to end.
          </p>
        </div>
      </header>

      <div className="admin-grid">
        <label className="json-editor">
          <span>Course JSON payload</span>
          <textarea value={jsonText} onChange={(event) => setJsonText(event.target.value)} rows={24} spellCheck={false} />
        </label>
        <aside className="upload-panel">
          <h2>Upload checklist</h2>
          <ul>
            <li>Slug must be unique and kebab-case.</li>
            <li>At least one lesson is required.</li>
            <li>Vocabulary and flashcards are nested under each lesson.</li>
            <li>Errors surface as API status codes for operational debugging.</li>
          </ul>
          <button onClick={() => void submitCourse()} disabled={isSubmitting}>
            {isSubmitting ? "Uploading..." : "Upload course"}
          </button>
          <p className="status-message" role="status">
            {status}
          </p>
        </aside>
      </div>
    </section>
  );
}
