const express = require("express");
const db = require("../config/supabase");
const children = require("../services/childRepository");
const auth = require("../middleware/authMiddleware");
const router = express.Router();
const switches = ["toggle_reduced-motion","toggle_cursor","toggle_narracao","toggle_efeitos"];
function valid(cfg) {
    if (!cfg || typeof cfg !== "object" || Array.isArray(cfg)) return false;
    return Object.entries(cfg).every(([key, value]) => {
        if (switches.includes(key)) return typeof value === "boolean";
        if (key === "speed") return ["normal","devagar","rapido"].includes(value);
        if (key === "volNarracao") return typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= 100;
        return key === "fontScale" && typeof value === "number" && value >= 0.9 && value <= 1.5;
    });
}
async function preferences(req, res) {
    res.set("Cache-Control","no-store");
    const write = req.method === "PUT";
    if (write && !valid(req.body)) return res.sendStatus(400);
    const owner = await children.findResponsibleIdByUserId(req.user.id);
    if (!owner) return res.sendStatus(403);
    const table = db.from("criancas");
    const query = write ? table.update({preferencias:req.body}) : table;
    const {data,error} = await query.select("preferencias").eq("responsavel_id",owner).eq("id",req.params.childId).maybeSingle();
    if (error) return res.sendStatus(500);
    if (!data) return res.sendStatus(403);
    return res.json(data.preferencias);
}
router.route("/children/:childId/preferencias").all(auth).get(preferences).put(preferences);
module.exports = router;
