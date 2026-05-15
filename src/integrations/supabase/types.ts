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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      children: {
        Row: {
          blouse_portee_2025: boolean | null
          classe: string | null
          created_at: string
          genre: string | null
          hauteur: string | null
          id: string
          modele_blouse_2025: string | null
          naissance: string | null
          nom: string
          prenom: string
          section: string | null
          taille: string | null
          taille_blouse_2025: string | null
          tenant_id: string | null
          tour: string | null
          tour_bassin: string | null
          tour_taille: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          blouse_portee_2025?: boolean | null
          classe?: string | null
          created_at?: string
          genre?: string | null
          hauteur?: string | null
          id?: string
          modele_blouse_2025?: string | null
          naissance?: string | null
          nom: string
          prenom: string
          section?: string | null
          taille?: string | null
          taille_blouse_2025?: string | null
          tenant_id?: string | null
          tour?: string | null
          tour_bassin?: string | null
          tour_taille?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          blouse_portee_2025?: boolean | null
          classe?: string | null
          created_at?: string
          genre?: string | null
          hauteur?: string | null
          id?: string
          modele_blouse_2025?: string | null
          naissance?: string | null
          nom?: string
          prenom?: string
          section?: string | null
          taille?: string | null
          taille_blouse_2025?: string | null
          tenant_id?: string | null
          tour?: string | null
          tour_bassin?: string | null
          tour_taille?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "children_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      client_counters: {
        Row: {
          client_number: number
          created_at: string
          tenant_id: string | null
          user_id: string
        }
        Insert: {
          client_number: number
          created_at?: string
          tenant_id?: string | null
          user_id: string
        }
        Update: {
          client_number?: number
          created_at?: string
          tenant_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_counters_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_options: {
        Row: {
          active: boolean
          code: string
          created_at: string
          description: string | null
          id: string
          is_default: boolean
          label: string
          position: number
          tenant_id: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          description?: string | null
          id?: string
          is_default?: boolean
          label: string
          position?: number
          tenant_id?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          is_default?: boolean
          label?: string
          position?: number
          tenant_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "delivery_options_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
          tenant_id: string | null
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
          tenant_id?: string | null
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_send_log_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          tenant_id: string | null
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          tenant_id?: string | null
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          tenant_id?: string | null
          token?: string
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_unsubscribe_tokens_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      family_parents: {
        Row: {
          adresse: string | null
          civilite: string
          code_postal: string | null
          created_at: string
          email: string | null
          has_alt_shipping: boolean
          id: string
          is_primary: boolean
          is_shipping_default: boolean
          nom: string
          position: number
          prenom: string
          role: string
          shipping_adresse: string | null
          shipping_code_postal: string | null
          shipping_label: string | null
          shipping_ville: string | null
          telephone: string | null
          tenant_id: string | null
          updated_at: string
          user_id: string
          ville: string | null
        }
        Insert: {
          adresse?: string | null
          civilite?: string
          code_postal?: string | null
          created_at?: string
          email?: string | null
          has_alt_shipping?: boolean
          id?: string
          is_primary?: boolean
          is_shipping_default?: boolean
          nom?: string
          position?: number
          prenom?: string
          role?: string
          shipping_adresse?: string | null
          shipping_code_postal?: string | null
          shipping_label?: string | null
          shipping_ville?: string | null
          telephone?: string | null
          tenant_id?: string | null
          updated_at?: string
          user_id: string
          ville?: string | null
        }
        Update: {
          adresse?: string | null
          civilite?: string
          code_postal?: string | null
          created_at?: string
          email?: string | null
          has_alt_shipping?: boolean
          id?: string
          is_primary?: boolean
          is_shipping_default?: boolean
          nom?: string
          position?: number
          prenom?: string
          role?: string
          shipping_adresse?: string | null
          shipping_code_postal?: string | null
          shipping_label?: string | null
          shipping_ville?: string | null
          telephone?: string | null
          tenant_id?: string | null
          updated_at?: string
          user_id?: string
          ville?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "family_parents_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      order_incidents: {
        Row: {
          created_at: string
          description: string
          eligible: boolean
          id: string
          incident_type: string
          order_id: string
          order_item_id: string
          photos: string[]
          quantity: number
          status: string
          tenant_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description: string
          eligible?: boolean
          id?: string
          incident_type: string
          order_id: string
          order_item_id: string
          photos?: string[]
          quantity?: number
          status?: string
          tenant_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string
          eligible?: boolean
          id?: string
          incident_type?: string
          order_id?: string
          order_item_id?: string
          photos?: string[]
          quantity?: number
          status?: string
          tenant_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_incidents_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          child_classe: string | null
          child_id: string | null
          child_nom: string
          child_prenom: string
          child_section: string | null
          created_at: string
          id: string
          line_total: number
          order_id: string
          product_id: string
          product_name: string
          product_ref: string
          quantity: number
          size: string
          tenant_id: string | null
          unit_price: number
          variant: string | null
        }
        Insert: {
          child_classe?: string | null
          child_id?: string | null
          child_nom: string
          child_prenom: string
          child_section?: string | null
          created_at?: string
          id?: string
          line_total: number
          order_id: string
          product_id: string
          product_name: string
          product_ref: string
          quantity: number
          size: string
          tenant_id?: string | null
          unit_price: number
          variant?: string | null
        }
        Update: {
          child_classe?: string | null
          child_id?: string | null
          child_nom?: string
          child_prenom?: string
          child_section?: string | null
          created_at?: string
          id?: string
          line_total?: number
          order_id?: string
          product_id?: string
          product_name?: string
          product_ref?: string
          quantity?: number
          size?: string
          tenant_id?: string | null
          unit_price?: number
          variant?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      order_sequences: {
        Row: {
          last_seq: number
          tenant_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          last_seq?: number
          tenant_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          last_seq?: number
          tenant_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_sequences_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      order_status_history: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          note: string | null
          order_id: string
          status: string
          tenant_id: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          note?: string | null
          order_id: string
          status: string
          tenant_id?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          note?: string | null
          order_id?: string
          status?: string
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_status_history_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string
          delivered_at: string | null
          family_civilite: string | null
          family_email: string
          family_nom: string
          family_prenom: string
          family_telephone: string | null
          id: string
          order_number: string
          paid_at: string | null
          payment_url: string | null
          payplug_payment_id: string | null
          shipping_address: string | null
          shipping_city: string | null
          shipping_label: string | null
          shipping_mode: string
          shipping_postal: string | null
          shipping_recipient: string | null
          status: string
          tenant_id: string | null
          total_amount: number
          tracking_carrier: string | null
          tracking_number: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          delivered_at?: string | null
          family_civilite?: string | null
          family_email: string
          family_nom: string
          family_prenom: string
          family_telephone?: string | null
          id?: string
          order_number?: string
          paid_at?: string | null
          payment_url?: string | null
          payplug_payment_id?: string | null
          shipping_address?: string | null
          shipping_city?: string | null
          shipping_label?: string | null
          shipping_mode?: string
          shipping_postal?: string | null
          shipping_recipient?: string | null
          status?: string
          tenant_id?: string | null
          total_amount?: number
          tracking_carrier?: string | null
          tracking_number?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          delivered_at?: string | null
          family_civilite?: string | null
          family_email?: string
          family_nom?: string
          family_prenom?: string
          family_telephone?: string | null
          id?: string
          order_number?: string
          paid_at?: string | null
          payment_url?: string | null
          payplug_payment_id?: string | null
          shipping_address?: string | null
          shipping_city?: string | null
          shipping_label?: string | null
          shipping_mode?: string
          shipping_postal?: string | null
          shipping_recipient?: string | null
          status?: string
          tenant_id?: string | null
          total_amount?: number
          tracking_carrier?: string | null
          tracking_number?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          adresse: string | null
          civilite: string
          code_etablissement: string | null
          code_postal: string | null
          created_at: string
          email: string
          family_name: string | null
          id: string
          nom: string
          prenom: string
          telephone: string | null
          tenant_id: string | null
          updated_at: string
          ville: string | null
        }
        Insert: {
          adresse?: string | null
          civilite?: string
          code_etablissement?: string | null
          code_postal?: string | null
          created_at?: string
          email: string
          family_name?: string | null
          id: string
          nom?: string
          prenom?: string
          telephone?: string | null
          tenant_id?: string | null
          updated_at?: string
          ville?: string | null
        }
        Update: {
          adresse?: string | null
          civilite?: string
          code_etablissement?: string | null
          code_postal?: string | null
          created_at?: string
          email?: string
          family_name?: string | null
          id?: string
          nom?: string
          prenom?: string
          telephone?: string | null
          tenant_id?: string | null
          updated_at?: string
          ville?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
          tenant_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
          tenant_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "suppressed_emails_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_domains: {
        Row: {
          created_at: string
          hostname: string
          id: string
          is_primary: boolean
          tenant_id: string
        }
        Insert: {
          created_at?: string
          hostname: string
          id?: string
          is_primary?: boolean
          tenant_id: string
        }
        Update: {
          created_at?: string
          hostname?: string
          id?: string
          is_primary?: boolean
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_domains_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          config: Json
          created_at: string
          id: string
          legacy_code_etablissement: string | null
          logo_url: string | null
          name: string
          short_name: string | null
          slug: string
          status: string
          theme_tokens: Json
          updated_at: string
        }
        Insert: {
          config?: Json
          created_at?: string
          id?: string
          legacy_code_etablissement?: string | null
          logo_url?: string | null
          name: string
          short_name?: string | null
          slug: string
          status?: string
          theme_tokens?: Json
          updated_at?: string
        }
        Update: {
          config?: Json
          created_at?: string
          id?: string
          legacy_code_etablissement?: string | null
          logo_url?: string | null
          name?: string
          short_name?: string | null
          slug?: string
          status?: string
          theme_tokens?: Json
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          tenant_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          tenant_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          tenant_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      apel_families_overview: {
        Args: { _season_start?: string }
        Returns: {
          children_count: number
          classes: string
          family_civilite: string
          family_email: string
          family_nom: string
          family_prenom: string
          family_telephone: string
          has_ordered: boolean
          items_count: number
          last_paid_at: string
          paid_orders_count: number
          user_id: string
          ville: string
        }[]
      }
      current_tenant_id: { Args: never; Returns: string }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      generate_order_number: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "user" | "apel"
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
      app_role: ["admin", "user", "apel"],
    },
  },
} as const
