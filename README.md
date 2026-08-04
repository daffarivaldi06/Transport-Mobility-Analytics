# Smart Mobility Analytics Dashboard

An interactive traffic and transport analytics dashboard designed to monitor, analyze, and visualize real-time or historical traffic data. This project features a React frontend dashboard connected to a Node.js Express backend API, backed by a PostgreSQL database.

This project is built to showcase full-stack development skills with clean code, interactive visual charts, and geospatial analytics.

---

##  Tech Stack

- **Frontend:** React, Vite, CSS, Recharts (Charts & Trends), Lucide Icons
- **Backend:** Node.js, Express, pg (PostgreSQL Client), csv-parse (CSV Processing)
- **Database:** PostgreSQL
- **DevOps:** Docker, Docker Compose

---

##  Features

- **Interactive KPI Cards:** Instantly view total vehicle counts, average speeds, average delays, and congestion levels.
- **Traffic Trend Charts:** Beautiful line and bar visualizations of traffic trends over time.
- **Vehicle Composition:** Visual breakdowns of vehicle types (cars, motorcycles, buses, trucks).
- **Location Mapping:** Interactive geographic visualization of sensor locations with traffic levels.
- **CSV Data Importer:** Upload raw CSV datasets directly into the PostgreSQL database.
- **Dynamic Filters:** Easily filter analytics by date range, specific location, and vehicle type.

---

##  How to Run Locally

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) and [PostgreSQL](https://www.postgresql.org/) installed.

### 1. Setup Backend & Database

1. Clone this repository:
   ```bash
   git clone <your-repo-url>
   cd mobility-api
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Setup environment variables:
   Create a `.env` file in the root directory and configure your PostgreSQL database credentials:
   ```env
   PORT=3000
   PG_HOST=localhost
   PG_PORT=5432
   PG_DATABASE=mobility
   PG_USER=your_postgres_username
   PG_PASSWORD=your_postgres_password
   ```

4. Initialize the database and seed sample data:
   ```bash
   npm run init-db
   ```

5. Start the backend dev server:
   ```bash
   npm run dev
   ```
   *The API will run at: http://localhost:3000/api*

### 2. Setup Frontend

1. Navigate to the client directory:
   ```bash
   cd client
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the frontend dev server:
   ```bash
   npm run dev
   ```
   *The dashboard will run at: http://localhost:5173/*

---

##  CSV Data Format

You can upload custom traffic logs in CSV format through the dashboard. Supported columns:
- `recorded_at` (aliases: `timestamp`, `time`)
- `location` (alias: `area`)
- `vehicle_type` (alias: `vehicleType`)
- `vehicle_count` (alias: `count`)
- `average_speed` (aliases: `avg_speed`, `speed`)
- `delay_minutes` (aliases: `delay`, `delay_min`)
- `congestion_level` (alias: `congestion`)
- `latitude` / `longitude` (aliases: `lat`, `lon`, `lng`)

An example template is available at `sample-data/traffic-sample.csv`.
