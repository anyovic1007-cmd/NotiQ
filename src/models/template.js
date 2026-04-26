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

const findBySlug = async (slug) => {
  if (!useSupabase) {
    return state.templates.find((item) => item.slug === slug) || null;
  }

  const response = await supabase
    .from("notification_templates")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  return ensureSuccess(response, "Unable to fetch template");
};

const create = async (data) => {
  if (!useSupabase) {
    const record = {
      id: createId("tpl"),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...data
    };

    state.templates.unshift(record);
    return record;
  }

  const response = await supabase
    .from("notification_templates")
    .insert(data)
    .select()
    .single();

  return ensureSuccess(response, "Unable to create template");
};

const list = async () => {
  if (!useSupabase) {
    return [...state.templates];
  }

  const response = await supabase
    .from("notification_templates")
    .select("*")
    .order("created_at", { ascending: false });

  return ensureSuccess(response, "Unable to list templates");
};

const update = async (id, patch) => {
  if (!useSupabase) {
    const template = state.templates.find((item) => item.id === id);

    if (!template) {
      return null;
    }

    Object.assign(template, patch, { updated_at: new Date().toISOString() });
    return template;
  }

  const response = await supabase
    .from("notification_templates")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .maybeSingle();

  return ensureSuccess(response, "Unable to update template");
};

module.exports = {
  findBySlug,
  create,
  list,
  update
};
