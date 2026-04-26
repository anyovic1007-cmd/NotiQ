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

const create = async (data) => {
  if (!useSupabase) {
    const record = {
      id: createId("run"),
      current_step: 0,
      status: "running",
      created_at: new Date().toISOString(),
      completed_at: null,
      ...data
    };

    state.workflowRuns.unshift(record);
    return record;
  }

  const response = await supabase
    .from("workflow_runs")
    .insert(data)
    .select()
    .single();

  return ensureSuccess(response, "Unable to create workflow run");
};

const findById = async (id) => {
  if (!useSupabase) {
    return state.workflowRuns.find((item) => item.id === id) || null;
  }

  const response = await supabase
    .from("workflow_runs")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  return ensureSuccess(response, "Unable to fetch workflow run");
};

const updateStep = async (id, step, status) => {
  const patch = {
    current_step: step,
    status
  };

  if (status === "completed" || status === "failed") {
    patch.completed_at = new Date().toISOString();
  }

  if (!useSupabase) {
    const run = state.workflowRuns.find((item) => item.id === id);

    if (!run) {
      return null;
    }

    Object.assign(run, patch);
    return run;
  }

  const response = await supabase
    .from("workflow_runs")
    .update(patch)
    .eq("id", id)
    .select()
    .maybeSingle();

  return ensureSuccess(response, "Unable to update workflow run");
};

module.exports = {
  create,
  findById,
  updateStep
};
