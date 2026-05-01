import { useState } from "react";
import { exportToPptx, exportToPdf } from "./exportUtils";

const C = {
  blue: "#003087", red: "#E4002B", lightBlue: "#0057A8",
  navy: "#001A4E", gray: "#F4F6FA", darkGray: "#2D3748",
  mid: "#64748B", white: "#FFFFFF", green: "#0A7C59",
  amber: "#D97706", teal: "#0891B2", purple: "#6D28D9",
};

const MODULES = ["PolicyCenter (PC)", "ClaimCenter (CC)", "BillingCenter (BC)", "Digital - Jutro"];
const INTEGRATIONS = [
  "Policy Data Service", "Payment Gateway", "FNOL / Third-Party Claims",
  "Document Management (DocuSign)", "External Rating Engine", "BI / Analytics (Snowflake)",
];
const FTE_HRS = 1760;
const BASE_INCIDENTS = {
  L2: { PC: 180, CC: 150, BC: 90, Digital: 60 },
  L3: { PC: 60, CC: 50, BC: 30, Digital: 20 },
};
const EFFORT_HRS = { L2: { P1: 4, P2: 8, P3: 3, P4: 1 }, L3: { P1: 12, P2: 20, P3: 8, P4: 3 } };
const SP_HRS = 6.8;
const AI_GAINS = { Y1: 0.08, Y2: 0.18, Y3: 0.28 };

function getModKey(mod) {
  if (mod.includes("PC")) return "PC";
  if (mod.includes("CC")) return "CC";
  if (mod.includes("BC")) return "BC";
  return "Digital";
}

function calcAnnualEffort(selectedModules, storyPointsPerSprint, sprintsPerYear) {
  const results = {};
  let totalL2 = 0, totalL3 = 0;
  const L2mix = { P1: 0.05, P2: 0.20, P3: 0.50, P4: 0.25 };
  const L3mix = { P1: 0.08, P2: 0.22, P3: 0.45, P4: 0.25 };
  selectedModules.forEach((mod) => {
    const k = getModKey(mod);
    const l2vol = BASE_INCIDENTS.L2[k], l3vol = BASE_INCIDENTS.L3[k];
    let l2hrs = 0, l3hrs = 0;
    ["P1","P2","P3","P4"].forEach((p) => {
      l2hrs += l2vol * L2mix[p] * EFFORT_HRS.L2[p];
      l3hrs += l3vol * L3mix[p] * EFFORT_HRS.L3[p];
    });
    results[mod] = { l2hrs: Math.round(l2hrs), l3hrs: Math.round(l3hrs), l2vol, l3vol };
    totalL2 += l2hrs; totalL3 += l3hrs;
  });
  const totalEnhancement = Math.round(storyPointsPerSprint * sprintsPerYear * SP_HRS);
  return { byModule: results, totalL2: Math.round(totalL2), totalL3: Math.round(totalL3), totalEnhancement };
}

function calcFTE(hrs) { return (hrs / FTE_HRS).toFixed(1); }
function applyAIGain(hrs, year) {
  const gain = year === 1 ? AI_GAINS.Y1 : year === 2 ? AI_GAINS.Y2 : AI_GAINS.Y3;
  return Math.round(hrs * (1 - gain));
}

// ── Shared UI components ───────────────────────────────────────────────────────

function Eyebrow({ left }) {
  return (
    <div style={{ background: "#000D2E", padding: "7px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>{left}</div>
      <span style={{ color: "#4A7FD4", fontSize: 10, letterSpacing: "0.06em" }}>CONFIDENTIAL &amp; PROPRIETARY</span>
    </div>
  );
}

function Section({ title, icon, children, accent }) {
  const bg = accent || C.blue;
  return (
    <div className="section-card" style={{
      background: C.white, borderRadius: 14,
      border: "1px solid #E2E8F0", marginBottom: 24,
      overflow: "hidden", boxShadow: "0 2px 12px rgba(0,48,135,0.07)"
    }}>
      <div style={{ background: `linear-gradient(100deg, ${bg} 0%, ${bg}CC 100%)`, padding: "15px 22px", display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ background: "rgba(255,255,255,0.18)", borderRadius: 8, width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, flexShrink: 0 }}>{icon}</span>
        <span style={{ color: C.white, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 16, letterSpacing: "0.02em" }}>{title}</span>
      </div>
      <div style={{ padding: "22px 22px" }}>{children}</div>
    </div>
  );
}

function Badge({ label, color }) {
  return (
    <span style={{ background: color + "18", color, border: "1px solid " + color + "45", borderRadius: 20, padding: "3px 12px", fontSize: 11, fontWeight: 700, fontFamily: "'Barlow', sans-serif", letterSpacing: "0.04em", whiteSpace: "nowrap", display: "inline-flex", alignItems: "center" }}>
      {label}
    </span>
  );
}

function KPI({ label, value, sub, color }) {
  return (
    <div className="kpi-card" style={{ background: C.white, borderRadius: 12, padding: "18px 20px", border: "1px solid #E8EDF5", borderTop: "4px solid " + (color || C.blue), flex: 1, minWidth: 150, boxShadow: "0 2px 10px rgba(0,48,135,0.07)" }}>
      <div style={{ fontSize: 10, color: C.mid, fontFamily: "'Barlow', sans-serif", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 7 }}>{label}</div>
      <div style={{ fontSize: 30, fontWeight: 800, color: color || C.blue, fontFamily: "'Barlow Condensed', sans-serif", lineHeight: 1.1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: C.mid, marginTop: 5, lineHeight: 1.5 }}>{sub}</div>}
    </div>
  );
}

function DataTable({ headers, rows, compact }) {
  return (
    <div style={{ overflowX: "auto", borderRadius: 8, border: "1px solid #E8EDF5" }}>
      <table className="data-table" style={{ width: "100%", borderCollapse: "collapse", fontSize: compact ? 12 : 13, fontFamily: "'Barlow', sans-serif" }}>
        <thead>
          <tr>
            {headers.map((h, i) => (
              <th key={i} style={{ background: C.navy, color: C.white, padding: compact ? "9px 13px" : "11px 15px", textAlign: i === 0 ? "left" : "center", fontWeight: 700, fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", whiteSpace: "nowrap", borderRight: "1px solid rgba(255,255,255,0.07)" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} style={{ background: ri % 2 === 0 ? C.white : "#F7FAFF" }}>
              {row.map((cell, ci) => (
                <td key={ci} style={{ padding: compact ? "8px 13px" : "10px 15px", textAlign: ci === 0 ? "left" : "center", borderBottom: "1px solid #EEF2F8", fontWeight: ci === 0 ? 600 : 400, color: C.darkGray }}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Slider({ label, min, max, value, onChange, step, unit }) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 7 }}>
        <span style={{ fontSize: 12, color: C.mid, fontFamily: "'Barlow', sans-serif", fontWeight: 500 }}>{label}</span>
        <span style={{ fontSize: 13, fontWeight: 800, color: C.blue, fontFamily: "'Barlow Condensed', sans-serif", background: C.blue + "12", padding: "2px 11px", borderRadius: 6 }}>{value}{unit}</span>
      </div>
      <input type="range" min={min} max={max} step={step || 1} value={value} onChange={(e) => onChange(Number(e.target.value))} style={{ width: "100%", cursor: "pointer", background: `linear-gradient(to right, ${C.blue} ${pct}%, #E2E8F0 ${pct}%)` }} />
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#A0AEC0", marginTop: 3 }}>
        <span>{min}{unit}</span><span>{max}{unit}</span>
      </div>
    </div>
  );
}

function PageFooter() {
  return (
    <div style={{ background: C.navy, marginTop: 12 }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 28px 24px", display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 48 }}>
        <div>
          <div style={{ marginBottom: 12 }}>
            <span style={{ color: "#93C5FD", fontSize: 13, letterSpacing: "0.12em", fontWeight: 700, textTransform: "uppercase", fontFamily: "'Barlow Condensed', sans-serif" }}>Guidewire Practice</span>
          </div>
          <div style={{ color: "#94A3B8", fontSize: 12, lineHeight: 1.85 }}>
            Guidewire Cloud AMS Engagement Estimator<br />
            Enterprise Application Managed Services for PC · CC · BC · Digital (Jutro)<br />
            AI-augmented operations with 3-year programme planning &amp; SLA governance
          </div>
        </div>
        <div>
          <div style={{ color: "#93C5FD", fontWeight: 700, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>GW Modules</div>
          {["PolicyCenter (PC)", "ClaimCenter (CC)", "BillingCenter (BC)", "Digital — Jutro"].map((m) => (
            <div key={m} style={{ color: "#94A3B8", fontSize: 12, marginBottom: 6 }}>{m}</div>
          ))}
        </div>
        <div>
          <div style={{ color: "#93C5FD", fontWeight: 700, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>Service Scope</div>
          {["L2/L3 Incident Management", "Enhancement Delivery", "Cloud Integrations", "AI Accelerators", "KT & Transition Planning"].map((s) => (
            <div key={s} style={{ color: "#94A3B8", fontSize: 12, marginBottom: 6 }}>{s}</div>
          ))}
        </div>
      </div>
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", padding: "14px 24px", textAlign: "center", color: "#475569", fontSize: 11, letterSpacing: "0.04em" }}>
        Guidewire Practice · AMS Engagement Estimator · Confidential &amp; Proprietary · {new Date().getFullYear()}
      </div>
    </div>
  );
}

// ── New Opportunity Modal ──────────────────────────────────────────────────────

function NewOppModal({ onConfirm, onClose }) {
  const [name, setName] = useState("");
  const [clientName, setClientName] = useState("");
  const valid = name.trim().length > 0;

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,26,78,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20, backdropFilter: "blur(3px)" }}>
      <div style={{ background: C.white, borderRadius: 16, width: "100%", maxWidth: 440, boxShadow: "0 24px 64px rgba(0,26,78,0.35)", overflow: "hidden" }}>
        <div style={{ background: `linear-gradient(100deg, ${C.blue}, ${C.lightBlue})`, padding: "18px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ color: C.white, fontWeight: 700, fontSize: 17, fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.02em" }}>New Opportunity</span>
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: "rgba(255,255,255,0.75)", fontSize: 22, cursor: "pointer", lineHeight: 1, padding: "0 4px" }}>×</button>
        </div>
        <div style={{ padding: "24px 24px 20px" }}>
          <div style={{ marginBottom: 18 }}>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: C.mid, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 7 }}>
              Opportunity Name <span style={{ color: C.red }}>*</span>
            </label>
            <input
              type="text" value={name} onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Aviva GW Cloud AMS 2025"
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && valid && onConfirm(name.trim(), clientName.trim())}
              style={{ width: "100%", padding: "11px 14px", borderRadius: 8, border: "2px solid " + (valid ? C.blue : "#E2E8F0"), fontSize: 14, fontFamily: "'Barlow', sans-serif", outline: "none", transition: "border-color 0.15s", color: C.darkGray, boxSizing: "border-box" }}
            />
          </div>
          <div style={{ marginBottom: 26 }}>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: C.mid, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 7 }}>
              Client / Account Name <span style={{ color: C.mid, fontWeight: 400 }}>(optional)</span>
            </label>
            <input
              type="text" value={clientName} onChange={(e) => setClientName(e.target.value)}
              placeholder="e.g. Aviva plc"
              style={{ width: "100%", padding: "11px 14px", borderRadius: 8, border: "2px solid #E2E8F0", fontSize: 14, fontFamily: "'Barlow', sans-serif", outline: "none", color: C.darkGray, boxSizing: "border-box" }}
            />
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={onClose} style={{ flex: 1, padding: "11px 0", borderRadius: 8, border: "2px solid #E2E8F0", background: "white", color: C.mid, fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: "'Barlow', sans-serif" }}>
              Cancel
            </button>
            <button
              onClick={() => valid && onConfirm(name.trim(), clientName.trim())}
              disabled={!valid}
              className="action-btn"
              style={{ flex: 2, padding: "11px 0", borderRadius: 8, background: valid ? C.blue : "#CBD5E0", color: C.white, border: "none", fontWeight: 700, fontSize: 13, cursor: valid ? "pointer" : "not-allowed", fontFamily: "'Barlow', sans-serif", boxShadow: valid ? "0 4px 12px rgba(0,48,135,0.3)" : "none" }}
            >
              Create &amp; Configure →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Home Page ─────────────────────────────────────────────────────────────────

function HomePage({ opportunities, onNew, onOpen, onDelete }) {
  const fmtDate = (iso) => new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

  return (
    <div style={{ fontFamily: "'Barlow', sans-serif", background: "#F0F4FA", minHeight: "100vh" }}>
      <Eyebrow left={<span style={{ color: "#4A7FD4", fontSize: 11, letterSpacing: "0.12em", fontWeight: 600, textTransform: "uppercase" }}>Guidewire Practice</span>} />

      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #001A4E 0%, #003087 55%, #0057A8 100%)", padding: "32px 36px 28px", boxShadow: "0 4px 28px rgba(0,26,78,0.32)", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", right: -50, top: -60, width: 240, height: 240, borderRadius: "50%", border: "44px solid rgba(255,255,255,0.04)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", right: 80, bottom: -90, width: 200, height: 200, borderRadius: "50%", border: "32px solid rgba(255,255,255,0.03)", pointerEvents: "none" }} />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 20, position: "relative" }}>
          <div>
            <div style={{ color: C.white, fontSize: 30, fontWeight: 800, fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.01em", lineHeight: 1.1, marginBottom: 5 }}>Guidewire Cloud AMS</div>
            <div style={{ color: "#93C5FD", fontSize: 16, fontWeight: 600, fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.05em", marginBottom: 8 }}>Engagement Estimator</div>
            <div style={{ color: "rgba(147,197,253,0.75)", fontSize: 11, letterSpacing: "0.05em" }}>PC · CC · BC · Digital (Jutro) · L2/L3 · Enhancements · 3-Year Plan · AI-Augmented</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
            <div style={{ textAlign: "right" }}>
              <div style={{ color: "rgba(147,197,253,0.75)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 4 }}>Opportunities</div>
              <div style={{ color: C.white, fontSize: 44, fontWeight: 800, fontFamily: "'Barlow Condensed', sans-serif", lineHeight: 1 }}>{opportunities.length}</div>
            </div>
            <button onClick={onNew} className="action-btn" style={{ background: C.red, color: C.white, border: "none", borderRadius: 10, padding: "14px 28px", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "'Barlow', sans-serif", boxShadow: "0 4px 18px rgba(228,0,43,0.45)", whiteSpace: "nowrap" }}>
              + New Opportunity
            </button>
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "36px 20px" }}>
        {opportunities.length === 0 ? (
          <div style={{ background: C.white, borderRadius: 16, border: "2px dashed #CBD5E0", padding: "72px 32px", textAlign: "center", boxShadow: "0 2px 12px rgba(0,48,135,0.05)" }}>
            <div style={{ fontSize: 60, marginBottom: 18 }}>📋</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: C.navy, fontFamily: "'Barlow Condensed', sans-serif", marginBottom: 10 }}>No Opportunities Yet</div>
            <div style={{ fontSize: 13, color: C.mid, marginBottom: 30, maxWidth: 380, margin: "0 auto 30px" }}>
              Create your first Guidewire Cloud AMS opportunity to start building a 3-year engagement estimate.
            </div>
            <button onClick={onNew} className="action-btn" style={{ background: C.blue, color: C.white, border: "none", borderRadius: 10, padding: "13px 34px", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "'Barlow', sans-serif", boxShadow: "0 4px 16px rgba(0,48,135,0.3)" }}>
              + Create First Opportunity
            </button>
          </div>
        ) : (
          <>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.mid, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 20 }}>
              {opportunities.length} Saved Opportunit{opportunities.length === 1 ? "y" : "ies"}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 20 }}>
              {opportunities.map((opp) => {
                const sym = opp.currency === "USD" ? "$" : "£";
                return (
                  <div key={opp.id} className="section-card" style={{ background: C.white, borderRadius: 14, border: "1px solid #E2E8F0", boxShadow: "0 2px 12px rgba(0,48,135,0.07)", overflow: "hidden" }}>
                    <div style={{ height: 5, background: `linear-gradient(90deg, ${C.blue}, ${C.teal})` }} />
                    <div style={{ padding: "18px 20px" }}>
                      {/* Name + currency */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                        <div>
                          <div style={{ fontSize: 16, fontWeight: 700, color: C.navy, fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.01em", marginBottom: 3 }}>{opp.name}</div>
                          {opp.clientName && <div style={{ fontSize: 12, color: C.mid }}>{opp.clientName}</div>}
                        </div>
                        <Badge label={opp.currency} color={C.blue} />
                      </div>
                      {/* Cost highlight */}
                      <div style={{ background: C.blue + "09", borderRadius: 8, padding: "10px 14px", marginBottom: 14, border: "1px solid " + C.blue + "18" }}>
                        <div style={{ fontSize: 9, color: C.mid, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 3 }}>3-Year Programme Cost</div>
                        <div style={{ fontSize: 26, fontWeight: 800, color: C.blue, fontFamily: "'Barlow Condensed', sans-serif" }}>
                          {sym}{(opp.totalProgramCost / 1000000).toFixed(2)}M
                        </div>
                      </div>
                      {/* Module badges */}
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 14 }}>
                        {opp.selectedModules.map((m) => (
                          <Badge key={m} label={getModKey(m)} color={m.includes("Jutro") ? C.teal : C.blue} />
                        ))}
                        {opp.selectedIntegrations.length > 0 && (
                          <Badge label={opp.selectedIntegrations.length + " integrations"} color={C.green} />
                        )}
                      </div>
                      {/* Dates */}
                      <div style={{ fontSize: 11, color: C.mid, marginBottom: 16, display: "flex", gap: 14, flexWrap: "wrap" }}>
                        <span>Created {fmtDate(opp.createdAt)}</span>
                        {opp.updatedAt !== opp.createdAt && <span>· Updated {fmtDate(opp.updatedAt)}</span>}
                      </div>
                      {/* Actions */}
                      <div style={{ display: "flex", gap: 8 }}>
                        <button onClick={() => onOpen(opp)} className="action-btn" style={{ flex: 1, padding: "10px 0", borderRadius: 8, background: C.blue, color: C.white, border: "none", fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "'Barlow', sans-serif", boxShadow: "0 2px 8px rgba(0,48,135,0.25)" }}>
                          Open →
                        </button>
                        <button onClick={() => onDelete(opp.id)} className="action-btn" style={{ padding: "10px 14px", borderRadius: 8, background: "transparent", color: C.mid, border: "1px solid #E2E8F0", fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: "'Barlow', sans-serif" }} title="Delete opportunity">
                          🗑
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
      <PageFooter />
    </div>
  );
}

// ── Estimator tabs ─────────────────────────────────────────────────────────────

const TABS = [
  { id: "overview", label: "Scope & Config" },
  { id: "estimation", label: "Estimation" },
  { id: "roadmap", label: "3-Year Roadmap" },
  { id: "sla", label: "SLA & Credits" },
  { id: "ai", label: "AI Capabilities" },
  { id: "kt", label: "KT Plan" },
];
const TAB_ICONS = { overview: "📋", estimation: "📊", roadmap: "🗓", sla: "⚖️", ai: "🤖", kt: "🔄" };

// ── Main App ───────────────────────────────────────────────────────────────────

export default function App() {
  // View routing
  const [view, setView] = useState("home");

  // Persisted opportunities
  const [opportunities, setOpportunities] = useState(() => {
    try { return JSON.parse(localStorage.getItem("gw-opportunities") || "[]"); }
    catch { return []; }
  });

  // Modal
  const [showNewModal, setShowNewModal] = useState(false);

  // Current opportunity metadata
  const [currentOppId, setCurrentOppId] = useState(null);
  const [oppName, setOppName] = useState("");
  const [oppClientName, setOppClientName] = useState("");
  const [oppCreatedAt, setOppCreatedAt] = useState(null);
  const [isSaved, setIsSaved] = useState(false);
  const [saveFlash, setSaveFlash] = useState(false);

  // Estimator config state
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedModules, setSelectedModules] = useState([...MODULES]);
  const [selectedIntegrations, setSelectedIntegrations] = useState(INTEGRATIONS.slice(0, 5));
  const [sprintsPerYear, setSprintsPerYear] = useState(26);
  const [spPerSprint, setSpPerSprint] = useState(20);
  const [teamRate, setTeamRate] = useState(85);
  const [ktMonths, setKtMonths] = useState(3);
  const [calMonths, setCalMonths] = useState(3);
  const [currency, setCurrency] = useState("USD");
  const [exporting, setExporting] = useState(null);

  const currSymbol = currency === "USD" ? "$" : "£";
  const toggleModule = (m) => { setSelectedModules((p) => p.includes(m) ? p.filter((x) => x !== m) : [...p, m]); setIsSaved(false); };
  const toggleIntegration = (i) => { setSelectedIntegrations((p) => p.includes(i) ? p.filter((x) => x !== i) : [...p, i]); setIsSaved(false); };

  const base = calcAnnualEffort(selectedModules, spPerSprint, sprintsPerYear);
  const integrationHrs = selectedIntegrations.length * 60;
  const totalBaseHrs = base.totalL2 + base.totalL3 + base.totalEnhancement + integrationHrs;

  const annual = [1, 2, 3].map((y) => {
    const l2 = applyAIGain(base.totalL2, y), l3 = applyAIGain(base.totalL3, y);
    const enh = applyAIGain(base.totalEnhancement, y), intg = applyAIGain(integrationHrs, y);
    const total = l2 + l3 + enh + intg;
    return { y, l2, l3, enh, intg, total, cost: Math.round(total * teamRate) };
  });

  const totalProgramCost = annual.reduce((s, a) => s + a.cost, 0);

  // ── Opportunity handlers ──────────────────────────────────────────────────

  function loadDefaults() {
    setSelectedModules([...MODULES]);
    setSelectedIntegrations(INTEGRATIONS.slice(0, 5));
    setSprintsPerYear(26); setSpPerSprint(20);
    setTeamRate(85); setKtMonths(3); setCalMonths(3);
    setCurrency("USD"); setActiveTab("overview");
  }

  function handleNewOppConfirm(name, clientName) {
    setOppName(name); setOppClientName(clientName);
    setCurrentOppId(null); setOppCreatedAt(null);
    setIsSaved(false); loadDefaults();
    setShowNewModal(false); setView("estimator");
  }

  function handleOpenOpp(opp) {
    setOppName(opp.name); setOppClientName(opp.clientName || "");
    setCurrentOppId(opp.id); setOppCreatedAt(opp.createdAt);
    setSelectedModules(opp.selectedModules);
    setSelectedIntegrations(opp.selectedIntegrations);
    setSprintsPerYear(opp.sprintsPerYear); setSpPerSprint(opp.spPerSprint);
    setTeamRate(opp.teamRate); setKtMonths(opp.ktMonths);
    setCalMonths(opp.calMonths); setCurrency(opp.currency);
    setActiveTab("overview"); setIsSaved(true);
    setView("estimator");
  }

  function handleSaveOpp() {
    const now = new Date().toISOString();
    const id = currentOppId || String(Date.now());
    const oppData = {
      id, name: oppName, clientName: oppClientName,
      createdAt: oppCreatedAt || now, updatedAt: now,
      selectedModules, selectedIntegrations,
      sprintsPerYear, spPerSprint, teamRate, ktMonths, calMonths, currency,
      totalProgramCost,
    };
    const updated = currentOppId
      ? opportunities.map((o) => o.id === currentOppId ? oppData : o)
      : [...opportunities, oppData];
    setOpportunities(updated);
    setCurrentOppId(id);
    setOppCreatedAt(oppData.createdAt);
    setIsSaved(true);
    setSaveFlash(true);
    setTimeout(() => setSaveFlash(false), 2000);
    localStorage.setItem("gw-opportunities", JSON.stringify(updated));
  }

  function handleDeleteOpp(id) {
    const updated = opportunities.filter((o) => o.id !== id);
    setOpportunities(updated);
    localStorage.setItem("gw-opportunities", JSON.stringify(updated));
  }

  async function handleExport(type) {
    if (!isSaved) return;
    setExporting(type);
    const exportData = { selectedModules, selectedIntegrations, spPerSprint, sprintsPerYear, teamRate, ktMonths, calMonths, currency, base, annual, totalBaseHrs, integrationHrs, totalProgramCost };
    try {
      if (type === "pptx") await exportToPptx(exportData);
      else await exportToPdf(exportData);
    } finally { setExporting(null); }
  }

  // ── HOME view ─────────────────────────────────────────────────────────────

  if (view === "home") {
    return (
      <>
        <HomePage opportunities={opportunities} onNew={() => setShowNewModal(true)} onOpen={handleOpenOpp} onDelete={handleDeleteOpp} />
        {showNewModal && <NewOppModal onConfirm={handleNewOppConfirm} onClose={() => setShowNewModal(false)} />}
      </>
    );
  }

  // ── ESTIMATOR view ────────────────────────────────────────────────────────

  const l2PriRows = ["P1","P2","P3","P4"].map((p, idx) => {
    const mixes = [0.05, 0.20, 0.50, 0.25];
    const slas = ["4 hrs","8 hrs","24 hrs","72 hrs"];
    const tickets = Math.round(selectedModules.reduce((s, m) => s + BASE_INCIDENTS.L2[getModKey(m)] * mixes[idx], 0));
    const hrs = Math.round(selectedModules.reduce((s, m) => s + BASE_INCIDENTS.L2[getModKey(m)] * mixes[idx] * EFFORT_HRS.L2[p], 0));
    return [p + " - " + ["Critical","High","Medium","Low"][idx], slas[idx], EFFORT_HRS.L2[p] + " hrs", tickets, hrs];
  });

  return (
    <div style={{ fontFamily: "'Barlow', sans-serif", background: "#F0F4FA", minHeight: "100vh", color: C.darkGray }}>

      {/* Eyebrow with breadcrumb */}
      <Eyebrow left={
        <>
          <button onClick={() => setView("home")} style={{ background: "transparent", border: "none", color: "#4A7FD4", fontSize: 11, cursor: "pointer", fontFamily: "'Barlow', sans-serif", fontWeight: 600, letterSpacing: "0.04em", padding: 0, display: "flex", alignItems: "center", gap: 4 }}>
            ← Home
          </button>
          <span style={{ color: "#1E3A6E", fontSize: 11 }}>·</span>
          <span style={{ color: "#4A7FD4", fontSize: 11, fontWeight: 500 }}>
            {oppName}{oppClientName && <span style={{ opacity: 0.65 }}> — {oppClientName}</span>}
          </span>
        </>
      } />

      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #001A4E 0%, #003087 55%, #0057A8 100%)", padding: "28px 36px 24px", boxShadow: "0 4px 28px rgba(0,26,78,0.32)", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", right: -50, top: -60, width: 240, height: 240, borderRadius: "50%", border: "44px solid rgba(255,255,255,0.04)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", right: 80, bottom: -90, width: 200, height: 200, borderRadius: "50%", border: "32px solid rgba(255,255,255,0.03)", pointerEvents: "none" }} />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 20, position: "relative" }}>
          <div>
            <div style={{ color: C.white, fontSize: 26, fontWeight: 800, fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.01em", lineHeight: 1.1, marginBottom: 3 }}>{oppName}</div>
            {oppClientName && <div style={{ color: "#93C5FD", fontSize: 13, marginBottom: 5 }}>{oppClientName}</div>}
            <div style={{ color: "rgba(147,197,253,0.75)", fontSize: 11, letterSpacing: "0.05em" }}>PC · CC · BC · Digital (Jutro) · L2/L3 · Enhancements · 3-Year Plan · AI-Augmented</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap" }}>
            <div style={{ textAlign: "right" }}>
              <div style={{ color: "rgba(147,197,253,0.75)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 4 }}>3-Year Programme Cost</div>
              <div style={{ color: C.white, fontSize: 38, fontWeight: 800, fontFamily: "'Barlow Condensed', sans-serif", lineHeight: 1 }}>{currSymbol}{(totalProgramCost / 1000000).toFixed(2)}M</div>
              <div style={{ color: "rgba(147,197,253,0.75)", fontSize: 11, marginTop: 5, display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <span>Rate: {currSymbol}{teamRate}/hr</span>
                <span style={{ opacity: 0.4 }}>·</span>
                <span>{selectedModules.length} modules</span>
              </div>
            </div>
            {/* Save button */}
            <button
              onClick={handleSaveOpp}
              className="action-btn"
              style={{
                background: saveFlash ? C.green : isSaved ? C.green + "CC" : C.red,
                color: C.white, border: "none", borderRadius: 10,
                padding: "12px 22px", fontWeight: 700, fontSize: 13,
                cursor: "pointer", fontFamily: "'Barlow', sans-serif",
                boxShadow: `0 4px 14px rgba(${isSaved ? "10,124,89" : "228,0,43"},0.35)`,
                minWidth: 110, transition: "background 0.3s"
              }}
            >
              {saveFlash ? "✓ Saved!" : isSaved ? "↺ Update" : "💾 Save"}
            </button>
          </div>
        </div>
      </div>

      {/* Tab Bar */}
      <div style={{ background: C.white, borderBottom: "2px solid #E2E8F0", display: "flex", overflowX: "auto", boxShadow: "0 2px 10px rgba(0,48,135,0.07)" }}>
        {TABS.map((t) => (
          <button key={t.id} className={`tab-btn${activeTab === t.id ? " tab-active" : ""}`} onClick={() => setActiveTab(t.id)}
            style={{ padding: "14px 22px", border: "none", cursor: "pointer", background: activeTab === t.id ? "#EEF4FF" : "transparent", color: activeTab === t.id ? C.blue : C.mid, fontFamily: "'Barlow', sans-serif", fontWeight: 700, fontSize: 12, letterSpacing: "0.04em", whiteSpace: "nowrap", borderBottom: activeTab === t.id ? "3px solid " + C.blue : "3px solid transparent", transition: "all 0.18s" }}>
            {TAB_ICONS[t.id]}&nbsp; {t.label}
          </button>
        ))}
      </div>

      {/* Export Toolbar */}
      <div style={{ background: "#FAFBFE", borderBottom: "1px solid #E2E8F0", padding: "10px 28px", display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 10 }}>
        {!isSaved && (
          <span style={{ fontSize: 11, color: C.amber, fontFamily: "'Barlow', sans-serif", display: "flex", alignItems: "center", gap: 5, marginRight: 6 }}>
            ⚠️ Save the opportunity first to enable exports
          </span>
        )}
        <span style={{ fontSize: 11, color: C.mid, fontFamily: "'Barlow', sans-serif" }}>Export as:</span>
        <button
          className="action-btn"
          onClick={() => handleExport("pdf")}
          disabled={!isSaved || exporting !== null}
          title={!isSaved ? "Save the opportunity first to export" : "Export as PDF"}
          style={{ padding: "8px 20px", borderRadius: 8, border: "none", background: isSaved ? C.red : "#CBD5E0", color: C.white, fontFamily: "'Barlow', sans-serif", fontWeight: 700, fontSize: 12, cursor: !isSaved || exporting ? "not-allowed" : "pointer", opacity: exporting && exporting !== "pdf" ? 0.5 : 1, boxShadow: isSaved ? "0 2px 10px rgba(228,0,43,0.28)" : "none", transition: "all 0.2s" }}
        >
          {exporting === "pdf" ? "⏳ Generating..." : "📄 Export PDF (6 pages)"}
        </button>
        <button
          className="action-btn"
          onClick={() => handleExport("pptx")}
          disabled={!isSaved || exporting !== null}
          title={!isSaved ? "Save the opportunity first to export" : "Export as PPTX"}
          style={{ padding: "8px 20px", borderRadius: 8, border: "none", background: isSaved ? C.blue : "#CBD5E0", color: C.white, fontFamily: "'Barlow', sans-serif", fontWeight: 700, fontSize: 12, cursor: !isSaved || exporting ? "not-allowed" : "pointer", opacity: exporting && exporting !== "pptx" ? 0.5 : 1, boxShadow: isSaved ? "0 2px 10px rgba(0,48,135,0.28)" : "none", transition: "all 0.2s" }}
        >
          {exporting === "pptx" ? "⏳ Generating..." : "📊 Export PPTX (7 slides)"}
        </button>
      </div>

      {/* Page Content */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 20px" }}>

        {/* TAB: SCOPE */}
        {activeTab === "overview" && (
          <div className="fade-in">
            <Section title="Engagement Scope Configuration" icon="⚙️">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 28 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: C.mid, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12, paddingBottom: 8, borderBottom: "2px solid " + C.blue + "18" }}>Guidewire Modules in Scope</div>
                  {MODULES.map((m) => (
                    <label key={m} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, cursor: "pointer", padding: "8px 12px", borderRadius: 8, background: selectedModules.includes(m) ? C.blue + "08" : "transparent", border: "1px solid " + (selectedModules.includes(m) ? C.blue + "28" : "transparent"), transition: "all 0.15s" }}>
                      <input type="checkbox" checked={selectedModules.includes(m)} onChange={() => toggleModule(m)} style={{ accentColor: C.blue, width: 16, height: 16 }} />
                      <span style={{ fontSize: 13, fontWeight: 600, flex: 1 }}>{m}</span>
                      <Badge label={m.includes("Jutro") ? "Digital" : "Core"} color={m.includes("Jutro") ? C.teal : C.blue} />
                    </label>
                  ))}
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: C.mid, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12, paddingBottom: 8, borderBottom: "2px solid " + C.teal + "28" }}>Cloud Integrations in Scope</div>
                  {INTEGRATIONS.map((i) => (
                    <label key={i} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, cursor: "pointer", padding: "8px 12px", borderRadius: 8, background: selectedIntegrations.includes(i) ? C.teal + "08" : "transparent", border: "1px solid " + (selectedIntegrations.includes(i) ? C.teal + "28" : "transparent"), transition: "all 0.15s" }}>
                      <input type="checkbox" checked={selectedIntegrations.includes(i)} onChange={() => toggleIntegration(i)} style={{ accentColor: C.teal, width: 16, height: 16 }} />
                      <span style={{ fontSize: 13, flex: 1 }}>{i}</span>
                    </label>
                  ))}
                </div>
              </div>
            </Section>

            <Section title="Commercial Parameters" icon="💰" accent={C.navy}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 36 }}>
                <div>
                  <Slider label={`Blended Team Rate (${currency}/hr)`} min={55} max={150} value={teamRate} onChange={(v) => { setTeamRate(v); setIsSaved(false); }} unit={" " + currency} />
                  <Slider label="Sprints per Year" min={12} max={26} value={sprintsPerYear} onChange={(v) => { setSprintsPerYear(v); setIsSaved(false); }} unit="" />
                  <Slider label="Story Points per Sprint" min={10} max={40} value={spPerSprint} onChange={(v) => { setSpPerSprint(v); setIsSaved(false); }} unit=" SP" />
                </div>
                <div>
                  <Slider label="KT Duration (months)" min={2} max={6} value={ktMonths} onChange={(v) => { setKtMonths(v); setIsSaved(false); }} unit=" mo" />
                  <Slider label="Calibration Period (months)" min={2} max={6} value={calMonths} onChange={(v) => { setCalMonths(v); setIsSaved(false); }} unit=" mo" />
                  <div style={{ marginTop: 18 }}>
                    <div style={{ fontSize: 11, color: C.mid, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>Currency Display</div>
                    <div style={{ display: "flex", gap: 10 }}>
                      {["USD","GBP"].map((c) => (
                        <button key={c} className="cur-btn" onClick={() => { setCurrency(c); setIsSaved(false); }} style={{ padding: "7px 22px", borderRadius: 8, border: "2px solid " + (currency === c ? C.blue : "#CBD5E0"), background: currency === c ? C.blue : "white", color: currency === c ? "white" : C.mid, fontWeight: 700, cursor: "pointer", fontSize: 13, boxShadow: currency === c ? "0 2px 8px rgba(0,48,135,0.2)" : "none" }}>{c}</button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </Section>

            <Section title="AMS Service Layers" icon="🏗️" accent={C.green}>
              <DataTable headers={["Service Layer","Description","Modules","Includes"]} rows={[
                ["L1 - Service Desk","First contact, ticket triage and routing","All","24x7 ticket logging, FAQ, GW Cloud portal access"],
                ["L2 - Incident Mgmt","Break-fix, configuration, GW Cloud ops","PC, CC, BC, Jutro","Incident resolution, root-cause identification, workarounds"],
                ["L3 - Problem Mgmt","Deep-dive GW config/code, integration fixes","PC, CC, BC, Jutro","Gosu code changes, patch mgmt, integration debugging"],
                ["Enhancement / SCR","Small Change Requests via sprint delivery","All Modules","Agile sprints, user stories, UAT support, GW Cloud deploy"],
                ["Integration AMS","Monitor and maintain 5-6 cloud integrations","All Integrations","API health checks, OAuth token refresh, error triage"],
                ["AI-Augmented Ops","AI copilots accelerating all layers","All","Incident predictor, Gosu copilot, auto-triage, release notes"],
              ]} />
            </Section>
          </div>
        )}

        {/* TAB: ESTIMATION */}
        {activeTab === "estimation" && (
          <div className="fade-in">
            <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 24 }}>
              <KPI label="Total Annual Hours (Base)" value={totalBaseHrs.toLocaleString()} sub="Before AI efficiency gains" color={C.blue} />
              <KPI label="Total FTEs (Base)" value={calcFTE(totalBaseHrs)} sub="Gross team size Y1" color={C.navy} />
              <KPI label="Enhancement SP/Year" value={(spPerSprint * sprintsPerYear).toLocaleString()} sub={sprintsPerYear + " sprints × " + spPerSprint + " SP"} color={C.green} />
              <KPI label="Integration Overhead" value={integrationHrs + " hrs"} sub={selectedIntegrations.length + " integrations × 60 hrs"} color={C.teal} />
            </div>
            <Section title="Module-Level Incident Effort Breakdown (Annual Base)" icon="📦">
              <DataTable headers={["Module","L2 Tickets/yr","L2 Effort (hrs)","L3 Tickets/yr","L3 Effort (hrs)","Total Inc. Hrs","FTEs"]}
                rows={selectedModules.map((m) => { const d = base.byModule[m]; if (!d) return [m,"-","-","-","-","-","-"]; const tot = d.l2hrs + d.l3hrs; return [m, d.l2vol, d.l2hrs.toLocaleString(), d.l3vol, d.l3hrs.toLocaleString(), tot.toLocaleString(), calcFTE(tot)]; })}
              />
            </Section>
            <Section title="Effort by Priority (P1–P4) — L2 Incident Resolution" icon="🔥" accent={C.red}>
              <DataTable headers={["Priority","SLA Target","Avg Hrs/Ticket","Est. Tickets/yr","Annual Hours"]} rows={l2PriRows} />
            </Section>
            <Section title="Enhancement Delivery Model" icon="🚀" accent={C.green}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
                <DataTable headers={["Parameter","Value"]} rows={[
                  ["Sprint Cadence","Fortnightly (2-week)"], ["Sprints per Year", sprintsPerYear],
                  ["Story Points / Sprint", spPerSprint], ["Total SP / Year", spPerSprint * sprintsPerYear],
                  ["Hours / Story Point", SP_HRS + " hrs"], ["Enhancement Hours / Year", base.totalEnhancement.toLocaleString()],
                  ["Enhancement FTEs", calcFTE(base.totalEnhancement)],
                ]} />
                <div style={{ background: "#F7FAFF", borderRadius: 10, padding: "18px 16px", border: "1px solid #E2E8F0" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: C.mid, marginBottom: 14, textTransform: "uppercase", letterSpacing: "0.06em" }}>User Story Size Guide</div>
                  {[{size:"XS",sp:"1-2",desc:"Config tweak, label change, minor UI"},{size:"S",sp:"3-5",desc:"Validation rule, simple workflow step"},{size:"M",sp:"6-10",desc:"New screen/section, API integration field"},{size:"L",sp:"13-20",desc:"New business rule, complex workflow"},{size:"XL",sp:"21+",desc:"Epic-level — split before sprint entry"}].map((r) => (
                    <div key={r.size} style={{ display: "flex", gap: 12, marginBottom: 10, alignItems: "flex-start" }}>
                      <div style={{ background: C.blue, color: "white", borderRadius: 5, padding: "3px 9px", fontSize: 11, fontWeight: 800, minWidth: 30, textAlign: "center" }}>{r.size}</div>
                      <div style={{ fontSize: 12 }}><span style={{ fontWeight: 700, color: C.blue }}>{r.sp} SP</span><span style={{ color: C.mid }}> — {r.desc}</span></div>
                    </div>
                  ))}
                </div>
              </div>
            </Section>
          </div>
        )}

        {/* TAB: ROADMAP */}
        {activeTab === "roadmap" && (
          <div className="fade-in">
            <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 24 }}>
              {annual.map((a) => (<KPI key={a.y} label={"Year " + a.y + " Total Hours"} value={a.total.toLocaleString()} sub={currSymbol + (a.cost/1000).toFixed(0) + "K · " + calcFTE(a.total) + " FTEs"} color={a.y===1?C.blue:a.y===2?C.teal:C.green} />))}
              <KPI label="3-Year Cost" value={currSymbol + (totalProgramCost/1000000).toFixed(2) + "M"} sub={"AI saves " + Math.round((1-annual[2].total/totalBaseHrs)*100) + "% by Y3"} color={C.red} />
            </div>
            <Section title="3-Year Effort & Cost Summary" icon="📈">
              <DataTable headers={["Stream","Y1 Hrs","Y1 Cost","Y2 Hrs","Y2 Cost","Y3 Hrs","Y3 Cost","3-Yr Total"]} rows={[
                ["L2 Incident Mgmt",annual[0].l2.toLocaleString(),currSymbol+(annual[0].l2*teamRate/1000).toFixed(0)+"K",annual[1].l2.toLocaleString(),currSymbol+(annual[1].l2*teamRate/1000).toFixed(0)+"K",annual[2].l2.toLocaleString(),currSymbol+(annual[2].l2*teamRate/1000).toFixed(0)+"K",currSymbol+((annual[0].l2+annual[1].l2+annual[2].l2)*teamRate/1000).toFixed(0)+"K"],
                ["L3 Problem Mgmt",annual[0].l3.toLocaleString(),currSymbol+(annual[0].l3*teamRate/1000).toFixed(0)+"K",annual[1].l3.toLocaleString(),currSymbol+(annual[1].l3*teamRate/1000).toFixed(0)+"K",annual[2].l3.toLocaleString(),currSymbol+(annual[2].l3*teamRate/1000).toFixed(0)+"K",currSymbol+((annual[0].l3+annual[1].l3+annual[2].l3)*teamRate/1000).toFixed(0)+"K"],
                ["Enhancements",annual[0].enh.toLocaleString(),currSymbol+(annual[0].enh*teamRate/1000).toFixed(0)+"K",annual[1].enh.toLocaleString(),currSymbol+(annual[1].enh*teamRate/1000).toFixed(0)+"K",annual[2].enh.toLocaleString(),currSymbol+(annual[2].enh*teamRate/1000).toFixed(0)+"K",currSymbol+((annual[0].enh+annual[1].enh+annual[2].enh)*teamRate/1000).toFixed(0)+"K"],
                ["Integration AMS",annual[0].intg.toLocaleString(),currSymbol+(annual[0].intg*teamRate/1000).toFixed(0)+"K",annual[1].intg.toLocaleString(),currSymbol+(annual[1].intg*teamRate/1000).toFixed(0)+"K",annual[2].intg.toLocaleString(),currSymbol+(annual[2].intg*teamRate/1000).toFixed(0)+"K",currSymbol+((annual[0].intg+annual[1].intg+annual[2].intg)*teamRate/1000).toFixed(0)+"K"],
                ["TOTAL",annual[0].total.toLocaleString(),currSymbol+(annual[0].cost/1000).toFixed(0)+"K",annual[1].total.toLocaleString(),currSymbol+(annual[1].cost/1000).toFixed(0)+"K",annual[2].total.toLocaleString(),currSymbol+(annual[2].cost/1000).toFixed(0)+"K",currSymbol+(totalProgramCost/1000000).toFixed(2)+"M"],
              ]} />
            </Section>
            <Section title="Programme Milestones & Phase Timeline" icon="🗓" accent={C.navy}>
              {[
                { phase:"Phase 0 — KT & Mobilisation", months:"Months 1-"+ktMonths, color:C.amber, milestones:["Shadow current SI across all GW modules and integrations","Document runbooks, incident playbooks, Gosu code inventory","Onboard AMS team (L2/L3/Enhancement squads)","Establish tooling: ITSM, Jira, monitoring dashboards, GW Cloud access","Integration mapping and API catalogue for all 5-6 integrations","KT sign-off gate: knowledge assessment and runbook validation"] },
                { phase:"Phase 1 — Calibration & Stabilisation", months:"Months "+(ktMonths+1)+"-"+(ktMonths+calMonths), color:C.teal, milestones:["Dual-run operations alongside incumbent SI (wound-down)","SLA measurement begins - no penalties in calibration window","Baseline incident volumes and resolution metrics established","First sprint of enhancements delivered to prove velocity","Integration health dashboards go live","Calibration review report - agreed baseline for SLA credit framework"] },
                { phase:"Year 1 — Steady-State AMS", months:"Months 7-18", color:C.blue, milestones:["Full SLA accountability begins (P1-P4 credits/penalties active)","AI Incident Predictor v1 deployed - reduces MTTR by ~15%","Gosu Copilot active for L3 team - code fix acceleration","All 6 integration pipelines under managed monitoring","Quarterly Business Reviews (QBRs) with client leadership","Enhancement backlog velocity: target 20 SP/sprint sustained"] },
                { phase:"Year 2 — Optimise & Accelerate", months:"Months 19-30", color:C.green, milestones:["AI-driven auto-triage covers 30%+ of L2 tickets","Proactive problem management: shift-left from L2 to L1","GW Cloud upgrade support: annual release cycle managed","Expand AI capabilities: Release Notes Summariser, Test DataHub","Tech Debt Radar deployed - 100+ Gosu anti-patterns scanned","Renegotiate SLA targets upward based on proven performance"] },
                { phase:"Year 3 — Innovation & Value Expansion", months:"Months 31-42", color:C.purple, milestones:["AI handles 40%+ of routine L2 incidents autonomously","Predictive analytics: forecast incident spikes pre-business events","Digital/Jutro accelerators: component library, A11y automation","Contract renewal preparation: benchmarking and value story","Potential scope expansion: new markets, additional modules","Innovation showcase: AI accelerator demonstration"] },
              ].map((p) => (
                <div key={p.phase} style={{ marginBottom: 22, borderLeft: "4px solid "+p.color, paddingLeft: 18, paddingBottom: 4 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: p.color }}>{p.phase}</div>
                    <Badge label={p.months} color={p.color} />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 20px" }}>
                    {p.milestones.map((m, i) => (
                      <div key={i} style={{ fontSize: 12, color: C.darkGray, display: "flex", gap: 7, alignItems: "flex-start" }}>
                        <span style={{ color: p.color, fontWeight: 700, marginTop: 1 }}>&#9658;</span><span>{m}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </Section>
          </div>
        )}

        {/* TAB: SLA */}
        {activeTab === "sla" && (
          <div className="fade-in">
            <Section title="SLA Framework — Priority Matrix" icon="⚖️" accent={C.red}>
              <DataTable headers={["Priority","Definition","Response SLA","Resolution SLA","Penalty (per breach)","Credit Cap"]} rows={[
                ["P1 - Critical","GW prod system down / major claims/policy impact","15 min","4 hrs","5% monthly fee","15% of monthly"],
                ["P2 - High","Significant functionality impaired, workaround exists","30 min","8 hrs","2% monthly fee","10% of monthly"],
                ["P3 - Medium","Non-critical issue, limited user impact","2 hrs","24 hrs","1% monthly fee","5% of monthly"],
                ["P4 - Low","Cosmetic / informational, no business impact","4 hrs","72 hrs","0.5% monthly fee","2% of monthly"],
              ]} />
              <div style={{ marginTop: 18, background: "#FFF7ED", border: "1px solid #FED7AA", borderRadius: 10, padding: 16 }}>
                <div style={{ fontWeight: 700, color: C.amber, fontSize: 12, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}><span>⚠️</span> Credit and Penalty Framework Rules</div>
                <div style={{ fontSize: 12, color: C.darkGray, lineHeight: 1.8 }}>
                  Credits apply from <strong>Month {ktMonths + calMonths + 1}</strong> onward (post-KT + Calibration period).<br />
                  Credits are cumulative per month but capped per priority tier.<br />
                  Exclusions: GW Cloud platform outages, client-caused delays, change freeze windows.<br />
                  Maximum aggregate monthly credit: <strong>25% of monthly managed service fee.</strong><br />
                  Incentive bonus: &gt;98% SLA adherence for 3 consecutive months = 1% fee reduction.
                </div>
              </div>
            </Section>
            <Section title="Integration SLA Addendum" icon="🔗" accent={C.teal}>
              <DataTable headers={["Integration","Monitoring","Alert SLA","Fix SLA (P2)","Escalation"]} rows={selectedIntegrations.map((i) => [i,"24×7 automated","15 min alert","8 hrs","GW + Vendor bridge call"])} />
            </Section>
            <Section title="Governance and Reporting Cadence" icon="📋" accent={C.navy}>
              <DataTable headers={["Report/Meeting","Frequency","Audience","Content"]} rows={[
                ["Daily Stand-up","Daily","AMS Squad","Open incidents, blockers, sprint progress"],
                ["Weekly Service Report","Weekly","Client IT Lead","Incident volumes, SLA adherence, sprint velocity"],
                ["Monthly Service Review","Monthly","IT Director","SLA scorecard, credits, backlog health, AI metrics"],
                ["Quarterly Business Review","Quarterly","CIO / Exec Sponsor","Programme health, roadmap, value delivered, year plan"],
                ["Annual Contract Review","Annually","Procurement / Legal","SLA renegotiation, scope changes, commercial terms"],
              ]} />
            </Section>
          </div>
        )}

        {/* TAB: AI */}
        {activeTab === "ai" && (
          <div className="fade-in">
            <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 24 }}>
              <KPI label="Y1 AI Productivity Gain" value="8%" sub="Auto-triage and copilot assist" color={C.teal} />
              <KPI label="Y2 AI Productivity Gain" value="18%" sub="Predictive ops active" color={C.green} />
              <KPI label="Y3 AI Productivity Gain" value="28%" sub="Autonomous L2 handling" color={C.purple} />
              <KPI label="3-Yr Hrs Saved" value={(totalBaseHrs*3-annual.reduce((s,a)=>s+a.total,0)).toLocaleString()} sub="vs. no-AI baseline" color={C.blue} />
            </div>
            <Section title="AI Accelerator Roadmap for AMS" icon="🤖">
              {[
                {name:"GW Incident Auto-Triage",year:"Y1 Q1",color:C.teal,impact:"High",desc:"AI classifier reads incoming ITSM tickets, assigns priority (P1-P4), routes to correct L2/L3 queue, and suggests resolution from historical runbooks.",benefit:"Reduces triage time from 30 min to under 5 min. Covers PC, CC, BC, Jutro tickets."},
                {name:"Gosu Code Copilot",year:"Y1 Q2",color:C.blue,impact:"High",desc:"LLM-powered assistant trained on Guidewire Gosu patterns. L3 engineers get real-time code suggestions, anti-pattern warnings, and auto-generated unit tests.",benefit:"30% reduction in L3 mean time to resolve (MTTR). Tech Debt Radar integrated."},
                {name:"Incident Predictor",year:"Y1 Q3",color:C.purple,impact:"Medium",desc:"ML model trained on 12 months of incident data predicts spike events (renewal season, month-end billing runs) and pre-scales support capacity.",benefit:"Proactive staffing — avoids SLA breach during high-volume windows."},
                {name:"AI Release Notes Summariser",year:"Y1 Q4",color:C.amber,impact:"Medium",desc:"Automatically processes Guidewire quarterly release notes, extracts impactful changes for each module, and generates change impact assessments.",benefit:"Saves 16 hrs per release cycle of manual assessment work."},
                {name:"GW Test DataHub AI",year:"Y2 Q1",color:C.green,impact:"High",desc:"AI-driven test data generation for Guidewire entities (Policy, Claim, Account). Supports CDA/GDPR masking. Reduces test setup time by 60%.",benefit:"Faster UAT cycles for enhancements — more SP delivered per sprint."},
                {name:"Autonomous L2 Resolution Agent",year:"Y3 Q1",color:C.red,impact:"Transformational",desc:"Agentic AI that reads P3/P4 incidents, executes pre-approved runbook actions in GW Cloud, closes tickets without human intervention.",benefit:"Handles 30–40% of L2 volume autonomously. Significant FTE reduction."},
              ].map((ai) => (
                <div key={ai.name} className="ai-card" style={{ border:"1px solid "+ai.color+"28", borderLeft:"5px solid "+ai.color, borderRadius:10, padding:"18px 18px", marginBottom:14, background:ai.color+"05" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
                    <div style={{ fontWeight:700, fontSize:15, color:ai.color }}>{ai.name}</div>
                    <div style={{ display:"flex", gap:8, flexShrink:0, marginLeft:12 }}>
                      <Badge label={ai.year} color={ai.color} />
                      <Badge label={"Impact: "+ai.impact} color={ai.impact==="Transformational"?C.red:ai.impact==="High"?C.blue:C.amber} />
                    </div>
                  </div>
                  <div style={{ fontSize:12, color:C.darkGray, marginBottom:8, lineHeight:1.65 }}>{ai.desc}</div>
                  <div style={{ fontSize:12, color:ai.color, fontWeight:600, display:"flex", gap:6 }}><span style={{ opacity:0.7 }}>✓</span> {ai.benefit}</div>
                </div>
              ))}
            </Section>
            <Section title="AI Productivity Impact by Year" icon="📊" accent={C.navy}>
              <DataTable headers={["Year","L2 Hrs (Base)","L2 Hrs (AI)","L3 Hrs (AI)","Enh Hrs (AI)","Total Hrs Saved","Cost Saved"]}
                rows={annual.map((a) => { const saved = totalBaseHrs - a.total; return ["Year "+a.y, base.totalL2.toLocaleString(), a.l2.toLocaleString(), a.l3.toLocaleString(), a.enh.toLocaleString(), saved.toLocaleString(), currSymbol+(saved*teamRate/1000).toFixed(0)+"K"]; })}
              />
            </Section>
          </div>
        )}

        {/* TAB: KT */}
        {activeTab === "kt" && (
          <div className="fade-in">
            <Section title={"Knowledge Transition Plan — " + ktMonths + "-Month Programme"} icon="🔄">
              <div style={{ marginBottom: 18, background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 10, padding: 16 }}>
                <div style={{ fontWeight: 700, color: C.blue, fontSize: 12, marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}><span>ℹ️</span> KT Guiding Principles</div>
                <div style={{ fontSize: 12, color: C.darkGray, lineHeight: 1.8 }}>
                  KT spans <strong>{ktMonths} months</strong>, followed by <strong>{calMonths} months calibration</strong>.
                  SLA penalties are not applicable until Month {ktMonths + calMonths + 1}.
                  The AMS team operates in shadow mode for the first {Math.ceil(ktMonths/2)} months, then takes primary accountability with incumbent on standby.
                </div>
              </div>
              {[
                {month:"Month 1",title:"Discovery & Shadow",color:C.amber,activities:["Onboard AMS team leads (L2, L3, Enhancement, Integration)","Receive all documentation from incumbent SI: runbooks, architecture docs, Gosu code repos","Shadow incidents across PC, CC, BC, Digital - observe triage and resolution","Map all 5-6 integrations: endpoints, auth, data flows, error patterns","Establish GW Cloud access, ITSM credentials, monitoring tool access","Interview incumbent team: tribal knowledge capture sessions"],deliverable:"Discovery Report, Knowledge Gap Analysis, Onboarding Checklist"},
                {month:"Month 2",title:"Runbook Creation & Parallel Operations",color:C.teal,activities:["Author runbooks for top 50 incident patterns per module","Gosu code walkthrough: all custom extensions, business rules, plugins","Integration runbooks: error resolution for each of 5-6 integrations","First team-led incident resolutions (with incumbent oversight)","Enhancement process walkthrough: backlog grooming, sprint delivery, GW Cloud deploy","Training completion: GW Cloud ops certification for L2/L3 team"],deliverable:"50 Runbooks, Integration Playbooks, Training Completion Report"},
                {month:"Month 3",title:"Primary Accountability + KT Sign-Off",color:C.green,activities:["AMS team takes primary incident ownership across all modules","Incumbent available on advisory basis only (escalation backstop)","First sprint of enhancement delivery completed and demonstrated","KT Assessment: knowledge quiz, incident simulation exercise","Integration monitoring fully transitioned to managed dashboards","KT Sign-Off Gate: client + AMS team + incumbent agreement on readiness"],deliverable:"KT Sign-Off Certificate, Full Runbook Library, Go/No-Go Assessment"},
              ].slice(0, ktMonths).map((m) => (
                <div key={m.month} style={{ marginBottom: 22, borderLeft: "4px solid "+m.color, paddingLeft: 18, paddingBottom: 4 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: m.color }}>{m.month}: {m.title}</div>
                    <Badge label="KT Phase" color={m.color} />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 20px", marginBottom: 10 }}>
                    {m.activities.map((a, i) => (
                      <div key={i} style={{ fontSize: 12, color: C.darkGray, display: "flex", gap: 7 }}>
                        <span style={{ color: m.color, fontWeight: 700, marginTop: 1 }}>&#9658;</span><span>{a}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ background: m.color+"14", border: "1px solid "+m.color+"35", borderRadius: 7, padding: "7px 14px", fontSize: 11, fontWeight: 600, color: m.color }}>
                    Deliverable: {m.deliverable}
                  </div>
                </div>
              ))}
            </Section>
            <Section title={"Calibration Period — " + calMonths + " Months Post-KT"} icon="🎯" accent={C.navy}>
              <div style={{ background: "#F0FFF4", border: "1px solid #86EFAC", borderRadius: 10, padding: 16, marginBottom: 18 }}>
                <div style={{ fontWeight: 700, color: C.green, fontSize: 12, marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}><span>✅</span> Calibration Rules</div>
                <div style={{ fontSize: 12, color: C.darkGray, lineHeight: 1.8 }}>
                  During the <strong>{calMonths}-month calibration</strong> window (Months {ktMonths+1}–{ktMonths+calMonths}):
                  SLA targets are tracked and reported but <strong>no credits or penalties apply</strong>.
                  This establishes the agreed baseline for ongoing managed service performance.
                </div>
              </div>
              <DataTable headers={["Calibration Activity","Owner","When"]} rows={[
                ["Track all incident volumes vs. baseline estimates","AMS Lead","Monthly"],
                ["Measure actual resolution times vs. SLA targets","Service Delivery Manager","Weekly"],
                ["Enhancement velocity: SP delivered vs. committed","Delivery Manager","Per Sprint"],
                ["Integration uptime and error rate tracking","Integration Lead","Continuous"],
                ["Calibration Review Report issued to client","Service Delivery Manager","Month "+(ktMonths+calMonths)],
                ["Agreed amended SLA baseline (if needed)","Both parties","Month "+(ktMonths+calMonths)],
                ["SLA penalties and credits activated","Contract Live","Month "+(ktMonths+calMonths+1)],
              ]} />
            </Section>
            <Section title="KT Risk Register" icon="⚠️" accent={C.red}>
              <DataTable headers={["Risk","Likelihood","Impact","Mitigation"]} rows={[
                ["Incumbent SI non-cooperation / slow handover","Medium","High","Contractual KT obligations; weekly KT progress reviews with client"],
                ["Gosu code undocumented - tribal knowledge only","High","High","Code archaeology sessions; Gosu Copilot assists discovery"],
                ["Integration credentials / access delays","Medium","Medium","Early access request; parallel credential provisioning in Month 1"],
                ["Volume underestimate (incidents higher than baseline)","Medium","Medium","30% buffer in calibration; agree true-up mechanism"],
                ["Key resource attrition during KT","Low","High","Minimum 2x coverage per role; KT docs prevent single-person dependency"],
              ]} />
            </Section>
          </div>
        )}

      </div>
      <PageFooter />
    </div>
  );
}
