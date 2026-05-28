import { CheckCircle2, Languages, Terminal } from "lucide-react";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import { api } from "../api";
import EmptyState from "../components/EmptyState";
import type { Lesson } from "../types";

type ContentBlock =
  | { type: "heading"; content: string }
  | { type: "paragraph"; content: string }
  | { type: "list"; items: string[] }
  | { type: "code"; lines: string[] };

function parsePlatformContent(text: string): ContentBlock[] {
  const blocks: ContentBlock[] = [];
  let listItems: string[] = [];
  let codeLines: string[] = [];

  const flushList = () => {
    if (listItems.length > 0) {
      blocks.push({ type: "list", items: listItems });
      listItems = [];
    }
  };
  const flushCode = () => {
    if (codeLines.length > 0) {
      blocks.push({ type: "code", lines: codeLines });
      codeLines = [];
    }
  };

  text.split("\n").forEach((rawLine) => {
    const line = rawLine.trim();
    if (!line) {
      flushList();
      flushCode();
      return;
    }
    if (line.startsWith("## ")) {
      flushList();
      flushCode();
      blocks.push({ type: "heading", content: line.replace("## ", "") });
      return;
    }
    if (line.startsWith("- ")) {
      flushCode();
      listItems.push(line.replace("- ", ""));
      return;
    }
    if (line.startsWith("$ ")) {
      flushList();
      codeLines.push(line);
      return;
    }
    flushList();
    flushCode();
    blocks.push({ type: "paragraph", content: line });
  });
  flushList();
  flushCode();
  return blocks;
}

function PlatformContent({ text }: { text: string }) {
  return (
    <>
      {parsePlatformContent(text).map((block, index) => {
        if (block.type === "heading") return <h2 key={`${block.type}-${index}`}>{block.content}</h2>;
        if (block.type === "paragraph") return <p key={`${block.type}-${index}`}>{block.content}</p>;
        if (block.type === "code") {
          return (
            <pre key={`${block.type}-${index}`}>
              <code>{block.lines.join("\n")}</code>
            </pre>
          );
        }
        return (
          <ul key={`${block.type}-${index}`}>
            {block.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        );
      })}
    </>
  );
}

export default function LessonPage() {
  const { id = "" } = useParams();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [traditional, setTraditional] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api.lesson(id).then(setLesson).catch((err) => setError(err.message));
  }, [id]);

  if (error) return <EmptyState message={`Lesson unavailable: ${error}`} />;
  if (!lesson) return <EmptyState message="Loading lesson..." />;

  const complete = async () => {
    await api.saveProgress(lesson.id, true, 1);
    setSaved(true);
  };
  const isPlatformLesson = lesson.course_era === "Platform Academy" || lesson.course_slug?.startsWith("platform-");

  if (isPlatformLesson) {
    return (
      <section className="page lesson-page platform-lesson-page">
        <header className="page-header">
          <div>
            <p className="eyebrow">
              Platform Academy / {lesson.course_category} / Lesson {lesson.sequence}
            </p>
            <h1>{lesson.title}</h1>
            <p className="lead">{lesson.summary}</p>
          </div>
          <Terminal aria-hidden="true" className="header-icon" />
        </header>

        <article className="platform-lesson-body">
          <PlatformContent text={lesson.body_simplified} />
        </article>

        <section className="platform-lab-panel">
          <div>
            <p className="eyebrow">Hands-on lab</p>
            <h2>Practice scenario</h2>
          </div>
          <PlatformContent text={lesson.pinyin} />
        </section>

        <section>
          <h2>Key terms</h2>
          <div className="vocab-grid">
            {lesson.vocabulary.map((term) => (
              <div className="vocab-card platform-term-card" key={term.id}>
                <strong>{term.simplified}</strong>
                <span>{term.pinyin}</span>
                <p>{term.definition}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="review-prompts">
          <h2>Review prompts</h2>
          <div className="prompt-list">
            {lesson.flashcards.map((card) => (
              <article key={card.id}>
                <strong>{card.prompt}</strong>
                <p>{card.answer}</p>
              </article>
            ))}
          </div>
        </section>

        <button className="primary-action" onClick={complete}>
          <CheckCircle2 aria-hidden="true" />
          <span>{saved ? "Progress saved" : "Mark complete"}</span>
        </button>
      </section>
    );
  }

  return (
    <section className="page lesson-page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Lesson {lesson.sequence}</p>
          <h1>{lesson.title}</h1>
          <p className="lead">{lesson.summary}</p>
        </div>
        <button className="icon-button" onClick={() => setTraditional((value) => !value)} title="Toggle simplified/traditional">
          <Languages aria-hidden="true" />
          <span>{traditional ? "Traditional" : "Simplified"}</span>
        </button>
      </header>

      <article className="lesson-body">
        <p className="hanzi">{traditional ? lesson.body_traditional : lesson.body_simplified}</p>
        <p className="pinyin">{lesson.pinyin}</p>
      </article>

      <section>
        <h2>Vocabulary</h2>
        <div className="vocab-grid">
          {lesson.vocabulary.map((term) => (
            <div className="vocab-card" key={term.id}>
              <strong>{traditional ? term.traditional : term.simplified}</strong>
              <span>{term.pinyin}</span>
              <p>{term.definition}</p>
            </div>
          ))}
        </div>
      </section>

      <button className="primary-action" onClick={complete}>
        <CheckCircle2 aria-hidden="true" />
        <span>{saved ? "Progress saved" : "Mark complete"}</span>
      </button>
    </section>
  );
}
