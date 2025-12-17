
export type Page = 'explore' | 'create' | 'profile' | 'ranking' | 'map' | 'my-games' | 'community' | 'arenas' | 'match-chat' | 'notifications' | 'wallet' | 'invite' | 'settings' | 'support' | 'hire';

export interface Profile {
  id: string;
  name: string;
  email?: string;
  photoUrl: string;
  dateOfBirth: string | null;
  city: string | null;
  state: string | null;
  sport: string[] | null;
  position: string[] | null;
  bio: string | null;
  points: number;
  matchesPlayed: number;
  reputation: 'Iniciante' | 'Intermediário' | 'Craque';
  bannerUrl?: string | null;
  favoriteTeam?: string | null;
  favoriteTeamLogoUrl?: string | null;
  matchCoins: number;
  referred_by?: string | null;
  signup_bonus_claimed?: boolean;
}

export interface Match {
  id: number;
  name: string;
  sport: string;
  location: string;
  lat: number | null;
  lng: number | null;
  date: Date;
  slots: number;
  filled_slots: number;
  rules: string;
  created_by: string;
  status: 'Convocando' | 'Confirmado' | 'Cancelado' | 'Finalizada';
  cancellation_reason: string | null;
  is_boosted?: boolean;
  boost_until?: string;
  is_private?: boolean;
  invite_code?: string | null;
  match_participants?: MatchParticipant[];
}

export interface MatchMessage {
  id: string;
  match_id: number;
  sender_id: string;
  message: string;
  sent_at: string;
  profiles?: {
    name: string;
    photo_url: string;
  };
}

export interface Notification {
  id: number;
  user_id: string;
  type: string;
  title: string;
  body: string;
  data: any;
  is_read: boolean;
  created_at: string;
}

export interface Arena {
  id: string;
  name: string;
  city: string;
  state: string;
  neighborhood: string;
  address: string;
  location_link?: string;
  sports: string[];
  price_info?: string;
  phone?: string;
  whatsapp?: string;
  is_partner: boolean;
  banner_url?: string;
  created_at?: string;
  lat?: number;
  lng?: number;
}

export interface Ranking {
  rank: number;
  user: Pick<Profile, 'name' | 'photoUrl' | 'id'>;
  points: number;
  stats?: {
    created: number;
    played: number;
  };
}

export interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  sources?: GroundingSource[];
}

export interface GroundingSource {
  uri: string;
  title: string;
  description?: string;
}

export interface Feature {
  icon: string;
  title: string;
  description: string;
}

export interface VenueLocation {
  name: string;
  address: string;
  lat: number;
  lng: number;
  uri?: string;
}

export interface DraftMatchData {
  name?: string;
  sport?: string;
  location?: string;
  date?: string;
  time?: string;
  slots?: number;
  rules?: string;
}

export interface Post {
  id: string;
  user_id: string;
  content: string;
  image_url?: string;
  likes_count: number;
  comments_count: number;
  created_at: string;
  user_has_liked?: boolean;
  profiles?: {
    name: string;
    photo_url: string;
  };
}

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  profiles?: {
    name: string;
    photo_url: string;
  };
}

export type NewUserRegistrationData = Omit<Profile, 'id' | 'points' | 'matchesPlayed' | 'reputation' | 'matchCoins'> & { password?: string };

export type ParticipantStatus = 'confirmed' | 'pending' | 'waitlist' | 'declined';

export interface MatchParticipant {
  match_id: number;
  user_id: string;
  joined_at: string;
  status: ParticipantStatus;
  waitlist_position?: number;
  profiles: Pick<Profile, 'name' | 'photoUrl' | 'reputation'>;
}

export interface Team {
  id: number;
  created_by: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  invite_code: string;
  created_at: string;
}

export interface TeamMember {
  id: number;
  team_id: number;
  user_id: string;
  status: 'pending' | 'approved' | 'rejected';
  role: 'admin' | 'member';
  joined_at: string;
  profiles?: Pick<Profile, 'name' | 'photoUrl' | 'reputation'>;
  team?: Team;
}
