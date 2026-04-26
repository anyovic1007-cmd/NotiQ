const connections = new Map();

const connect = (userId, res) => {
  const key = userId || "global";
  const list = connections.get(key) || [];

  list.push(res);
  connections.set(key, list);

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();
  res.write("event: ready\n");
  res.write(`data: ${JSON.stringify({ userId: key })}\n\n`);

  reqCleanup(res, key);
};

const reqCleanup = (res, key) => {
  const cleanup = () => {
    const list = connections.get(key) || [];
    const next = list.filter((item) => item !== res);

    if (next.length === 0) {
      connections.delete(key);
    } else {
      connections.set(key, next);
    }
  };

  res.on("close", cleanup);
  res.on("finish", cleanup);
};

const push = (userId, payload) => {
  const list = connections.get(userId) || [];

  for (const res of list) {
    res.write(`data: ${JSON.stringify(payload)}\n\n`);
  }
};

const connectionCount = (userId) => (connections.get(userId) || []).length;

const totalConnections = () =>
  Array.from(connections.values()).reduce((sum, list) => sum + list.length, 0);

module.exports = {
  connect,
  push,
  connectionCount,
  totalConnections
};
