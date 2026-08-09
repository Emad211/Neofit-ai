export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      ai_request_audit: {
        Row: {
          attempt_count: number
          completed_at: string | null
          created_at: string
          failure_code: string | null
          fallback_from: string | null
          id: string
          input_chars: number
          input_tokens: number | null
          model_id: string | null
          output_chars: number | null
          output_tokens: number | null
          provider: string | null
          request_kind: string
          router_latency_ms: number | null
          status: string
          system_chars: number
          total_tokens: number | null
          user_id: string
        }
        Insert: {
          attempt_count?: number
          completed_at?: string | null
          created_at?: string
          failure_code?: string | null
          fallback_from?: string | null
          id?: string
          input_chars?: number
          input_tokens?: number | null
          model_id?: string | null
          output_chars?: number | null
          output_tokens?: number | null
          provider?: string | null
          request_kind: string
          router_latency_ms?: number | null
          status?: string
          system_chars?: number
          total_tokens?: number | null
          user_id: string
        }
        Update: {
          attempt_count?: number
          completed_at?: string | null
          created_at?: string
          failure_code?: string | null
          fallback_from?: string | null
          id?: string
          input_chars?: number
          input_tokens?: number | null
          model_id?: string | null
          output_chars?: number | null
          output_tokens?: number | null
          provider?: string | null
          request_kind?: string
          router_latency_ms?: number | null
          status?: string
          system_chars?: number
          total_tokens?: number | null
          user_id?: string
        }
        Relationships: []
      }
      body_measurements: {
        Row: {
          body_fat_percent: number | null
          client_mutation_id: string
          created_at: string
          id: string
          local_date: string
          measured_at: string
          note: string | null
          updated_at: string
          user_id: string
          waist_cm: number | null
          weight_kg: number | null
        }
        Insert: {
          body_fat_percent?: number | null
          client_mutation_id: string
          created_at?: string
          id?: string
          local_date: string
          measured_at?: string
          note?: string | null
          updated_at?: string
          user_id: string
          waist_cm?: number | null
          weight_kg?: number | null
        }
        Update: {
          body_fat_percent?: number | null
          client_mutation_id?: string
          created_at?: string
          id?: string
          local_date?: string
          measured_at?: string
          note?: string | null
          updated_at?: string
          user_id?: string
          waist_cm?: number | null
          weight_kg?: number | null
        }
        Relationships: []
      }
      encrypted_provider_credentials: {
        Row: {
          auth_tag: string
          ciphertext: string
          cooldown_until: string | null
          created_at: string
          id: string
          iv: string
          key_hint: string
          key_version: number
          last_failure_code: string | null
          last_validated_at: string
          model_id: string
          provider: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          auth_tag: string
          ciphertext: string
          cooldown_until?: string | null
          created_at?: string
          id?: string
          iv: string
          key_hint: string
          key_version?: number
          last_failure_code?: string | null
          last_validated_at?: string
          model_id: string
          provider: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          auth_tag?: string
          ciphertext?: string
          cooldown_until?: string | null
          created_at?: string
          id?: string
          iv?: string
          key_hint?: string
          key_version?: number
          last_failure_code?: string | null
          last_validated_at?: string
          model_id?: string
          provider?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      nutrition_entries: {
        Row: {
          client_mutation_id: string
          core_schema_version: number
          created_at: string
          estimate: Json
          id: string
          label: string
          local_date: string
          logged_at: string
          meal_type: string
          nutrition_plan_id: string | null
          nutrition_plan_meal_id: string | null
          nutrition_plan_version: number | null
          source_id: string
          source_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          client_mutation_id: string
          core_schema_version?: number
          created_at?: string
          estimate: Json
          id?: string
          label: string
          local_date: string
          logged_at?: string
          meal_type: string
          nutrition_plan_id?: string | null
          nutrition_plan_meal_id?: string | null
          nutrition_plan_version?: number | null
          source_id: string
          source_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          client_mutation_id?: string
          core_schema_version?: number
          created_at?: string
          estimate?: Json
          id?: string
          label?: string
          local_date?: string
          logged_at?: string
          meal_type?: string
          nutrition_plan_id?: string | null
          nutrition_plan_meal_id?: string | null
          nutrition_plan_version?: number | null
          source_id?: string
          source_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "nutrition_entries_nutrition_plan_id_fkey"
            columns: ["nutrition_plan_id"]
            isOneToOne: false
            referencedRelation: "nutrition_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      nutrition_goals: {
        Row: {
          core_schema_version: number
          created_at: string
          daily: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          core_schema_version?: number
          created_at?: string
          daily?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          core_schema_version?: number
          created_at?: string
          daily?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      nutrition_plans: {
        Row: {
          activated_at: string | null
          archived_at: string | null
          created_at: string
          id: string
          plan: Json
          schema_version: number
          source: string
          status: string
          title: string
          user_id: string
          version: number
        }
        Insert: {
          activated_at?: string | null
          archived_at?: string | null
          created_at?: string
          id?: string
          plan: Json
          schema_version?: number
          source?: string
          status?: string
          title: string
          user_id: string
          version: number
        }
        Update: {
          activated_at?: string | null
          archived_at?: string | null
          created_at?: string
          id?: string
          plan?: Json
          schema_version?: number
          source?: string
          status?: string
          title?: string
          user_id?: string
          version?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
          locale: string
          timezone: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id: string
          locale?: string
          timezone?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
          locale?: string
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_onboarding: {
        Row: {
          completed_at: string | null
          created_at: string
          current_step: number
          draft: Json
          schema_version: number
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          current_step?: number
          draft?: Json
          schema_version?: number
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          current_step?: number
          draft?: Json
          schema_version?: number
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          created_at: string
          theme: string
          units: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          theme?: string
          units?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          theme?: string
          units?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      workout_plans: {
        Row: {
          activated_at: string | null
          archived_at: string | null
          created_at: string
          id: string
          plan: Json
          schema_version: number
          source: string
          status: string
          title: string
          user_id: string
          version: number
        }
        Insert: {
          activated_at?: string | null
          archived_at?: string | null
          created_at?: string
          id?: string
          plan: Json
          schema_version?: number
          source?: string
          status?: string
          title: string
          user_id: string
          version: number
        }
        Update: {
          activated_at?: string | null
          archived_at?: string | null
          created_at?: string
          id?: string
          plan?: Json
          schema_version?: number
          source?: string
          status?: string
          title?: string
          user_id?: string
          version?: number
        }
        Relationships: []
      }
      workout_sessions: {
        Row: {
          client_mutation_id: string
          completed_at: string | null
          created_at: string
          duration_minutes: number | null
          id: string
          notes: string | null
          pain_scale: number | null
          rpe: number | null
          started_at: string
          status: string
          total_volume_kg: number | null
          updated_at: string
          user_id: string
          workout_id: string
          workout_plan_id: string | null
          workout_plan_version: number | null
          workout_title: string
        }
        Insert: {
          client_mutation_id: string
          completed_at?: string | null
          created_at?: string
          duration_minutes?: number | null
          id?: string
          notes?: string | null
          pain_scale?: number | null
          rpe?: number | null
          started_at?: string
          status?: string
          total_volume_kg?: number | null
          updated_at?: string
          user_id: string
          workout_id: string
          workout_plan_id?: string | null
          workout_plan_version?: number | null
          workout_title: string
        }
        Update: {
          client_mutation_id?: string
          completed_at?: string | null
          created_at?: string
          duration_minutes?: number | null
          id?: string
          notes?: string | null
          pain_scale?: number | null
          rpe?: number | null
          started_at?: string
          status?: string
          total_volume_kg?: number | null
          updated_at?: string
          user_id?: string
          workout_id?: string
          workout_plan_id?: string | null
          workout_plan_version?: number | null
          workout_title?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_sessions_workout_plan_id_fkey"
            columns: ["workout_plan_id"]
            isOneToOne: false
            referencedRelation: "workout_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_sets: {
        Row: {
          completed_at: string | null
          created_at: string
          exercise_id: string
          exercise_name: string
          exercise_order: number
          id: string
          reps: number | null
          session_id: string
          set_order: number
          target_reps: string
          updated_at: string
          user_id: string
          weight_kg: number | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          exercise_id: string
          exercise_name: string
          exercise_order: number
          id?: string
          reps?: number | null
          session_id: string
          set_order: number
          target_reps: string
          updated_at?: string
          user_id: string
          weight_kg?: number | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          exercise_id?: string
          exercise_name?: string
          exercise_order?: number
          id?: string
          reps?: number | null
          session_id?: string
          set_order?: number
          target_reps?: string
          updated_at?: string
          user_id?: string
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "workout_sets_session_owner_fk"
            columns: ["session_id", "user_id"]
            isOneToOne: false
            referencedRelation: "workout_sessions"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      activate_nutrition_plan: {
        Args: { p_plan_id: string }
        Returns: undefined
      }
      activate_workout_plan: { Args: { p_plan_id: string }; Returns: undefined }
      complete_ai_request: {
        Args: {
          p_attempt_count?: number
          p_failure_code?: string
          p_fallback_from?: string
          p_input_chars?: number
          p_input_tokens?: number
          p_model_id?: string
          p_output_chars?: number
          p_output_tokens?: number
          p_provider?: string
          p_request_id: string
          p_router_latency_ms?: number
          p_status: string
          p_system_chars?: number
          p_total_tokens?: number
        }
        Returns: undefined
      }
      create_nutrition_plan_version: {
        Args: {
          p_activate?: boolean
          p_plan: Json
          p_source?: string
          p_title: string
        }
        Returns: {
          plan_id: string
          plan_version: number
        }[]
      }
      create_workout_plan_version: {
        Args: {
          p_activate?: boolean
          p_plan: Json
          p_source?: string
          p_title: string
        }
        Returns: {
          plan_id: string
          plan_version: number
        }[]
      }
      reserve_ai_request: {
        Args: {
          p_burst_limit?: number
          p_hourly_limit?: number
          p_request_kind: string
        }
        Returns: {
          allowed: boolean
          burst_used: number
          hourly_used: number
          request_id: string
          retry_after_seconds: number
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
