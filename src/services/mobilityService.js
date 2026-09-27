const { parse } = require('csv-parse');
const pool = require('../config/db');

const allowedVehicleTypes = new Set(['car', 'bus', 'truck', 'motorcycle', 'bicycle', 'van', 'tram', 'other']);

const buildFilterClause = (filters = {}, startIndex = 1) => {
  const clauses = [];
  const values = [];
  let index = startIndex;

  if (filters.startTime) {
    clauses.push(`recorded_at >= $${index++}`);
    values.push(filters.startTime);
  }

  if (filters.endTime) {
    clauses.push(`recorded_at <= $${index++}`);
    values.push(filters.endTime);
  }

  if (filters.location) {
    clauses.push(`location = $${index++}`);
    values.push(filters.location);
  }

  if (filters.vehicleType) {
    clauses.push(`vehicle_type = $${index++}`);
    values.push(filters.vehicleType);
  }

  return {
    where: clauses.length ? `WHERE ${clauses.join(' AND ')}` : '',
    values
  };
};

const toNumber = (value, fallback = null) => {
  if (value === undefined || value === null || value === '') return fallback;
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

const normalizeRow = (row, rowNumber) => {
  const vehicleType = String(row.vehicle_type || row.vehicleType || 'other').trim().toLowerCase();
  const normalizedType = allowedVehicleTypes.has(vehicleType) ? vehicleType : 'other';
  const recordedAt = row.recorded_at || row.timestamp || row.time;
  const location = String(row.location || row.area || '').trim();

  if (!recordedAt || !location) {
    throw new Error(`CSV row ${rowNumber} must include recorded_at and location.`);
  }

  return {
    recordedAt,
    location,
    vehicleType: normalizedType,
    vehicleCount: toNumber(row.vehicle_count || row.count, 0),
    averageSpeed: toNumber(row.average_speed || row.avg_speed || row.speed, 0),
    delayMinutes: toNumber(row.delay_minutes || row.delay || row.delay_min, 0),
    congestionLevel: toNumber(row.congestion_level || row.congestion, 0),
    latitude: toNumber(row.latitude || row.lat),
    longitude: toNumber(row.longitude || row.lon || row.lng)
  };
};

const getRecords = async (filters, limit) => {
  const filter = buildFilterClause(filters);
  const result = await pool.query(
    `
      SELECT id, recorded_at, location, vehicle_type, vehicle_count, average_speed,
             delay_minutes, congestion_level, latitude, longitude
      FROM traffic_records
      ${filter.where}
      ORDER BY recorded_at DESC
      LIMIT $${filter.values.length + 1}
    `,
    [...filter.values, limit]
  );

  return result.rows;
};

const getSummary = async (filters) => {
  const filter = buildFilterClause(filters);
  const result = await pool.query(
    `
      SELECT
        COALESCE(SUM(vehicle_count), 0)::int AS total_vehicles,
        COALESCE(ROUND(AVG(congestion_level)::numeric, 2), 0)::float AS congestion_level,
        COALESCE(ROUND(AVG(average_speed)::numeric, 2), 0)::float AS average_speed,
        COALESCE(ROUND(AVG(delay_minutes)::numeric, 2), 0)::float AS average_delay,
        COUNT(*)::int AS record_count
      FROM traffic_records
      ${filter.where}
    `,
    filter.values
  );

  const byVehicle = await pool.query(
    `
      SELECT vehicle_type, COALESCE(SUM(vehicle_count), 0)::int AS total
      FROM traffic_records
      ${filter.where}
      GROUP BY vehicle_type
      ORDER BY total DESC
    `,
    filter.values
  );

  return {
    ...result.rows[0],
    vehicles_by_type: byVehicle.rows
  };
};

const getTimeseries = async (filters) => {
  const filter = buildFilterClause(filters);
  const result = await pool.query(
    `
      SELECT
        date_trunc('hour', recorded_at) AS bucket,
        COALESCE(SUM(vehicle_count), 0)::int AS vehicles,
        COALESCE(ROUND(AVG(congestion_level)::numeric, 2), 0)::float AS congestion,
        COALESCE(ROUND(AVG(average_speed)::numeric, 2), 0)::float AS speed
      FROM traffic_records
      ${filter.where}
      GROUP BY bucket
      ORDER BY bucket ASC
    `,
    filter.values
  );

  return result.rows;
};

const getLocations = async (filters) => {
  const filter = buildFilterClause(filters);
  const result = await pool.query(`
    SELECT
      location,
      COALESCE(AVG(latitude), 0)::float AS latitude,
      COALESCE(AVG(longitude), 0)::float AS longitude,
      COALESCE(SUM(vehicle_count), 0)::int AS vehicles,
      COALESCE(ROUND(AVG(congestion_level)::numeric, 2), 0)::float AS congestion
    FROM traffic_records
    ${filter.where}
    GROUP BY location
    ORDER BY vehicles DESC
  `, filter.values);

  return result.rows;
};

const importCsv = async (csvText) => {
  const parser = parse(csvText, {
    columns: true,
    skip_empty_lines: true,
    trim: true
  });

  const rows = [];
  for await (const row of parser) {
    rows.push(row);
  }

  if (!rows.length) {
    return { imported: 0 };
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    for (const [index, row] of rows.entries()) {
      const record = normalizeRow(row, index + 2);
      await client.query(
        `
          INSERT INTO traffic_records (
            recorded_at, location, vehicle_type, vehicle_count, average_speed,
            delay_minutes, congestion_level, latitude, longitude
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `,
        [
          record.recordedAt,
          record.location,
          record.vehicleType,
          record.vehicleCount,
          record.averageSpeed,
          record.delayMinutes,
          record.congestionLevel,
          record.latitude,
          record.longitude
        ]
      );
    }

    await client.query('COMMIT');
    return { imported: rows.length };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

module.exports = {
  getRecords,
  getSummary,
  getTimeseries,
  getLocations,
  importCsv
};
