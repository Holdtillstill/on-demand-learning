import { useQuery } from "@tanstack/react-query";

import { api } from "../api";
import type { PlatformInterviewPrepIndex, PlatformLab, PlatformResources } from "../types";
import type { AcademyCoreData, AcademyData } from "../types/academy";

const EMPTY_RESOURCES: PlatformResources = {
  domains: [],
  types: [],
  resources: []
};

const EMPTY_INTERVIEW_PREP: PlatformInterviewPrepIndex = {
  domains: [],
  levels: [],
  total_questions: 0,
  packs: []
};

const LAB_RICH_ARRAY_FIELDS = [
  "skills",
  "prerequisites",
  "setup_commands",
  "setup_self_check_commands",
  "commands",
  "practice_steps",
  "expected_evidence",
  "validation_commands",
  "cleanup_commands",
  "no_cluster_fallback",
  "artifact_paths",
  "learner_artifact_paths",
  "workspace_quickstart_commands",
  "cluster_workspace_commands",
  "worksheet_prompts",
  "rubric",
  "validation_checks",
  "checklist"
] as const satisfies readonly (keyof PlatformLab)[];

const LAB_RICH_STRING_FIELDS = ["portfolio_focus", "workspace_archive_name", "workspace_root"] as const satisfies readonly (keyof PlatformLab)[];

export const academyQueryKeys = {
  core: (learnerId: string) => ["platform-academy", "core", learnerId] as const,
  deferredContent: ["platform-academy", "deferred-content"] as const
};

function richerStringArray(left: unknown, right: unknown) {
  const leftItems = Array.isArray(left) ? left.filter((item): item is string => typeof item === "string") : [];
  const rightItems = Array.isArray(right) ? right.filter((item): item is string => typeof item === "string") : [];
  return rightItems.length >= leftItems.length ? rightItems : leftItems;
}

function mergeLabPayload(left: PlatformLab, right: PlatformLab): PlatformLab {
  const merged: PlatformLab = { ...left, ...right };
  const arrayFields = merged as Record<(typeof LAB_RICH_ARRAY_FIELDS)[number], string[] | undefined>;
  const stringFields = merged as Record<(typeof LAB_RICH_STRING_FIELDS)[number], string | undefined>;

  for (const field of LAB_RICH_ARRAY_FIELDS) {
    arrayFields[field] = richerStringArray(left[field], right[field]);
  }
  for (const field of LAB_RICH_STRING_FIELDS) {
    const rightValue = typeof right[field] === "string" ? right[field] : "";
    const leftValue = typeof left[field] === "string" ? left[field] : "";
    stringFields[field] = rightValue.trim() ? rightValue : leftValue;
  }

  return merged;
}

function mergeLabPayloads(catalogLabs: PlatformLab[], labEndpointPayloads: PlatformLab[]) {
  const endpointBySlug = new globalThis.Map(labEndpointPayloads.map((lab) => [lab.slug, lab]));
  const catalogSlugs = new Set(catalogLabs.map((lab) => lab.slug));
  return [
    ...catalogLabs.map((lab) => {
      const endpointLab = endpointBySlug.get(lab.slug);
      return endpointLab ? mergeLabPayload(lab, endpointLab) : lab;
    }),
    ...labEndpointPayloads.filter((lab) => !catalogSlugs.has(lab.slug))
  ];
}

async function fetchAcademyCoreData(learnerId: string): Promise<AcademyCoreData> {
  const [catalog, roadmap, labs, progress, activity, labSubmissions, dashboard] = await Promise.all([
    api.catalog(),
    api.roadmap(),
    api.labs(),
    api.progress(learnerId),
    api.activity(learnerId),
    api.labSubmissions(learnerId),
    api.dashboard(learnerId, "platform")
  ]);

  return {
    catalog: { ...catalog, labs: mergeLabPayloads(catalog.labs, labs) },
    roadmap,
    progress,
    activity,
    labSubmissions,
    dashboard
  };
}

async function fetchDeferredContent() {
  const [resources, interviewPrep] = await Promise.all([api.resources(), api.interviewPrep()]);
  return { resources, interviewPrep };
}

export function useAcademyData(learnerId: string) {
  const coreQuery = useQuery({
    queryKey: academyQueryKeys.core(learnerId),
    queryFn: () => fetchAcademyCoreData(learnerId)
  });

  const deferredContentQuery = useQuery({
    queryKey: academyQueryKeys.deferredContent,
    queryFn: fetchDeferredContent,
    enabled: Boolean(coreQuery.data),
    staleTime: Infinity
  });

  const data: AcademyData | null = coreQuery.data
    ? {
        ...coreQuery.data,
        resources: deferredContentQuery.data?.resources ?? EMPTY_RESOURCES,
        resourcesLoaded: Boolean(deferredContentQuery.data?.resources),
        interviewPrep: deferredContentQuery.data?.interviewPrep ?? EMPTY_INTERVIEW_PREP,
        interviewPrepLoaded: Boolean(deferredContentQuery.data?.interviewPrep)
      }
    : null;

  return {
    data,
    isLoading: coreQuery.isLoading,
    error: coreQuery.error ?? deferredContentQuery.error,
    refetchCore: coreQuery.refetch
  };
}
