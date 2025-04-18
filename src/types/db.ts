export interface User {
  _id?: string;
  username: string;
  password: string;
  nickname: string;
  isAdmin: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Tier {
  _id?: string;
  tier: string;
  color: string;
  agents: string[];
  updatedAt: Date;
}

export interface TierList {
  _id?: string;
  tiers: Tier[];
  updatedAt: Date;
} 