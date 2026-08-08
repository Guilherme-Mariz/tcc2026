class JsonExtractor {

    extract(text) {

        if (!text || typeof text !== "string") {
            throw new Error("Resposta da IA inválida.");
        }

        // Remove blocos ```json
        const cleaned = text
            .replace(/```json/g, "")
            .replace(/```/g, "")
            .trim();

        // Procura o primeiro {
        const start = cleaned.indexOf("{");

        // Procura o último }
        const end = cleaned.lastIndexOf("}");

        if (start === -1 || end === -1) {
            throw new Error("JSON não encontrado.");
        }

        const jsonString = cleaned.substring(start, end + 1);

        return JSON.parse(jsonString);

    }

}

module.exports = new JsonExtractor();