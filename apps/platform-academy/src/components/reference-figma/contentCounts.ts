import { interviewPacks, labs, lessonDetails, resources } from "./v1/data";

export const referenceContentCounts = {
  lessons: lessonDetails.length,
  labs: labs.length,
  resources: resources.length,
  interviewPacks: interviewPacks.length,
  interviewQuestions: interviewPacks.reduce((total, pack) => total + pack.questionCount, 0)
};
