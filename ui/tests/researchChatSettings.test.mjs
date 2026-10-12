import assert from "node:assert/strict";
import test from "node:test";
import { researchChatError, researchChatSettings } from "../src/researchChatSettings.ts";

test("Assistence sends model changes with standard speed, full access and agentic mode", () => {
  const harness = { id: "codex", options: { permissionModes: [{ id: "ask" }, { id: "full-access" }] } };
  const first = researchChatSettings(harness, "first-model", "max");
  const next = researchChatSettings(harness, "next-model", null);
  assert.deepEqual(first, { model: "first-model", reasoningLevel: "max", serviceTier: "default", permissionMode: "full-access", planMode: false });
  assert.deepEqual(next, { ...first, model: "next-model", reasoningLevel: "default" });
});

test("side chat distinguishes a readable answer, provider failure and empty completion", () => {
  const message = parts => ({id:"test",role:"assistant",createdAt:1,completedAt:2,parts});
  assert.equal(researchChatError(message([{id:"text",type:"text",text:"Jawaban penelitian"}])),null);
  assert.equal(researchChatError(message([{id:"failure",type:"tool",tool:"error",state:{error:"Model unavailable"}}])),"Model unavailable");
  assert.match(researchChatError(message([{id:"thinking",type:"reasoning",text:"Thinking"}])),/tanpa jawaban/);
});

test("full access uses the selected provider's vocabulary and never invents unsupported options", () => {
  const claude = { id: "claude", options: { permissionModes: [{ id: "auto" }, { id: "bypassPermissions" }] } };
  assert.equal(researchChatSettings(claude, "model", null).permissionMode, "bypassPermissions");
  assert.equal(researchChatSettings(claude, "model", null).serviceTier, undefined);
  assert.equal(researchChatSettings({ id: "other", options: { permissionModes: [] } }, null, null).permissionMode, undefined);
});
