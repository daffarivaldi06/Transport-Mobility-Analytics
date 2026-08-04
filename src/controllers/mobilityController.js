const mobilityService = require('../services/mobilityService');

const filtersFromQuery = (query) => ({
  startTime: query.startTime,
  endTime: query.endTime,
  location: query.location,
  vehicleType: query.vehicleType
});

const getRecords = async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit || '100', 10), 500);
    const records = await mobilityService.getRecords(filtersFromQuery(req.query), limit);
    res.json({ data: records });
  } catch (err) {
    next(err);
  }
};

const getSummary = async (req, res, next) => {
  try {
    const summary = await mobilityService.getSummary(filtersFromQuery(req.query));
    res.json(summary);
  } catch (err) {
    next(err);
  }
};

const getTimeseries = async (req, res, next) => {
  try {
    const points = await mobilityService.getTimeseries(filtersFromQuery(req.query));
    res.json({ data: points });
  } catch (err) {
    next(err);
  }
};

const getLocations = async (req, res, next) => {
  try {
    const locations = await mobilityService.getLocations(filtersFromQuery(req.query));
    res.json({ data: locations });
  } catch (err) {
    next(err);
  }
};

const importCsv = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'CSV file is required in form field "file".' });
    }

    const result = await mobilityService.importCsv(req.file.buffer.toString('utf8'));
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getRecords,
  getSummary,
  getTimeseries,
  getLocations,
  importCsv
};
