const supabaseAdmin = require("../config/supabase");
const { randomUUID } = require("node:crypto");

const AVATAR_BUCKET = "child-avatars";

class ChildRepository {
  constructor() {
    this.table = "criancas";
    this.responsibleTable = "responsaveis";
  }

  async findResponsibleIdByUserId(userId) {
    if (!userId) {
      return null;
    }

    // Relaciona o ID do Supabase Auth ao responsável cadastrado na aplicação.
    const { data, error } = await supabaseAdmin
      .from(this.responsibleTable)
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return data?.id || null;
  }

  async findById(childId, responsavelId) {
    if (!childId || !responsavelId) {
      return null;
    }

    const { data, error } = await supabaseAdmin
      .from(this.table)
      .select("id, nome, avatar_path")
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
      avatarPath: data.avatar_path || null,
    };
  }

  async createAvatarUrl(path) {
    if (!path) return null;
    const { data, error } = await supabaseAdmin.storage
      .from(AVATAR_BUCKET)
      .createSignedUrl(path, 60 * 60);
    if (error) throw error;
    return data?.signedUrl || null;
  }

  async findByResponsibleId(responsavelId) {
    if (!responsavelId) {
      return [];
    }

    const { data, error } = await supabaseAdmin
      .from(this.table)
      .select("id, nome, avatar_path")
      .eq("responsavel_id", responsavelId);

    if (error) {
      throw error;
    }

    return Promise.all((data || []).map(async (child) => ({
      id: child.id,
      nome: child.nome,
      firstName: child.nome.trim().split(" ")[0],
      avatarUrl: await this.createAvatarUrl(child.avatar_path),
    })));
  }

  async updateAvatarByUserId(userId, childId, buffer, mimeType) {
    const responsavelId = await this.findResponsibleIdByUserId(userId);
    const child = responsavelId && await this.findById(childId, responsavelId);
    if (!child) return null;

    const extension = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" }[mimeType];
    const newPath = `${responsavelId}/${childId}/${randomUUID()}.${extension}`;
    const storage = supabaseAdmin.storage.from(AVATAR_BUCKET);
    const uploaded = await storage.upload(newPath, buffer, {
      contentType: mimeType,
      cacheControl: "3600",
      upsert: false,
    });
    if (uploaded.error) throw uploaded.error;

    const updated = await supabaseAdmin.from(this.table)
      .update({ avatar_path: newPath })
      .eq("id", childId)
      .eq("responsavel_id", responsavelId)
      .select("id")
      .single();

    if (updated.error) {
      await storage.remove([newPath]);
      throw updated.error;
    }
    if (child.avatarPath) await storage.remove([child.avatarPath]);
    return { id: childId, avatarUrl: await this.createAvatarUrl(newPath) };
  }

  async verifyPinByUserId(userId, pin) {
    if (!userId || !/^\d{4}$/.test(pin)) {
      return false;
    }

    // Como a coluna é bigint, Number também valida corretamente PINs como "0123".
    const numericPin = Number(pin);

    // Retorna somente o ID correspondente; o PIN armazenado não sai do Supabase.
    const { data, error } = await supabaseAdmin
      .from(this.responsibleTable)
      .select("id")
      .eq("user_id", userId)
      .eq("pin", numericPin)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return Boolean(data);
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
