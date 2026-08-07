function extract(text) {

    if (!text || typeof text !== "string") {
        throw new Error("Resposta da IA inválida.");
    }

    // Remove ```json e ```
    let cleaned = text
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

    // Procura o primeiro {
    const start = cleaned.indexOf("{");

    // Procura o último }
    const end = cleaned.lastIndexOf("}");

    if (start === -1 || end === -1) {
        throw new Error("Nenhum JSON encontrado na resposta da IA.");
    }

    cleaned = cleaned.substring(start, end + 1);

    return JSON.parse(cleaned);

}

module.exports = {
    extract
};