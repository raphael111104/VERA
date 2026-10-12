import type { ChatMessage, Harness, TurnOptions } from "./api";

/** The research composer exposes only the model; the other axes are fixed. */
export function researchChatSettings(harness: Harness | undefined, model: string | null, reasoningLevel: string | null): TurnOptions {
  return {
    model,
    reasoningLevel: reasoningLevel ?? "default",
    serviceTier: harness?.id === "codex" ? "default" : undefined,
    permissionMode: harness?.options?.permissionModes.find(choice => ["full-access", "bypassPermissions", "bypass"].includes(choice.id))?.id,
    planMode: false,
  };
}

/** A completed turn can still contain a provider failure, which must not look successful. */
export function researchChatError(message: ChatMessage): string | null {
  const failed = message.parts.find(part => part.type === "tool" && part.tool === "error");
  if (failed) return failed.state?.error || failed.text || "Agent tidak dapat menyelesaikan jawaban. Coba kirim kembali.";
  if (!message.parts.some(part => part.type === "text" && part.text?.trim())) return "Agent selesai tanpa jawaban yang dapat dibaca. Coba kirim kembali.";
  return null;
}
