export type Fields = Record<string, string>;
export interface Direction {
  comparisons?: CandidateComparison[];
  interest: string;
  experience: string;
  field: string;
  phenomenon: string;
  participants: string;
  context: string;
  concept: string;
  exclusions: string;
  objective: string;
  terms: string;
  seedSources: string;
  candidates: string[];
  choice: string;
  reason: string;
  question: string;
  title: string;
  uncertainty: string;
  reviewFit: string;
  instructions: string;
  step: number;
}
export interface Protocol {
  queryPlans?: {
    provider: string;
    original: string;
    query: string;
    limitsReason: string;
  }[];
  rationale: string;
  objective: string;
  question: string;
  inclusion: string;
  exclusion: string;
  sources: string;
  query: string;
  provider: string;
  limitsReason: string;
  screening: string;
  charting: string;
  chartingFields: string;
  appraisal: string;
  appraisalReason: string;
  synthesis: string;
  registration: string;
  registrationUrl: string;
  amendmentReason: string;
  assignmentFormat: boolean;
}
export interface EvidenceRecord {
  bibliography?: Bibliography;
  id: string;
  runId: string;
  rawId: string;
  title: string;
  doi: string | null;
  year: string | null;
  authors: string | null;
  abstract: string | null;
  url: string | null;
}
export interface SearchRun {
  rawPages: { original?: string; response?: unknown }[];
  id: string;
  purpose: string;
  provider: string;
  query: string | null;
  searchedAt: string | null;
  importedAt: number | null;
  startedAt: number;
  updatedAt: number;
  protocolRevision: number;
  reportedTotal: number | null;
  retrievedCount: number;
  status: string;
  checkpoint: string | null;
  warnings: string[];
  sourceFile: string | null;
  checksum: string | null;
}
export interface Decision {
  id: string;
  recordId: string;
  actorId: string;
  stage: string;
  verdict: string;
  reason: string;
  selectionRevision: number;
  protocolRevision: number;
  submittedAt: number;
}
export interface Retrieval {
  recordId: string;
  status: string;
  reason: string;
  artifactId: string | null;
  at: number;
}
export interface Project {
  id: string;
  name: string;
  entry: string;
  revision: number;
  currentActivity: string;
  createdAt: number;
  updatedAt: number;
  direction: Direction;
  directionConfirmed: boolean;
  protocol: Protocol;
  protocolRevision: number;
  protocolLocked: boolean;
  needsReview: boolean;
  selectionRevision: number;
  selectionStale: boolean;
  runs: SearchRun[];
  records: EvidenceRecord[];
  decisions: Decision[];
  retrievals: Retrieval[];
  merges: {
    id: string;
    canonicalId: string;
    duplicateId: string;
    reason: string;
    active: boolean;
  }[];
}
export interface Summary {
  id: string;
  name: string;
  entry: string;
  revision: number;
  currentActivity: string;
  updatedAt: number;
}
export interface Workspace {
  protocolAlignment?: string[];
  referencePreview?: {
    recordId: string;
    citation: string;
    reference: string;
    issues: string[];
    metadata: Bibliography;
  }[];
  project: Project;
  actor: { id: string; role: "owner" | "reviewer" };
  members: { id: string; name: string }[];
  ledger: Record<string, number | boolean | null>;
  statuses: { recordId: string; title: string; fulltext: string }[];
  duplicateCandidates: {
    canonicalId: string;
    duplicateId: string;
    reason: string;
  }[];
  history: { revision: number; action: string; actorId: string; at: number }[];
  directionBlockers: string[];
  protocolBlockers: string[];
  impact: string[];
  reviewMode: string;
  capabilities: {
    id: string;
    label: string;
    configured: boolean;
    detail: string;
  }[];
}
export interface Command {
  action: string;
  data: unknown;
}
export interface Request extends Command {
  expectedRevision: number;
  operationId: string;
}
export interface ImportPreview {
  records: EvidenceRecord[];
  errors: string[];
  headers: string[];
}
export interface Locator {
  artifactId: string;
  page: number | null;
  section: string;
  quote: string;
  documentHash: string;
}
export interface Column {
  id: string;
  label: string;
  kind: string;
  required: boolean;
  allowedValues: string[];
  missingPolicy: string[];
  extractionGuidance: string;
}
export interface Cell {
  id: string;
  recordId: string;
  columnId: string;
  value: string;
  state: string;
  locator: Locator;
  extractor: string;
  verifier: string | null;
  verificationStatus: string;
  verificationNote: string;
  schemaVersion: number;
  selectionRevision: number;
  protocolRevision: number;
  at: number;
}
export interface DraftSection {
  key: string;
  text: string;
  status: string;
  revision: number;
}
export interface Claim {
  id: string;
  sectionKey: string;
  text: string;
  claimType: string;
  recordIds: string[];
  cellIds: string[];
  sourceLevel: string;
  locators: Locator[];
  reviewStatus: string;
  reviewer: string | null;
  dependency: string;
}
export interface Synthesis {
  version: number;
  selectionRevision: number;
  protocolRevision: number;
  schemaVersion: number;
  recordIds: string[];
  cellIds: string[];
  includedCount: number;
  excludedUnconfirmed: number;
  dependency: string;
  tables: {
    columnId: string;
    label: string;
    denominator: number;
    available: number;
    counts: Record<string, number>;
    missing: Record<string, number>;
    overlapping: boolean;
  }[];
}
export interface Evidence {
  jobs?: AssistanceJob[];
  themes?: {
    id: string;
    text: string;
    recordIds: string[];
    cellIds: string[];
    dependency: string;
    approvedBy: string;
  }[];
  output?: OutputSettings;
  reporting: {
    item: number;
    sectionKey: string;
    quote: string;
    note: string;
  }[];
  exports: ExportManifest[];
  learning: LearningEvent[];
  schemas: { version: number; columns: Column[]; reason: string }[];
  cells: Cell[];
  pilot: {
    recordIds: string[];
    rationale: string;
    status: string;
    schemaVersion: number;
  } | null;
  syntheses: Synthesis[];
  sections: DraftSection[];
  claims: Claim[];
  files: {
    id: string;
    name: string;
    text: string;
    checksum: string;
    at: number;
  }[];
  appraisals: {
    recordId: string;
    instrument: string;
    judgement: string;
    actorId: string;
    protocolRevision: number;
  }[];
}
export interface Project {
  evidence: Evidence;
}
export interface Workspace {
  finalStagesEnabled: boolean;
  audit: AuditReport | null;
  artifacts: { id: string; recordId: string; checksum: string }[];
  evidenceSummary: {
    included: string[];
    confirmedRows: string[];
    dependency: string;
    synthesisStale: boolean;
    practice: boolean;
  };
}
export interface AuditReport {
  projectRevision: number;
  reviewState: string;
  coverage: {
    reported: number;
    notApplicable: number;
    total: number;
    assignment: null | {
      instructions: string;
      status: string;
      note: string;
      items?: {
        requirement: string;
        sectionKey: string;
        quote: string;
        note: string;
        status: string;
      }[];
    };
  };
  checklist: {
    item: number;
    label: string;
    status: string;
    sectionKey: string | null;
    quote: string | null;
    note: string | null;
    page: number | null;
    pageMapping: string;
  }[];
  unresolvedIssues: { code: string; message: string }[];
  dependencyVersions: {
    protocol: number;
    selection: number;
    schema: number;
    evidenceHash: string;
  };
  pagination: {
    status: string;
    reason?: string;
    anchors?: Record<string, number>;
  };
}
export interface ExportManifest
  extends Pick<
    AuditReport,
    | "reviewState"
    | "coverage"
    | "unresolvedIssues"
    | "dependencyVersions"
    | "pagination"
  > {
  exportId: string;
  projectRevision: number;
  files: { name: string; bytes: number; sha256: string }[];
}
export interface LearningEvent {
  type: string;
  id?: string;
  decisionId?: string;
  activity?: string;
  judgement?: string;
  reason?: string;
  evidence?: string;
  hypothesis?: string;
  usedLevel?: number;
  recommendation?: string;
  response?: string;
  finalJudgement?: string;
  hypothesisCorrection?: string;
  topic?: string;
  scheduledAt?: string;
  instructions?: string;
  answer?: string;
  ratings?: string[];
  note?: string;
  granted?: boolean;
  researchUse?: boolean;
  purpose?: string;
  policyVersion: string;
  promptVersion: string;
  modelVersion?: string;
  rubric?: string[];
  actorId: string;
  at: number;
  dependency: string;
}
export interface Bibliography {
  authors: { family: string; given: string; literal: string }[];
  title?: string | null;
  year?: string | null;
  doi?: string | null;
  url?: string | null;
  containerTitle: string;
  volume: string;
  issue: string;
  pages: string;
  articleNumber: string;
  publisher: string;
  kind: string;
  reviewed: boolean;
  note: string;
  provenance: string;
}
export interface OutputSettings {
  language?: string;
  studentName?: string;
  studentId?: string;
  program?: string;
  identityRequired?: boolean;
  filename?: string;
  requirements?: { label: string; text: string }[];
}
export interface AssistanceJob {
  usedLevel?: number;
  id: string;
  actorId: string;
  kind: string;
  sectionKey: string;
  engine: string;
  status: string;
  modelVersion: string;
  policyVersion: string;
  summary?: string;
  error?: string;
  proposal?: {
    summary: string;
    patches: { field: string; text: string }[];
    recordIds: string[];
    cellIds: string[];
  };
  reviewReason?: string;
  at: number;
}
export interface CandidateComparison {
  candidate: string;
  aspects: Record<string, string>;
  recordIds: string[];
  note: string;
  origin: string;
}
