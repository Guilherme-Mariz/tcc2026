const supabase = require("../config/supabase");

class ChildRepository {

    constructor() {
        this.table = "criancas";
        this.responsibleTable = "responsaveis";
    }

    async findResponsibleIdByUserId(userId) {

        if (!userId) {
            return null;
        }

        const { data, error } = await supabase
            .from(this.responsibleTable)
            .select("id")
            .eq("user_id", userId)
            .single();

        if (error) {

            if (error.code === "PGRST116") {
                return null;
            }

            throw error;
        }

        return data?.id || null;
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

    async findByResponsibleId(responsavelId) {

        if (!responsavelId) {
            return [];
        }

        const { data, error } = await supabase
            .from(this.table)
            .select("id, nome")
            .eq("responsavel_id", responsavelId);

        if (error) {
            throw error;
        }

        return (data || []).map(child => ({
            id: child.id,
            firstName: child.nome.trim().split(" ")[0]
        }));
    }

    async findByUserId(userId) {

        const responsavelId =
            await this.findResponsibleIdByUserId(userId);

        if (!responsavelId) {
            return [];
        }

        return this.findByResponsibleId(responsavelId);
    }
}

module.exports = new ChildRepository();