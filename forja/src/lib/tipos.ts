export type EstadoEstacion = 'active' | 'no_sticker' | 'retired';

export type Estacion = {
  station_id: string;
  gym_id: string;
  gym_name: string;
  gym_branch: string | null;
  label: string;
  zone: string | null;
  station_name: string;
  status: EstadoEstacion;
  exercise_id: string | null;
  exercise_name: string | null;
  muscle_group: string | null;
  video_url: string | null;
  video_source: 'tiktok' | 'instagram' | 'youtube' | 'own' | null;
  cues: string[];
  common_mistakes: string[];
  is_member: boolean;
};

export type Sesion = {
  session_date: string;
  top_weight: number;
  set_count: number;
  top_reps: number;
  feeling: number | null;
};

export type Meta = {
  id: string;
  exercise_id: string;
  target_weight_kg: number;
  target_date: string;
  start_weight_kg: number | null;
  status: 'active' | 'achieved' | 'expired' | 'cancelled';
};

export type ResumenEjercicio = {
  last: Sesion | null;
  previous: Sesion | null;
  record: number | null;
  first_date: string | null;
  session_count: number;
  sessions: Sesion[];
  goal: Meta | null;
};

export type Panel = {
  members_active: number;
  members_declared: number | null;
  stations_total: number;
  stations_with_code: number;
  sets_7d: number;
  sets_prev_7d: number;
  active_users_7d: number;
  top_stations: { label: string; name: string; sets: number }[];
  alerts: { stations_without_code: number; stations_quiet: number };
};

export type EstacionPanel = {
  id: string;
  label: string;
  name: string;
  zone: string | null;
  nfc_code: string | null;
  status: EstadoEstacion;
  last_scan_at: string | null;
  sets_7d: number;
  video_url: string | null;
  video_source: 'tiktok' | 'instagram' | 'youtube' | 'own' | null;
};
