export interface User {
  username: string;
  password: string;
  nickname: string;
}

export interface AuthState {
  isLoggedIn: boolean;
  currentUser: string | null;
  currentNickname: string | null;
} 