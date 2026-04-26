import React from "react";
import ReactDOM from "react-dom/client";
import {
  Bell,
  Blocks,
  Gauge,
  Layers3,
  Mailbox,
  Network,
  TimerReset
} from "lucide-react";
import "./styles.css";

type View = "overview" | "notifications" | "templates" | "workflows" | "digest" | "queue";

type NotificationRow = {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string;
  status: string;
  created_at: string;
  read_at: string | null;
};

type Template = {
  id: string;
  slug: string;
  channel: string;
  subject?: string;
  body: string;
};

type Workflow = {
  id: string;
  slug: string;
  name: string;
  steps: Array<{
    id: string;
    channel: string;
    templateSlug: string;
    delayMs?: number;
    condition?: string;
  }>;
};

type DigestConfig = {
  id: string;
  key: string;
  user_id: string;
  window_ms: number;
  template_slug: string;
};

const views: Array<{ id: View; label: string; icon: React.ReactNode }> = [
  { id: "overview", label: "Overview", icon: <Gauge size={16} /> },
  { id: "notifications", label: "Notifications", icon: <Bell size={16} /> },
  { id: "templates", label: "Templates", icon: <Mailbox size={16} /> },
  { id: "workflows", label: "Workflows", icon: <Network size={16} /> },
  { id: "digest", label: "Digest", icon: <TimerReset size={16} /> },
  { id: "queue", label: "Queue", icon: <Layers3 size={16} /> }
];

const getInitialView = (): View => {
  const hash = window.location.hash.replace("#", "");
  return views.some((view) => view.id === hash) ? (hash as View) : "overview";
};

const iso = (value?: string | null) => (value ? new Date(value).toISOString() : "-");

async function api<T>(input: string, init?: RequestInit): Promise<T> {
  const response = await fetch(input, init);
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.error || "Request failed");
  }

  return payload.data as T;
}

function StatusDot({ status }: { status: string }) {
  const color =
    status === "sent" || status === "completed" || status === "delivered"
      ? "#22c55e"
      : status === "failed"
        ? "#ef4444"
        : status === "pending" || status === "running" || status === "queued"
          ? "#f59e0b"
          : "#64748b";

  return (
    <span className="status-cell">
      <span className="status-dot" style={{ backgroundColor: color }} />
      <span className="mono">{status}</span>
    </span>
  );
}

function App() {
  const [view, setView] = React.useState<View>(getInitialView());
  const [stats, setStats] = React.useState({
    total: 0,
    pending: 0,
    failed: 0,
    sent: 0,
    activeStreams: 0
  });
  const [notifications, setNotifications] = React.useState<NotificationRow[]>([]);
  const [notificationMeta, setNotificationMeta] = React.useState({ total: 0, page: 1, pageSize: 25 });
  const [expandedId, setExpandedId] = React.useState<string | null>(null);
  const [templates, setTemplates] = React.useState<Template[]>([]);
  const [workflows, setWorkflows] = React.useState<Workflow[]>([]);
  const [digestConfigs, setDigestConfigs] = React.useState<Array<DigestConfig & { pendingCount: number }>>([]);
  const [filters, setFilters] = React.useState({ type: "", status: "", user_id: "" });
  const [templateDraft, setTemplateDraft] = React.useState({
    slug: "",
    channel: "inapp",
    subject: "",
    body: ""
  });
  const [workflowModal, setWorkflowModal] = React.useState<string | null>(null);
  const [workflowRunForm, setWorkflowRunForm] = React.useState({
    userId: "user-1",
    to: "",
    variables: "{\"name\":\"Ryo\"}"
  });
  const [message, setMessage] = React.useState("Dashboard ready.");

  React.useEffect(() => {
    const onHash = () => setView(getInitialView());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  React.useEffect(() => {
    void refreshStats();
    const timer = window.setInterval(() => {
      void refreshStats();
    }, 10000);
    return () => window.clearInterval(timer);
  }, []);

  React.useEffect(() => {
    void loadNotifications();
  }, [filters]);

  React.useEffect(() => {
    void loadTemplates();
    void loadWorkflows();
    void loadDigestConfigs();
  }, []);

  const refreshStats = async () => {
    try {
      setStats(await api("/health/stats"));
    } catch (error) {
      setMessage((error as Error).message);
    }
  };

  const loadNotifications = async () => {
    const params = new URLSearchParams();
    if (filters.type) params.set("type", filters.type);
    if (filters.status) params.set("status", filters.status);
    if (filters.user_id) params.set("user_id", filters.user_id);

    try {
      const data = await api<{ items: NotificationRow[]; total: number; page: number; pageSize: number }>(
        `/notify?${params.toString()}`
      );
      setNotifications(data.items);
      setNotificationMeta({ total: data.total, page: data.page, pageSize: data.pageSize });
    } catch (error) {
      setMessage((error as Error).message);
    }
  };

  const loadTemplates = async () => {
    try {
      setTemplates(await api("/templates"));
    } catch (error) {
      setMessage((error as Error).message);
    }
  };

  const loadWorkflows = async () => {
    try {
      setWorkflows(await api("/workflows"));
    } catch (error) {
      setMessage((error as Error).message);
    }
  };

  const loadDigestConfigs = async () => {
    try {
      const configs = (await api("/digest/config")) as DigestConfig[];
      const withCounts = await Promise.all(
        configs.map(async (config) => {
          const events = await api<Array<{ id: string }>>(`/digest/events/${config.key}/${config.user_id}`);
          return { ...config, pendingCount: events.length };
        })
      );
      setDigestConfigs(withCounts);
    } catch (error) {
      setMessage((error as Error).message);
    }
  };

  const saveTemplate = async (event: React.FormEvent) => {
    event.preventDefault();
    await api("/templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(templateDraft)
    });
    setTemplateDraft({ slug: "", channel: "inapp", subject: "", body: "" });
    setMessage("Template created.");
    await loadTemplates();
  };

  const patchTemplate = async (slug: string, patch: Partial<Template>) => {
    await api(`/templates/${slug}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch)
    });
    setMessage(`Template ${slug} updated.`);
    await loadTemplates();
  };

  const triggerWorkflow = async () => {
    if (!workflowModal) {
      return;
    }

    await api(`/workflows/${workflowModal}/trigger`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: workflowRunForm.userId,
        to: workflowRunForm.to,
        variables: JSON.parse(workflowRunForm.variables || "{}")
      })
    });

    setMessage(`Workflow ${workflowModal} triggered.`);
    setWorkflowModal(null);
  };

  const flushDigest = async (key: string, userId: string) => {
    await api("/digest/flush", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, userId })
    });
    setMessage(`Flushed digest ${key}:${userId}.`);
    await loadDigestConfigs();
    await loadNotifications();
  };

  const content: Record<View, React.ReactNode> = {
    overview: (
      <section className="grid">
        {[
          ["Total", stats.total],
          ["Pending", stats.pending],
          ["Failed", stats.failed],
          ["Sent", stats.sent],
          ["Active SSE", stats.activeStreams]
        ].map(([label, value]) => (
          <article key={label} className="card">
            <p>{label}</p>
            <strong>{value}</strong>
          </article>
        ))}
      </section>
    ),
    notifications: (
      <section className="stack">
        <div className="toolbar">
          <input placeholder="type" value={filters.type} onChange={(e) => setFilters({ ...filters, type: e.target.value })} />
          <input placeholder="status" value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} />
          <input placeholder="user_id" className="mono" value={filters.user_id} onChange={(e) => setFilters({ ...filters, user_id: e.target.value })} />
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>User</th>
              <th>Type</th>
              <th>Title</th>
              <th>Status</th>
              <th>Created</th>
              <th>Read</th>
            </tr>
          </thead>
          <tbody>
            {notifications.map((item) => (
              <React.Fragment key={item.id}>
                <tr onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}>
                  <td className="mono">{item.id}</td>
                  <td className="mono">{item.user_id}</td>
                  <td>{item.type}</td>
                  <td>{item.title}</td>
                  <td><StatusDot status={item.status} /></td>
                  <td className="mono">{iso(item.created_at)}</td>
                  <td className="mono">{iso(item.read_at)}</td>
                </tr>
                {expandedId === item.id ? (
                  <tr className="expanded-row">
                    <td colSpan={7}><pre className="mono body-preview">{item.body}</pre></td>
                  </tr>
                ) : null}
              </React.Fragment>
            ))}
          </tbody>
        </table>
        <p className="placeholder mono">rows={notificationMeta.total} page={notificationMeta.page} pageSize={notificationMeta.pageSize}</p>
      </section>
    ),
    templates: (
      <section className="stack">
        <form className="card form-grid" onSubmit={saveTemplate}>
          <input placeholder="slug" className="mono" value={templateDraft.slug} onChange={(e) => setTemplateDraft({ ...templateDraft, slug: e.target.value })} />
          <select value={templateDraft.channel} onChange={(e) => setTemplateDraft({ ...templateDraft, channel: e.target.value })}>
            <option value="inapp">inapp</option>
            <option value="email">email</option>
          </select>
          <input placeholder="subject" value={templateDraft.subject} onChange={(e) => setTemplateDraft({ ...templateDraft, subject: e.target.value })} />
          <textarea placeholder="body" value={templateDraft.body} onChange={(e) => setTemplateDraft({ ...templateDraft, body: e.target.value })} />
          <button type="submit">Create template</button>
        </form>
        {templates.length === 0 ? <p className="placeholder mono">no templates loaded</p> : null}
        {templates.map((template) => (
          <article key={template.id} className="card stack">
            <div className="row">
              <strong>{template.slug}</strong>
              <span className="mono">{template.channel}</span>
            </div>
            <input
              value={template.subject || ""}
              onChange={(e) => {
                setTemplates((current) => current.map((item) => item.id === template.id ? { ...item, subject: e.target.value } : item));
              }}
              onBlur={() => void patchTemplate(template.slug, { subject: template.subject || "" })}
            />
            <textarea
              value={template.body}
              onChange={(e) => {
                setTemplates((current) => current.map((item) => item.id === template.id ? { ...item, body: e.target.value } : item));
              }}
              onBlur={() => void patchTemplate(template.slug, { body: template.body })}
            />
            <p className="placeholder mono">{template.body.slice(0, 80)}</p>
          </article>
        ))}
      </section>
    ),
    workflows: (
      <section className="stack">
        {workflows.length === 0 ? <p className="placeholder mono">no workflows loaded</p> : null}
        {workflows.map((workflow) => (
          <article key={workflow.id} className="card stack">
            <div className="row">
              <div>
                <strong>{workflow.name}</strong>
                <p className="placeholder mono">{workflow.slug}</p>
              </div>
              <button onClick={() => setWorkflowModal(workflow.slug)}>Trigger workflow</button>
            </div>
            <p className="placeholder mono">steps={workflow.steps.length}</p>
            <div className="timeline">
              {workflow.steps.map((step) => (
                <div key={step.id} className="timeline-step">
                  <span className="status-dot" />
                  <div>
                    <p>{step.channel} -&gt; <span className="mono">{step.templateSlug}</span></p>
                    <p className="placeholder mono">delayMs={step.delayMs || 0} condition={step.condition || "always"}</p>
                  </div>
                </div>
              ))}
            </div>
          </article>
        ))}
      </section>
    ),
    digest: (
      <section className="stack">
        {digestConfigs.length === 0 ? <p className="placeholder mono">no digest configs loaded</p> : null}
        <table className="data-table">
          <thead>
            <tr>
              <th>Key</th>
              <th>User</th>
              <th>Window</th>
              <th>Template</th>
              <th>Pending</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {digestConfigs.map((config) => (
              <tr key={config.id}>
                <td className="mono">{config.key}</td>
                <td className="mono">{config.user_id}</td>
                <td className="mono">{config.window_ms}</td>
                <td className="mono">{config.template_slug}</td>
                <td className="mono">{config.pendingCount}</td>
                <td><button onClick={() => void flushDigest(config.key, config.user_id)}>Flush</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    ),
    queue: (
      <section className="stack">
        <p className="placeholder mono">Queue monitoring unavailable - configure REDIS_URL</p>
      </section>
    )
  };

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <Blocks size={18} />
          <div>
            <strong>NotiQ</strong>
            <p>ops dashboard</p>
          </div>
        </div>
        <nav className="nav">
          {views.map((item) => (
            <button
              key={item.id}
              className={view === item.id ? "nav-item active" : "nav-item"}
              onClick={() => {
                window.location.hash = item.id;
                setView(item.id);
              }}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>
      <main className="main">
        <header className="topbar">
          <div>
            <h1>{views.find((item) => item.id === view)?.label}</h1>
            <p>{message}</p>
          </div>
          <button onClick={() => {
            void refreshStats();
            void loadNotifications();
            void loadTemplates();
            void loadWorkflows();
            void loadDigestConfigs();
          }}>Refresh</button>
        </header>
        {content[view]}
      </main>

      {workflowModal ? (
        <div className="modal-backdrop" onClick={() => setWorkflowModal(null)}>
          <div className="modal card" onClick={(event) => event.stopPropagation()}>
            <h2>Trigger workflow</h2>
            <input value={workflowRunForm.userId} onChange={(e) => setWorkflowRunForm({ ...workflowRunForm, userId: e.target.value })} />
            <input value={workflowRunForm.to} onChange={(e) => setWorkflowRunForm({ ...workflowRunForm, to: e.target.value })} placeholder="to email" />
            <textarea value={workflowRunForm.variables} onChange={(e) => setWorkflowRunForm({ ...workflowRunForm, variables: e.target.value })} />
            <button onClick={() => void triggerWorkflow()}>Run</button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
