import type { Harness } from "./api";
import type { ModelSelection } from "./components/ModelPicker";
import type { ResearchJob } from "./researchWorkflow";

/** A folder's next-run choice takes precedence over a historical job's model. */
export function researchSelection(available: Harness[], folder: ModelSelection | null, job: ResearchJob | null, preferred: ModelSelection | null | undefined): ModelSelection | null {
  const historical: ModelSelection | null = job ? {harness:job.harness as ModelSelection["harness"],model:job.model,reasoningLevel:job.reasoningLevel ?? null,serviceTier:null,permissionMode:null} : null;
  return [folder,historical,preferred].find(value => value && available.some(h => h.id === value.harness)) ?? null;
}
