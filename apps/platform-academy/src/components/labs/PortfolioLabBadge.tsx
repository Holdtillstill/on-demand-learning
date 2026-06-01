import type { PlatformLab } from "../../types";

export function PortfolioLabBadge({ lab }: { lab: PlatformLab }) {
  if (lab.portfolio_grade !== true) return null;
  return <span className="portfolio-lab-badge">{lab.portfolio_focus ? lab.portfolio_focus : "Portfolio-grade"}</span>;
}
