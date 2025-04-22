import { Schema, model, models } from 'mongoose';

const agentStatSchema = new Schema({
  agentName: {
    type: String,
    required: true,
  },
  playCount: {
    type: Number,
    default: 0,
  },
  wins: {
    type: Number,
    default: 0,
  },
  losses: {
    type: Number,
    default: 0,
  },
  kills: {
    type: Number,
    default: 0,
  },
  deaths: {
    type: Number,
    default: 0,
  },
  assists: {
    type: Number,
    default: 0,
  },
}, { _id: false });

const userSchema = new Schema({
  email: {
    type: String,
    required: [true, '이메일은 필수입니다.'],
    unique: true,
  },
  nickname: {
    type: String,
    required: [true, '닉네임은 필수입니다.'],
    unique: true,
  },
  valorantNickname: {
    type: String,
    required: [true, '발로란트 닉네임은 필수입니다.'],
    unique: true,
  },
  password: {
    type: String,
    required: [true, '비밀번호는 필수입니다.'],
  },
  preferredPosition: {
    type: String,
    required: [true, '선호 포지션은 필수입니다.'],
    enum: ['타격대', '척후대', '감시자', '전략가'],
  },
  tier: {
    type: String,
    default: '언랭크',
  },
  role: {
    type: String,
    default: 'USER',
    enum: ['USER', 'ADMIN'],
  },
  agentStats: [agentStatSchema],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// timestamps 옵션 추가
userSchema.set('timestamps', true);

export default models.User || model('User', userSchema); 