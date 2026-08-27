export interface InstagramUser {
  id: string;
  username: string;
  full_name: string;
  profile_pic_url: string;
  is_verified: boolean;
  is_creator: boolean;
  is_private?: boolean;
  profile_url: string;
}

export interface InstagramAPIUser {
  pk: string | number;
  pk_id?: string;
  id?: string;
  username: string;
  full_name?: string;
  profile_pic_url?: string;
  is_verified?: boolean;
  is_private?: boolean;
  account_badges?: Array<{ type: string }>;
  [key: string]: any; // Para permitir otros campos dinámicos
}

export interface InstagramAPIResponse {
  users: InstagramAPIUser[];
  big_list: boolean;
  page_size: number;
  has_more: boolean;
  next_max_id?: string | number;
  status: string;
  [key: string]: any; // Campos adicionales
}

export interface IGSessionConfig {
  userId: string;
  username?: string;
  headers: Record<string, string>;
  lastCapturedAt: number;
}

export type ScanStatus = 'idle' | 'fetching_following' | 'fetching_followers' | 'complete' | 'error';

export interface UnfollowProgressState {
  isProcessing: boolean;
  isPaused: boolean;
  currentIndex: number;
  total: number;
  currentUsername: string;
  successCount: number;
  failedCount: number;
  logs: Array<{
    timestamp: string;
    username: string;
    user?: InstagramUser;
    status: 'success' | 'failed' | 'skipped';
    message: string;
  }>;
}

export interface ScanProgressState {
  status: ScanStatus;
  followingCount: number;
  followersCount: number;
  error: string | null;
}

