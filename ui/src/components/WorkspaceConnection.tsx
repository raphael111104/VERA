import { useState } from "react";
import { House } from "lucide-react";
import type { RuntimeInfo } from "../api";
import { m } from "../paraglide/messages.js";
import { RemoteHostDialog } from "./RemoteHostDialog";
import { RemoteIcon } from "./RemoteIcon";
import { RemoteStatus } from "./RemoteStatus";
import { SshConfigDialog } from "./SshConfigDialog";
import { showLandingPage } from "./StartupSplash";
import { Button } from "./ui";

export function WorkspaceConnection({
  runtime,
  corner = false,
  compact = false,
}: {
  runtime: RuntimeInfo;
  corner?: boolean;
  compact?: boolean;
}) {
  const [dialog, setDialog] = useState<"hosts" | "config" | null>(null);

  if (runtime.kind === "ssh") return <RemoteStatus runtime={runtime} corner={corner} compact={compact} />;

  return (
    <>
      {corner ? (
        <div className="fixed bottom-0 start-0 z-50">
          <Button
            className="h-auto max-w-48 justify-start rounded-none border-b-0 border-s-0 px-2.5 py-1.5 font-normal"
            title={m.remote_dialog_title()}
            aria-haspopup="dialog"
            onClick={() => setDialog("hosts")}
          >
            <RemoteIcon size={14} className="shrink-0" />
            <span className="min-w-0 truncate text-sm leading-tight">VERA</span>
          </Button>
        </div>
      ) : (
        <div className={`workspace-connection relative shrink-0 border-t border-border ${compact ? "is-compact" : ""}`}>
          <Button
            type="button"
            variant="ghost"
            size="small"
            className="workspace-home-button w-full justify-start gap-2 px-2 py-2.5"
            aria-label={m.vera_landing_back()}
            title={m.vera_landing_back()}
            data-tip={m.vera_landing_back()}
            onClick={showLandingPage}
          >
            <House size={16} aria-hidden="true" />
            <span className="workspace-connection-label min-w-0 truncate">{m.vera_landing_back()}</span>
          </Button>
        </div>
      )}
      {dialog === "hosts" && (
        <RemoteHostDialog
          onClose={() => setDialog(null)}
          onConfigureSsh={() => setDialog("config")}
        />
      )}
      {dialog === "config" && <SshConfigDialog onClose={() => setDialog("hosts")} />}
    </>
  );
}
