export type ResearchPanel = "files" | "output" | "assistence" | "notes" | "evidence" | "chart" | `browser:${string}`;
export type ResearchPanelGroup = "files" | "output" | "assistence" | "browser";

export function researchPanelGroup(panel: ResearchPanel): ResearchPanelGroup {
  if (panel.startsWith("browser:")) return "browser";
  if (panel === "output" || panel === "chart") return "output";
  return panel === "assistence" ? "assistence" : "files";
}

export function closeResearchPanel(tabs: ResearchPanel[], active: ResearchPanel | null, closed: ResearchPanel) {
  const remaining = tabs.filter(tab => tab !== closed);
  const siblings = tabs.filter(tab => researchPanelGroup(tab) === researchPanelGroup(closed));
  const index = siblings.indexOf(closed);
  const fallback = siblings[index - 1] ?? siblings[index + 1] ?? null;
  return {tabs: remaining, panel: active === closed ? fallback : active};
}
