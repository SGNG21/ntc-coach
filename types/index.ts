export type CCP = 'ccp1' | 'ccp2' | 'transversal';

export type ModuleId =
  | 'veille' | 'pac' | 'prospection' | 'perf'
  | 'image' | 'proposition' | 'nego' | 'bilan' | 'relation'
  | 'transversal' | 'digital' | 'rse' | 'juridique';

export type ChatMode = 'expliquer' | 'quiz' | 'scenario' | 'criteres';

export type ExoMode = 'qcm' | 'redaction' | 'situation' | 'grille';

export type CCFMode = 'prosp_tel' | 'nego_face' | 'entretien_tech';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface Score {
  correct: number;
  total: number;
  byModule: Record<string, { correct: number; total: number }>;
}

export interface SessionData {
  id?: string;
  messages: Message[];
  score: Score;
  module: ModuleId;
  created_at?: string;
}

export interface ModuleConfig {
  label: string;
  ccp: string;
  desc: string;
  criteres: string[];
  savoirs: string[];
  qps: string[];
}

export interface CustomFicheSection {
  title: string;
  def?: string | null;
  body?: string;
}

export interface CustomMindNode {
  title: string;
  children: { t: string; subs: string[] }[];
}

export interface CustomQuizItem {
  q: string;
  opts: string[];
  ok: number;
  fb: string;
}

export interface CustomSeance {
  id: string;
  name: string;
  color: string;
  fiche: CustomFicheSection[];
  mind: CustomMindNode[];
  quiz: CustomQuizItem[];
  createdAt: string;
}
