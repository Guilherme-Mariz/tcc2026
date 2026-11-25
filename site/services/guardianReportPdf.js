const fs = require("node:fs/promises");
const path = require("node:path");
const { PDFDocument, StandardFonts, PageSizes, rgb } = require("pdf-lib");

const catalog = require("../data/activities.json");
const moduleNames = ["", "Emoções", "Comunicação", "Situações Sociais", "Rotina", "Refúgio"];

function reportText(value) {
    if (typeof value !== "string") return "";
    return value.trim().replace(/(m[oó]dulo\s+)(?:de\s+)?["“']?calma\b["”']?/giu, "$1Refúgio");
}

const margin = 48;
const green = rgb(0.12, 0.36, 0.28);
const ink = rgb(0.13, 0.18, 0.16);
const date = new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo" });

async function guardianReportPdf(childName, report, conversation) {
    const pdf = await PDFDocument.create();
    pdf.setTitle("Relatório de acompanhamento | Teko");
    const regular = await pdf.embedFont(StandardFonts.Helvetica);
    const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
    const supported = new Set(regular.getCharacterSet());
    const logo = await pdf.embedPng(await fs.readFile(path.join(__dirname, "../data/report-logo.png")));
    let page, y;
    function newPage() {
        page = pdf.addPage(PageSizes.A4);
        const top = page.getHeight() - margin;
        const size = logo.scaleToFit(78, 40);
        page.drawImage(logo, { x: margin, y: top - size.height, ...size });
        page.drawText("Relatório de acompanhamento", { x: margin + 94, y: top - 23, size: 19, font: bold, color: green });
        page.drawLine({ start: { x: margin, y: top - 52 }, end: { x: page.getWidth() - margin, y: top - 52 }, thickness: 1, color: green });
        page.drawText("Página " + pdf.getPageCount(), { x: margin, y: 27, size: 9, font: regular, color: green });
        y = top - 84;
    }
    function paragraph(value, size = 11, font = regular) {
        const clean = Array.from(String(value).normalize("NFC").replace(/\s+/gu, " "),
            char => supported.has(char.codePointAt(0)) ? char : " ").join("");
        const width = page.getWidth() - 2 * margin;
        let line = "";
        function flush() {
            if (y < 58) newPage();
            page.drawText(line, { x: margin, y, size, font, color: font === bold ? green : ink });
            y -= size + 6;
            line = "";
        }
        for (const word of clean.trim().split(/\s+/u)) {
            const next = line ? line + " " + word : word;
            if (font.widthOfTextAtSize(next, size) <= width) { line = next; continue; }
            if (line) flush();
            for (const char of word) {
                if (font.widthOfTextAtSize(line + char, size) > width) flush();
                line += char;
            }
        }
        if (line) flush();
    }
    function section(title) {
        y -= 15;
        if (y < 100) newPage();
        paragraph(title, 15, bold);
    }
    newPage();
    paragraph(childName, 16, bold);
    paragraph("Emitido em " + date.format(new Date()));
    section("Atividades concluídas");
    paragraph("Total de realizações: " + report.totalRealizations);
    if (!report.activities.length) paragraph("Ainda não há atividades concluídas.");
    for (const item of report.activities) {
        y -= 6;
        if (y < 96) newPage();
        const game = catalog.find(entry => entry.id === item.activityId);
        const moduleName = moduleNames[game?.modulo_id];
        paragraph((moduleName ? moduleName + " • " : "") + item.title + " (" + item.count + "×)", 12, bold);
        const dates = [item.firstCompletedAt, item.lastCompletedAt].filter(Boolean).map(timestamp => date.format(new Date(timestamp)));
        if (dates.length) paragraph("Período registrado: " + [...new Set(dates)].join(" a "));
    }
    section("Conversas com o Teko");
    const summary = reportText(conversation?.summary);
    const history = reportText(conversation?.history);
    if (summary) paragraph(summary);
    if (history && history !== summary) {
        paragraph("Contexto das conversas", 12, bold);
        paragraph(history);
    }
    if (!summary && !history) paragraph("Ainda não há uma síntese de conversa registrada.");
    const interests = Array.isArray(conversation?.child_interests)
        ? conversation.child_interests.map(item => reportText(item?.name)).filter(Boolean) : [];
    if (interests.length) paragraph("Interesses mencionados: " + interests.join(", ") + ".");
    const suggested = catalog.find(game => game.id === conversation?.last_activity?.id);
    if (suggested) paragraph("Última atividade sugerida: " + suggested.titulo + " (módulo " + moduleNames[suggested.modulo_id] + ").");
    return Buffer.from(await pdf.save());
}

module.exports = guardianReportPdf;
