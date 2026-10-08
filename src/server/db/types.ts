// PLACEHOLDER: hand-authored to match supabase/migrations/0001_init.sql.
// Replace it by running: npm run db:types
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      ai_usage: {
        Row: {
          created_at: string;
          error_code: string | null;
          id: string;
          input_tokens: number;
          job: string;
          latency_ms: number;
          model: string;
          ok: boolean;
          output_tokens: number;
          project_id: string | null;
          provider: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          error_code?: string | null;
          id?: string;
          input_tokens?: number;
          job: string;
          latency_ms?: number;
          model: string;
          ok: boolean;
          output_tokens?: number;
          project_id?: string | null;
          provider: string;
          user_id?: string;
        };
        Update: {
          created_at?: string;
          error_code?: string | null;
          id?: string;
          input_tokens?: number;
          job?: string;
          latency_ms?: number;
          model?: string;
          ok?: boolean;
          output_tokens?: number;
          project_id?: string | null;
          provider?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'ai_usage_project_id_fkey';
            columns: ['project_id'];
            isOneToOne: false;
            referencedRelation: 'projects';
            referencedColumns: ['id'];
          },
        ];
      };
      brain_events: {
        Row: {
          actor: string;
          created_at: string;
          id: string;
          kind: string;
          payload: Json;
          project_id: string;
          revision: number;
          summary: string;
        };
        Insert: {
          actor: string;
          created_at?: string;
          id?: string;
          kind: string;
          payload?: Json;
          project_id: string;
          revision: number;
          summary?: string;
        };
        Update: {
          actor?: string;
          created_at?: string;
          id?: string;
          kind?: string;
          payload?: Json;
          project_id?: string;
          revision?: number;
          summary?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'brain_events_project_id_fkey';
            columns: ['project_id'];
            isOneToOne: false;
            referencedRelation: 'projects';
            referencedColumns: ['id'];
          },
        ];
      };
      exports: {
        Row: {
          brain_revision: number;
          content_md: string;
          created_at: string;
          id: string;
          kind: string;
          project_id: string;
          variant: string | null;
        };
        Insert: {
          brain_revision: number;
          content_md: string;
          created_at?: string;
          id?: string;
          kind: string;
          project_id: string;
          variant?: string | null;
        };
        Update: {
          brain_revision?: number;
          content_md?: string;
          created_at?: string;
          id?: string;
          kind?: string;
          project_id?: string;
          variant?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'exports_project_id_fkey';
            columns: ['project_id'];
            isOneToOne: false;
            referencedRelation: 'projects';
            referencedColumns: ['id'];
          },
        ];
      };
      insights: {
        Row: {
          allow_other: boolean;
          blocking: boolean;
          category: string;
          created_at: string;
          detail: string;
          id: string;
          kind: string;
          message_id: string | null;
          multi: boolean;
          options: Json;
          project_id: string;
          related_keys: string[];
          resolution: Json | null;
          resolved_at: string | null;
          status: string;
          title: string;
        };
        Insert: {
          allow_other?: boolean;
          blocking?: boolean;
          category: string;
          created_at?: string;
          detail?: string;
          id?: string;
          kind: string;
          message_id?: string | null;
          multi?: boolean;
          options?: Json;
          project_id: string;
          related_keys?: string[];
          resolution?: Json | null;
          resolved_at?: string | null;
          status?: string;
          title: string;
        };
        Update: {
          allow_other?: boolean;
          blocking?: boolean;
          category?: string;
          created_at?: string;
          detail?: string;
          id?: string;
          kind?: string;
          message_id?: string | null;
          multi?: boolean;
          options?: Json;
          project_id?: string;
          related_keys?: string[];
          resolution?: Json | null;
          resolved_at?: string | null;
          status?: string;
          title?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'insights_message_id_fkey';
            columns: ['message_id'];
            isOneToOne: false;
            referencedRelation: 'messages';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'insights_project_id_fkey';
            columns: ['project_id'];
            isOneToOne: false;
            referencedRelation: 'projects';
            referencedColumns: ['id'];
          },
        ];
      };
      messages: {
        Row: {
          content: string;
          created_at: string;
          id: string;
          project_id: string;
          role: string;
          structured: Json | null;
        };
        Insert: {
          content: string;
          created_at?: string;
          id?: string;
          project_id: string;
          role: string;
          structured?: Json | null;
        };
        Update: {
          content?: string;
          created_at?: string;
          id?: string;
          project_id?: string;
          role?: string;
          structured?: Json | null;
        };
        Relationships: [
          {
            foreignKeyName: 'messages_project_id_fkey';
            columns: ['project_id'];
            isOneToOne: false;
            referencedRelation: 'projects';
            referencedColumns: ['id'];
          },
        ];
      };
      projects: {
        Row: {
          brain: Json;
          brain_revision: number;
          counts: Json;
          created_at: string;
          id: string;
          idea_text: string;
          language: string;
          name: string;
          owner_id: string;
          readiness_score: number;
          updated_at: string;
        };
        Insert: {
          brain?: Json;
          brain_revision?: number;
          counts?: Json;
          created_at?: string;
          id?: string;
          idea_text: string;
          language?: string;
          name: string;
          owner_id?: string;
          readiness_score?: number;
          updated_at?: string;
        };
        Update: {
          brain?: Json;
          brain_revision?: number;
          counts?: Json;
          created_at?: string;
          id?: string;
          idea_text?: string;
          language?: string;
          name?: string;
          owner_id?: string;
          readiness_score?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      proposals: {
        Row: {
          created_at: string;
          decided_at: string | null;
          id: string;
          message_id: string | null;
          ops: Json;
          project_id: string;
          status: string;
        };
        Insert: {
          created_at?: string;
          decided_at?: string | null;
          id?: string;
          message_id?: string | null;
          ops: Json;
          project_id: string;
          status?: string;
        };
        Update: {
          created_at?: string;
          decided_at?: string | null;
          id?: string;
          message_id?: string | null;
          ops?: Json;
          project_id?: string;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'proposals_message_id_fkey';
            columns: ['message_id'];
            isOneToOne: false;
            referencedRelation: 'messages';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'proposals_project_id_fkey';
            columns: ['project_id'];
            isOneToOne: false;
            referencedRelation: 'projects';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      commit_brain: {
        Args: {
          p_assistant_message?: Json;
          p_brain: Json;
          p_counts: Json;
          p_decide_proposal?: Json;
          p_event: Json;
          p_expected_revision: number;
          p_new_insights?: Json;
          p_new_proposal?: Json;
          p_project_id: string;
          p_readiness: number;
          p_resolve_insight_ids?: string[];
        };
        Returns: number;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DefaultSchema = Database['public'];

export type Tables<T extends keyof DefaultSchema['Tables']> = DefaultSchema['Tables'][T]['Row'];
export type TablesInsert<T extends keyof DefaultSchema['Tables']> =
  DefaultSchema['Tables'][T]['Insert'];
export type TablesUpdate<T extends keyof DefaultSchema['Tables']> =
  DefaultSchema['Tables'][T]['Update'];
export type Enums<T extends keyof DefaultSchema['Enums']> = DefaultSchema['Enums'][T];
export type CompositeTypes<T extends keyof DefaultSchema['CompositeTypes']> =
  DefaultSchema['CompositeTypes'][T];

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
