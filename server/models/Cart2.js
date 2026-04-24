const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const Cart2Schema = new Schema({
  user_id: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  artwork_ids: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Artwork'
    }
  ]
});


module.exports = mongoose.models.Cart2 || mongoose.model('Cart2', Cart2Schema, 'carts2');
