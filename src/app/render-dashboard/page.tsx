import { demoRenderDashboardSummary } from "@/effects/render-dashboard-mock";

const summary = demoRenderDashboardSummary;

const containerStyle: React.CSSProperties = {
  maxWidth: "960px",
  margin: "0 auto",
  padding: "2rem 1.5rem",
  fontFamily:
    'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  color: "#111827",
  lineHeight: 1.5,
};

const headerStyle: React.CSSProperties = {
  marginBottom: "2rem",
  paddingBottom: "1.5rem",
  borderBottom: "1px solid #e5e7eb",
};

const titleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "1.875rem",
  fontWeight: 700,
};

const subtitleStyle: React.CSSProperties = {
  margin: "0.5rem 0 0",
  color: "#6b7280",
  fontSize: "1rem",
};

const statsGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: "1rem",
  marginBottom: "2rem",
};

const statCardStyle: React.CSSProperties = {
  padding: "1rem",
  border: "1px solid #e5e7eb",
  borderRadius: "0.5rem",
  backgroundColor: "#f9fafb",
};

const statLabelStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "0.75rem",
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  color: "#6b7280",
};

const statValueStyle: React.CSSProperties = {
  margin: "0.5rem 0 0",
  fontSize: "1.125rem",
  fontWeight: 600,
};

const panelStyle: React.CSSProperties = {
  marginBottom: "1.5rem",
  padding: "1.25rem",
  border: "1px solid #e5e7eb",
  borderRadius: "0.5rem",
  backgroundColor: "#ffffff",
};

const panelTitleStyle: React.CSSProperties = {
  margin: "0 0 1rem",
  fontSize: "1.125rem",
  fontWeight: 600,
};

const listStyle: React.CSSProperties = {
  margin: 0,
  padding: 0,
  listStyle: "none",
};

const listItemStyle: React.CSSProperties = {
  padding: "0.75rem 0",
  borderTop: "1px solid #f3f4f6",
};

const itemPrimaryStyle: React.CSSProperties = {
  margin: 0,
  fontWeight: 600,
};

const itemSecondaryStyle: React.CSSProperties = {
  margin: "0.25rem 0 0",
  color: "#4b5563",
  fontSize: "0.875rem",
  wordBreak: "break-all",
};

const emptyStateStyle: React.CSSProperties = {
  margin: 0,
  color: "#6b7280",
};

const stats = [
  { label: "Queue ID", value: summary.queueId },
  { label: "Topic", value: summary.topic },
  { label: "Status", value: summary.status },
  { label: "Success Rate", value: summary.successRateLabel },
  { label: "Total Jobs", value: String(summary.totalJobs) },
  { label: "Completed Jobs", value: String(summary.completedJobs) },
  { label: "Failed Jobs", value: String(summary.failedJobs) },
];

export default function RenderDashboardPage() {
  return (
    <main style={containerStyle}>
      <header style={headerStyle}>
        <h1 style={titleStyle}>Render Dashboard</h1>
        <p style={subtitleStyle}>Mock render pipeline summary</p>
      </header>

      <section aria-label="Render stats" style={statsGridStyle}>
        {stats.map((stat) => (
          <article key={stat.label} style={statCardStyle}>
            <p style={statLabelStyle}>{stat.label}</p>
            <p style={statValueStyle}>{stat.value}</p>
          </article>
        ))}
      </section>

      <section aria-label="Outputs" style={panelStyle}>
        <h2 style={panelTitleStyle}>Outputs</h2>
        <ul style={listStyle}>
          {summary.outputs.map((output) => (
            <li key={output.jobId} style={listItemStyle}>
              <p style={itemPrimaryStyle}>{output.jobId}</p>
              <p style={itemSecondaryStyle}>{output.outputPath}</p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-label="Errors" style={panelStyle}>
        <h2 style={panelTitleStyle}>Errors</h2>
        {summary.errors.length === 0 ? (
          <p style={emptyStateStyle}>No errors</p>
        ) : (
          <ul style={listStyle}>
            {summary.errors.map((error) => (
              <li key={error.jobId} style={listItemStyle}>
                <p style={itemPrimaryStyle}>{error.jobId}</p>
                <p style={itemSecondaryStyle}>{error.error}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
