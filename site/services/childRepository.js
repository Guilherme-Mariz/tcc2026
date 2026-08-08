const supabase = require("../config/supabase");

class ChildRepository {

    constructor() {
        this.table = "criancas";
    }

    async findById(childId) {

        const { data, error } = await supabase
            .from(this.table)
            .select("id, nome")
            .eq("id", childId)
            .single();

        if (error) {
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