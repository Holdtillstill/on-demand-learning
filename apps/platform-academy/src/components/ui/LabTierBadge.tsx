import type { PlatformLab } from "../../types";

const labTierLabels: Record<PlatformLab["lab_tier"], string> = {
  full: "Full lab",
  guided: "Guided lab",
  "evidence-pack": "Evidence pack"
};

export function LabTierBadge({ tier }: { tier: PlatformLab["lab_tier"] }) {
  return <span className={`lab-tier-badge lab-tier-${tier}`}>{labTierLabels[tier]}</span>;
}
