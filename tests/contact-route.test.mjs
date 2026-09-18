import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import assert from "node:assert/strict";
import test from "node:test";
import ts from "typescript";

const compiled = ts.transpileModule(readFileSync(new URL("../src/app/api/contact/route.ts", import.meta.url), "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
}).outputText;

function setup({ configured = true, rejected = false } = {}) {
  const sent = [];
  const exports = {};
  runInNewContext(compiled, {
    exports, Request, Response, Buffer, URL,
    process: { env: configured ? { GMAIL_USER: "owner@gmail.com", GMAIL_APP_PASSWORD: "test-only" } : {} },
    require: (name) => name === "nodemailer" ? { createTransport: () => ({
      sendMail: async (mail) => { if (rejected) throw new Error("SMTP failure"); sent.push(mail); return { accepted: ["owner@gmail.com"] }; },
      close() {},
    }) } : { personal: { email: "owner@gmail.com" } },
  });
  const submit = (data = {}, origin = "http://localhost:3000") => exports.POST(new Request("http://localhost:3000/api/contact", {
    method: "POST", headers: { "Content-Type": "application/json", origin },
    body: JSON.stringify({ name: "Test Visitor", email: "visitor@example.com", subject: "Project inquiry", message: "A sample contact message.", ...data }),
  }));
  return { submit, sent };
}

test("sends only to the owner and uses visitor as reply-to", async () => {
  const { submit, sent } = setup();
  assert.equal((await submit({ to: "attacker@example.com" })).status, 200);
  assert.equal(sent[0].to, "owner@gmail.com");
  assert.equal(sent[0].replyTo.address, "visitor@example.com");
  assert.equal(sent[0].from.address, "owner@gmail.com");
  assert.match(sent[0].text, /A sample contact message/);
});

test("rejects invalid fields, header injection, honeypot, and cross-origin submissions", async () => {
  const { submit, sent } = setup();
  for (const fields of [{ email: "invalid" }, { subject: "Hello\r\nBcc: bad@example.com" }, { message: "short" }, { website: "spam" }]) {
    assert.equal((await submit(fields)).status, 400);
  }
  assert.equal((await submit({}, "https://other.example")).status, 403);
  assert.equal((await submit({ message: "x".repeat(25000) })).status, 413);
  assert.equal(sent.length, 0);
});

test("does not report success without credentials or after SMTP failure", async () => {
  assert.equal((await setup({ configured: false }).submit()).status, 503);
  assert.equal((await setup({ rejected: true }).submit()).status, 502);
});

test("limits repeated submissions", async () => {
  const { submit, sent } = setup();
  for (let i = 0; i < 3; i++) assert.equal((await submit()).status, 200);
  assert.equal((await submit()).status, 429);
  assert.equal(sent.length, 3);
});
