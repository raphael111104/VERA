import type { ResearchBrief } from "./researchDemo";
import type { ModelSelection } from "./components/ModelPicker";

export interface ResearchFolder {
  id: string;
  name: string;
  brief: ResearchBrief;
  jobId: string | null;
  selection: ModelSelection | null;
  revision: number;
}

// One writer per folder coalesces edits and prevents older requests overwriting newer drafts.
export class ResearchFolderWriter {
  private pending = new Map<string, ResearchFolder>();
  private running = new Map<string, Promise<void>>();
  private revisions = new Map<string, number>();
  private save: (folder: ResearchFolder) => Promise<ResearchFolder>;
  constructor(save: (folder: ResearchFolder) => Promise<ResearchFolder>) { this.save = save; }
  enqueue(folder: ResearchFolder): Promise<void> {
    this.pending.set(folder.id, folder);
    return this.flush(folder.id);
  }
  flush(id: string): Promise<void> {
    const running = this.running.get(id);
    if (running) return running;
    const task = this.drain(id).finally(() => this.running.delete(id));
    this.running.set(id, task);
    return task;
  }
  private async drain(id: string) {
    while (this.pending.has(id)) {
      const next = this.pending.get(id)!;
      this.pending.delete(id);
      try {
        const saved = await this.save({...next, revision: this.revisions.get(id) ?? next.revision});
        this.revisions.set(id, saved.revision);
      } catch (error) {
        if (!this.pending.has(id)) this.pending.set(id, next);
        throw error;
      }
    }
  }
}
