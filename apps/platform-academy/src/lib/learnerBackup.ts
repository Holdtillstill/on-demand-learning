import type { PlatformLearnerStateExport } from "../types";

const learnerStateLimits = {
  progressRows: 120,
  activityRows: 600,
  labRows: 40,
  studyPlanRows: 25,
  studyPlanQuestionRows: 250,
  studyPlanNameLength: 120,
  worksheetFields: 80,
  checkedFields: 160,
  fieldKeyLength: 100,
  worksheetValueLength: 4000
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function validateBackupFieldMap(value: unknown, valueType: "string" | "boolean", maxFields: number) {
  if (!isRecord(value)) return false;
  const entries = Object.entries(value);
  if (entries.length > maxFields) return false;
  return entries.every(([key, entryValue]) => {
    if (key.length > learnerStateLimits.fieldKeyLength) return false;
    if (valueType === "string") return typeof entryValue === "string" && entryValue.length <= learnerStateLimits.worksheetValueLength;
    return typeof entryValue === "boolean";
  });
}

function validateBackupStudyPlans(value: unknown) {
  if (value === undefined) return true;
  if (!Array.isArray(value) || value.length > learnerStateLimits.studyPlanRows) return false;
  return value.every((plan) => {
    if (!isRecord(plan)) return false;
    if (typeof plan.id !== "string" || typeof plan.name !== "string") return false;
    if (plan.id.length > learnerStateLimits.fieldKeyLength || plan.name.length > learnerStateLimits.studyPlanNameLength) return false;
    if (typeof plan.createdAt !== "string" || typeof plan.updatedAt !== "string") return false;
    if (!Array.isArray(plan.questionIds) || plan.questionIds.length > learnerStateLimits.studyPlanQuestionRows) return false;
    return plan.questionIds.every((questionId) => typeof questionId === "string" && questionId.length <= learnerStateLimits.fieldKeyLength);
  });
}

export function learnerBackupValidationError(value: unknown) {
  if (!isRecord(value)) return "Use an exported Platform Academy JSON backup.";
  if (value.schema_version !== 1) return "Backup schema version is not supported.";
  if (!Array.isArray(value.progress) || !Array.isArray(value.activity) || !Array.isArray(value.lab_submissions)) {
    return "Use an exported Platform Academy JSON backup.";
  }
  if (
    value.progress.length > learnerStateLimits.progressRows ||
    value.activity.length > learnerStateLimits.activityRows ||
    value.lab_submissions.length > learnerStateLimits.labRows
  ) {
    return "Backup is too large for import.";
  }
  const state = value as unknown as PlatformLearnerStateExport;
  for (const labSubmission of state.lab_submissions) {
    if (!isRecord(labSubmission) || typeof labSubmission.lab_slug !== "string") {
      return "Use an exported Platform Academy JSON backup.";
    }
    if (
      !validateBackupFieldMap(labSubmission.worksheet_answers, "string", learnerStateLimits.worksheetFields) ||
      !validateBackupFieldMap(labSubmission.checked_items, "boolean", learnerStateLimits.checkedFields)
    ) {
      return "Backup lab workbook fields exceed the import limit.";
    }
  }
  if (!validateBackupStudyPlans(value.interview_study_plans)) {
    return "Backup interview study plans exceed the import limit.";
  }
  return "";
}
