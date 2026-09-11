// O cliente administrativo permanece exclusivamente no servidor.
// O service verifica a propriedade da criança antes de chamar estas operações.
class ActivityRepository {
    constructor(db) {
        this.db = db;
        // Nome físico existente no Supabase, incluindo o acento.
        this.table = "realizações_atividades";
    }

    async findActivity(activityId) {
        const { data, error } = await this.db.from("atividades")
            .select("id").eq("id", activityId).maybeSingle();
        if (error) throw error;
        return data;
    }

    async insertCompletion(row) {
        const { data, error } = await this.db.from(this.table)
            .insert(row).select("id, crianca_id, atividade_id, created_at").single();
        if (!error) return { record: data, created: true };
        if (error.code !== "23505") throw error;

        // Um reenvio usa a PK da mesma realização; nunca faz UPDATE no histórico.
        const existing = await this.db.from(this.table)
            .select("id, crianca_id, atividade_id, created_at")
            .eq("id", row.id).maybeSingle();
        if (existing.error) throw existing.error;
        if (existing.data?.crianca_id !== row.crianca_id ||
            existing.data?.atividade_id !== row.atividade_id) {
            const conflict = new Error("Identificador de realização já utilizado.");
            conflict.status = 409;
            throw conflict;
        }
        return { record: existing.data, created: false };
    }

    async completedActivityIds(childId, activityIds) {
        const completed = new Set();
        const pageSize = 1000;
        for (let from = 0; ; from += pageSize) {
            const { data, error } = await this.db.from(this.table)
                .select("atividade_id").eq("crianca_id", childId)
                .eq("resultado->>concluida", "true").in("atividade_id", activityIds)
                .order("id").range(from, from + pageSize - 1);
            if (error) throw error;
            for (const row of data || []) completed.add(row.atividade_id);
            if (!data || data.length < pageSize || completed.size === activityIds.length) break;
        }
        return [...completed];
    }
}
module.exports = ActivityRepository;
