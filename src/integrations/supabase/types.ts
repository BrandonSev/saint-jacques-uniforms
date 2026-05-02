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
          classe: string | null
          created_at: string
          genre: string | null
          hauteur: string | null
          id: string
          naissance: string | null
          nom: string
          prenom: string
          section: string | null
          taille: string | null
          tour: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          classe?: string | null
          created_at?: string
          genre?: string | null
          hauteur?: string | null
          id?: string
          naissance?: string | null
          nom: string
          prenom: string
          section?: string | null
          taille?: string | null
          tour?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          classe?: string | null
          created_at?: string
          genre?: string | null
          hauteur?: string | null
          id?: string
          naissance?: string | null
          nom?: string
          prenom?: string
          section?: string | null
          taille?: string | null
          tour?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
          updated_at?: string
          user_id?: string
          ville?: string | null
        }
        Relationships: []
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
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
        ]
      }
      orders: {
        Row: {
          created_at: string
          family_civilite: string | null
          family_email: string
          family_nom: string
          family_prenom: string
          family_telephone: string | null
          id: string
          order_number: string
          status: string
          total_amount: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          family_civilite?: string | null
          family_email: string
          family_nom: string
          family_prenom: string
          family_telephone?: string | null
          id?: string
          order_number?: string
          status?: string
          total_amount?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          family_civilite?: string | null
          family_email?: string
          family_nom?: string
          family_prenom?: string
          family_telephone?: string | null
          id?: string
          order_number?: string
          status?: string
          total_amount?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
          updated_at?: string
          ville?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
