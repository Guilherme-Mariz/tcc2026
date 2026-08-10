const supabase = require("../config/supabase");

class ChildRepository {

    constructor() {
        this.table = "criancas";
    }

    async findById(childId, responsavelId) {

        if (!childId || !responsavelId) {
            return null;
        }

        const { data, error } = await supabase
            .from(this.table)
            .select("id, nome")
            .eq("id", childId)
            .eq("responsavel_id", responsavelId)
            .single();

        if (error) {

            // Criança não encontrada ou não pertence
            // ao responsável informado.
            if (error.code === "PGRST116") {
                return null;
            }

            throw error;
        }

        if (!data) {
            return null;
        }

        return {
            id: data.id,
            firstName: data.nome.trim().split(" ")[0]
        };
    }
}

module.exports = new ChildRepository();