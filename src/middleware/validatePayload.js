const validatePayload = (requiredFields) => (req, res, next) => {
  const missingFields = requiredFields.filter((field) => {
    const value = req.body[field];
    return value === undefined || value === null || value === "";
  });

  if (missingFields.length > 0) {
    return res.status(400).json({
      success: false,
      data: null,
      error: `Missing required field(s): ${missingFields.join(", ")}`
    });
  }

  return next();
};

module.exports = validatePayload;
