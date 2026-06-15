import { ReferenceFigmaStatus } from "../components/ReferenceFigmaScreens";

export function DeferredContentPage({ title, detail }: { title: string; detail: string }) {
  return <ReferenceFigmaStatus title={title.replace(/\.\.\.$/, "")} detail={detail} />;
}
