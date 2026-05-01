// ─── Export Utilities ─────────────────────────────────────────────────────────
// Handles PPTX (via pptxgenjs npm) and PDF (via jsPDF CDN) exports.
// Both exports receive live computed state so numbers always match the UI.

import PptxGenJS from "pptxgenjs";

const C_BLUE = "003087";
const C_RED = "E4002B";
const C_NAVY = "001A4E";
const C_LIGHT = "EEF3FB";
const C_MID = "64748B";
const WHITE = "FFFFFF";

// ─── Load CDN script once (used only for jsPDF) ───────────────────────────────
function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector('script[src="' + src + '"]')) {
      resolve();
      return;
    }
    const s = document.createElement("script");
    s.src = src;
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

async function ensureJsPDF() {
  await loadScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js");
  await loadScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js");
}

// ─── Shared slide helpers ──────────────────────────────────────────────────────

function addSlideHeader(slide, title, subtitle) {
  // Dark navy top bar
  slide.addShape("rect", { x: 0, y: 0, w: "100%", h: 1.1, fill: { color: C_NAVY } });
  // Red accent stripe
  slide.addShape("rect", { x: 0, y: 1.1, w: "100%", h: 0.06, fill: { color: C_RED } });
  // Title
  slide.addText(title, {
    x: 0.4, y: 0.14, w: 9.2, h: 0.52,
    fontSize: 20, bold: true, color: WHITE,
    fontFace: "Arial", valign: "middle",
  });
  if (subtitle) {
    slide.addText(subtitle, {
      x: 0.4, y: 0.66, w: 9.2, h: 0.32,
      fontSize: 10, color: "93C5FD",
      fontFace: "Arial", valign: "middle",
    });
  }
  // Footer
  slide.addText("Guidewire Practice · Confidential & Proprietary · " + new Date().getFullYear(), {
    x: 0, y: 7.1, w: "100%", h: 0.3,
    fontSize: 8, color: C_MID, align: "center", fontFace: "Arial",
  });
}

function addKpiRow(slide, kpis, yPos) {
  // kpis: [{label, value, sub, color}]
  const w = 2.15;
  const gap = 0.12;
  kpis.forEach((kpi, i) => {
    const x = 0.4 + i * (w + gap);
    const col = kpi.color || C_BLUE;
    slide.addShape("rect", { x, y: yPos, w, h: 1.15, fill: { color: C_LIGHT }, line: { color: "D1D9E6", pt: 1 } });
    slide.addShape("rect", { x, y: yPos, w: 0.06, h: 1.15, fill: { color: col } });
    slide.addText(kpi.label.toUpperCase(), {
      x: x + 0.14, y: yPos + 0.1, w: w - 0.2, h: 0.22,
      fontSize: 7, color: C_MID, fontFace: "Arial", bold: true,
    });
    slide.addText(kpi.value, {
      x: x + 0.14, y: yPos + 0.3, w: w - 0.2, h: 0.52,
      fontSize: 22, bold: true, color: col, fontFace: "Arial",
    });
    if (kpi.sub) {
      slide.addText(kpi.sub, {
        x: x + 0.14, y: yPos + 0.84, w: w - 0.2, h: 0.22,
        fontSize: 7, color: C_MID, fontFace: "Arial",
      });
    }
  });
}

function addTable(slide, headers, rows, yPos, opts) {
  const tableRows = [
    headers.map((h) => ({
      text: h,
      options: { bold: true, color: WHITE, fill: { color: C_NAVY }, fontSize: 8, align: "center" },
    })),
    ...rows.map((row, ri) =>
      row.map((cell, ci) => ({
        text: String(cell),
        options: {
          fontSize: 8,
          color: "2D3748",
          fill: { color: ri % 2 === 0 ? WHITE : C_LIGHT },
          align: ci === 0 ? "left" : "center",
          bold: ci === 0,
        },
      }))
    ),
  ];
  slide.addTable(tableRows, {
    x: opts?.x || 0.4,
    y: yPos,
    w: opts?.w || 9.2,
    rowH: opts?.rowH || 0.28,
    border: { pt: 0.5, color: "E2E8F0" },
    fontFace: "Arial",
    ...opts,
  });
}

// ─── PPTX EXPORT ──────────────────────────────────────────────────────────────

export async function exportToPptx(data) {
  const prs = new PptxGenJS();
  prs.layout = "LAYOUT_WIDE";
  prs.author = "Guidewire Practice";
  prs.title = "GW Cloud AMS Engagement Estimator";

  const {
    selectedModules, selectedIntegrations, spPerSprint, sprintsPerYear,
    teamRate, ktMonths, calMonths, currency,
    base, annual, totalBaseHrs, integrationHrs, totalProgramCost,
  } = data;

  const sym = currency === "USD" ? "$" : "£";

  // ── Slide 1: Title ──────────────────────────────────────────────────────────
  const s1 = prs.addSlide();
  s1.addShape("rect", { x: 0, y: 0, w: "100%", h: "100%", fill: { color: C_NAVY } });
  s1.addShape("rect", { x: 0, y: 5.2, w: "100%", h: 2.3, fill: { color: C_BLUE } });
  s1.addShape("rect", { x: 0, y: 5.15, w: "100%", h: 0.1, fill: { color: C_RED } });
  s1.addText("GUIDEWIRE PRACTICE", {
    x: 0.4, y: 0.48, w: 6, h: 0.36,
    fontSize: 10, color: "93C5FD", fontFace: "Arial", valign: "middle",
  });
  s1.addText("Guidewire Cloud AMS\nEngagement Estimator", {
    x: 0.4, y: 1.6, w: 9.2, h: 2.2,
    fontSize: 44, bold: true, color: WHITE, fontFace: "Arial",
  });
  s1.addText("PC · CC · BC · Digital (Jutro) · L2/L3 · Enhancements · 3-Year Plan · AI-Augmented", {
    x: 0.4, y: 3.9, w: 9.2, h: 0.4,
    fontSize: 12, color: "93C5FD", fontFace: "Arial",
  });
  s1.addText([
    { text: "3-Year Programme Cost: ", options: { color: "93C5FD", fontSize: 14 } },
    { text: sym + (totalProgramCost / 1000000).toFixed(2) + "M", options: { color: WHITE, fontSize: 20, bold: true } },
  ], { x: 0.4, y: 5.5, w: 9.2, h: 0.6, fontFace: "Arial" });
  s1.addText(selectedModules.length + " modules · " + selectedIntegrations.length + " integrations · " + sym + teamRate + "/hr blended rate", {
    x: 0.4, y: 6.1, w: 9.2, h: 0.35, fontSize: 11, color: "93C5FD", fontFace: "Arial",
  });
  s1.addText("Guidewire Practice · Confidential & Proprietary · " + new Date().getFullYear(), {
    x: 0, y: 7.1, w: "100%", h: 0.3,
    fontSize: 8, color: "64748B", align: "center", fontFace: "Arial",
  });

  // ── Slide 2: Scope Summary ──────────────────────────────────────────────────
  const s2 = prs.addSlide();
  addSlideHeader(s2, "Engagement Scope", "Modules, Integrations & Commercial Parameters");
  s2.addText("Guidewire Modules in Scope", {
    x: 0.4, y: 1.3, w: 4.4, h: 0.3, fontSize: 11, bold: true, color: C_BLUE, fontFace: "Arial",
  });
  selectedModules.forEach((m, i) => {
    s2.addShape("rect", { x: 0.4, y: 1.7 + i * 0.42, w: 4.4, h: 0.35,
      fill: { color: i % 2 === 0 ? C_LIGHT : WHITE }, line: { color: "E2E8F0", pt: 0.5 } });
    s2.addText(m, { x: 0.55, y: 1.72 + i * 0.42, w: 3, h: 0.3, fontSize: 10, bold: true, color: "2D3748", fontFace: "Arial" });
    s2.addText(m.includes("Jutro") ? "Digital" : "Core", {
      x: 3.7, y: 1.72 + i * 0.42, w: 0.9, h: 0.3, fontSize: 9,
      color: WHITE, align: "center", fontFace: "Arial",
      fill: { color: m.includes("Jutro") ? "0891B2" : C_BLUE },
    });
  });
  s2.addText("Cloud Integrations", {
    x: 5.2, y: 1.3, w: 4.4, h: 0.3, fontSize: 11, bold: true, color: C_BLUE, fontFace: "Arial",
  });
  selectedIntegrations.forEach((intg, i) => {
    s2.addShape("rect", { x: 5.2, y: 1.7 + i * 0.42, w: 4.4, h: 0.35,
      fill: { color: i % 2 === 0 ? C_LIGHT : WHITE }, line: { color: "E2E8F0", pt: 0.5 } });
    s2.addText("●  " + intg, { x: 5.35, y: 1.72 + i * 0.42, w: 4.1, h: 0.3, fontSize: 10, color: "2D3748", fontFace: "Arial" });
  });
  const paramY = 1.7 + Math.max(selectedModules.length, selectedIntegrations.length) * 0.42 + 0.15;
  s2.addText("Commercial Parameters", { x: 0.4, y: paramY, w: 9.2, h: 0.3, fontSize: 11, bold: true, color: C_BLUE, fontFace: "Arial" });
  const params = [
    ["Blended Rate", sym + teamRate + "/hr"],
    ["Sprints/Year", sprintsPerYear],
    ["SP/Sprint", spPerSprint],
    ["KT Duration", ktMonths + " months"],
    ["Calibration", calMonths + " months"],
    ["SLA Live", "Month " + (ktMonths + calMonths + 1)],
  ];
  params.forEach((p, i) => {
    const x = 0.4 + i * 1.58;
    s2.addShape("rect", { x, y: paramY + 0.35, w: 1.48, h: 0.7, fill: { color: C_LIGHT }, line: { color: "D1D9E6", pt: 0.5 } });
    s2.addShape("rect", { x, y: paramY + 0.35, w: 1.48, h: 0.06, fill: { color: C_RED } });
    s2.addText(p[0], { x, y: paramY + 0.42, w: 1.48, h: 0.2, fontSize: 7, color: C_MID, align: "center", fontFace: "Arial" });
    s2.addText(String(p[1]), { x, y: paramY + 0.6, w: 1.48, h: 0.38, fontSize: 16, bold: true, color: C_BLUE, align: "center", fontFace: "Arial" });
  });

  // ── Slide 3: Estimation KPIs + Module Breakdown ─────────────────────────────
  const s3 = prs.addSlide();
  addSlideHeader(s3, "Estimation Summary", "Annual hours, FTEs and effort by module");
  addKpiRow(s3, [
    { label: "Total Annual Hrs (Base)", value: totalBaseHrs.toLocaleString(), sub: "Before AI gains", color: C_BLUE },
    { label: "Total FTEs", value: (totalBaseHrs / 1760).toFixed(1), sub: "Gross team Y1", color: C_NAVY },
    { label: "Enhancement SP/Year", value: (spPerSprint * sprintsPerYear).toLocaleString(), sub: sprintsPerYear + " sprints x " + spPerSprint + " SP", color: "0A7C59" },
    { label: "Integration Overhead", value: integrationHrs + " hrs", sub: selectedIntegrations.length + " integ. x 60 hrs", color: "0891B2" },
  ], 1.3);

  const modRows = selectedModules.map((m) => {
    const d = base.byModule[m];
    if (!d) return [m, "-", "-", "-", "-", "-", "-"];
    const tot = d.l2hrs + d.l3hrs;
    return [m, d.l2vol, d.l2hrs.toLocaleString(), d.l3vol, d.l3hrs.toLocaleString(), tot.toLocaleString(), (tot / 1760).toFixed(1)];
  });
  s3.addText("Module-Level Incident Effort (Annual Base)", {
    x: 0.4, y: 2.6, w: 9.2, h: 0.28, fontSize: 10, bold: true, color: C_BLUE, fontFace: "Arial",
  });
  addTable(s3, ["Module", "L2 Tickets/yr", "L2 Hrs", "L3 Tickets/yr", "L3 Hrs", "Total Inc. Hrs", "FTEs"], modRows, 2.9);

  // Enhancement row
  s3.addText("Enhancement Delivery", {
    x: 0.4, y: 2.9 + modRows.length * 0.28 + 0.42, w: 9.2, h: 0.28, fontSize: 10, bold: true, color: C_BLUE, fontFace: "Arial",
  });
  addTable(s3,
    ["Parameter", "Value"],
    [
      ["Sprint Cadence", "Fortnightly (2-week)"],
      ["Total Story Points/Year", String(spPerSprint * sprintsPerYear)],
      ["Hours per Story Point", "6.8 hrs"],
      ["Total Enhancement Hours/Year", base.totalEnhancement.toLocaleString()],
      ["Enhancement FTEs", (base.totalEnhancement / 1760).toFixed(1)],
    ],
    2.9 + modRows.length * 0.28 + 0.75,
    { x: 0.4, w: 4.5 }
  );

  // ── Slide 4: 3-Year Cost Summary ────────────────────────────────────────────
  const s4 = prs.addSlide();
  addSlideHeader(s4, "3-Year Cost & Effort Summary", "AI efficiency gains applied — 8% Y1 → 18% Y2 → 28% Y3");
  addKpiRow(s4, [
    { label: "Year 1 Total Cost", value: sym + (annual[0].cost / 1000).toFixed(0) + "K", sub: annual[0].total.toLocaleString() + " hrs · " + (annual[0].total / 1760).toFixed(1) + " FTEs", color: C_BLUE },
    { label: "Year 2 Total Cost", value: sym + (annual[1].cost / 1000).toFixed(0) + "K", sub: annual[1].total.toLocaleString() + " hrs · " + (annual[1].total / 1760).toFixed(1) + " FTEs", color: "0891B2" },
    { label: "Year 3 Total Cost", value: sym + (annual[2].cost / 1000).toFixed(0) + "K", sub: annual[2].total.toLocaleString() + " hrs · " + (annual[2].total / 1760).toFixed(1) + " FTEs", color: "0A7C59" },
    { label: "3-Year Programme", value: sym + (totalProgramCost / 1000000).toFixed(2) + "M", sub: "AI saves " + Math.round((1 - annual[2].total / totalBaseHrs) * 100) + "% by Y3", color: C_RED },
  ], 1.3);

  addTable(s4,
    ["Stream", "Y1 Hrs", "Y1 Cost", "Y2 Hrs", "Y2 Cost", "Y3 Hrs", "Y3 Cost", "3-Yr Total"],
    [
      ["L2 Incident Mgmt",
        annual[0].l2.toLocaleString(), sym + (annual[0].l2 * teamRate / 1000).toFixed(0) + "K",
        annual[1].l2.toLocaleString(), sym + (annual[1].l2 * teamRate / 1000).toFixed(0) + "K",
        annual[2].l2.toLocaleString(), sym + (annual[2].l2 * teamRate / 1000).toFixed(0) + "K",
        sym + ((annual[0].l2 + annual[1].l2 + annual[2].l2) * teamRate / 1000).toFixed(0) + "K",
      ],
      ["L3 Problem Mgmt",
        annual[0].l3.toLocaleString(), sym + (annual[0].l3 * teamRate / 1000).toFixed(0) + "K",
        annual[1].l3.toLocaleString(), sym + (annual[1].l3 * teamRate / 1000).toFixed(0) + "K",
        annual[2].l3.toLocaleString(), sym + (annual[2].l3 * teamRate / 1000).toFixed(0) + "K",
        sym + ((annual[0].l3 + annual[1].l3 + annual[2].l3) * teamRate / 1000).toFixed(0) + "K",
      ],
      ["Enhancements",
        annual[0].enh.toLocaleString(), sym + (annual[0].enh * teamRate / 1000).toFixed(0) + "K",
        annual[1].enh.toLocaleString(), sym + (annual[1].enh * teamRate / 1000).toFixed(0) + "K",
        annual[2].enh.toLocaleString(), sym + (annual[2].enh * teamRate / 1000).toFixed(0) + "K",
        sym + ((annual[0].enh + annual[1].enh + annual[2].enh) * teamRate / 1000).toFixed(0) + "K",
      ],
      ["Integration AMS",
        annual[0].intg.toLocaleString(), sym + (annual[0].intg * teamRate / 1000).toFixed(0) + "K",
        annual[1].intg.toLocaleString(), sym + (annual[1].intg * teamRate / 1000).toFixed(0) + "K",
        annual[2].intg.toLocaleString(), sym + (annual[2].intg * teamRate / 1000).toFixed(0) + "K",
        sym + ((annual[0].intg + annual[1].intg + annual[2].intg) * teamRate / 1000).toFixed(0) + "K",
      ],
      ["TOTAL",
        annual[0].total.toLocaleString(), sym + (annual[0].cost / 1000).toFixed(0) + "K",
        annual[1].total.toLocaleString(), sym + (annual[1].cost / 1000).toFixed(0) + "K",
        annual[2].total.toLocaleString(), sym + (annual[2].cost / 1000).toFixed(0) + "K",
        sym + (totalProgramCost / 1000000).toFixed(2) + "M",
      ],
    ],
    2.6
  );

  // ── Slide 5: SLA Framework ──────────────────────────────────────────────────
  const s5 = prs.addSlide();
  addSlideHeader(s5, "SLA Framework & Credit/Penalty Model", "SLA accountability from Month " + (ktMonths + calMonths + 1) + " (post-KT + calibration)");
  addTable(s5,
    ["Priority", "Definition", "Response", "Resolution", "Penalty/Breach", "Credit Cap"],
    [
      ["P1 – Critical", "GW prod down / major business impact", "15 min", "4 hrs", "5% monthly fee", "15%"],
      ["P2 – High", "Significant impairment, workaround exists", "30 min", "8 hrs", "2% monthly fee", "10%"],
      ["P3 – Medium", "Non-critical, limited user impact", "2 hrs", "24 hrs", "1% monthly fee", "5%"],
      ["P4 – Low", "Cosmetic / informational", "4 hrs", "72 hrs", "0.5% monthly fee", "2%"],
    ],
    1.35
  );
  s5.addShape("rect", { x: 0.4, y: 2.72, w: 9.2, h: 1.5, fill: { color: "FFF7ED" }, line: { color: "FED7AA", pt: 1 } });
  s5.addText("Credit & Penalty Rules", { x: 0.6, y: 2.82, w: 8.8, h: 0.25, fontSize: 9, bold: true, color: "D97706", fontFace: "Arial" });
  s5.addText(
    "Credits apply from Month " + (ktMonths + calMonths + 1) + " onward (post-KT + calibration).  " +
    "Max aggregate monthly credit: 25% of monthly fee.  " +
    "Exclusions: GW Cloud platform outages, client-caused delays, change freeze windows.  " +
    "Incentive: >98% adherence for 3 consecutive months = 1% fee reduction.",
    { x: 0.6, y: 3.1, w: 8.8, h: 1.0, fontSize: 9, color: "2D3748", fontFace: "Arial" }
  );
  s5.addText("Integration SLA Addendum", { x: 0.4, y: 4.35, w: 9.2, h: 0.28, fontSize: 10, bold: true, color: C_BLUE, fontFace: "Arial" });
  addTable(s5,
    ["Integration", "Monitoring", "Alert SLA", "Fix SLA (P2)", "Escalation"],
    selectedIntegrations.map((i) => [i, "24x7 automated", "15 min", "8 hrs", "GW + Vendor bridge"]),
    4.65, { rowH: 0.24 }
  );

  // ── Slide 6: AI Capabilities ────────────────────────────────────────────────
  const s6 = prs.addSlide();
  addSlideHeader(s6, "AI Capabilities Roadmap", "Augmenting AMS operations across all service layers — Y1 through Y3");
  addKpiRow(s6, [
    { label: "Y1 AI Gain", value: "8%", sub: "Auto-triage & copilot", color: "0891B2" },
    { label: "Y2 AI Gain", value: "18%", sub: "Predictive ops active", color: "0A7C59" },
    { label: "Y3 AI Gain", value: "28%", sub: "Autonomous L2 handling", color: "6D28D9" },
    { label: "3-Yr Hours Saved", value: (totalBaseHrs * 3 - annual.reduce((s, a) => s + a.total, 0)).toLocaleString(), sub: "vs. no-AI baseline", color: C_BLUE },
  ], 1.3);
  const aiAccel = [
    ["GW Incident Auto-Triage", "Y1 Q1", "High", "AI classifier routes tickets, suggests resolution from runbooks. Triage: 30min to <5min."],
    ["Gosu Code Copilot", "Y1 Q2", "High", "LLM trained on Gosu patterns — real-time suggestions, anti-pattern detection, unit tests."],
    ["Incident Predictor", "Y1 Q3", "Medium", "ML model predicts incident spikes; pre-scales support capacity before high-volume windows."],
    ["AI Release Notes Summariser", "Y1 Q4", "Medium", "Processes GW quarterly releases; generates change impact assessments. Saves 16 hrs/cycle."],
    ["GW Test DataHub AI", "Y2 Q1", "High", "AI test data generation for GW entities. GDPR masking. Reduces UAT setup by 60%."],
    ["Autonomous L2 Agent", "Y3 Q1", "Transformational", "Agentic AI executes pre-approved runbooks for P3/P4 tickets. Handles 30-40% of L2 volume."],
  ];
  s6.addText("AI Accelerator Roadmap", { x: 0.4, y: 2.6, w: 9.2, h: 0.28, fontSize: 10, bold: true, color: C_BLUE, fontFace: "Arial" });
  addTable(s6, ["Accelerator", "Timeline", "Impact", "Description"], aiAccel, 2.9, { rowH: 0.3 });

  // ── Slide 7: KT Plan ────────────────────────────────────────────────────────
  const s7 = prs.addSlide();
  addSlideHeader(s7, "Knowledge Transition Plan", ktMonths + "-month KT + " + calMonths + "-month calibration · SLA live Month " + (ktMonths + calMonths + 1));
  const ktPhases = [
    { month: "Month 1", title: "Discovery & Shadow", color: "D97706",
      pts: ["Onboard AMS team leads (L2, L3, Enhancement, Integration)", "Shadow incumbent across PC, CC, BC, Jutro", "Receive all runbooks, architecture docs, Gosu code repos", "Deliverable: Discovery Report, Knowledge Gap Analysis"] },
    { month: "Month 2", title: "Runbook Creation & Parallel Ops", color: "0891B2",
      pts: ["Author runbooks for top 50 incident patterns per module", "Gosu code walkthrough: extensions, business rules, plugins", "First team-led resolutions with incumbent oversight", "Deliverable: 50 Runbooks, Integration Playbooks"] },
    { month: "Month 3", title: "Primary Accountability & Sign-Off", color: "0A7C59",
      pts: ["AMS team takes primary incident ownership across all modules", "First sprint of enhancements completed and demonstrated", "KT Assessment: knowledge quiz + incident simulation", "Deliverable: KT Sign-Off Certificate, Full Runbook Library"] },
  ];
  ktPhases.slice(0, ktMonths).forEach((ph, i) => {
    const x = 0.4 + i * 3.15;
    s7.addShape("rect", { x, y: 1.3, w: 3.0, h: 4.5, fill: { color: C_LIGHT }, line: { color: "E2E8F0", pt: 1 } });
    s7.addShape("rect", { x, y: 1.3, w: 3.0, h: 0.08, fill: { color: ph.color } });
    s7.addShape("rect", { x, y: 1.3, w: 3.0, h: 0.5, fill: { color: ph.color + "22" } });
    s7.addText(ph.month, { x: x + 0.1, y: 1.32, w: 2.8, h: 0.22, fontSize: 9, bold: true, color: ph.color, fontFace: "Arial" });
    s7.addText(ph.title, { x: x + 0.1, y: 1.53, w: 2.8, h: 0.22, fontSize: 9, color: "2D3748", fontFace: "Arial" });
    ph.pts.forEach((pt, j) => {
      s7.addText("▸  " + pt, { x: x + 0.15, y: 1.9 + j * 0.62, w: 2.75, h: 0.55, fontSize: 8, color: "2D3748", fontFace: "Arial" });
    });
  });
  s7.addShape("rect", { x: 0.4, y: 5.95, w: 9.2, h: 0.85, fill: { color: "EFF6FF" }, line: { color: "BFDBFE", pt: 1 } });
  s7.addText("Calibration Period (" + calMonths + " months, Months " + (ktMonths + 1) + "-" + (ktMonths + calMonths) + ")", {
    x: 0.6, y: 6.0, w: 9.0, h: 0.25, fontSize: 9, bold: true, color: C_BLUE, fontFace: "Arial",
  });
  s7.addText(
    "SLA tracked and reported — no penalties apply. Establishes agreed performance baseline. Credits and penalties activate Month " + (ktMonths + calMonths + 1) + ".",
    { x: 0.6, y: 6.25, w: 9.0, h: 0.48, fontSize: 8, color: "2D3748", fontFace: "Arial" }
  );

  await prs.writeFile({ fileName: "GW-Cloud-AMS-Estimator.pptx" });
}

// ─── PDF EXPORT ───────────────────────────────────────────────────────────────

export async function exportToPdf(data) {
  await ensureJsPDF();
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

  const {
    selectedModules, selectedIntegrations, spPerSprint, sprintsPerYear,
    teamRate, ktMonths, calMonths, currency,
    base, annual, totalBaseHrs, integrationHrs, totalProgramCost,
  } = data;

  const sym = currency === "USD" ? "$" : "£";
  const W = 297;

  function addPdfHeader(doc, title, subtitle, pageNum) {
    // Navy bar
    doc.setFillColor(0, 26, 78);
    doc.rect(0, 0, W, 18, "F");
    // Red stripe
    doc.setFillColor(228, 0, 43);
    doc.rect(0, 18, W, 1.2, "F");
    // Title
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text(title, 8, 9);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(147, 197, 253);
    if (subtitle) doc.text(subtitle, 8, 14);
    // Page number
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(7);
    doc.text("Page " + pageNum + " · Guidewire Practice · Confidential", W - 8, 210 - 5, { align: "right" });
    doc.setTextColor(0, 0, 0);
  }

  function kpiBox(doc, x, y, w, h, label, value, sub, hexColor) {
    const r = parseInt(hexColor.slice(0, 2), 16);
    const g = parseInt(hexColor.slice(2, 4), 16);
    const b = parseInt(hexColor.slice(4, 6), 16);
    doc.setFillColor(238, 243, 251);
    doc.rect(x, y, w, h, "F");
    doc.setFillColor(r, g, b);
    doc.rect(x, y, 1.2, h, "F");
    doc.setFontSize(6);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    doc.text(label.toUpperCase(), x + 2, y + 4);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(r, g, b);
    doc.text(value, x + 2, y + 11);
    if (sub) {
      doc.setFontSize(6);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 116, 139);
      doc.text(sub, x + 2, y + 15);
    }
    doc.setTextColor(0, 0, 0);
  }

  // ── Page 1: Cover ────────────────────────────────────────────────────────────
  doc.setFillColor(0, 26, 78);
  doc.rect(0, 0, W, 210, "F");
  doc.setFillColor(0, 48, 135);
  doc.rect(0, 120, W, 90, "F");
  doc.setFillColor(228, 0, 43);
  doc.rect(0, 119, W, 2, "F");
  doc.setFillColor(228, 0, 43);
  doc.rect(10, 10, 28, 10, "F");
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(147, 197, 253);
  doc.text("GUIDEWIRE PRACTICE", 10, 17);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(32);
  doc.setFont("helvetica", "bold");
  doc.text("Guidewire Cloud AMS", 10, 55);
  doc.text("Engagement Estimator", 10, 70);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(147, 197, 253);
  doc.text("PC · CC · BC · Digital (Jutro) · L2/L3 · Enhancements · 3-Year Plan · AI-Augmented", 10, 83);
  doc.setFontSize(11);
  doc.setTextColor(147, 197, 253);
  doc.text("3-Year Programme Cost:", 10, 132);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text(sym + (totalProgramCost / 1000000).toFixed(2) + "M", 10, 145);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(147, 197, 253);
  doc.text(selectedModules.length + " modules · " + selectedIntegrations.length + " integrations · " + sym + teamRate + "/hr blended rate", 10, 155);
  doc.text("KT: " + ktMonths + " months · Calibration: " + calMonths + " months · SLA live Month " + (ktMonths + calMonths + 1), 10, 162);
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text("Guidewire Practice · Confidential & Proprietary · " + new Date().getFullYear(), W / 2, 205, { align: "center" });

  // ── Page 2: Estimation ───────────────────────────────────────────────────────
  doc.addPage();
  addPdfHeader(doc, "Estimation Summary", "Annual hours, FTEs and effort by module", 2);
  const kpiW = 66; const kpiH = 18; const kpiY = 23;
  kpiBox(doc, 8, kpiY, kpiW, kpiH, "Total Annual Hrs (Base)", totalBaseHrs.toLocaleString(), "Before AI gains", "003087");
  kpiBox(doc, 78, kpiY, kpiW, kpiH, "Total FTEs", (totalBaseHrs / 1760).toFixed(1), "Gross team Y1", "001A4E");
  kpiBox(doc, 148, kpiY, kpiW, kpiH, "Enhancement SP/Year", (spPerSprint * sprintsPerYear).toLocaleString(), sprintsPerYear + " sprints x " + spPerSprint + " SP", "0A7C59");
  kpiBox(doc, 218, kpiY, kpiW, kpiH, "Integration Overhead", integrationHrs + " hrs", selectedIntegrations.length + " integ. x 60 hrs", "0891B2");

  doc.setFontSize(9); doc.setFont("helvetica", "bold"); doc.setTextColor(0, 48, 135);
  doc.text("Module-Level Incident Effort (Annual Base)", 8, 48);

  doc.autoTable({
    startY: 51,
    head: [["Module", "L2 Tickets/yr", "L2 Hrs", "L3 Tickets/yr", "L3 Hrs", "Total Inc. Hrs", "FTEs"]],
    body: selectedModules.map((m) => {
      const d = base.byModule[m];
      if (!d) return [m, "-", "-", "-", "-", "-", "-"];
      const tot = d.l2hrs + d.l3hrs;
      return [m, d.l2vol, d.l2hrs.toLocaleString(), d.l3vol, d.l3hrs.toLocaleString(), tot.toLocaleString(), (tot / 1760).toFixed(1)];
    }),
    styles: { fontSize: 8, fontStyle: "normal" },
    headStyles: { fillColor: [0, 26, 78], textColor: 255, fontStyle: "bold", fontSize: 8 },
    alternateRowStyles: { fillColor: [238, 243, 251] },
    columnStyles: { 0: { fontStyle: "bold" } },
    margin: { left: 8, right: 8 },
  });

  const afterModY = doc.lastAutoTable.finalY + 6;
  doc.setFontSize(9); doc.setFont("helvetica", "bold"); doc.setTextColor(0, 48, 135);
  doc.text("Enhancement Delivery Model", 8, afterModY);
  doc.autoTable({
    startY: afterModY + 3,
    head: [["Parameter", "Value"]],
    body: [
      ["Sprint Cadence", "Fortnightly (2-week)"],
      ["Total Story Points/Year", String(spPerSprint * sprintsPerYear)],
      ["Hours per Story Point", "6.8 hrs"],
      ["Total Enhancement Hours/Year", base.totalEnhancement.toLocaleString()],
      ["Enhancement FTEs", (base.totalEnhancement / 1760).toFixed(1)],
    ],
    styles: { fontSize: 8 },
    headStyles: { fillColor: [0, 26, 78], textColor: 255, fontStyle: "bold", fontSize: 8 },
    alternateRowStyles: { fillColor: [238, 243, 251] },
    columnStyles: { 0: { fontStyle: "bold" } },
    tableWidth: 120,
    margin: { left: 8 },
  });

  // ── Page 3: 3-Year Cost ───────────────────────────────────────────────────────
  doc.addPage();
  addPdfHeader(doc, "3-Year Cost & Effort Summary", "AI efficiency applied: 8% Y1 → 18% Y2 → 28% Y3", 3);
  kpiBox(doc, 8, 23, 66, 18, "Year 1 Total Cost", sym + (annual[0].cost / 1000).toFixed(0) + "K", annual[0].total.toLocaleString() + " hrs", "003087");
  kpiBox(doc, 78, 23, 66, 18, "Year 2 Total Cost", sym + (annual[1].cost / 1000).toFixed(0) + "K", annual[1].total.toLocaleString() + " hrs", "0891B2");
  kpiBox(doc, 148, 23, 66, 18, "Year 3 Total Cost", sym + (annual[2].cost / 1000).toFixed(0) + "K", annual[2].total.toLocaleString() + " hrs", "0A7C59");
  kpiBox(doc, 218, 23, 66, 18, "3-Year Programme", sym + (totalProgramCost / 1000000).toFixed(2) + "M", "AI saves " + Math.round((1 - annual[2].total / totalBaseHrs) * 100) + "% by Y3", "E4002B");

  doc.setFontSize(9); doc.setFont("helvetica", "bold"); doc.setTextColor(0, 48, 135);
  doc.text("Effort & Cost by Stream", 8, 48);
  doc.autoTable({
    startY: 51,
    head: [["Stream", "Y1 Hrs", "Y1 Cost", "Y2 Hrs", "Y2 Cost", "Y3 Hrs", "Y3 Cost", "3-Yr Total"]],
    body: [
      ["L2 Incident Mgmt", annual[0].l2.toLocaleString(), sym + (annual[0].l2 * teamRate / 1000).toFixed(0) + "K",
        annual[1].l2.toLocaleString(), sym + (annual[1].l2 * teamRate / 1000).toFixed(0) + "K",
        annual[2].l2.toLocaleString(), sym + (annual[2].l2 * teamRate / 1000).toFixed(0) + "K",
        sym + ((annual[0].l2 + annual[1].l2 + annual[2].l2) * teamRate / 1000).toFixed(0) + "K"],
      ["L3 Problem Mgmt", annual[0].l3.toLocaleString(), sym + (annual[0].l3 * teamRate / 1000).toFixed(0) + "K",
        annual[1].l3.toLocaleString(), sym + (annual[1].l3 * teamRate / 1000).toFixed(0) + "K",
        annual[2].l3.toLocaleString(), sym + (annual[2].l3 * teamRate / 1000).toFixed(0) + "K",
        sym + ((annual[0].l3 + annual[1].l3 + annual[2].l3) * teamRate / 1000).toFixed(0) + "K"],
      ["Enhancements", annual[0].enh.toLocaleString(), sym + (annual[0].enh * teamRate / 1000).toFixed(0) + "K",
        annual[1].enh.toLocaleString(), sym + (annual[1].enh * teamRate / 1000).toFixed(0) + "K",
        annual[2].enh.toLocaleString(), sym + (annual[2].enh * teamRate / 1000).toFixed(0) + "K",
        sym + ((annual[0].enh + annual[1].enh + annual[2].enh) * teamRate / 1000).toFixed(0) + "K"],
      ["Integration AMS", annual[0].intg.toLocaleString(), sym + (annual[0].intg * teamRate / 1000).toFixed(0) + "K",
        annual[1].intg.toLocaleString(), sym + (annual[1].intg * teamRate / 1000).toFixed(0) + "K",
        annual[2].intg.toLocaleString(), sym + (annual[2].intg * teamRate / 1000).toFixed(0) + "K",
        sym + ((annual[0].intg + annual[1].intg + annual[2].intg) * teamRate / 1000).toFixed(0) + "K"],
      ["TOTAL", annual[0].total.toLocaleString(), sym + (annual[0].cost / 1000).toFixed(0) + "K",
        annual[1].total.toLocaleString(), sym + (annual[1].cost / 1000).toFixed(0) + "K",
        annual[2].total.toLocaleString(), sym + (annual[2].cost / 1000).toFixed(0) + "K",
        sym + (totalProgramCost / 1000000).toFixed(2) + "M"],
    ],
    styles: { fontSize: 8 },
    headStyles: { fillColor: [0, 26, 78], textColor: 255, fontStyle: "bold", fontSize: 8 },
    alternateRowStyles: { fillColor: [238, 243, 251] },
    columnStyles: { 0: { fontStyle: "bold" } },
    margin: { left: 8, right: 8 },
  });

  // ── Page 4: SLA ────────────────────────────────────────────────────────────
  doc.addPage();
  addPdfHeader(doc, "SLA Framework & Credit/Penalty Model", "SLA accountability from Month " + (ktMonths + calMonths + 1), 4);
  doc.setFontSize(9); doc.setFont("helvetica", "bold"); doc.setTextColor(0, 48, 135);
  doc.text("Priority Matrix", 8, 26);
  doc.autoTable({
    startY: 29,
    head: [["Priority", "Definition", "Response", "Resolution", "Penalty/Breach", "Credit Cap"]],
    body: [
      ["P1 – Critical", "GW prod down / major business impact", "15 min", "4 hrs", "5% monthly fee", "15%"],
      ["P2 – High", "Significant impairment, workaround exists", "30 min", "8 hrs", "2% monthly fee", "10%"],
      ["P3 – Medium", "Non-critical, limited user impact", "2 hrs", "24 hrs", "1% monthly fee", "5%"],
      ["P4 – Low", "Cosmetic / informational", "4 hrs", "72 hrs", "0.5% monthly fee", "2%"],
    ],
    styles: { fontSize: 8 },
    headStyles: { fillColor: [0, 26, 78], textColor: 255, fontStyle: "bold", fontSize: 8 },
    alternateRowStyles: { fillColor: [238, 243, 251] },
    columnStyles: { 0: { fontStyle: "bold" } },
    margin: { left: 8, right: 8 },
  });
  const slaY = doc.lastAutoTable.finalY + 4;
  doc.setFillColor(255, 247, 237);
  doc.rect(8, slaY, W - 16, 18, "F");
  doc.setFontSize(8); doc.setFont("helvetica", "bold"); doc.setTextColor(217, 119, 6);
  doc.text("Credit & Penalty Rules", 11, slaY + 5);
  doc.setFont("helvetica", "normal"); doc.setTextColor(45, 55, 72); doc.setFontSize(7.5);
  doc.text("Credits apply from Month " + (ktMonths + calMonths + 1) + ". Max aggregate monthly credit: 25% of fee. Exclusions: GW Cloud outages, client-caused delays, change freeze. Incentive: >98% for 3 months = 1% reduction.", 11, slaY + 10, { maxWidth: W - 24 });

  const intgSlaY = slaY + 25;
  doc.setFontSize(9); doc.setFont("helvetica", "bold"); doc.setTextColor(0, 48, 135);
  doc.text("Integration SLA Addendum", 8, intgSlaY);
  doc.autoTable({
    startY: intgSlaY + 3,
    head: [["Integration", "Monitoring", "Alert SLA", "Fix SLA (P2)", "Escalation"]],
    body: selectedIntegrations.map((i) => [i, "24x7 automated", "15 min", "8 hrs", "GW + Vendor bridge"]),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [0, 26, 78], textColor: 255, fontStyle: "bold", fontSize: 8 },
    alternateRowStyles: { fillColor: [238, 243, 251] },
    columnStyles: { 0: { fontStyle: "bold" } },
    margin: { left: 8, right: 8 },
  });

  // ── Page 5: AI Capabilities ────────────────────────────────────────────────
  doc.addPage();
  addPdfHeader(doc, "AI Capabilities Roadmap", "Augmenting AMS operations across all service layers", 5);
  kpiBox(doc, 8, 23, 66, 18, "Y1 AI Productivity Gain", "8%", "Auto-triage & copilot", "0891B2");
  kpiBox(doc, 78, 23, 66, 18, "Y2 AI Productivity Gain", "18%", "Predictive ops active", "0A7C59");
  kpiBox(doc, 148, 23, 66, 18, "Y3 AI Productivity Gain", "28%", "Autonomous L2 handling", "6D28D9");
  kpiBox(doc, 218, 23, 66, 18, "3-Yr Hours Saved", (totalBaseHrs * 3 - annual.reduce((s, a) => s + a.total, 0)).toLocaleString(), "vs. no-AI baseline", "003087");
  doc.setFontSize(9); doc.setFont("helvetica", "bold"); doc.setTextColor(0, 48, 135);
  doc.text("AI Accelerator Roadmap", 8, 48);
  doc.autoTable({
    startY: 51,
    head: [["Accelerator", "Timeline", "Impact", "Description"]],
    body: [
      ["GW Incident Auto-Triage", "Y1 Q1", "High", "AI classifier routes tickets, suggests resolution. Triage 30min → <5min."],
      ["Gosu Code Copilot", "Y1 Q2", "High", "LLM trained on Gosu — real-time suggestions, anti-pattern detection, unit tests."],
      ["Incident Predictor", "Y1 Q3", "Medium", "ML predicts incident spikes; pre-scales support capacity."],
      ["AI Release Notes Summariser", "Y1 Q4", "Medium", "Processes GW releases; generates change impact assessments. Saves 16 hrs/cycle."],
      ["GW Test DataHub AI", "Y2 Q1", "High", "AI test data generation with GDPR masking. Reduces UAT setup by 60%."],
      ["Autonomous L2 Resolution Agent", "Y3 Q1", "Transformational", "Agentic AI executes runbooks for P3/P4 — handles 30-40% of L2 autonomously."],
    ],
    styles: { fontSize: 8 },
    headStyles: { fillColor: [0, 26, 78], textColor: 255, fontStyle: "bold", fontSize: 8 },
    alternateRowStyles: { fillColor: [238, 243, 251] },
    columnStyles: { 0: { fontStyle: "bold", cellWidth: 55 }, 1: { cellWidth: 18 }, 2: { cellWidth: 22 } },
    margin: { left: 8, right: 8 },
  });

  // ── Page 6: KT Plan ────────────────────────────────────────────────────────
  doc.addPage();
  addPdfHeader(doc, "Knowledge Transition Plan", ktMonths + "-month KT + " + calMonths + "-month calibration · SLA live Month " + (ktMonths + calMonths + 1), 6);
  doc.autoTable({
    startY: 24,
    head: [["Phase", "Month", "Key Activities", "Deliverable"]],
    body: [
      ["Discovery & Shadow", "Month 1",
        "Onboard AMS team leads. Shadow incumbent. Receive all docs & Gosu repos. Map all integrations.",
        "Discovery Report, Knowledge Gap Analysis"],
      ["Runbook Creation & Parallel Ops", "Month 2",
        "Author runbooks for top 50 incident patterns. Gosu walkthrough. First team-led resolutions.",
        "50 Runbooks, Integration Playbooks"],
      ["Primary Accountability + KT Sign-Off", "Month 3",
        "AMS team takes primary ownership. First sprint delivered. KT assessment + simulation.",
        "KT Sign-Off Certificate, Runbook Library"],
    ].slice(0, ktMonths),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [0, 26, 78], textColor: 255, fontStyle: "bold", fontSize: 8 },
    alternateRowStyles: { fillColor: [238, 243, 251] },
    columnStyles: { 0: { fontStyle: "bold", cellWidth: 55 }, 1: { cellWidth: 18 } },
    margin: { left: 8, right: 8 },
  });
  const ktRiskY = doc.lastAutoTable.finalY + 6;
  doc.setFontSize(9); doc.setFont("helvetica", "bold"); doc.setTextColor(0, 48, 135);
  doc.text("KT Risk Register", 8, ktRiskY);
  doc.autoTable({
    startY: ktRiskY + 3,
    head: [["Risk", "Likelihood", "Impact", "Mitigation"]],
    body: [
      ["Incumbent SI non-cooperation", "Medium", "High", "Contractual KT obligations; weekly progress reviews"],
      ["Gosu code undocumented", "High", "High", "Code archaeology; Gosu Copilot assists discovery"],
      ["Integration access delays", "Medium", "Medium", "Early access requests; parallel provisioning Month 1"],
      ["Volume underestimate", "Medium", "Medium", "30% calibration buffer; agree true-up mechanism"],
      ["Key resource attrition during KT", "Low", "High", "2x coverage per role; docs prevent single-dependency"],
    ],
    styles: { fontSize: 8 },
    headStyles: { fillColor: [0, 26, 78], textColor: 255, fontStyle: "bold", fontSize: 8 },
    alternateRowStyles: { fillColor: [238, 243, 251] },
    columnStyles: { 0: { fontStyle: "bold" } },
    margin: { left: 8, right: 8 },
  });

  doc.save("GW-Cloud-AMS-Estimator.pdf");
}
