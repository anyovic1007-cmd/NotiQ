const digestModel = require("../models/digest");
const digestService = require("../services/digestService");

const upsertConfig = async (req, res, next) => {
  try {
    const config = await digestModel.upsertConfig(req.body);
    res.status(200).json({ success: true, data: config, error: null });
  } catch (error) {
    next(error);
  }
};

const ingest = async (req, res, next) => {
  try {
    const event = await digestService.ingest(req.body.key, req.body.userId, req.body.payload);
    res.status(202).json({ success: true, data: event, error: null });
  } catch (error) {
    next(error);
  }
};

const getEvents = async (req, res, next) => {
  try {
    const events = await digestModel.getEvents(req.params.key, req.params.userId);
    res.status(200).json({ success: true, data: events, error: null });
  } catch (error) {
    next(error);
  }
};

const listConfigs = async (_req, res, next) => {
  try {
    const configs = await digestModel.listConfigs();
    res.status(200).json({ success: true, data: configs, error: null });
  } catch (error) {
    next(error);
  }
};

const flush = async (req, res, next) => {
  try {
    const result = await digestService.flushDigest(req.body.key, req.body.userId);
    res.status(200).json({ success: true, data: result, error: null });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  upsertConfig,
  ingest,
  getEvents,
  listConfigs,
  flush
};
