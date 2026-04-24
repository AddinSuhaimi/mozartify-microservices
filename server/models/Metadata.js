const mongoose = require('mongoose');

const MetadataSchema = new mongoose.Schema({
  title: { type: String, required: true },
  artist: { type: String, required: true },
  composer: { type: String, required: true },
  instrumentation: { type: String, required: true },
  genre: { type: String, required: true },
  copyright: { type: String },
  key: { type: String },
  lyricsProvided: { type: Boolean },
  historicalContext: { type: String },
  description: { type: String },
  filePath: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.models.Metadata || mongoose.model('Metadata', MetadataSchema);