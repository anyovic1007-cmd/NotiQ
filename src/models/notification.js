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

const insertNotification = async (notification) => {
  if (!useSupabase) {
    const record = {
      id: createId("notif"),
      created_at: new Date().toISOString(),
      read_at: null,
      ...notification
    };

    state.notifications.unshift(record);
    return record;
  }

  const response = await supabase
    .from("notifications")
    .insert(notification)
    .select()
    .single();

  return ensureSuccess(response, "Unable to insert notification");
};

const getByUserId = async (userId) => {
  if (!useSupabase) {
    return state.notifications.filter((notification) => notification.user_id === userId);
  }

  const response = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  return ensureSuccess(response, "Unable to fetch notifications");
};

const getById = async (id) => {
  if (!useSupabase) {
    return state.notifications.find((item) => item.id === id) || null;
  }

  const response = await supabase
    .from("notifications")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  return ensureSuccess(response, "Unable to fetch notification");
};

const listNotifications = async (filters = {}) => {
  if (!useSupabase) {
    let rows = [...state.notifications];

    if (filters.type) {
      rows = rows.filter((item) => item.type === filters.type);
    }

    if (filters.status) {
      rows = rows.filter((item) => item.status === filters.status);
    }

    if (filters.userId) {
      rows = rows.filter((item) => item.user_id === filters.userId);
    }

    const page = Number(filters.page) > 0 ? Number(filters.page) : 1;
    const pageSize = Number(filters.pageSize) > 0 ? Number(filters.pageSize) : 25;
    const offset = (page - 1) * pageSize;

    return {
      items: rows.slice(offset, offset + pageSize),
      total: rows.length,
      page,
      pageSize
    };
  }

  const page = Number(filters.page) > 0 ? Number(filters.page) : 1;
  const pageSize = Number(filters.pageSize) > 0 ? Number(filters.pageSize) : 25;
  let query = supabase
    .from("notifications")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range((page - 1) * pageSize, (page * pageSize) - 1);

  if (filters.type) {
    query = query.eq("type", filters.type);
  }

  if (filters.status) {
    query = query.eq("status", filters.status);
  }

  if (filters.userId) {
    query = query.eq("user_id", filters.userId);
  }

  const response = await query;
  const items = ensureSuccess(response, "Unable to list notifications");

  return {
    items,
    total: response.count || items.length,
    page,
    pageSize
  };
};

const markAsRead = async (id) => {
  if (!useSupabase) {
    const notification = state.notifications.find((item) => item.id === id);

    if (!notification) {
      return null;
    }

    notification.status = "read";
    notification.read_at = new Date().toISOString();
    return notification;
  }

  const response = await supabase
    .from("notifications")
    .update({
      status: "read",
      read_at: new Date().toISOString()
    })
    .eq("id", id)
    .select()
    .maybeSingle();

  return ensureSuccess(response, "Unable to mark notification as read");
};

const updateNotificationStatus = async (id, status, retries = 0) => {
  if (!useSupabase) {
    const notification = state.notifications.find((item) => item.id === id);

    if (!notification) {
      return null;
    }

    notification.status = status;
    notification.retries = retries;

    if (status === "read") {
      notification.read_at = new Date().toISOString();
    }

    return notification;
  }

  const update = {
    status,
    retries
  };

  if (status === "read") {
    update.read_at = new Date().toISOString();
  }

  const response = await supabase
    .from("notifications")
    .update(update)
    .eq("id", id)
    .select()
    .maybeSingle();

  return ensureSuccess(response, "Unable to update notification status");
};

const insertWebhookEvent = async ({ source, payload }) => {
  if (!useSupabase) {
    const record = {
      id: createId("event"),
      source,
      payload,
      processed_at: new Date().toISOString()
    };

    state.webhookEvents.unshift(record);
    return record;
  }

  const response = await supabase
    .from("webhook_events")
    .insert({
      source,
      payload,
      processed_at: new Date().toISOString()
    })
    .select()
    .single();

  return ensureSuccess(response, "Unable to persist webhook event");
};

const getStats = async () => {
  if (!useSupabase) {
    const total = state.notifications.length;
    const counts = state.notifications.reduce((acc, item) => {
      acc[item.status] = (acc[item.status] || 0) + 1;
      return acc;
    }, {});

    return {
      total,
      pending: counts.pending || 0,
      failed: counts.failed || 0,
      sent: counts.sent || 0
    };
  }

  const response = await supabase.from("notifications").select("status");
  const rows = ensureSuccess(response, "Unable to fetch notification stats");
  const counts = rows.reduce((acc, item) => {
    acc[item.status] = (acc[item.status] || 0) + 1;
    return acc;
  }, {});

  return {
    total: rows.length,
    pending: counts.pending || 0,
    failed: counts.failed || 0,
    sent: counts.sent || 0
  };
};

module.exports = {
  insertNotification,
  getByUserId,
  getById,
  listNotifications,
  markAsRead,
  updateNotificationStatus,
  insertWebhookEvent,
  getStats
};
