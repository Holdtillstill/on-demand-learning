export function LevelBadge({ level }: { level: string }) {
  return <span className={`level-badge level-${level.toLowerCase().replace(/[^a-z]+/g, "-")}`}>{level}</span>;
}
