export type RelationType =
  | 'extends'
  | 'supports'
  | 'contrasts'
  | 'restates'
  | 'requires'
  | 'exemplifies';

export interface ScriptureDef {
  full_name: string;
  author: string;
  language: string;
  locator_fields: string[];
}

export interface VerseTranslation {
  en?: string | null;
  mr?: string | null;
}

export interface Verse {
  id: string;
  scripture: string;
  locator: Record<string, number | string>;
  display_ref: string;
  text: string;
  transliteration?: string | null;
  translation?: VerseTranslation;
  theme_tags: string[];
  notes?: string | null;
}

export interface Edge {
  from: string;
  to: string;
  relation: RelationType;
  why: string;
}

export interface Chain {
  id: string;
  title: string;
  sequence: string[];
}

export interface NodePosition {
  x: number;
  y: number;
  fx?: number | null;
  fy?: number | null;
}

export interface ScriptureDatabase {
  schema_version: string;
  relation_vocabulary: RelationType[];
  scriptures: Record<string, ScriptureDef>;
  verses: Verse[];
  edges: Edge[];
  chains: Chain[];
  review_notes?: string[];
  node_positions?: Record<string, NodePosition>;
}

export interface ProposeBatchRequest {
  raw_verses_text?: string;
  scripture?: string;
  locator_hint?: string;
  existing_database?: ScriptureDatabase;
}

export interface ProposeBatchResponse {
  verses: Verse[];
  edges: Edge[];
  chains?: Chain[];
  review_notes?: string[];
}
