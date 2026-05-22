export interface VocabularyTerm {
  id: number;
  simplified: string;
  traditional: string;
  pinyin: string;
  definition: string;
}

export interface Flashcard {
  id: number;
  lesson_id: number;
  prompt: string;
  answer: string;
  pinyin: string;
  difficulty: string;
}

export interface LessonSummary {
  id: number;
  course_id: number;
  title: string;
  summary: string;
  sequence: number;
}

export interface Lesson extends LessonSummary {
  body_simplified: string;
  body_traditional: string;
  pinyin: string;
  audio_url?: string | null;
  video_url?: string | null;
  vocabulary: VocabularyTerm[];
  flashcards: Flashcard[];
}

export interface Course {
  id: number;
  slug: string;
  title: string;
  era: string;
  level: string;
  category: string;
  description: string;
  subscription_tier: string;
  lessons: LessonSummary[];
}

export interface CourseCreate {
  slug: string;
  title: string;
  era: string;
  level: string;
  category: string;
  description: string;
  subscription_tier: string;
  lessons: Array<{
    title: string;
    summary: string;
    body_simplified: string;
    body_traditional: string;
    pinyin: string;
    audio_url?: string | null;
    video_url?: string | null;
    vocabulary: Array<{ simplified: string; traditional: string; pinyin: string; definition: string }>;
    flashcards: Array<{ prompt: string; answer: string; pinyin: string; difficulty: string }>;
  }>;
}

export interface Progress {
  id: number;
  user_id: string;
  lesson_id: number;
  completed: boolean;
  score: number;
  updated_at: string;
}
