export interface GlossaryTerm {
  id: number;
  term: string;
  context: string;
  definition: string;
}

export interface Flashcard {
  id: number;
  lesson_id: number;
  prompt: string;
  answer: string;
  hint: string;
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
  body: string;
  practice_notes: string;
  audio_url?: string | null;
  video_url?: string | null;
  course_slug?: string | null;
  course_category?: string | null;
  course_era?: string | null;
  terms: GlossaryTerm[];
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

export interface PlatformActivity {
  id: number;
  user_id: string;
  target_type: string;
  target_id: string;
  state: string;
  updated_at: string;
}

export type PlatformLabSubmissionStatus = "in_progress" | "submitted";

export interface PlatformActivityInput {
  target_type: string;
  target_id: string;
  state?: string;
}

export interface PlatformLabSubmission {
  id: number;
  user_id: string;
  lab_slug: string;
  worksheet_answers: Record<string, string>;
  checked_items: Record<string, boolean>;
  status: PlatformLabSubmissionStatus;
  score: number;
  completed_checks: number;
  total_checks: number;
  answered_prompts: number;
  total_prompts: number;
  evidence_terms: string[];
  rubric_feedback: Array<{
    criterion: string;
    status: "missing" | "needs-evidence" | "passes" | "strong" | string;
    feedback: string;
    evidence_terms: string[];
  }>;
  created_at: string;
  updated_at: string;
}

export interface PlatformLabSubmissionInput {
  worksheet_answers: Record<string, string>;
  checked_items: Record<string, boolean>;
  status?: PlatformLabSubmissionStatus;
}

export interface PlatformInterviewStudyPlan {
  id: string;
  name: string;
  questionIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface PlatformLearnerStateExport {
  schema_version: number;
  exported_at: string;
  source_user_id: string;
  progress: Array<{
    lesson_id: number;
    completed: boolean;
    score: number;
    updated_at?: string | null;
  }>;
  activity: Array<{
    target_type: string;
    target_id: string;
    state: string;
    updated_at?: string | null;
  }>;
  lab_submissions: Array<{
    lab_slug: string;
    worksheet_answers: Record<string, string>;
    checked_items: Record<string, boolean>;
    status: PlatformLabSubmissionStatus;
    updated_at?: string | null;
  }>;
  interview_study_plans?: PlatformInterviewStudyPlan[];
}

export interface PlatformLearnerStateImportResult {
  user_id: string;
  progress_imported: number;
  activity_imported: number;
  lab_submissions_imported: number;
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
  lab_tier: "full" | "guided" | "evidence-pack";
  portfolio_grade?: boolean;
  portfolio_focus?: string;
  scenario: string;
  skills: string[];
  prerequisites?: string[];
  setup_commands?: string[];
  setup_self_check_commands?: string[];
  commands: string[];
  practice_steps?: string[];
  expected_evidence?: string[];
  validation_commands?: string[];
  cleanup_commands?: string[];
  no_cluster_fallback?: string[];
  artifact_paths?: string[];
  learner_artifact_paths?: string[];
  workspace_archive_name?: string;
  workspace_root?: string;
  workspace_quickstart_commands?: string[];
  cluster_workspace_commands?: string[];
  worksheet_prompts?: string[];
  rubric?: string[];
  validation_checks?: string[];
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
  source_takeaways?: string[];
  study_tasks?: string[];
  interview_prompts?: string[];
  official_sources?: PlatformOfficialSource[];
  source_url?: string | null;
  source_label?: string | null;
  reviewed_at?: string | null;
}

export interface PlatformResources {
  domains: string[];
  types: string[];
  resources: PlatformResource[];
}

export interface PlatformOfficialSource {
  label: string;
  url: string;
}

export interface PlatformInterviewQuestion {
  question: string;
  scenario: string;
  answer_outline: string[];
  strong_signals: string[];
  red_flags: string[];
  practice_task: string;
}

export interface PlatformInterviewPrep {
  slug: string;
  title: string;
  domain: string;
  level_group: string;
  focus: string;
  related_course_slug: string;
  related_labs: string[];
  official_sources: PlatformOfficialSource[];
  questions: PlatformInterviewQuestion[];
}

export interface PlatformInterviewPrepIndex {
  domains: string[];
  levels: string[];
  total_questions: number;
  packs: PlatformInterviewPrep[];
}
