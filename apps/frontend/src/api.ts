import type {
  CharacterMetadata,
  Course,
  CourseCreate,
  DueReviewQueue,
  Flashcard,
  LearningPath,
  Lesson,
  Progress,
  ReviewState,
  UserDashboard
} from "./types";

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
    let detail = response.statusText;
    try {
      const payload = (await response.json()) as { detail?: unknown };
      detail = typeof payload.detail === "string" ? payload.detail : JSON.stringify(payload.detail);
    } catch {
      detail = response.statusText;
    }
    throw new Error(`${response.status} ${detail}`);
  }
  return response.json();
}

export const api = {
  courses: () => getJson<Course[]>("/api/courses"),
  course: (id: string) => getJson<Course>(`/api/courses/${id}`),
  lesson: (id: string) => getJson<Lesson>(`/api/lessons/${id}`),
  flashcards: () => getJson<Flashcard[]>("/api/flashcards"),
  progress: (userId = "demo-user") => getJson<Progress[]>(`/api/progress/${userId}`),
  dashboard: (userId = "demo-user") => getJson<UserDashboard>(`/api/users/${userId}/dashboard`),
  learningPath: (userId = "demo-user") => getJson<LearningPath>(`/api/learning-path?user_id=${encodeURIComponent(userId)}`),
  dueReviews: (userId = "demo-user") => getJson<DueReviewQueue>(`/api/reviews/due?user_id=${encodeURIComponent(userId)}`),
  answerReview: (flashcardId: number, quality: number, correct: boolean, userId = "demo-user") =>
    postJson<ReviewState>(`/api/reviews/${flashcardId}/answer`, { user_id: userId, quality, correct }),
  characters: () => getJson<CharacterMetadata[]>("/api/characters"),
  search: (q: string) => getJson<{ courses: Course[]; lessons: Lesson[] }>(`/api/search?q=${encodeURIComponent(q)}`),
  saveProgress: (lessonId: number, completed: boolean, score: number) =>
    postJson<Progress>("/api/progress", { user_id: "demo-user", lesson_id: lessonId, completed, score }),
  quizAttempt: (lessonId: number, score: number, answers: Record<string, string>) =>
    postJson("/api/quiz/attempts", { user_id: "demo-user", lesson_id: lessonId, score, answers }),
  createCourse: (course: CourseCreate) => postJson<Course>("/api/admin/courses", course)
};
