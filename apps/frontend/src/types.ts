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

export interface ReviewCard extends Flashcard {
  due_at: string;
  interval_days: number;
  ease: number;
}

export interface DueReviewQueue {
  user_id: string;
  generated_at: string;
  count: number;
  cards: ReviewCard[];
}

export interface ReviewState {
  user_id: string;
  flashcard_id: number;
  ease: number;
  interval_days: number;
  due_at: string;
  last_reviewed_at: string;
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
  course_slug?: string | null;
  course_category?: string | null;
  course_era?: string | null;
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

export interface LearningPathLesson {
  id: number;
  title: string;
  summary: string;
  sequence: number;
  state: "completed" | "recommended" | "locked";
  score?: number | null;
}

export interface LearningPathModule {
  course_id: number;
  slug: string;
  title: string;
  category: string;
  era: string;
  level: string;
  sequence: number;
  locked: boolean;
  lessons: LearningPathLesson[];
}

export interface LearningPath {
  user_id: string;
  recommended_lesson_id?: number | null;
  modules: LearningPathModule[];
}

export interface PlatformLab {
  slug: string;
  title: string;
  track: string;
  difficulty: string;
  estimated_minutes: number;
  scenario: string;
  skills: string[];
  commands: string[];
  checklist: string[];
  course_slug: string;
  lesson_id?: number | null;
}

export interface PlatformTrack {
  slug: string;
  title: string;
  role: string;
  summary: string;
  outcomes: string[];
  course: Course;
}

export interface PlatformAcademyCatalog {
  title: string;
  promise: string;
  total_courses: number;
  total_lessons: number;
  tracks: PlatformTrack[];
  labs: PlatformLab[];
}

export interface PlatformRoadmapStage {
  sequence: number;
  title: string;
  role: string;
  focus: string;
  course_slugs: string[];
  checkpoints: string[];
}

export interface PlatformAcademyRoadmap {
  stages: PlatformRoadmapStage[];
}

export interface Achievement {
  code: string;
  title: string;
  description: string;
  earned: boolean;
  progress: number;
  target: number;
  awarded_at?: string | null;
}

export interface UserDashboard {
  user_id: string;
  xp: {
    total: number;
    lesson_completion_xp: number;
    quiz_xp: number;
    review_xp: number;
  };
  daily_goal: {
    target_xp: number;
    earned_xp_today: number;
    met: boolean;
  };
  streak: {
    current_days: number;
    freeze_available: boolean;
    last_activity_date?: string | null;
  };
  achievements: Achievement[];
  completed_lessons: number;
  due_reviews: number;
}

export interface CharacterMetadata {
  id: number;
  simplified: string;
  traditional: string;
  pinyin: string;
  meaning: string;
  radical: string;
  strokes: number;
  mnemonic: string;
  cultural_note: string;
  example_words: string[];
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
