import { Compass } from "lucide-react";

export function EmptyState({ title, detail }: { title: string; detail?: string }) {
  return (
    <section className="state-panel">
      <Compass aria-hidden="true" />
      <h1>{title}</h1>
      {detail && <p>{detail}</p>}
    </section>
  );
}
