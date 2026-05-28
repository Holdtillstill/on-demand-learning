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

export interface Progress {
  id: number;
  user_id: string;
  lesson_id: number;
  completed: boolean;
  score: number;
  updated_at: string;
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

export interface PlatformLab {
  slug: string;
  title: string;
  track: string;
  difficulty: string;
  level_group: string;
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
  level_group: string;
  audience: string;
  outcomes: string[];
  course: Course;
}

export interface PlatformLevel {
  slug: string;
  title: string;
  level_group: string;
  audience: string;
  total_courses: number;
  total_lessons: number;
  courses: Course[];
}

export interface PlatformAcademyCatalog {
  title: string;
  promise: string;
  total_courses: number;
  total_lessons: number;
  levels: PlatformLevel[];
  tracks: PlatformTrack[];
  labs: PlatformLab[];
}

export interface PlatformRoadmapStage {
  sequence: number;
  title: string;
  role: string;
  focus: string;
  level_group: string;
  course_slugs: string[];
  checkpoints: string[];
}

export interface PlatformAcademyRoadmap {
  stages: PlatformRoadmapStage[];
}

export interface PlatformResource {
  slug: string;
  title: string;
  domain: string;
  level_group: string;
  resource_type: string;
  estimated_minutes: number;
  summary: string;
  outcomes: string[];
  prerequisites: string[];
  safety_level: string;
  commands: string[];
  artifacts: string[];
  related_lessons: number[];
  related_labs: string[];
  next_steps: string[];
}

export interface PlatformResources {
  domains: string[];
  types: string[];
  resources: PlatformResource[];
}
