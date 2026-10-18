import test from "node:test";
import assert from "node:assert/strict";
import {
  activeTransfer,
  hasInitialJudgement,
  needsJudgement,
  recommendation,
  stageGuides,
  proposalReadiness,
} from "../src/features/research-workflow/guidance.ts";

function workspace() {
  return {
    actor: { id: "owner", role: "owner" },
    directionBlockers: ["Isi konsep dan konteks"],
    duplicateCandidates: [],
    project: {
      directionConfirmed: false,
      direction: { concept: "", context: "" },
      protocolLocked: false,
      needsReview: false,
      selectionStale: false,
      runs: [],
      records: [],
      evidence: { learning: [] },
    },
    evidenceSummary: {
      dependency: "current-evidence",
      included: [],
      confirmedRows: [],
      synthesisStale: true,
    },
    audit: { unresolvedIssues: [] },
  };
}
test("guide covers all activities with a goal, a human decision boundary and progressive prompts", () => {
  for (const activity of [
    "direction",
    "protocol",
    "search",
    "selection",
    "charting",
    "synthesis",
    "draft",
    "audit",
    "learning",
    "history",
  ]) {
    const guide = stageGuides[activity];
    assert.ok(guide.goal && guide.help && guide.boundary);
    assert.ok(guide.questions.length >= 2);
    assert.ok(guide.questions.every(([question, hint]) => question && hint));
    const next = recommendation(workspace(), activity);
    assert.ok(stageGuides[next.target]);
  }
});
test("recommendations respect direction approval, a frozen protocol and upstream changes", () => {
  const w = workspace();
  assert.equal(recommendation(w, "protocol").target, "direction");
  w.project.directionConfirmed = true;
  assert.equal(recommendation(w, "direction").target, "protocol");
  w.project.protocolLocked = true;
  assert.equal(recommendation(w, "protocol").target, "search");
  w.project.needsReview = true;
  assert.equal(recommendation(w, "protocol").target, "protocol");
  w.project.selectionStale = true;
  assert.equal(recommendation(w, "selection").target, "selection");
});
test("partial searches take priority over screening and never use provider totals as received records", () => {
  const w = workspace();
  w.project.records = [{ id: "r1", runId: "formal-run" }];
  w.project.runs = [
    {
      id: "formal-run",
      purpose: "formal",
      status: "partial",
      reportedTotal: 99999,
      retrievedCount: 1,
    },
  ];
  const before = structuredClone(w);
  assert.equal(recommendation(w, "search").target, "search");
  assert.match(recommendation(w, "search").text, /parsial/);
  assert.doesNotMatch(recommendation(w, "search").text, /99999/);
  assert.deepEqual(w, before);
  w.project.runs[0].status = "completed";
  assert.equal(recommendation(w, "search").target, "selection");
  assert.match(recommendation(w, "search").text, /1 record formal/);
});
test("exploratory sources do not become a recommendation to begin formal screening", () => {
  const w = workspace();
  w.project.runs = [
    { id: "explore", purpose: "exploratory", status: "completed" },
  ];
  w.project.records = [{ id: "r1", runId: "explore" }];
  assert.equal(recommendation(w, "search").target, "protocol");
  assert.match(recommendation(w, "search").text, /eksplorasi/);
  assert.equal(recommendation(w, "selection").target, "search");
});
test("local focus proposals require actual concepts and context; hints remain available without them", () => {
  const w = workspace();
  assert.match(proposalReadiness(w, "direction", "local", 4), /konsep/);
  assert.equal(proposalReadiness(w, "direction", "local", 2), null);
  w.project.direction.concept = "AI feedback";
  assert.ok(proposalReadiness(w, "direction", "local", 4));
  w.project.direction.context = "higher education";
  assert.equal(proposalReadiness(w, "direction", "local", 4), null);
});
test("empty or unverified evidence sends users back to source work instead of inventing synthesis", () => {
  const w = workspace();
  assert.equal(recommendation(w, "charting").target, "selection");
  assert.equal(recommendation(w, "synthesis").target, "charting");
  w.evidenceSummary.included = ["r1"];
  assert.equal(recommendation(w, "charting").target, "charting");
  w.evidenceSummary.confirmedRows = ["r1"];
  assert.equal(recommendation(w, "synthesis").target, "synthesis");
  assert.match(recommendation(w, "synthesis").text, /perbarui/i);
  assert.equal(recommendation(w, "draft").target, "synthesis");
});
test("a judgement belongs to this actor, stage and exact evidence dependency", () => {
  const w = workspace();
  w.project.evidence.learning = [
    {
      type: "learning_decision",
      actorId: "someone-else",
      activity: "direction",
      dependency: "current-evidence",
    },
  ];
  assert.equal(hasInitialJudgement(w, "direction"), false);
  w.project.evidence.learning[0].actorId = "owner";
  assert.equal(hasInitialJudgement(w, "direction"), true);
  assert.equal(hasInitialJudgement(w, "selection"), false);
  w.evidenceSummary.dependency = "changed-evidence";
  assert.equal(hasInitialJudgement(w, "direction"), false);
  assert.equal(needsJudgement("direction"), true);
  assert.equal(needsJudgement("draft"), true);
  assert.equal(needsJudgement("search"), false);
});
test("submitting one transfer does not unlock help when another transfer is still active", () => {
  const w = workspace();
  w.project.evidence.learning = [
    { type: "transfer_start", id: "one" },
    { type: "transfer_start", id: "two" },
    { type: "transfer_submit", id: "one" },
  ];
  assert.equal(activeTransfer(w), true);
  w.project.evidence.learning.push({ type: "transfer_cancel", id: "two" });
  assert.equal(activeTransfer(w), false);
});
