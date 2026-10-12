import assert from "node:assert/strict";
import test from "node:test";
import { researchBrowserUrl, researchMetadataText } from "../src/researchBrowser.ts";

test("source browser accepts complete web URLs and keeps DOI paths", () => {
  assert.equal(researchBrowserUrl(" https://doi.org/10.1234/article "), "https://doi.org/10.1234/article");
  assert.equal(researchBrowserUrl("http://example.org"), "http://example.org/");
});

test("publisher metadata renders JATS and nested entities as readable plain text", () => {
  assert.equal(researchMetadataText("<jats:p>Claims &amp; evidence</jats:p><jats:p>Revisions</jats:p>"), "Claims & evidence Revisions");
  assert.equal(researchMetadataText("Writing Analytics&amp;#x3a; Process"), "Writing Analytics: Process");
  assert.equal(researchMetadataText("&lt;em&gt;Evidence&lt;/em&gt; &#128218;"), "Evidence 📚");
  assert.equal(researchMetadataText("&#99999999; &#0;"), "&#99999999; &#0;");
});

test("source browser rejects executable, local-file, relative and credential URLs", () => {
  for (const url of ["javascript:alert(1)", "data:text/html,example", "file:///C:/private.txt", "/api/settings", "not a URL", "https://user:secret@example.org"]) {
    assert.equal(researchBrowserUrl(url), null, url);
  }
});
