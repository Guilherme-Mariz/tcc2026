const test = require("node:test");
const assert = require("node:assert/strict");
const express = require("express");
const recovery = require("../routes/passwordRecovery");

test("altera a senha somente após validar o código de recuperação do e-mail", async t => {
    const email = "familia@example.com";
    let updates = 0;
    const auth = {
        resetPasswordForEmail: async address => { assert.equal(address, email); return {}; },
        verifyOtp: async args => {
            assert.equal(args.type, "recovery");
            assert.equal(args.email, email);
            return { data: { session: args.token === "123456" ? {} : null } };
        },
        updateUser: async ({password}) => { assert.equal(password, "nova-senha"); updates++; return {}; }
    };
    const app = express().use(express.json(), recovery(() => ({ auth })));
    const server = app.listen(0, "127.0.0.1");
    await new Promise(resolve => server.once("listening", resolve));
    t.after(() => server.close());
    const post = (path, body) => fetch("http://127.0.0.1:" + server.address().port + path, {
        method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify({ email, ...body })
    });
    assert.equal((await post("/codigo", {})).status, 200);
    assert.equal((await post("/confirmar", {codigo:"999999", senha:"nova-senha"})).status, 400);
    assert.equal(updates, 0);
    assert.equal((await post("/confirmar", {codigo:"123456", senha:"nova-senha"})).status, 200);
    assert.equal(updates, 1);
});
