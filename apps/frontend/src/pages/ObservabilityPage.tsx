import { Activity, Boxes, FileJson, LineChart } from "lucide-react";

const tiles = [
  { icon: Activity, title: "Tracing", body: "FastAPI and worker spans export through OTLP to Jaeger in local Compose." },
  { icon: LineChart, title: "Metrics", body: "Prometheus scrapes request latency, request counts, quiz attempts, lesson completions, and worker jobs." },
  { icon: FileJson, title: "Logs", body: "Services write JSON logs with request IDs; the optional logging profile routes container logs to OpenSearch." },
  { icon: Boxes, title: "Platform", body: "Docker Compose, Kubernetes manifests, Terraform scaffold, CI templates, SLOs, and runbooks live in-repo." }
];

export default function ObservabilityPage() {
  return (
    <section className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">SRE portfolio layer</p>
          <h1>Cloud-native operating model</h1>
          <p className="lead">The learning app is deliberately instrumented so reliability work can be shown with real traffic and real product actions.</p>
        </div>
      </header>

      <div className="platform-grid">
        {tiles.map((tile) => {
          const Icon = tile.icon;
          return (
            <div className="platform-tile" key={tile.title}>
              <Icon aria-hidden="true" />
              <h2>{tile.title}</h2>
              <p>{tile.body}</p>
            </div>
          );
        })}
      </div>

      <div className="ops-links">
        <a href="http://localhost:9090">Prometheus</a>
        <a href="http://localhost:3001">Grafana</a>
        <a href="http://localhost:16686">Jaeger</a>
        <a href="http://localhost:5601">OpenSearch Dashboards</a>
      </div>
    </section>
  );
}
