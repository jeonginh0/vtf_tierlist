import mongoose from 'mongoose';

const tierListSchema = new mongoose.Schema({
  tiers: [{
    tier: String,
    color: String,
    agents: [String]
  }],
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.models.TierList || mongoose.model('TierList', tierListSchema); 