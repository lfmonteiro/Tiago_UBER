const mongoose = require('mongoose');

const pushSubscriptionSchema = new mongoose.Schema({
  motorista: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Motorista',
    required: true
  },
  subscription: {
    type: Object,
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('PushSubscription', pushSubscriptionSchema);
