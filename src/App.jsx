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

function Section({ title, icon, children, accent }) {
  return (
    <div style={{ background: C.white, borderRadius: 12, border: "1px solid #E2E8F0", marginBottom: 24, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,48,135,0.07)" }}>
      <div style={{ background: accent || C.blue, padding: "14px 20px", display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 20 }}>{icon}</span>
        <span style={{ color: C.white, fontFamily: "'Barlow', sans-serif", fontWeight: 700, fontSize: 15, letterSpacing: "0.02em" }}>{title}</span>
      </div>
      <div style={{ padding: 20 }}>{children}</div>
    </div>
  );
}

function Badge({ label, color }) {
  return (
    <span style={{ background: color + "18", color, border: "1px solid " + color + "40", borderRadius: 6, padding: "2px 10px", fontSize: 11, fontWeight: 700, fontFamily: "'Barlow', sans-serif", letterSpacing: "0.04em" }}>
      {label}
    </span>
  );
}

function KPI({ label, value, sub, color }) {
  return (
    <div style={{ background: C.gray, borderRadius: 10, padding: "16px 18px", borderLeft: "4px solid " + (color || C.blue), flex: 1, minWidth: 140 }}>
      <div style={{ fontSize: 11, color: C.mid, fontFamily: "'Barlow', sans-serif", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 800, color: color || C.blue, fontFamily: "'Barlow Condensed', sans-serif" }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: C.mid, marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function DataTable({ headers, rows, compact }) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: compact ? 12 : 13, fontFamily: "'Barlow', sans-serif" }}>
        <thead>
          <tr>
            {headers.map((h, i) => (
              <th key={i} style={{ background: C.navy, color: C.white, padding: compact ? "8px 12px" : "10px 14px", textAlign: i === 0 ? "left" : "center", fontWeight: 700, fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase", whiteSpace: "nowrap" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} style={{ background: ri % 2 === 0 ? C.white : C.gray }}>
              {row.map((cell, ci) => (
                <td key={ci} style={{ padding: compact ? "7px 12px" : "9px 14px", textAlign: ci === 0 ? "left" : "center", borderBottom: "1px solid #E2E8F0", fontWeight: ci === 0 ? 600 : 400, color: C.darkGray }}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Slider({ label, min, max, value, onChange, step, unit }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ fontSize: 12, color: C.mid, fontFamily: "'Barlow', sans-serif" }}>{label}</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: C.blue, fontFamily: "'Barlow Condensed', sans-serif" }}>{value}{unit}</span>
      </div>
      <input type="range" min={min} max={max} step={step || 1} value={value} onChange={(e) => onChange(Number(e.target.value))} style={{ width: "100%", accentColor: C.blue, cursor: "pointer" }} />
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#A0AEC0", marginTop: 2 }}>
        <span>{min}{unit}</span><span>{max}{unit}</span>
      </div>
    </div>
  );
}

const TABS = [
  { id: "overview", label: "Scope & Config" },
  { id: "estimation", label: "Estimation" },
  { id: "roadmap", label: "3-Year Roadmap" },
  { id: "sla", label: "SLA & Credits" },
  { id: "ai", label: "AI Capabilities" },
  { id: "kt", label: "KT Plan" },
];
const TAB_ICONS = { overview: "📋", estimation: "📊", roadmap: "🗓", sla: "⚖️", ai: "🤖", kt: "🔄" };

export default function App() {
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

  const toggleModule = (m) => setSelectedModules((p) => p.includes(m) ? p.filter((x) => x !== m) : [...p, m]);
  const toggleIntegration = (i) => setSelectedIntegrations((p) => p.includes(i) ? p.filter((x) => x !== i) : [...p, i]);

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

  const exportData = {
    selectedModules, selectedIntegrations, spPerSprint, sprintsPerYear,
    teamRate, ktMonths, calMonths, currency,
    base, annual, totalBaseHrs, integrationHrs, totalProgramCost,
  };

  async function handleExport(type) {
    setExporting(type);
    try {
      if (type === "pptx") await exportToPptx(exportData);
      else await exportToPdf(exportData);
    } finally {
      setExporting(null);
    }
  }

  const l2PriRows = ["P1","P2","P3","P4"].map((p, idx) => {
    const mixes = [0.05, 0.20, 0.50, 0.25];
    const slas = ["4 hrs","8 hrs","24 hrs","72 hrs"];
    const tickets = Math.round(selectedModules.reduce((s, m) => s + BASE_INCIDENTS.L2[getModKey(m)] * mixes[idx], 0));
    const hrs = Math.round(selectedModules.reduce((s, m) => s + BASE_INCIDENTS.L2[getModKey(m)] * mixes[idx] * EFFORT_HRS.L2[p], 0));
    return [p + " - " + ["Critical","High","Medium","Low"][idx], slas[idx], EFFORT_HRS.L2[p] + " hrs", tickets, hrs];
  });

  return (
    <div style={{ fontFamily: "'Barlow', sans-serif", background: "#F0F4FA", minHeight: "100vh", color: C.darkGray }}>

      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #001A4E 0%, #003087 60%, #0057A8 100%)", padding: "24px 32px 20px", boxShadow: "0 4px 24px rgba(0,26,78,0.25)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
              <div style={{ background: C.red, color: C.white, padding: "4px 14px", borderRadius: 4, fontWeight: 800, fontSize: 13, letterSpacing: "0.08em", fontFamily: "'Barlow Condensed', sans-serif" }}>NTT DATA</div>
              <div style={{ color: "#93C5FD", fontSize: 12, letterSpacing: "0.1em" }}>GUIDEWIRE PRACTICE</div>
            </div>
            <div style={{ color: C.white, fontSize: 22, fontWeight: 800, fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.02em" }}>Guidewire Cloud AMS — Engagement Estimator</div>
            <div style={{ color: "#93C5FD", fontSize: 12, marginTop: 3 }}>PC · CC · BC · Digital (Jutro) · L2/L3 · Enhancements · 3-Year Plan · AI-Augmented</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ color: "#93C5FD", fontSize: 11, marginBottom: 2 }}>3-Year Programme Cost</div>
            <div style={{ color: C.white, fontSize: 32, fontWeight: 800, fontFamily: "'Barlow Condensed', sans-serif" }}>{currSymbol}{(totalProgramCost / 1000000).toFixed(2)}M</div>
            <div style={{ color: "#93C5FD", fontSize: 11, marginTop: 2 }}>Blended rate: {currSymbol}{teamRate}/hr · {selectedModules.length} modules</div>
          </div>
        </div>
      </div>

      {/* Tab Bar */}
      <div style={{ background: C.white, borderBottom: "3px solid " + C.blue, display: "flex", overflowX: "auto", boxShadow: "0 2px 8px rgba(0,48,135,0.08)" }}>
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={{ padding: "13px 20px", border: "none", cursor: "pointer", background: activeTab === t.id ? C.blue : "transparent", color: activeTab === t.id ? C.white : C.mid, fontFamily: "'Barlow', sans-serif", fontWeight: 700, fontSize: 12, letterSpacing: "0.04em", whiteSpace: "nowrap", borderBottom: activeTab === t.id ? "3px solid " + C.red : "3px solid transparent", transition: "all 0.2s" }}>
            {TAB_ICONS[t.id]} {t.label}
          </button>
        ))}
      </div>

      {/* Export Toolbar */}
      <div style={{ background: C.white, borderBottom: "1px solid #E2E8F0", padding: "10px 24px", display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 10 }}>
        <span style={{ fontSize: 11, color: C.mid, fontFamily: "'Barlow', sans-serif" }}>Export current estimates as:</span>
        <button
          onClick={() => handleExport("pdf")}
          disabled={exporting !== null}
          style={{ padding: "7px 18px", borderRadius: 7, border: "2px solid " + C.red, background: exporting === "pdf" ? C.red : C.white, color: exporting === "pdf" ? C.white : C.red, fontFamily: "'Barlow', sans-serif", fontWeight: 700, fontSize: 12, cursor: exporting ? "wait" : "pointer", transition: "all 0.2s" }}
        >
          {exporting === "pdf" ? "Generating PDF..." : "Export PDF (6 pages)"}
        </button>
        <button
          onClick={() => handleExport("pptx")}
          disabled={exporting !== null}
          style={{ padding: "7px 18px", borderRadius: 7, border: "2px solid " + C.blue, background: exporting === "pptx" ? C.blue : C.white, color: exporting === "pptx" ? C.white : C.blue, fontFamily: "'Barlow', sans-serif", fontWeight: 700, fontSize: 12, cursor: exporting ? "wait" : "pointer", transition: "all 0.2s" }}
        >
          {exporting === "pptx" ? "Generating PPTX..." : "Export PPTX (7 slides)"}
        </button>
      </div>

      {/* Page Content */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 20px" }}>

        {/* TAB: SCOPE */}
        {activeTab === "overview" && (
          <>
            <Section title="Engagement Scope Configuration" icon="⚙️">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: C.mid, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>Guidewire Modules in Scope</div>
                  {MODULES.map((m) => (
                    <label key={m} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10, cursor: "pointer" }}>
                      <input type="checkbox" checked={selectedModules.includes(m)} onChange={() => toggleModule(m)} style={{ accentColor: C.blue, width: 16, height: 16 }} />
                      <span style={{ fontSize: 13, fontWeight: 600 }}>{m}</span>
                      <Badge label={m.includes("Jutro") ? "Digital" : "Core"} color={m.includes("Jutro") ? C.teal : C.blue} />
                    </label>
                  ))}
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: C.mid, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>Cloud Integrations in Scope</div>
                  {INTEGRATIONS.map((i) => (
                    <label key={i} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10, cursor: "pointer" }}>
                      <input type="checkbox" checked={selectedIntegrations.includes(i)} onChange={() => toggleIntegration(i)} style={{ accentColor: C.teal, width: 16, height: 16 }} />
                      <span style={{ fontSize: 13 }}>{i}</span>
                    </label>
                  ))}
                </div>
              </div>
            </Section>

            <Section title="Commercial Parameters" icon="💰" accent={C.navy}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32 }}>
                <div>
                  <Slider label="Blended Team Rate (USD/hr)" min={55} max={150} value={teamRate} onChange={setTeamRate} unit=" USD" />
                  <Slider label="Sprints per Year" min={12} max={26} value={sprintsPerYear} onChange={setSprintsPerYear} unit="" />
                  <Slider label="Story Points per Sprint" min={10} max={40} value={spPerSprint} onChange={setSpPerSprint} unit=" SP" />
                </div>
                <div>
                  <Slider label="KT Duration (months)" min={2} max={6} value={ktMonths} onChange={setKtMonths} unit=" mo" />
                  <Slider label="Calibration Period (months)" min={2} max={6} value={calMonths} onChange={setCalMonths} unit=" mo" />
                  <div style={{ marginTop: 16 }}>
                    <div style={{ fontSize: 12, color: C.mid, marginBottom: 6 }}>Currency Display</div>
                    <div style={{ display: "flex", gap: 10 }}>
                      {["USD","GBP"].map((c) => (
                        <button key={c} onClick={() => setCurrency(c)} style={{ padding: "6px 18px", borderRadius: 6, border: "2px solid " + (currency === c ? C.blue : "#CBD5E0"), background: currency === c ? C.blue : "white", color: currency === c ? "white" : C.mid, fontWeight: 700, cursor: "pointer", fontSize: 13 }}>{c}</button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </Section>

            <Section title="AMS Service Layers" icon="🏗️" accent={C.green}>
              <DataTable
                headers={["Service Layer","Description","Modules","Includes"]}
                rows={[
                  ["L1 - Service Desk","First contact, ticket triage and routing","All","24x7 ticket logging, FAQ, GW Cloud portal access"],
                  ["L2 - Incident Mgmt","Break-fix, configuration, GW Cloud ops","PC, CC, BC, Jutro","Incident resolution, root-cause identification, workarounds"],
                  ["L3 - Problem Mgmt","Deep-dive GW config/code, integration fixes","PC, CC, BC, Jutro","Gosu code changes, patch mgmt, integration debugging"],
                  ["Enhancement / SCR","Small Change Requests via sprint delivery","All Modules","Agile sprints, user stories, UAT support, GW Cloud deploy"],
                  ["Integration AMS","Monitor and maintain 5-6 cloud integrations","All Integrations","API health checks, OAuth token refresh, error triage"],
                  ["AI-Augmented Ops","AI copilots accelerating all layers","All","Incident predictor, Gosu copilot, auto-triage, release notes"],
                ]}
              />
            </Section>
          </>
        )}

        {/* TAB: ESTIMATION */}
        {activeTab === "estimation" && (
          <>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 24 }}>
              <KPI label="Total Annual Hours (Base)" value={totalBaseHrs.toLocaleString()} sub="Before AI efficiency gains" color={C.blue} />
              <KPI label="Total FTEs (Base)" value={calcFTE(totalBaseHrs)} sub="Gross team size Y1" color={C.navy} />
              <KPI label="Enhancement SP/Year" value={(spPerSprint * sprintsPerYear).toLocaleString()} sub={sprintsPerYear + " sprints x " + spPerSprint + " SP"} color={C.green} />
              <KPI label="Integration Overhead" value={integrationHrs + " hrs"} sub={selectedIntegrations.length + " integrations x 60 hrs"} color={C.teal} />
            </div>

            <Section title="Module-Level Incident Effort Breakdown (Annual Base)" icon="📦">
              <DataTable
                headers={["Module","L2 Tickets/yr","L2 Effort (hrs)","L3 Tickets/yr","L3 Effort (hrs)","Total Inc. Hrs","FTEs"]}
                rows={selectedModules.map((m) => {
                  const d = base.byModule[m];
                  if (!d) return [m,"-","-","-","-","-","-"];
                  const tot = d.l2hrs + d.l3hrs;
                  return [m, d.l2vol, d.l2hrs.toLocaleString(), d.l3vol, d.l3hrs.toLocaleString(), tot.toLocaleString(), calcFTE(tot)];
                })}
              />
            </Section>

            <Section title="Effort by Priority (P1-P4) - L2 Incident Resolution" icon="🔥" accent={C.red}>
              <DataTable headers={["Priority","SLA Target","Avg Hrs/Ticket","Est. Tickets/yr","Annual Hours"]} rows={l2PriRows} />
            </Section>

            <Section title="Enhancement Delivery Model" icon="🚀" accent={C.green}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
                <DataTable headers={["Parameter","Value"]} rows={[
                  ["Sprint Cadence","Fortnightly (2-week)"],
                  ["Sprints per Year", sprintsPerYear],
                  ["Story Points / Sprint", spPerSprint],
                  ["Total SP / Year", spPerSprint * sprintsPerYear],
                  ["Hours / Story Point", SP_HRS + " hrs"],
                  ["Enhancement Hours / Year", base.totalEnhancement.toLocaleString()],
                  ["Enhancement FTEs", calcFTE(base.totalEnhancement)],
                ]} />
                <div style={{ background: C.gray, borderRadius: 10, padding: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: C.mid, marginBottom: 12, textTransform: "uppercase" }}>User Story Size Guide</div>
                  {[{size:"XS",sp:"1-2",desc:"Config tweak, label change, minor UI"},{size:"S",sp:"3-5",desc:"Validation rule, simple workflow step"},{size:"M",sp:"6-10",desc:"New screen/section, API integration field"},{size:"L",sp:"13-20",desc:"New business rule, complex workflow"},{size:"XL",sp:"21+",desc:"Epic-level - split before sprint entry"}].map((r) => (
                    <div key={r.size} style={{ display: "flex", gap: 12, marginBottom: 8, alignItems: "flex-start" }}>
                      <div style={{ background: C.blue, color: "white", borderRadius: 4, padding: "2px 8px", fontSize: 11, fontWeight: 800, minWidth: 28, textAlign: "center" }}>{r.size}</div>
                      <div style={{ fontSize: 11 }}><span style={{ fontWeight: 700, color: C.blue }}>{r.sp} SP</span><span style={{ color: C.mid }}> — {r.desc}</span></div>
                    </div>
                  ))}
                </div>
              </div>
            </Section>
          </>
        )}

        {/* TAB: ROADMAP */}
        {activeTab === "roadmap" && (
          <>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 24 }}>
              {annual.map((a) => (
                <KPI key={a.y} label={"Year " + a.y + " Total Hours"} value={a.total.toLocaleString()} sub={currSymbol + (a.cost/1000).toFixed(0) + "K · " + calcFTE(a.total) + " FTEs"} color={a.y===1?C.blue:a.y===2?C.teal:C.green} />
              ))}
              <KPI label="3-Year Cost" value={currSymbol + (totalProgramCost/1000000).toFixed(2) + "M"} sub={"AI saves " + Math.round((1-annual[2].total/totalBaseHrs)*100) + "% by Y3"} color={C.red} />
            </div>

            <Section title="3-Year Effort & Cost Summary" icon="📈">
              <DataTable
                headers={["Stream","Y1 Hrs","Y1 Cost","Y2 Hrs","Y2 Cost","Y3 Hrs","Y3 Cost","3-Yr Total"]}
                rows={[
                  ["L2 Incident Mgmt", annual[0].l2.toLocaleString(), currSymbol+(annual[0].l2*teamRate/1000).toFixed(0)+"K", annual[1].l2.toLocaleString(), currSymbol+(annual[1].l2*teamRate/1000).toFixed(0)+"K", annual[2].l2.toLocaleString(), currSymbol+(annual[2].l2*teamRate/1000).toFixed(0)+"K", currSymbol+((annual[0].l2+annual[1].l2+annual[2].l2)*teamRate/1000).toFixed(0)+"K"],
                  ["L3 Problem Mgmt", annual[0].l3.toLocaleString(), currSymbol+(annual[0].l3*teamRate/1000).toFixed(0)+"K", annual[1].l3.toLocaleString(), currSymbol+(annual[1].l3*teamRate/1000).toFixed(0)+"K", annual[2].l3.toLocaleString(), currSymbol+(annual[2].l3*teamRate/1000).toFixed(0)+"K", currSymbol+((annual[0].l3+annual[1].l3+annual[2].l3)*teamRate/1000).toFixed(0)+"K"],
                  ["Enhancements", annual[0].enh.toLocaleString(), currSymbol+(annual[0].enh*teamRate/1000).toFixed(0)+"K", annual[1].enh.toLocaleString(), currSymbol+(annual[1].enh*teamRate/1000).toFixed(0)+"K", annual[2].enh.toLocaleString(), currSymbol+(annual[2].enh*teamRate/1000).toFixed(0)+"K", currSymbol+((annual[0].enh+annual[1].enh+annual[2].enh)*teamRate/1000).toFixed(0)+"K"],
                  ["Integration AMS", annual[0].intg.toLocaleString(), currSymbol+(annual[0].intg*teamRate/1000).toFixed(0)+"K", annual[1].intg.toLocaleString(), currSymbol+(annual[1].intg*teamRate/1000).toFixed(0)+"K", annual[2].intg.toLocaleString(), currSymbol+(annual[2].intg*teamRate/1000).toFixed(0)+"K", currSymbol+((annual[0].intg+annual[1].intg+annual[2].intg)*teamRate/1000).toFixed(0)+"K"],
                  ["TOTAL", annual[0].total.toLocaleString(), currSymbol+(annual[0].cost/1000).toFixed(0)+"K", annual[1].total.toLocaleString(), currSymbol+(annual[1].cost/1000).toFixed(0)+"K", annual[2].total.toLocaleString(), currSymbol+(annual[2].cost/1000).toFixed(0)+"K", currSymbol+(totalProgramCost/1000000).toFixed(2)+"M"],
                ]}
              />
            </Section>

            <Section title="Programme Milestones & Phase Timeline" icon="🗓" accent={C.navy}>
              {[
                { phase: "Phase 0 - KT & Mobilisation", months: "Months 1-"+ktMonths, color: C.amber, milestones: ["Shadow current SI across all GW modules and integrations","Document runbooks, incident playbooks, Gosu code inventory","Onboard NTT DATA AMS team (L2/L3/Enhancement squads)","Establish tooling: ITSM, Jira, monitoring dashboards, GW Cloud access","Integration mapping and API catalogue for all 5-6 integrations","KT sign-off gate: knowledge assessment and runbook validation"] },
                { phase: "Phase 1 - Calibration & Stabilisation", months: "Months "+(ktMonths+1)+"-"+(ktMonths+calMonths), color: C.teal, milestones: ["Dual-run operations alongside incumbent SI (wound-down)","SLA measurement begins - no penalties in calibration window","Baseline incident volumes and resolution metrics established","First sprint of enhancements delivered to prove velocity","Integration health dashboards go live","Calibration review report - agreed baseline for SLA credit framework"] },
                { phase: "Year 1 - Steady-State AMS", months: "Months 7-18", color: C.blue, milestones: ["Full SLA accountability begins (P1-P4 credits/penalties active)","AI Incident Predictor v1 deployed - reduces MTTR by ~15%","Gosu Copilot active for L3 team - code fix acceleration","All 6 integration pipelines under NTT DATA monitoring","Quarterly Business Reviews (QBRs) with client leadership","Enhancement backlog velocity: target 20 SP/sprint sustained"] },
                { phase: "Year 2 - Optimise & Accelerate", months: "Months 19-30", color: C.green, milestones: ["AI-driven auto-triage covers 30%+ of L2 tickets","Proactive problem management: shift-left from L2 to L1","GW Cloud upgrade support: annual release cycle managed","Expand AI capabilities: Release Notes Summariser, Test DataHub","Tech Debt Radar deployed - 100+ Gosu anti-patterns scanned","Renegotiate SLA targets upward based on proven performance"] },
                { phase: "Year 3 - Innovation & Value Expansion", months: "Months 31-42", color: C.purple, milestones: ["AI handles 40%+ of routine L2 incidents autonomously","Predictive analytics: forecast incident spikes pre-business events","Digital/Jutro accelerators: component library, A11y automation","Contract renewal preparation: benchmarking and value story","Potential scope expansion: new markets, additional modules","Innovation showcase: NTT DATA AI accelerator demonstration"] },
              ].map((p) => (
                <div key={p.phase} style={{ marginBottom: 20, borderLeft: "4px solid "+p.color, paddingLeft: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: p.color }}>{p.phase}</div>
                    <Badge label={p.months} color={p.color} />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 16px" }}>
                    {p.milestones.map((m, i) => (
                      <div key={i} style={{ fontSize: 12, color: C.darkGray, display: "flex", gap: 6, alignItems: "flex-start" }}>
                        <span style={{ color: p.color, fontWeight: 700 }}>&#9658;</span><span>{m}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </Section>
          </>
        )}

        {/* TAB: SLA */}
        {activeTab === "sla" && (
          <>
            <Section title="SLA Framework - Priority Matrix" icon="⚖️" accent={C.red}>
              <DataTable
                headers={["Priority","Definition","Response SLA","Resolution SLA","Penalty (per breach)","Credit Cap"]}
                rows={[
                  ["P1 - Critical","GW prod system down / major claims/policy impact","15 min","4 hrs","5% monthly fee","15% of monthly"],
                  ["P2 - High","Significant functionality impaired, workaround exists","30 min","8 hrs","2% monthly fee","10% of monthly"],
                  ["P3 - Medium","Non-critical issue, limited user impact","2 hrs","24 hrs","1% monthly fee","5% of monthly"],
                  ["P4 - Low","Cosmetic / informational, no business impact","4 hrs","72 hrs","0.5% monthly fee","2% of monthly"],
                ]}
              />
              <div style={{ marginTop: 16, background: "#FFF7ED", border: "1px solid #FED7AA", borderRadius: 8, padding: 14 }}>
                <div style={{ fontWeight: 700, color: C.amber, fontSize: 12, marginBottom: 6 }}>Credit and Penalty Framework Rules</div>
                <div style={{ fontSize: 12, color: C.darkGray, lineHeight: 1.7 }}>
                  Credits apply from <strong>Month {ktMonths + calMonths + 1}</strong> onward (post-KT + Calibration period).<br />
                  Credits are cumulative per month but capped per priority tier.<br />
                  Exclusions: GW Cloud platform outages, client-caused delays, change freeze windows.<br />
                  Maximum aggregate monthly credit: <strong>25% of monthly managed service fee.</strong><br />
                  Incentive bonus: &gt;98% SLA adherence for 3 consecutive months = 1% fee reduction.
                </div>
              </div>
            </Section>

            <Section title="Integration SLA Addendum" icon="🔗" accent={C.teal}>
              <DataTable headers={["Integration","Monitoring","Alert SLA","Fix SLA (P2)","Escalation"]} rows={selectedIntegrations.map((i) => [i,"24x7 automated","15 min alert","8 hrs","GW + Vendor bridge call"])} />
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
          </>
        )}

        {/* TAB: AI */}
        {activeTab === "ai" && (
          <>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 24 }}>
              <KPI label="Y1 AI Productivity Gain" value="8%" sub="Auto-triage and copilot assist" color={C.teal} />
              <KPI label="Y2 AI Productivity Gain" value="18%" sub="Predictive ops active" color={C.green} />
              <KPI label="Y3 AI Productivity Gain" value="28%" sub="Autonomous L2 handling" color={C.purple} />
              <KPI label="3-Yr Hrs Saved" value={(totalBaseHrs*3-annual.reduce((s,a)=>s+a.total,0)).toLocaleString()} sub="vs. no-AI baseline" color={C.blue} />
            </div>

            <Section title="AI Accelerator Roadmap for AMS" icon="🤖">
              {[
                { name:"GW Incident Auto-Triage", year:"Y1 Q1", color:C.teal, impact:"High", desc:"AI classifier reads incoming ITSM tickets, assigns priority (P1-P4), routes to correct L2/L3 queue, and suggests resolution from historical runbooks.", benefit:"Reduces triage time from 30 min to under 5 min. Covers PC, CC, BC, Jutro tickets." },
                { name:"Gosu Code Copilot", year:"Y1 Q2", color:C.blue, impact:"High", desc:"LLM-powered assistant trained on Guidewire Gosu patterns. L3 engineers get real-time code suggestions, anti-pattern warnings, and auto-generated unit tests.", benefit:"30% reduction in L3 mean time to resolve (MTTR). Tech Debt Radar integrated." },
                { name:"Incident Predictor", year:"Y1 Q3", color:C.purple, impact:"Medium", desc:"ML model trained on 12 months of incident data predicts spike events (renewal season, month-end billing runs) and pre-scales support capacity.", benefit:"Proactive staffing - avoids SLA breach during high-volume windows." },
                { name:"AI Release Notes Summariser", year:"Y1 Q4", color:C.amber, impact:"Medium", desc:"Automatically processes Guidewire quarterly release notes, extracts impactful changes for each module, and generates change impact assessments.", benefit:"Saves 16 hrs per release cycle of manual assessment work." },
                { name:"GW Test DataHub AI", year:"Y2 Q1", color:C.green, impact:"High", desc:"AI-driven test data generation for Guidewire entities (Policy, Claim, Account). Supports CDA/GDPR masking. Reduces test setup time by 60%.", benefit:"Faster UAT cycles for enhancements - more SP delivered per sprint." },
                { name:"Autonomous L2 Resolution Agent", year:"Y3 Q1", color:C.red, impact:"Transformational", desc:"Agentic AI that reads P3/P4 incidents, executes pre-approved runbook actions in GW Cloud, closes tickets without human intervention.", benefit:"Handles 30-40% of L2 volume autonomously. Significant FTE reduction." },
              ].map((ai) => (
                <div key={ai.name} style={{ border: "1px solid "+ai.color+"30", borderRadius: 10, padding: 16, marginBottom: 14, borderLeft: "5px solid "+ai.color }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: ai.color }}>{ai.name}</div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <Badge label={ai.year} color={ai.color} />
                      <Badge label={"Impact: "+ai.impact} color={ai.impact==="Transformational"?C.red:ai.impact==="High"?C.blue:C.amber} />
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: C.darkGray, marginBottom: 6 }}>{ai.desc}</div>
                  <div style={{ fontSize: 12, color: ai.color, fontWeight: 600 }}>Benefit: {ai.benefit}</div>
                </div>
              ))}
            </Section>

            <Section title="AI Productivity Impact by Year" icon="📊" accent={C.navy}>
              <DataTable
                headers={["Year","L2 Hrs (Base)","L2 Hrs (AI)","L3 Hrs (AI)","Enh Hrs (AI)","Total Hrs Saved","Cost Saved"]}
                rows={annual.map((a) => {
                  const saved = totalBaseHrs - a.total;
                  return ["Year "+a.y, base.totalL2.toLocaleString(), a.l2.toLocaleString(), a.l3.toLocaleString(), a.enh.toLocaleString(), saved.toLocaleString(), currSymbol+(saved*teamRate/1000).toFixed(0)+"K"];
                })}
              />
            </Section>
          </>
        )}

        {/* TAB: KT */}
        {activeTab === "kt" && (
          <>
            <Section title={"Knowledge Transition Plan - "+ktMonths+"-Month Programme"} icon="🔄">
              <div style={{ marginBottom: 16, background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 8, padding: 14 }}>
                <div style={{ fontWeight: 700, color: C.blue, fontSize: 12, marginBottom: 4 }}>KT Guiding Principles</div>
                <div style={{ fontSize: 12, color: C.darkGray, lineHeight: 1.7 }}>
                  KT spans <strong>{ktMonths} months</strong>, followed by <strong>{calMonths} months calibration</strong>.
                  SLA penalties are not applicable until Month {ktMonths + calMonths + 1}.
                  NTT DATA operates in shadow mode for the first {Math.ceil(ktMonths/2)} months, then takes primary accountability with incumbent on standby.
                </div>
              </div>
              {[
                { month:"Month 1", title:"Discovery & Shadow", color:C.amber, activities:["Onboard NTT DATA AMS team leads (L2, L3, Enhancement, Integration)","Receive all documentation from incumbent SI: runbooks, architecture docs, Gosu code repos","Shadow incidents across PC, CC, BC, Digital - observe triage and resolution","Map all 5-6 integrations: endpoints, auth, data flows, error patterns","Establish GW Cloud access, ITSM credentials, monitoring tool access","Interview incumbent team: tribal knowledge capture sessions"], deliverable:"Discovery Report, Knowledge Gap Analysis, Onboarding Checklist" },
                { month:"Month 2", title:"Runbook Creation & Parallel Operations", color:C.teal, activities:["NTT DATA authors runbooks for top 50 incident patterns per module","Gosu code walkthrough: all custom extensions, business rules, plugins","Integration runbooks: error resolution for each of 5-6 integrations","First NTT DATA-led incident resolutions (with incumbent oversight)","Enhancement process walkthrough: backlog grooming, sprint delivery, GW Cloud deploy","Training completion: GW Cloud ops certification for L2/L3 team"], deliverable:"50 Runbooks, Integration Playbooks, Training Completion Report" },
                { month:"Month 3", title:"Primary Accountability + KT Sign-Off", color:C.green, activities:["NTT DATA takes primary incident ownership across all modules","Incumbent available on advisory basis only (escalation backstop)","First sprint of enhancement delivery completed and demonstrated","KT Assessment: knowledge quiz, incident simulation exercise","Integration monitoring fully transitioned to NTT DATA dashboards","KT Sign-Off Gate: client + NTT DATA + incumbent agreement on readiness"], deliverable:"KT Sign-Off Certificate, Full Runbook Library, Go/No-Go Assessment" },
              ].slice(0, ktMonths).map((m) => (
                <div key={m.month} style={{ marginBottom: 20, borderLeft: "4px solid "+m.color, paddingLeft: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: m.color }}>{m.month}: {m.title}</div>
                    <Badge label="KT Phase" color={m.color} />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 16px", marginBottom: 8 }}>
                    {m.activities.map((a, i) => (
                      <div key={i} style={{ fontSize: 12, color: C.darkGray, display: "flex", gap: 6 }}>
                        <span style={{ color: m.color, fontWeight: 700 }}>&#9658;</span><span>{a}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ background: m.color+"12", border: "1px solid "+m.color+"30", borderRadius: 6, padding: "6px 12px", fontSize: 11, fontWeight: 600, color: m.color }}>
                    Deliverable: {m.deliverable}
                  </div>
                </div>
              ))}
            </Section>

            <Section title={"Calibration Period - "+calMonths+" Months Post-KT"} icon="🎯" accent={C.navy}>
              <div style={{ background: "#F0FFF4", border: "1px solid #86EFAC", borderRadius: 8, padding: 14, marginBottom: 16 }}>
                <div style={{ fontWeight: 700, color: C.green, fontSize: 12, marginBottom: 4 }}>Calibration Rules</div>
                <div style={{ fontSize: 12, color: C.darkGray, lineHeight: 1.7 }}>
                  During the <strong>{calMonths}-month calibration</strong> window (Months {ktMonths+1}-{ktMonths+calMonths}):
                  SLA targets are tracked and reported but <strong>no credits or penalties apply</strong>.
                  This establishes the agreed baseline for ongoing managed service performance.
                </div>
              </div>
              <DataTable headers={["Calibration Activity","Owner","When"]} rows={[
                ["Track all incident volumes vs. baseline estimates","NTT DATA AMS Lead","Monthly"],
                ["Measure actual resolution times vs. SLA targets","Service Delivery Manager","Weekly"],
                ["Enhancement velocity: SP delivered vs. committed","Delivery Manager","Per Sprint"],
                ["Integration uptime and error rate tracking","Integration Lead","Continuous"],
                ["Calibration Review Report issued to client","NTT DATA SDM","Month "+(ktMonths+calMonths)],
                ["Agreed amended SLA baseline (if needed)","Both parties","Month "+(ktMonths+calMonths)],
                ["SLA penalties and credits activated","Contract Live","Month "+(ktMonths+calMonths+1)],
              ]} />
            </Section>

            <Section title="KT Risk Register" icon="⚠️" accent={C.red}>
              <DataTable headers={["Risk","Likelihood","Impact","Mitigation"]} rows={[
                ["Incumbent SI non-cooperation / slow handover","Medium","High","Contractual KT obligations; weekly KT progress reviews with client"],
                ["Gosu code undocumented - tribal knowledge only","High","High","Code archaeology sessions; NTT DATA Gosu Copilot assists discovery"],
                ["Integration credentials / access delays","Medium","Medium","Early access request; parallel credential provisioning in Month 1"],
                ["Volume underestimate (incidents higher than baseline)","Medium","Medium","30% buffer in calibration; agree true-up mechanism"],
                ["Key NTT DATA resource attrition during KT","Low","High","Minimum 2x coverage per role; KT docs prevent single-person dependency"],
              ]} />
            </Section>
          </>
        )}

      </div>

      {/* Footer */}
      <div style={{ background: C.navy, color: "#93C5FD", textAlign: "center", padding: "16px 20px", fontSize: 11, letterSpacing: "0.04em" }}>
        NTT DATA — Guidewire Practice · AMS Engagement Estimator · Confidential &amp; Proprietary · {new Date().getFullYear()}
      </div>
    </div>
  );
}
