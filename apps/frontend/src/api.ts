import type { Course, Flashcard, Lesson, Progress } from "./types";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`);
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`);
  }
  return response.json();
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`);
  }
  return response.json();
}

export const api = {
  courses: () => getJson<Course[]>("/api/courses"),
  course: (id: string) => getJson<Course>(`/api/courses/${id}`),
  lesson: (id: string) => getJson<Lesson>(`/api/lessons/${id}`),
  flashcards: () => getJson<Flashcard[]>("/api/flashcards"),
  progress: (userId = "demo-user") => getJson<Progress[]>(`/api/progress/${userId}`),
  search: (q: string) => getJson<{ courses: Course[]; lessons: Lesson[] }>(`/api/search?q=${encodeURIComponent(q)}`),
  saveProgress: (lessonId: number, completed: boolean, score: number) =>
    postJson<Progress>("/api/progress", { user_id: "demo-user", lesson_id: lessonId, completed, score }),
  quizAttempt: (lessonId: number, score: number, answers: Record<string, string>) =>
    postJson("/api/quiz/attempts", { user_id: "demo-user", lesson_id: lessonId, score, answers })
};
