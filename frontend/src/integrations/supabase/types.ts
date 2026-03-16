export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      admin_audit_logs: {
        Row: {
          action: string
          actor_id: string
          created_at: string
          details: string | null
          id: string
          metadata_json: Json | null
          target_id: string | null
          target_type: string | null
        }
        Insert: {
          action: string
          actor_id: string
          created_at?: string
          details?: string | null
          id?: string
          metadata_json?: Json | null
          target_id?: string | null
          target_type?: string | null
        }
        Update: {
          action?: string
          actor_id?: string
          created_at?: string
          details?: string | null
          id?: string
          metadata_json?: Json | null
          target_id?: string | null
          target_type?: string | null
        }
        Relationships: []
      }
      certificate_events: {
        Row: {
          actor_id: string | null
          certificate_id: string
          created_at: string
          event_type: Database["public"]["Enums"]["certificate_event_type"]
          id: string
          metadata_json: Json | null
        }
        Insert: {
          actor_id?: string | null
          certificate_id: string
          created_at?: string
          event_type: Database["public"]["Enums"]["certificate_event_type"]
          id?: string
          metadata_json?: Json | null
        }
        Update: {
          actor_id?: string | null
          certificate_id?: string
          created_at?: string
          event_type?: Database["public"]["Enums"]["certificate_event_type"]
          id?: string
          metadata_json?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "certificate_events_certificate_id_fkey"
            columns: ["certificate_id"]
            isOneToOne: false
            referencedRelation: "certificates"
            referencedColumns: ["id"]
          },
        ]
      }
      certificate_templates: {
        Row: {
          background_style: Json | null
          body_text: string
          color_theme: Json | null
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          layout: Database["public"]["Enums"]["template_layout"]
          logo_url: string | null
          number_prefix: string
          organization_id: string | null
          placeholders: Json
          seal_config: Json | null
          signature_config: Json | null
          subtitle: string | null
          title: string
          updated_at: string
        }
        Insert: {
          background_style?: Json | null
          body_text: string
          color_theme?: Json | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          layout?: Database["public"]["Enums"]["template_layout"]
          logo_url?: string | null
          number_prefix?: string
          organization_id?: string | null
          placeholders?: Json
          seal_config?: Json | null
          signature_config?: Json | null
          subtitle?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          background_style?: Json | null
          body_text?: string
          color_theme?: Json | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          layout?: Database["public"]["Enums"]["template_layout"]
          logo_url?: string | null
          number_prefix?: string
          organization_id?: string | null
          placeholders?: Json
          seal_config?: Json | null
          signature_config?: Json | null
          subtitle?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "certificate_templates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      certificates: {
        Row: {
          certificate_number: string
          company_name: string | null
          completion_date: string | null
          course_name: string | null
          created_at: string
          created_by: string | null
          duration_text: string | null
          external_pdf_url: string | null
          external_verification_url: string | null
          id: string
          is_external: boolean
          issue_date: string
          issuer_name: string
          issuer_title: string | null
          metadata_json: Json | null
          notes: string | null
          organization_id: string | null
          original_issuer: string | null
          pdf_url: string | null
          recipient_email: string | null
          recipient_name: string
          score: string | null
          slug: string
          status: Database["public"]["Enums"]["certificate_status"]
          template_id: string | null
          training_name: string | null
          updated_at: string
          uploaded_by: string | null
        }
        Insert: {
          certificate_number: string
          company_name?: string | null
          completion_date?: string | null
          course_name?: string | null
          created_at?: string
          created_by?: string | null
          duration_text?: string | null
          external_pdf_url?: string | null
          external_verification_url?: string | null
          id?: string
          is_external?: boolean
          issue_date?: string
          issuer_name?: string
          issuer_title?: string | null
          metadata_json?: Json | null
          notes?: string | null
          organization_id?: string | null
          original_issuer?: string | null
          pdf_url?: string | null
          recipient_email?: string | null
          recipient_name: string
          score?: string | null
          slug: string
          status?: Database["public"]["Enums"]["certificate_status"]
          template_id?: string | null
          training_name?: string | null
          updated_at?: string
          uploaded_by?: string | null
        }
        Update: {
          certificate_number?: string
          company_name?: string | null
          completion_date?: string | null
          course_name?: string | null
          created_at?: string
          created_by?: string | null
          duration_text?: string | null
          external_pdf_url?: string | null
          external_verification_url?: string | null
          id?: string
          is_external?: boolean
          issue_date?: string
          issuer_name?: string
          issuer_title?: string | null
          metadata_json?: Json | null
          notes?: string | null
          organization_id?: string | null
          original_issuer?: string | null
          pdf_url?: string | null
          recipient_email?: string | null
          recipient_name?: string
          score?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["certificate_status"]
          template_id?: string | null
          training_name?: string | null
          updated_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "certificates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificates_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "certificate_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_submissions: {
        Row: {
          company: string | null
          created_at: string
          email: string
          first_name: string
          id: string
          last_name: string
          message: string
          subject: string | null
        }
        Insert: {
          company?: string | null
          created_at?: string
          email: string
          first_name: string
          id?: string
          last_name: string
          message: string
          subject?: string | null
        }
        Update: {
          company?: string | null
          created_at?: string
          email?: string
          first_name?: string
          id?: string
          last_name?: string
          message?: string
          subject?: string | null
        }
        Relationships: []
      }
      coupons: {
        Row: {
          code: string
          created_at: string
          current_uses: number
          discount_percent: number
          id: string
          is_active: boolean
          max_uses: number | null
          valid_from: string
          valid_until: string | null
        }
        Insert: {
          code: string
          created_at?: string
          current_uses?: number
          discount_percent?: number
          id?: string
          is_active?: boolean
          max_uses?: number | null
          valid_from?: string
          valid_until?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          current_uses?: number
          discount_percent?: number
          id?: string
          is_active?: boolean
          max_uses?: number | null
          valid_from?: string
          valid_until?: string | null
        }
        Relationships: []
      }
      orders: {
        Row: {
          coupon_code: string | null
          coupon_discount_percent: number
          created_at: string
          currency: string
          discount_percent: number
          discounted_price: number
          final_amount: number
          id: string
          metadata_json: Json | null
          organization_id: string
          original_price: number
          payment_method: string | null
          plan_id: string
          plan_name: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          coupon_code?: string | null
          coupon_discount_percent?: number
          created_at?: string
          currency?: string
          discount_percent?: number
          discounted_price?: number
          final_amount?: number
          id?: string
          metadata_json?: Json | null
          organization_id: string
          original_price?: number
          payment_method?: string | null
          plan_id: string
          plan_name: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          coupon_code?: string | null
          coupon_discount_percent?: number
          created_at?: string
          currency?: string
          discount_percent?: number
          discounted_price?: number
          final_amount?: number
          id?: string
          metadata_json?: Json | null
          organization_id?: string
          original_price?: number
          payment_method?: string | null
          plan_id?: string
          plan_name?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          created_at: string
          id: string
          organization_id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id: string
          role?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          logo_url: string | null
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          logo_url?: string | null
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      plans: {
        Row: {
          analytics_access: boolean
          api_access: boolean
          audit_exports: boolean
          bulk_import: boolean
          created_at: string
          display_order: number
          id: string
          max_certificates_per_month: number
          max_templates: number
          name: string
          price_monthly: number
          priority_support: boolean
          team_members: number
          webhook_access: boolean
        }
        Insert: {
          analytics_access?: boolean
          api_access?: boolean
          audit_exports?: boolean
          bulk_import?: boolean
          created_at?: string
          display_order?: number
          id?: string
          max_certificates_per_month?: number
          max_templates?: number
          name: string
          price_monthly?: number
          priority_support?: boolean
          team_members?: number
          webhook_access?: boolean
        }
        Update: {
          analytics_access?: boolean
          api_access?: boolean
          audit_exports?: boolean
          bulk_import?: boolean
          created_at?: string
          display_order?: number
          id?: string
          max_certificates_per_month?: number
          max_templates?: number
          name?: string
          price_monthly?: number
          priority_support?: boolean
          team_members?: number
          webhook_access?: boolean
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          organization_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          organization_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          organization_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          billing_cycle_end: string
          billing_cycle_start: string
          created_at: string
          id: string
          organization_id: string
          plan_id: string
          status: string
          updated_at: string
        }
        Insert: {
          billing_cycle_end?: string
          billing_cycle_start?: string
          created_at?: string
          id?: string
          organization_id: string
          plan_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          billing_cycle_end?: string
          billing_cycle_start?: string
          created_at?: string
          id?: string
          organization_id?: string
          plan_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      usage_tracking: {
        Row: {
          count: number
          created_at: string
          id: string
          metric: string
          organization_id: string
          period_end: string
          period_start: string
          updated_at: string
        }
        Insert: {
          count?: number
          created_at?: string
          id?: string
          metric: string
          organization_id: string
          period_end: string
          period_start: string
          updated_at?: string
        }
        Update: {
          count?: number
          created_at?: string
          id?: string
          metric?: string
          organization_id?: string
          period_end?: string
          period_start?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "usage_tracking_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      apply_coupon: { Args: { _code: string }; Returns: Json }
      backfill_template_snapshots: { Args: never; Returns: number }
      check_plan_limit: {
        Args: { _metric: string; _org_id: string }
        Returns: Json
      }
      generate_certificate_number: {
        Args: { _prefix?: string }
        Returns: string
      }
      get_admin_stats: { Args: never; Returns: Json }
      get_admin_users: { Args: never; Returns: Json }
      get_org_usage: { Args: { _org_id: string }; Returns: Json }
      get_platform_stats: { Args: never; Returns: Json }
      get_user_org_id: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_usage: {
        Args: { _amount?: number; _metric: string; _org_id: string }
        Returns: undefined
      }
      log_admin_action: {
        Args: {
          _action: string
          _details?: string
          _target_id?: string
          _target_type?: string
        }
        Returns: string
      }
    }
    Enums: {
      app_role: "admin" | "user" | "super_admin"
      certificate_event_type: "issued" | "revoked" | "viewed" | "downloaded"
      certificate_status: "issued" | "revoked" | "draft"
      template_layout: "portrait" | "landscape"
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
    Enums: {
      app_role: ["admin", "user", "super_admin"],
      certificate_event_type: ["issued", "revoked", "viewed", "downloaded"],
      certificate_status: ["issued", "revoked", "draft"],
      template_layout: ["portrait", "landscape"],
    },
  },
} as const
