export interface Badge {
  id: string;
  name: string;
  emoji: string;
  description: string;
  isAdmin?: boolean;
  imageUrl?: string;
  requiredViews?: number;
  isCustom?: boolean;
  createdBy?: string;
}

export interface SocialLink {
  platform: string;
  url: string;
  icon: string;
  color: string;
}

export interface MusicTrack {
  title: string;
  artist: string;
  url: string;
  coverUrl: string;
}

export interface UserProfile {
  uid: string;
  username: string;
  displayName: string;
  bio: string;
  avatarUrl: string;
  bannerUrl: string;
  accentColor: string;
  socialLinks: SocialLink[];
  badges: string[];
  music?: MusicTrack;
  discordId?: string;
  discordUsername?: string;
  discordAvatar?: string;
  discordTag?: string;
  discordBio?: string;
  location?: string;
  views: number;
  numericUid: string;
  showUid: boolean;
  showViews: boolean;
  animation: string;
  font: string;
  createdAt: number;
  isAdmin?: boolean;
}

export interface InviteCode {
  code: string;
  used: boolean;
  createdBy: string;
  createdAt: number;
  usedBy?: string;
  usedAt?: number;
  // для входящих инвайтов (волна раздачи)
  receivedBy?: string; // uid получателя
  isWave?: boolean;
}
