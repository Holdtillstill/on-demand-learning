import { EmptyState } from "../components/EmptyState";

export function DeferredContentPage({ title, detail }: { title: string; detail: string }) {
  return (
    <section className="page canonical-page">
      <EmptyState title={title} detail={detail} />
    </section>
  );
}
