const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const script = fs.readFileSync(require.resolve("../view/js/preferencias.js"), "utf8");

test("uma nova página aplica o tema antes da rede e isola o cache por criança", async () => {
    const cache = new Map();
    const classes = new Map();
    let child = "a";
    let calls = 0;
    const sandbox = {
        window: { addEventListener() {}, dispatchEvent() {} }, Event,
        localStorage: { getItem: () => JSON.stringify({ crianca: { id: child } }) },
        sessionStorage: { getItem: k => cache.get(k), setItem: (k,v) => cache.set(k,v) },
        document: { documentElement: { style: {}, classList: { toggle: (k,v) => classes.set(k,v) } } },
        fetch: async () => { calls++; return { ok: true, json: async () => ({ darkMode: child === "a" }) }; }
    };
    const open = () => vm.runInNewContext(script, {...sandbox});
    open();
    await new Promise(resolve => setImmediate(resolve));
    open();
    assert.equal(classes.get("tema-escuro"), true);
    assert.equal(calls, 1);
    child = "b";
    open();
    assert.equal(classes.get("tema-escuro"), false);
    assert.equal(calls, 2);
});
