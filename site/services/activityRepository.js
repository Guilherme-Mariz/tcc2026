const { summarizeFacts } = require('./progressSummary');
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

    async history(childId, offset = 0, limit = 50, cursor = null) {
        let query = this.db.from(this.table)
            .select('id, atividade_id, resultado, created_at')
            .eq('crianca_id', childId).order('created_at', { ascending: false })
            .order('id', { ascending: false });
        if (cursor) {
            query = query.or(`created_at.lt.${cursor.date},and(created_at.eq.${cursor.date},id.lt.${cursor.id})`);
        }
        const { data, error } = await query.range(offset, offset + limit - 1);
        if (error) throw error;
        return data || [];
    }

    async progress(childId) {
        // Uma única consulta/snapshot no Postgres agrega todo o histórico, sem
        // transferir cada realização ou depender do limite de mil linhas da API.
        const { data, error } = await this.db.rpc('teko_progress_facts', { p_child_id: childId });
        if (error) throw error;
        if (!data || !Array.isArray(data.activities) || !Array.isArray(data.days)) {
            throw new Error('Resumo de progresso indisponível.');
        }
        return summarizeFacts(data);
    }
}
module.exports = ActivityRepository;
