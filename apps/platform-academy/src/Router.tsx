import type { ReactNode } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

export type AppRouterProps = {
  dashboard: ReactNode;
  roadmap: ReactNode;
  labs: ReactNode;
  labEvidenceJournal: ReactNode;
  labDetail: ReactNode;
  interviewPrep: ReactNode;
  resources: ReactNode;
  resourceDetail: ReactNode;
  designsIndex: ReactNode;
  designVariant: ReactNode;
  course: ReactNode;
  lessonByCourseSequence: ReactNode;
  lessonById: ReactNode;
};

export function AppRouter({
  dashboard,
  roadmap,
  labs,
  labEvidenceJournal,
  labDetail,
  interviewPrep,
  resources,
  resourceDetail,
  designsIndex,
  designVariant,
  course,
  lessonByCourseSequence,
  lessonById
}: AppRouterProps) {
  return (
    <Routes>
      <Route path="/" element={dashboard} />
      <Route path="/dashboard/home" element={dashboard} />
      <Route path="/roadmap" element={roadmap} />
      <Route path="/labs" element={labs} />
      <Route path="/labs/history" element={labEvidenceJournal} />
      <Route path="/labs/:slug" element={labDetail} />
      <Route path="/interview-prep" element={interviewPrep} />
      <Route path="/resources" element={resources} />
      <Route path="/resources/:slug" element={resourceDetail} />
      <Route path="/designs" element={designsIndex} />
      <Route path="/designs/:id" element={designVariant} />
      <Route path="/courses/:courseRef" element={course} />
      <Route path="/courses/:courseRef/lessons/:sequence" element={lessonByCourseSequence} />
      <Route path="/lessons/:id" element={lessonById} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
