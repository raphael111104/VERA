import assert from "node:assert/strict";
import test from "node:test";
import { DIAGNOSIS_INDICATORS, completeDiagnosis, diagnosisFocus, diagnosisUncertain, onboardingModel } from "../src/components/onboardingDiagnosis.ts";

const allAnswers = (level) => Object.fromEntries(DIAGNOSIS_INDICATORS.map(({ id }) => [id, level]));

test("initial diagnosis requires a valid answer to every indicator", () => {
  assert.equal(completeDiagnosis({}), null);
  const answers = allAnswers("guided");
  delete answers.citation_ethics;
  assert.equal(completeDiagnosis(answers), null);
  answers.citation_ethics = "invented";
  assert.equal(completeDiagnosis(answers), null);
  answers.citation_ethics = "experienced";
  assert.deepEqual(completeDiagnosis(answers), { version: 1, answers });
});

test("uncertainty is recorded explicitly without being called low competence", () => {
  const answers = allAnswers("unsure");
  assert.ok(completeDiagnosis(answers));
  assert.equal(diagnosisFocus(answers).length, 0);
  assert.equal(diagnosisUncertain(answers).length, 8);
  answers.research_question = "guided";
  answers.article_structure = "new";
  answers.literature_search = "independent";
  assert.deepEqual(diagnosisFocus(answers).map(({ id }) => id), ["research_question", "article_structure"]);
  assert.equal(diagnosisUncertain(answers).length, 5);
});

test("chosen model survives refresh while removed models and empty catalogs reconcile", () => {
  const models = [{ id: "first" }, { id: "chosen" }];
  assert.equal(onboardingModel(models, "chosen"), "chosen");
  assert.equal(onboardingModel(models, "removed"), "first");
  assert.equal(onboardingModel([], "chosen"), null);
  assert.equal(onboardingModel(models, null), "first");
});
