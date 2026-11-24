const test = require("node:test");
const assert = require("node:assert/strict");
const express = require("express");
const cookieParser = require("cookie-parser");
const { createClient } = require("@supabase/supabase-js");

// Exercita a cadeia real do cliente PostgREST e os filtros presentes no HTTP.
test("preferências exigem sessão e vínculo, validam os valores e restauram o padrão por criança", async t => {
    const dados = new Map([["a", {}], ["b", {}]]);
    const db = createClient("https://example.test", "test-key", {
        global: { fetch: async (input, options) => {
            const url = new URL(input);
            if (url.pathname.endsWith("/responsaveis")) {
                assert.equal(url.searchParams.get("user_id"), "eq.user");
                return Response.json([{ id: "owner" }]);
            }
            assert.equal(url.pathname, "/rest/v1/criancas");
            assert.equal(url.searchParams.get("responsavel_id"), "eq.owner");
            const id = url.searchParams.get("id").slice(3);
            if (!dados.has(id)) return Response.json([]);
            if (options.method === "PATCH") dados.set(id, JSON.parse(options.body).preferencias);
            const row = { preferencias: dados.get(id) };
            return Response.json(options.method === "PATCH" ? row : [row]);
        } }
    });
    db.auth.getUser = async () => ({ data: { user: { id: "user" } } });
    const path = require.resolve("../config/supabase");
    require.cache[path] = { id: path, filename: path, loaded: true, exports: db };
    const app = express().use(express.json(), cookieParser(), require("../routes/preferencias"));
    const server = app.listen(0, "127.0.0.1");
    await new Promise(resolve => server.once("listening", resolve));
    t.after(() => new Promise(resolve => server.close(resolve)));
    const endpoint = (id, value, auth = true) => fetch(
        'http://127.0.0.1:' + server.address().port + '/children/' + id + '/preferencias',
        { method: value === undefined ? "GET" : "PUT",
          headers: { "content-type": "application/json", cookie: auth ? "token=test" : "" },
          body: JSON.stringify(value) }
    );
    assert.equal((await endpoint("a", undefined, false)).status, 401);
    assert.equal((await endpoint("outro", { darkMode: true })).status, 403);
    const cfg = { darkMode: true, volNarracao: 0, speed: "devagar", fontScale: 1.4 };
    assert.deepEqual(await (await endpoint("a", cfg)).json(), cfg);
    assert.deepEqual(await (await endpoint("a")).json(), cfg);
    assert.deepEqual(await (await endpoint("b")).json(), {});
    for (const bad of [{ darkMode: "sim" }, { volNarracao: 101 }, { speed: "xyz" }]) {
        assert.equal((await endpoint("a", bad)).status, 400);
    }
    assert.deepEqual(await (await endpoint("a", {})).json(), {});
});
