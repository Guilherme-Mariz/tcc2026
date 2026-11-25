const test = require("node:test");
const assert = require("node:assert/strict");
const { PDFDocument } = require("pdf-lib");
const ActivityService = require("../services/activityService");
const makePdf = require("../services/guardianReportPdf");
const childId = "10000000-0000-4000-8000-000000000001";

test("relatório consulta a síntese apenas após validar vínculo e PIN", async () => {
    const reads = [];
    const service = new ActivityService({
        children: {
            findResponsibleIdByUserId: async user => user,
            findById: async (id, user) => user === "familia" && { firstName: "João" },
            verifyPinByUserId: async (user, pin) => pin === "0123"
        },
        repository: {
            report: async () => ({ activities: [], totalRealizations: 0 }),
            conversationSummary: async id => { reads.push(id); return ""; }
        }
    });
    await assert.rejects(service.guardianReport("outra", childId, "0123"), { status: 403 });
    await assert.rejects(service.guardianReport("familia", childId, "0000"), { status: 403 });
    assert.equal(reads.length, 0);
    const result = await PDFDocument.load(await service.guardianReport("familia", childId, "0123"));
    assert.deepEqual(reads, [childId]);
    assert.equal(result.getPageCount(), 1);
});

test("PDF pagina atividades extensas e aceita acentos e emojis na síntese", async () => {
    const activities = Array.from({ length: 48 }, (_, i) => ({
        title: "Emoções e escolhas " + i, count: 2, firstCompletedAt: "2026-01-15T15:00:00Z"
    }));
    const bytes = await makePdf("José", { activities, totalRealizations: 96 }, { summary: "Conversou sobre gratidão 🌻.", history: "Mencionou o módulo calma." });
    assert.ok((await PDFDocument.load(bytes)).getPageCount() > 1);
});
