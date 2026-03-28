export interface Badge {
  id: string;
  icon: string;
  label: string;
  color?: string;
  isCustom?: boolean;
  customImageBase64?: string;
  description?: string;
}

export interface ViewMedal {
  id: string;
  label: string;
  threshold: number;
  svg: string; // SVG string for medal icon
}

export interface SocialLink {
  platform: string;
  url: string;
  color?: string;
}

export interface MusicTrack {
  title: string;
  artist: string;
  coverUrl: string;
  audioBase64?: string;
  audioUrl?: string;
}

export interface DiscordData {
  id: string;
  username: string;
  discriminator: string;
  avatar: string;
  bio?: string;
  tag?: string;
}

export interface UserProfile {
  uid: string;
  username: string;
  displayName?: string;
  avatarBase64?: string;
  bannerBase64?: string;
  bio: string;
  location?: string;
  badges: Badge[];
  socialLinks: SocialLink[];
  music?: MusicTrack;
  discordData?: DiscordData;
  views: number;
  createdAt: number;
  backgroundType: 'color' | 'gradient' | 'video';
  backgroundColor?: string;
  backgroundGradient?: string;
  backgroundVideoUrl?: string;
  textColor?: string;
  accentColor?: string;
  blurEffect?: boolean;
  glassEffect?: boolean;
  socialIconColor?: string;
  cardAnimation?: 'fade' | 'slide' | 'scale' | 'none';
  showViews?: boolean;
  showUid?: boolean;
  numericUid?: string;
  // Anti-cheat views
  viewSessions?: string[];
  lastViewAt?: number;
  topKey?: boolean; // special TOP badge
}

export interface InviteCode {
  code: string;
  createdBy: string;
  usedBy?: string;
  usedAt?: number;
  createdAt: number;
  isUsed: boolean;
  isTopKey?: boolean;
}
