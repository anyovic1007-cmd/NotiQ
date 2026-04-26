const { createClient } = require("@supabase/supabase-js");

const { state, createId } = require("../lib/store");

const useSupabase = Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_KEY);
const supabase = useSupabase
  ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY)
  : null;

const ensureSuccess = (response, fallbackMessage) => {
  if (response.error) {
    throw new Error(response.error.message || fallbackMessage);
  }

  return response.data;
};

const getConfig = async (key, userId) => {
  if (!useSupabase) {
    return state.digestConfigs.find((item) => item.key === key && item.user_id === userId) || null;
  }

  const response = await supabase
    .from("digest_configs")
    .select("*")
    .eq("key", key)
    .eq("user_id", userId)
    .maybeSingle();

  return ensureSuccess(response, "Unable to fetch digest config");
};

const upsertConfig = async ({ key, userId, windowMs, templateSlug }) => {
  const payload = {
    key,
    user_id: userId,
    window_ms: windowMs,
    template_slug: templateSlug
  };

  if (!useSupabase) {
    const existing = state.digestConfigs.find((item) => item.key === key && item.user_id === userId);

    if (existing) {
      Object.assign(existing, payload);
      return existing;
    }

    const record = {
      id: createId("digest"),
      ...payload
    };

    state.digestConfigs.unshift(record);
    return record;
  }

  const response = await supabase
    .from("digest_configs")
    .upsert(payload, { onConflict: "key,user_id" })
    .select()
    .single();

  return ensureSuccess(response, "Unable to upsert digest config");
};

const addEvent = async (key, userId, payload) => {
  if (!useSupabase) {
    const record = {
      id: createId("digest-event"),
      digest_key: key,
      user_id: userId,
      payload,
      created_at: new Date().toISOString()
    };

    state.digestEvents.unshift(record);
    return record;
  }

  const response = await supabase
    .from("digest_events")
    .insert({
      digest_key: key,
      user_id: userId,
      payload
    })
    .select()
    .single();

  return ensureSuccess(response, "Unable to add digest event");
};

const getEvents = async (key, userId) => {
  if (!useSupabase) {
    return state.digestEvents
      .filter((item) => item.digest_key === key && item.user_id === userId)
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  }

  const response = await supabase
    .from("digest_events")
    .select("*")
    .eq("digest_key", key)
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  return ensureSuccess(response, "Unable to fetch digest events");
};

const clearEvents = async (key, userId) => {
  if (!useSupabase) {
    state.digestEvents = state.digestEvents.filter(
      (item) => !(item.digest_key === key && item.user_id === userId)
    );
    return [];
  }

  const response = await supabase
    .from("digest_events")
    .delete()
    .eq("digest_key", key)
    .eq("user_id", userId);

  return ensureSuccess(response, "Unable to clear digest events");
};

const listConfigs = async () => {
  if (!useSupabase) {
    return [...state.digestConfigs];
  }

  const response = await supabase
    .from("digest_configs")
    .select("*")
    .order("user_id", { ascending: true });

  return ensureSuccess(response, "Unable to list digest configs");
};

module.exports = {
  getConfig,
  upsertConfig,
  addEvent,
  getEvents,
  clearEvents,
  listConfigs
};
