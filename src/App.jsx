import React, { useState } from "react";
import { 
  Activity, AlertTriangle, ArrowUpRight, Bot, CheckCircle2, 
  DollarSign, LayoutDashboard, MessageSquare, RefreshCw, 
  ShieldCheck, Sparkles, XCircle, Zap 
} from "lucide-react";

const demo = {
  id: "INC-2026-8185",
  title: "Chicken Burger stockout risk",
  riskLevel: "CRITICAL",
  riskScore: 94,
  status: "PENDING_APPROVAL",
  summary: "Inventory is below safety thresholds while demand remains high.",
  affectedOrders: 12,
  revenueAtRisk: 48000,
  predictedImpact: "Stockout likely within 4 hours at current sales velocity.",
  recommendation: "Transfer 20 units from Branch B to maintain fulfillment.",
  confidence: 94,
  evidence: ["Current stock: 8 units", "Daily demand: 45 units", "12 active orders", "Branch B excess: 35 units"]
};

const initialIncidents = [
  demo,
  {
    id: "RF-204",
    title: "5 orders approaching SLA limit",
    riskLevel: "HIGH",
    riskScore: 76,
    status: "MONITORING",
    affectedOrders: 5,
    revenueAtRisk: 18750,
    summary: "Pending orders approaching service level agreement deadlines.",
    predictedImpact: "Fulfillment delays may trigger automated refund actions.",
    recommendation: "Assign dispatch owner directly to active batch.",
    confidence: 91,
    evidence: ["5 orders exceeding 80% SLA window"]
  },
  {
    id: "RF-198",
    title: "Customer complaint spike",
    riskLevel: "MEDIUM",
    riskScore: 61,
    status: "OPEN",
    affectedOrders: 7,
    revenueAtRisk: 9200,
    summary: "Elevated feedback rate detected across local branch routes.",
    predictedImpact: "Customer retention index score decreased by 4%.",
    recommendation: "Audit late deliveries for last-mile logistics routing.",
    confidence: 87,
    evidence: ["Complaint volume 2.1x above standard baseline"]
  }
];

const base = import.meta.env.VITE_N8N_BASE_URL || "https://mekan-mellz.app.n8n.cloud";
const paths = {
  simulate: import.meta.env.VITE_N8N_SIMULATE_PATH || "/webhook/rescueflow-api",
  approve: import.meta.env.VITE_N8N_APPROVE_PATH || "/webhook/rescueflow-api",
  reject: import.meta.env.VITE_N8N_REJECT_PATH || "/webhook/rescueflow-api",
  ask: import.meta.env.VITE_N8N_ASK_PATH || "/webhook/rescueflow-api"
};

// Generic API Caller for n8n Webhooks
async function apiCall(path, method = "POST", body = null) {
  const options = { method };
  if (body) {
    options.headers = { "Content-Type": "application/json" };
    options.body = JSON.stringify(body);
  }
  const response = await fetch(base + path, options);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json().catch(() => ({}));
}

const money = n => new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(n || 0);

export default function App() {
  const [incidents, setIncidents] = useState(initialIncidents);
  const [selected, setSelected] = useState(demo);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState("");
  const [health, setHealth] = useState(82);
  const [q, setQ] = useState("");
  const [answer, setAnswer] = useState("");

  const criticalCount = incidents.filter(x => (x.riskLevel === "CRITICAL" || x.riskLevel === "HIGH") && x.status !== "RESOLVED").length;
  const totalRevenueAtRisk = incidents.filter(x => x.status !== "RESOLVED").reduce((acc, item) => acc + (item.revenueAtRisk || 0), 0);

  // 1. SIMULATE ACTION (Routes to Google Sheets branch in n8n)
  const simulate = async () => {
    setBusy(true);
    setToast("Executing live n8n workflow pipeline...");
    try {
      const data = await apiCall(paths.simulate, "POST", { action: "simulate" });

      if (data && data.ai_analysis) {
        const analysis = data.ai_analysis;
        const actionPlan = data.ai_action_plan || {};
        const healthMetrics = data.health_metrics || {};

        const liveIncident = {
          id: analysis.incident_id || "INC-2026-8185",
          title: analysis.title || "Critical Operational Risk Detected",
          riskLevel: analysis.risk_score > 80 ? "CRITICAL" : "HIGH",
          riskScore: analysis.risk_score || 85,
          status: analysis.status || "PENDING_APPROVAL",
          summary: analysis.summary || "High stock shortage risk identified.",
          affectedOrders: analysis.orders_exposed || 0,
          revenueAtRisk: analysis.revenue_at_risk || 0,
          predictedImpact: analysis.predicted_impact || "Potential order fulfillment delays.",
          recommendation: actionPlan.primary_action || analysis.recommendation || "Initiate emergency stock transfer.",
          confidence: analysis.confidence || 95,
          evidence: analysis.evidence || [`Risk score: ${analysis.risk_score}`, `Exposed orders: ${analysis.orders_exposed}`]
        };

        if (healthMetrics.operations_health) setHealth(healthMetrics.operations_health);
        setSelected(liveIncident);
        setIncidents(prev => [liveIncident, ...prev.filter(i => i.id !== liveIncident.id)]);
        setToast("Live n8n workflow execution complete!");
      } else {
        setToast("Connected to n8n successfully.");
      }
    } catch (err) {
      console.error(err);
      setToast("n8n pipeline offline. Displaying local state.");
    } finally {
      setBusy(false);
    }
  };

  // 2. APPROVE ACTION (Routes to Decision/Telegram branch in n8n)
  const approve = async () => {
    setBusy(true);
    try {
      await apiCall(paths.approve, "POST", { 
        action: "approve", 
        incident_id: selected.id, 
        decision: "APPROVED", 
        recommendation: selected.recommendation 
      });

      setSelected(prev => ({ ...prev, status: "RESOLVED" }));
      setIncidents(prev => prev.map(i => i.id === selected.id ? { ...i, status: "RESOLVED" } : i));
      setHealth(96);
      setToast("Approved! Telegram notification dispatched via n8n.");
    } catch (err) {
      console.error(err);
      setToast("Error executing approval action.");
    } finally {
      setBusy(false);
    }
  };

  // 3. REJECT ACTION (Routes to Decision branch in n8n)
  const reject = async () => {
    setBusy(true);
    try {
      await apiCall(paths.reject, "POST", { 
        action: "reject", 
        incident_id: selected.id, 
        decision: "REJECTED" 
      });

      setSelected(prev => ({ ...prev, status: "REVIEW REQUIRED" }));
      setIncidents(prev => prev.map(i => i.id === selected.id ? { ...i, status: "REVIEW REQUIRED" } : i));
      setToast("Action rejected. Logged into review queue.");
    } catch (err) {
      console.error(err);
      setToast("Error recording rejection.");
    } finally {
      setBusy(false);
    }
  };

  // 4. ASK ASSISTANT ACTION
  const ask = async () => {
    if (!q.trim()) return;
    setAnswer("Querying operational state context...");
    try {
      const res = await apiCall(paths.ask, "POST", { action: "ask", question: q, context: { incidents, health } });
      setAnswer(res.answer || res.message || "No response generated.");
    } catch (err) {
      console.error(err);
      setAnswer(`Top Priority: '${selected.title}' with ${selected.affectedOrders} orders impacted (${money(selected.revenueAtRisk)} exposed).`);
    }
  };

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <div className="brandMark"><ShieldCheck size={22} /></div>
          <div><b>RESCUEFLOW</b><span>AI OPERATIONS</span></div>
        </div>
        <nav>
          <a className="active"><LayoutDashboard size={18} /> Command Center</a>
          <a><Activity size={18} /> Incidents</a>
          <a><Zap size={18} /> Automations</a>
          <a><Bot size={18} /> AI Intelligence</a>
          <a><MessageSquare size={18} /> Ask RescueFlow</a>
        </nav>
        <div className="sideCard">
          <small>AI BUILDFEST ENTRY</small>
          <p>Retail / FMCG Operations</p>
          n8n Integration Node Connected
        </div>
      </aside>

      <main className="main">
        <header className="top">
          <div>
            <small>AI OPERATIONS CONTROL CENTER</small>
            <h1>RescueFlow <em>AI</em></h1>
          </div>
          <div className="online">
            ● SYSTEM ONLINE
            <button onClick={() => location.reload()}><RefreshCw size={14} /></button>
          </div>
        </header>

        <section className="hero">
          <div>
            <small>OPERATIONAL INTELLIGENCE</small>
            <h2>Detect risk. Understand impact.<br /><em>Respond before disruption.</em></h2>
            <p>RescueFlow aggregates real-time operational signals, scores risk severity with AI, and suggests safe mitigation workflows.</p>
          </div>
          <button className="simulate" disabled={busy} onClick={simulate}>
            <Sparkles size={16} /> {busy ? "EXECUTING..." : "SIMULATE CRITICAL INCIDENT"}
          </button>
        </section>

        <section className="metrics">
          <Metric label="Operations Health" value={health + "%"} sub="Live operating posture" icon={<Activity size={20} />} />
          <Metric label="Critical Incidents" value={criticalCount} sub="Require attention" icon={<AlertTriangle size={20} />} red />
          <Metric label="Revenue at Risk" value={money(totalRevenueAtRisk)} sub="Unresolved exposure" icon={<DollarSign size={20} />} red />
          <Metric label="AI Confidence" value={(selected.confidence || 95) + "%"} sub="Current analysis" icon={<Bot size={20} />} />
        </section>

        <section className="grid">
          <Panel>
            <Head over="AI PRIORITY QUEUE" title="What needs attention?" count={incidents.length} />
            <div className="list">
              {incidents.map(i => (
                <button 
                  className={"incident " + (selected.id === i.id ? "selected" : "")} 
                  onClick={() => setSelected(i)} 
                  key={i.id}
                >
                  <b className={"sev " + (i.riskLevel ? i.riskLevel.toLowerCase() : "high")}>{i.riskLevel}</b>
                  <span>
                    <strong>{i.title}</strong>
                    <small>{i.affectedOrders} orders · {money(i.revenueAtRisk)} exposed</small>
                  </span>
                  <b>{i.riskScore}</b>
                  <ArrowUpRight size={16} />
                </button>
              ))}
            </div>
          </Panel>

          <Panel>
            <Head over="AI INCIDENT ANALYSIS" title={selected.title} badge={selected.status} />
            <div>
              <Label t="SUMMARY OF SITUATION" />
              <p style={{ fontSize: "14px", marginTop: "4px" }}>{selected.summary}</p>
              
              <div className="impacts">
                <Impact t="Risk Score" v={selected.riskScore + "/100"} />
                <Impact t="Orders Exposed" v={selected.affectedOrders} />
                <Impact t="Revenue at Risk" v={money(selected.revenueAtRisk)} />
              </div>

              <Label t="PREDICTED IMPACT" />
              <p style={{ fontSize: "14px", marginTop: "4px" }}>{selected.predictedImpact}</p>

              <div className="recommend">
                <div><Bot size={16} /> AI RECOMMENDATION <span>{selected.confidence}% confidence</span></div>
                <strong>{selected.recommendation}</strong>
                <section>
                  {selected.evidence && selected.evidence.map((e, idx) => <small key={idx}>✓ {e}</small>)}
                </section>
              </div>

              <div className="approval">
                <div>
                  <Label t="HUMAN-IN-THE-LOOP APPROVAL" />
                  <p style={{ fontSize: "12px", color: "#94a3b8" }}>High-impact actions require manager sign-off.</p>
                </div>
                <div>
                  <button className="approve" disabled={busy || selected.status === "RESOLVED"} onClick={approve}>
                    <CheckCircle2 size={16} /> Approve
                  </button>
                  <button className="reject" disabled={busy || selected.status === "RESOLVED"} onClick={reject}>
                    <XCircle size={16} /> Reject
                  </button>
                </div>
              </div>
            </div>
          </Panel>
        </section>

        <section className="lower">
          <Panel>
            <Head over="AUTOMATION TRACE" title="Incident Execution Timeline" />
            <div className="timeline">
              {["Risk signal detected", "AI impact calculation complete", "Manager alert dispatched via Telegram", selected.status === "RESOLVED" ? "Action approved by operator" : "Awaiting approval", selected.status === "RESOLVED" ? "Inventory transfer automated" : "Ready to execute"].map((step, idx) => (
                <div className={idx < 3 || (selected.status === "RESOLVED" && idx < 5) ? "done" : ""} key={idx}>
                  <i /> <small>{["12:40", "12:41", "12:41", "12:45", "12:46"][idx]}</small>
                  <b>{step}</b>
                </div>
              ))}
            </div>
          </Panel>

          <Panel>
            <Head over="AI ASSISTANT" title="Ask RescueFlow" icon={<Bot size={18} />} />
            <div className="ask">
              <div className="answer">{answer || "Ask about active risks, inventory status, or recommended mitigation actions."}</div>
              <div className="input">
                <input 
                  value={q} 
                  onChange={e => setQ(e.target.value)} 
                  onKeyDown={e => e.key === "Enter" && ask()} 
                  placeholder="e.g. What is the current stock risk for Branch B?"
                />
                <button onClick={ask}><ArrowUpRight size={16} /></button>
              </div>
            </div>
          </Panel>
        </section>

        <footer>RescueFlow AI Operations Control Center · Retail & FMCG Risk Automation</footer>
      </main>

      {toast && <div className="toast" onClick={() => setToast("")}>{toast}</div>}
    </div>
  );
}

function Metric({ label, value, sub, icon, red }) {
  return (
    <div className="metric">
      <div className={"mi " + (red ? "red" : "")}>{icon}</div>
      <span>{label}<strong>{value}</strong><small>{sub}</small></span>
    </div>
  );
}

function Panel({ children }) { return <div className="panel">{children}</div>; }
function Head({ over, title, count, badge, icon }) {
  return (
    <div className="head">
      <div><small>{over}</small><h3>{title}</h3></div>
      {count && <b className="count">{count}</b>}
      {badge && <b className="badge">{badge}</b>}
      {icon}
    </div>
  );
}
function Label({ t }) { return <small className="label">{t}</small>; }
function Impact({ t, v }) { return <div><small>{t}</small><b>{v}</b></div>; }