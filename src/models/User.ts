import mongoose from 'mongoose';

const matchStatSchema = new mongoose.Schema({
  matchId: { type: String, required: true },
  rank: { type: Number, required: true, min: 1, max: 10 },
  isGameMVP: { type: Boolean, default: false },
  isTeamMVP: { type: Boolean, default: false },
  date: { type: Date, default: Date.now },
  points: { type: Number, required: true } // 매치별 획득 포인트
});

const agentStatSchema = new mongoose.Schema({
  agentName: { type: String, required: true },
  playCount: { type: Number, default: 0 },
  kills: { type: Number, default: 0 },
  deaths: { type: Number, default: 0 },
  assists: { type: Number, default: 0 },
  wins: { type: Number, default: 0 },
  losses: { type: Number, default: 0 },
  matchStats: [matchStatSchema],
  leaguePoint: { type: Number, default: 0 } // 총 리그 포인트
});

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  nickname: { type: String, required: true, unique: true },
  valorantNickname: { type: String, required: true },
  password: { type: String, required: true },
  preferredPosition: { type: String, required: true },
  role: { type: String, enum: ['USER', 'ADMIN'], default: 'USER' },
  agentStats: [agentStatSchema],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// 매치 통계 저장 전에 포인트 계산
matchStatSchema.pre('save', function(next) {
  let points = 0;
  
  // 등수에 따른 기본 포인트
  switch(this.rank) {
    case 1: points = 10; break;
    case 2: points = 9; break;
    case 3: points = 8; break;
    case 4: points = 7; break;
    case 5: points = 6; break;
    default: points = 5; // 6-10등
  }
  
  // MVP 보너스 포인트
  if (this.isGameMVP) points += 2;
  if (this.isTeamMVP) points += 1;
  
  this.points = points;
  next();
});

// 매치 통계가 추가될 때마다 총 리그 포인트 업데이트
agentStatSchema.pre('save', function(next) {
  if (this.isModified('matchStats')) {
    const totalPoints = this.matchStats.reduce((sum, match) => sum + match.points, 0);
    const parentDoc = this.$parent();
    if (parentDoc) {
      (parentDoc as mongoose.Document & { leaguePoint: number }).leaguePoint = totalPoints;
    }
  }
  next();
});

export default mongoose.models.User || mongoose.model('User', userSchema); 