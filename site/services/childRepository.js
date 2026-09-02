const supabase = require("../config/supabase");

class ChildRepository {
  constructor() {
    this.table = "criancas";
    this.responsibleTable = "responsaveis";
  }

  async findResponsibleIdByUserId(userId) {

    console.log("\n===== TESTE SUPABASE =====");
    console.log("userId procurado:", userId);

    const { data, error } = await supabase
        .from("responsaveis")
        .select("id, user_id, nome_completo, pin");

    console.log("TODOS OS RESPONSÁVEIS:", data);
    console.log("ERRO:", error);

    return null;
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
      firstName: data.nome.trim().split(" ")[0],
    };
  }

  async findByResponsibleId(responsavelId) {
    console.log("Buscando crianças do responsável:", responsavelId);

    if (!responsavelId) {
      return [];
    }

    const { data, error } = await supabase
      .from(this.table)
      .select("id, nome")
      .eq("responsavel_id", responsavelId);

    console.log("Resultado crianças:", data);
    console.log("Erro crianças:", error);

    if (error) {
      throw error;
    }

    return (data || []).map((child) => ({
      id: child.id,
      firstName: child.nome.trim().split(" ")[0],
    }));
  }

  async findByUserId(userId) {
    const responsavelId = await this.findResponsibleIdByUserId(userId);

    if (!responsavelId) {
      return [];
    }

    return this.findByResponsibleId(responsavelId);
  }
}

module.exports = new ChildRepository();
