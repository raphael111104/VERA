import type { Command, Request } from "./types";

/** A failed acknowledgement retries the same operation, before any newer edit. */
export class WorkflowWriter<T extends { revision: number }> {
  private revision: number;
  private failed: Request | null = null;
  private pending: Command[] = [];
  private running: Promise<void> | null = null;
  private send: (request: Request) => Promise<T>;
  private accepted: (value: T) => void;
  constructor(
    revision: number,
    send: (request: Request) => Promise<T>,
    accepted: (value: T) => void,
  ) {
    this.revision = revision;
    this.send = send;
    this.accepted = accepted;
  }
  save(command: Command): Promise<void> {
    const last = this.pending.at(-1);
    if (
      ["direction", "protocol"].includes(command.action) &&
      last?.action === command.action
    )
      this.pending[this.pending.length - 1] = command;
    else this.pending.push(command);
    return this.drain();
  }
  retry(): Promise<void> {
    return this.drain();
  }
  private drain(): Promise<void> {
    if (this.running) return this.running;
    this.running = this.run().finally(() => {
      this.running = null;
    });
    return this.running;
  }
  private async run(): Promise<void> {
    while (this.failed || this.pending.length) {
      const request = this.failed ?? {
        ...this.pending.shift()!,
        expectedRevision: this.revision,
        operationId: crypto.randomUUID(),
      };
      this.failed = request;
      let saved: T;
      try {
        saved = await this.send(request);
      } catch (error) {
        const status = Number((error as { status?: number })?.status);
        // A definite rejection did not commit. Only uncertain acknowledgements,
        // conflicts and throttling keep the same operation for a safe retry.
        if (status >= 400 && status < 500 && status !== 409 && status !== 429)
          this.failed = null;
        throw error;
      }
      this.revision = saved.revision;
      this.failed = null;
      this.accepted(saved);
    }
  }
}
