import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Activity,
  Bus,
  Clock,
  Gauge,
  MapPin,
  RefreshCw,
  Upload,
  Workflow
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import './styles.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const vehicleTypes = ['', 'car', 'bus', 'truck', 'motorcycle', 'bicycle', 'van', 'tram', 'other'];

function App() {
  const [filters, setFilters] = useState({
    startTime: '',
    endTime: '',
    location: '',
    vehicleType: ''
  });
  const [summary, setSummary] = useState(null);
  const [timeseries, setTimeseries] = useState([]);
  const [locations, setLocations] = useState([]);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [notice, setNotice] = useState('');

  const query = useMemo(() => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    return params.toString();
  }, [filters]);

  const fetchDashboard = async () => {
    setLoading(true);
    setNotice('');

    try {
      const suffix = query ? `?${query}` : '';
      const [summaryRes, seriesRes, locationsRes, recordsRes] = await Promise.all([
        fetch(`${API_URL}/mobility/summary${suffix}`),
        fetch(`${API_URL}/mobility/timeseries${suffix}`),
        fetch(`${API_URL}/mobility/locations${suffix}`),
        fetch(`${API_URL}/mobility/records${suffix}`)
      ]);

      if (!summaryRes.ok || !seriesRes.ok || !locationsRes.ok || !recordsRes.ok) {
        throw new Error('API request failed');
      }

      setSummary(await summaryRes.json());
      setTimeseries((await seriesRes.json()).data);
      setLocations((await locationsRes.json()).data);
      setRecords((await recordsRes.json()).data);
    } catch (error) {
      setNotice('Tidak bisa memuat data. Pastikan backend berjalan di port 3000.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [query]);

  const uploadCsv = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const body = new FormData();
    body.append('file', file);
    setUploading(true);
    setNotice('');

    try {
      const response = await fetch(`${API_URL}/mobility/import`, {
        method: 'POST',
        body
      });

      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload.error?.message || payload.error || 'Import failed');
      }

      const result = await response.json();
      setNotice(`${result.imported} baris CSV berhasil diimport.`);
      await fetchDashboard();
    } catch (error) {
      setNotice(error.message);
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const locationOptions = useMemo(() => locations.map((item) => item.location), [locations]);
  const mapBounds = useMemo(() => getMapBounds(locations), [locations]);
  const vehicleChart = summary?.vehicles_by_type || [];

  return (
    <main className="app-shell">
      <section className="topbar">
        <div>
          <p className="eyebrow">Smart Mobility Analytics</p>
          <h1>Transport operations dashboard</h1>
        </div>
        <div className="top-actions">
          <label className="icon-button" title="Upload CSV">
            <Upload size={18} />
            <span>{uploading ? 'Uploading' : 'CSV'}</span>
            <input type="file" accept=".csv,text/csv" onChange={uploadCsv} disabled={uploading} />
          </label>
          <button className="icon-button" type="button" onClick={fetchDashboard} title="Refresh">
            <RefreshCw size={18} className={loading ? 'spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </section>

      <section className="filters">
        <label>
          Start
          <input type="datetime-local" value={filters.startTime} onChange={(e) => setFilters({ ...filters, startTime: e.target.value })} />
        </label>
        <label>
          End
          <input type="datetime-local" value={filters.endTime} onChange={(e) => setFilters({ ...filters, endTime: e.target.value })} />
        </label>
        <label>
          Lokasi
          <select value={filters.location} onChange={(e) => setFilters({ ...filters, location: e.target.value })}>
            <option value="">Semua lokasi</option>
            {locationOptions.map((location) => (
              <option key={location} value={location}>{location}</option>
            ))}
          </select>
        </label>
        <label>
          Kendaraan
          <select value={filters.vehicleType} onChange={(e) => setFilters({ ...filters, vehicleType: e.target.value })}>
            {vehicleTypes.map((type) => (
              <option key={type || 'all'} value={type}>{type || 'Semua tipe'}</option>
            ))}
          </select>
        </label>
      </section>

      {notice && <div className="notice">{notice}</div>}

      <section className="kpi-grid">
        <KpiCard icon={Bus} label="Jumlah kendaraan" value={formatNumber(summary?.total_vehicles)} helper={`${formatNumber(summary?.record_count)} records`} />
        <KpiCard icon={Activity} label="Congestion level" value={`${summary?.congestion_level ?? 0}%`} helper="Rata-rata jaringan" />
        <KpiCard icon={Gauge} label="Average speed" value={`${summary?.average_speed ?? 0} km/h`} helper="Kecepatan rata-rata" />
        <KpiCard icon={Clock} label="Delay" value={`${summary?.average_delay ?? 0} min`} helper="Rata-rata keterlambatan" />
      </section>

      <section className="content-grid">
        <div className="panel wide">
          <div className="panel-header">
            <h2>Traffic trend</h2>
            <Workflow size={18} />
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={timeseries.map(formatSeriesPoint)}>
              <defs>
                <linearGradient id="vehicles" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#216869" stopOpacity={0.38} />
                  <stop offset="95%" stopColor="#216869" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#d8e1de" />
              <XAxis dataKey="time" tick={{ fill: '#52615d', fontSize: 12 }} />
              <YAxis tick={{ fill: '#52615d', fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="vehicles" stroke="#216869" fill="url(#vehicles)" strokeWidth={2} />
              <Area type="monotone" dataKey="congestion" stroke="#c45131" fill="transparent" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="panel">
          <div className="panel-header">
            <h2>Vehicle mix</h2>
            <Bus size={18} />
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={vehicleChart}>
              <CartesianGrid strokeDasharray="3 3" stroke="#d8e1de" />
              <XAxis dataKey="vehicle_type" tick={{ fill: '#52615d', fontSize: 12 }} />
              <YAxis tick={{ fill: '#52615d', fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="total" fill="#e0a458" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="panel map-panel">
          <div className="panel-header">
            <h2>Mobility map</h2>
            <MapPin size={18} />
          </div>
          <div className="map-surface">
            {locations.map((item) => {
              const position = projectLocation(item, mapBounds);
              return (
                <button
                  key={item.location}
                  className="map-marker"
                  style={{ left: `${position.x}%`, top: `${position.y}%`, '--heat': item.congestion }}
                  title={`${item.location}: ${item.vehicles} vehicles, ${item.congestion}% congestion`}
                  onClick={() => setFilters({ ...filters, location: item.location })}
                >
                  <span>{item.location}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="panel table-panel">
          <div className="panel-header">
            <h2>Latest records</h2>
            <Clock size={18} />
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Location</th>
                  <th>Type</th>
                  <th>Vehicles</th>
                  <th>Speed</th>
                  <th>Delay</th>
                </tr>
              </thead>
              <tbody>
                {records.map((record) => (
                  <tr key={record.id}>
                    <td>{new Date(record.recorded_at).toLocaleString()}</td>
                    <td>{record.location}</td>
                    <td>{record.vehicle_type}</td>
                    <td>{record.vehicle_count}</td>
                    <td>{record.average_speed} km/h</td>
                    <td>{record.delay_minutes} min</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </main>
  );
}

function KpiCard({ icon: Icon, label, value, helper }) {
  return (
    <article className="kpi-card">
      <div className="kpi-icon"><Icon size={22} /></div>
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
        <span>{helper}</span>
      </div>
    </article>
  );
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString('id-ID');
}

function formatSeriesPoint(point) {
  return {
    ...point,
    time: new Date(point.bucket).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
  };
}

function getMapBounds(items) {
  const lats = items.map((item) => Number(item.latitude)).filter(Number.isFinite);
  const lons = items.map((item) => Number(item.longitude)).filter(Number.isFinite);

  return {
    minLat: Math.min(...lats, -8),
    maxLat: Math.max(...lats, -5),
    minLon: Math.min(...lons, 105),
    maxLon: Math.max(...lons, 113)
  };
}

function projectLocation(item, bounds) {
  const lat = Number(item.latitude);
  const lon = Number(item.longitude);
  const xRange = bounds.maxLon - bounds.minLon || 1;
  const yRange = bounds.maxLat - bounds.minLat || 1;

  return {
    x: clamp(((lon - bounds.minLon) / xRange) * 84 + 8, 8, 92),
    y: clamp((1 - (lat - bounds.minLat) / yRange) * 76 + 12, 12, 88)
  };
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

createRoot(document.getElementById('root')).render(<App />);
