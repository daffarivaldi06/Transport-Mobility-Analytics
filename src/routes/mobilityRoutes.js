const express = require('express');
const multer = require('multer');
const mobilityController = require('../controllers/mobilityController');

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 8 * 1024 * 1024
  }
});

router.get('/records', mobilityController.getRecords);
router.get('/summary', mobilityController.getSummary);
router.get('/timeseries', mobilityController.getTimeseries);
router.get('/locations', mobilityController.getLocations);
router.post('/import', upload.single('file'), mobilityController.importCsv);

module.exports = router;
