/** Manual integration fixture: real onboarding, isolated sample API, no local profile writes. */
import { createRoot } from "react-dom/client";
import { useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "../../src/queries/client";
import { Onboarding } from "../../src/components/Onboarding";
import "../../src/tailwind.css";

const sampleHarness = {
  id: "codex", name: "Codex", installed: true, installBroken: false,
  authenticated: true, authState: "ready", authMethod: "oauth", account: "Akun contoh",
  agentReady: true, supportsSteering: true, catalogPending: false,
  models: [{ id: "sample-model-a", displayName: "Model contoh A" }, { id: "sample-model-b", displayName: "Model contoh B" }],
  options: { permissionModes: [], reasoningLevels: [], defaultPermissionMode: null },
};
let submitted: unknown = null;
window.fetch = async (input, init) => {
  const url = new URL(typeof input === "string" ? input : input instanceof Request ? input.url : input.toString(), location.origin);
  let data: unknown;
  if (url.pathname === "/api/harnesses") data = { harnesses: [sampleHarness] };
  else if (url.pathname === "/api/project-path/status") data = { gitVersion: "2.50 (contoh)", gitInstallable: false };
  else if (url.pathname === "/api/harnesses/setup/commands") data = {};
  else if (url.pathname === "/api/settings/profile") data = { researchAreas: [], otherArea: null, background: null, papers: [] };
  else if (url.pathname === "/api/telemetry/event") data = {};
  else if (url.pathname === "/api/onboarding/complete") {
    submitted = JSON.parse(String(init?.body));
    data = { project: { id: "fixture-project", name: "Workspace contoh" }, selection: submitted };
  } else return new Response(JSON.stringify({ error: `Fixture tidak mendukung ${url.pathname}` }), { status: 404, headers: { "Content-Type": "application/json" } });
  return new Response(JSON.stringify(data), { headers: { "Content-Type": "application/json" } });
};

function Preview() {
  const [done, setDone] = useState(false);
  return <QueryClientProvider client={queryClient}><div className="app flex h-full flex-col bg-canvas text-text">
    <div className="border-b border-border bg-background p-3 text-center text-sm">Uji onboarding · data contoh · jawaban tidak disimpan ke profil pengguna</div>
    {done ? <main className="mx-auto w-full max-w-155 p-6"><h1>Uji onboarding selesai</h1><p>Model dan delapan jawaban diteruskan ke API contoh.</p><pre className="whitespace-pre-wrap break-words text-sm">{JSON.stringify(submitted, null, 2)}</pre></main> : <Onboarding remote={false} preferredAgent={null} onDone={() => setDone(true)} />}
  </div></QueryClientProvider>;
}
const root = import.meta.hot?.data.root ?? createRoot(document.getElementById("root")!);
if (import.meta.hot) {
  import.meta.hot.data.root = root;
  import.meta.hot.accept();
}
root.render(<Preview />);
