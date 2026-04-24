const mongoose = require("mongoose");

const DeletedArtworkSchema = new mongoose.Schema({
  filename: { type: String },
  title: { type: String },
  artist: { type: String },
  price: { type: String },
  collection: { type: String },
  dateUploaded: { type: Date },
  imageUrl: { type: String },
  downloads: { type: Number },
  deletedAt: { type: Date, default: Date.now }, 
});

module.exports = mongoose.models.DeletedArtwork || mongoose.model("DeletedArtwork", DeletedArtworkSchema);