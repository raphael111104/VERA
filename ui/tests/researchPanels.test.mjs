import assert from "node:assert/strict";
import test from "node:test";
import { closeResearchPanel, researchPanelGroup } from "../src/researchPanels.ts";

test("research tabs belong to four separate workspace sections", () => {
  const tabs=["files","notes","evidence","output","chart","assistence","browser:https://example.org","browser:start"];
  assert.deepEqual(tabs.filter(tab=>researchPanelGroup(tab)==="files"),["files","notes","evidence"]);
  assert.deepEqual(tabs.filter(tab=>researchPanelGroup(tab)==="output"),["output","chart"]);
  assert.deepEqual(tabs.filter(tab=>researchPanelGroup(tab)==="assistence"),["assistence"]);
  assert.deepEqual(tabs.filter(tab=>researchPanelGroup(tab)==="browser"),["browser:https://example.org","browser:start"]);
});
test("closing an active tab selects a sibling in its own section", () => {
  const tabs=["files","output","notes","browser:start","evidence"];
  assert.deepEqual(closeResearchPanel(tabs,"evidence","evidence"),{tabs:tabs.slice(0,-1),panel:"notes"});
  assert.equal(closeResearchPanel(tabs,"files","files").panel,"notes");
  assert.equal(closeResearchPanel(tabs,"browser:start","browser:start").panel,null);
});
test("closing another section never changes the active tab or removes unrelated tabs", () => {
  assert.deepEqual(closeResearchPanel(["output","files","browser:start"],"output","files"),{tabs:["output","browser:start"],panel:"output"});
});
