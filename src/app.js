const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const errorHandler = require('./middlewares/errorHandler');
const mobilityRoutes = require('./routes/mobilityRoutes');

dotenv.config();

const app = express();

app.use(cors({
  origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : false
}));
app.use(express.json({ limit: '2mb' }));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'smart-mobility-api' });
});

app.use('/api/mobility', mobilityRoutes);

app.use(errorHandler);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
