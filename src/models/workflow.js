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
    return state.workflows.find((item) => item.slug === slug) || null;
  }

  const response = await supabase
    .from("notification_workflows")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  return ensureSuccess(response, "Unable to fetch workflow");
};

const create = async (data) => {
  if (!useSupabase) {
    const record = {
      id: createId("wf"),
      created_at: new Date().toISOString(),
      ...data
    };

    state.workflows.unshift(record);
    return record;
  }

  const response = await supabase
    .from("notification_workflows")
    .insert(data)
    .select()
    .single();

  return ensureSuccess(response, "Unable to create workflow");
};

const list = async () => {
  if (!useSupabase) {
    return [...state.workflows];
  }

  const response = await supabase
    .from("notification_workflows")
    .select("*")
    .order("created_at", { ascending: false });

  return ensureSuccess(response, "Unable to list workflows");
};

module.exports = {
  findBySlug,
  create,
  list
};
