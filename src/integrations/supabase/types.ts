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
      app_settings: {
        Row: {
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      applications: {
        Row: {
          admin_notes: string | null
          city: string | null
          course_id: string | null
          course_title: string | null
          created_at: string
          id: string
          message: string | null
          name: string
          phone: string
          promocode: string | null
          referrer: string | null
          status: Database["public"]["Enums"]["application_status"]
          updated_at: string
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          admin_notes?: string | null
          city?: string | null
          course_id?: string | null
          course_title?: string | null
          created_at?: string
          id?: string
          message?: string | null
          name: string
          phone: string
          promocode?: string | null
          referrer?: string | null
          status?: Database["public"]["Enums"]["application_status"]
          updated_at?: string
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          admin_notes?: string | null
          city?: string | null
          course_id?: string | null
          course_title?: string | null
          created_at?: string
          id?: string
          message?: string | null
          name?: string
          phone?: string
          promocode?: string | null
          referrer?: string | null
          status?: Database["public"]["Enums"]["application_status"]
          updated_at?: string
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "applications_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: string
          created_at: string
          diff: Json | null
          entity: string
          entity_id: string | null
          id: string
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          diff?: Json | null
          entity: string
          entity_id?: string | null
          id?: string
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          diff?: Json | null
          entity?: string
          entity_id?: string | null
          id?: string
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      banners: {
        Row: {
          badge: string | null
          created_at: string
          cta_label: string | null
          ends_at: string | null
          id: string
          image_url: string | null
          is_active: boolean
          link_url: string | null
          placement: string
          sort_order: number
          starts_at: string | null
          subtitle: string | null
          title: string
          updated_at: string
        }
        Insert: {
          badge?: string | null
          created_at?: string
          cta_label?: string | null
          ends_at?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          link_url?: string | null
          placement?: string
          sort_order?: number
          starts_at?: string | null
          subtitle?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          badge?: string | null
          created_at?: string
          cta_label?: string | null
          ends_at?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          link_url?: string | null
          placement?: string
          sort_order?: number
          starts_at?: string | null
          subtitle?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          content: string
          cover_url: string | null
          created_at: string
          excerpt: string | null
          id: string
          meta_description: string | null
          meta_title: string | null
          published: boolean
          published_at: string | null
          slug: string
          tags: string[]
          title: string
          updated_at: string
        }
        Insert: {
          content?: string
          cover_url?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          meta_description?: string | null
          meta_title?: string | null
          published?: boolean
          published_at?: string | null
          slug: string
          tags?: string[]
          title: string
          updated_at?: string
        }
        Update: {
          content?: string
          cover_url?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          meta_description?: string | null
          meta_title?: string | null
          published?: boolean
          published_at?: string | null
          slug?: string
          tags?: string[]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      certificates: {
        Row: {
          course_title: string
          created_at: string
          full_name: string
          id: string
          issued_at: string
          number: string
          registry_no: string | null
          updated_at: string
          valid_until: string | null
        }
        Insert: {
          course_title: string
          created_at?: string
          full_name: string
          id?: string
          issued_at: string
          number: string
          registry_no?: string | null
          updated_at?: string
          valid_until?: string | null
        }
        Update: {
          course_title?: string
          created_at?: string
          full_name?: string
          id?: string
          issued_at?: string
          number?: string
          registry_no?: string | null
          updated_at?: string
          valid_until?: string | null
        }
        Relationships: []
      }
      course_reviews: {
        Row: {
          author_company: string | null
          author_name: string
          course_id: string
          created_at: string
          id: string
          is_approved: boolean
          rating: number
          text: string
          updated_at: string
        }
        Insert: {
          author_company?: string | null
          author_name: string
          course_id: string
          created_at?: string
          id?: string
          is_approved?: boolean
          rating: number
          text: string
          updated_at?: string
        }
        Update: {
          author_company?: string | null
          author_name?: string
          course_id?: string
          created_at?: string
          id?: string
          is_approved?: boolean
          rating?: number
          text?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_reviews_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_schedules: {
        Row: {
          city: string | null
          course_id: string
          created_at: string
          end_date: string | null
          format: string | null
          id: string
          is_active: boolean
          is_default: boolean
          price: number | null
          seats_left: number | null
          seats_total: number | null
          start_date: string
          updated_at: string
        }
        Insert: {
          city?: string | null
          course_id: string
          created_at?: string
          end_date?: string | null
          format?: string | null
          id?: string
          is_active?: boolean
          is_default?: boolean
          price?: number | null
          seats_left?: number | null
          seats_total?: number | null
          start_date: string
          updated_at?: string
        }
        Update: {
          city?: string | null
          course_id?: string
          created_at?: string
          end_date?: string | null
          format?: string | null
          id?: string
          is_active?: boolean
          is_default?: boolean
          price?: number | null
          seats_left?: number | null
          seats_total?: number | null
          start_date?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_schedules_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_teachers: {
        Row: {
          course_id: string
          teacher_id: string
        }
        Insert: {
          course_id: string
          teacher_id: string
        }
        Update: {
          course_id?: string
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_teachers_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_teachers_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          category_id: string | null
          city: string | null
          created_at: string
          description: string | null
          document_description: string | null
          document_sample_url: string | null
          document_type: string | null
          duration: string | null
          faqs: Json
          features: Json
          format: string | null
          id: string
          image_url: string | null
          meta_description: string | null
          meta_title: string | null
          price: number | null
          price_note: string | null
          program_practice: string | null
          program_theory: string | null
          published: boolean
          short_description: string | null
          slug: string
          sort_order: number
          start_date: string | null
          steps: Json
          title: string
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          city?: string | null
          created_at?: string
          description?: string | null
          document_description?: string | null
          document_sample_url?: string | null
          document_type?: string | null
          duration?: string | null
          faqs?: Json
          features?: Json
          format?: string | null
          id?: string
          image_url?: string | null
          meta_description?: string | null
          meta_title?: string | null
          price?: number | null
          price_note?: string | null
          program_practice?: string | null
          program_theory?: string | null
          published?: boolean
          short_description?: string | null
          slug: string
          sort_order?: number
          start_date?: string | null
          steps?: Json
          title: string
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          city?: string | null
          created_at?: string
          description?: string | null
          document_description?: string | null
          document_sample_url?: string | null
          document_type?: string | null
          duration?: string | null
          faqs?: Json
          features?: Json
          format?: string | null
          id?: string
          image_url?: string | null
          meta_description?: string | null
          meta_title?: string | null
          price?: number | null
          price_note?: string | null
          program_practice?: string | null
          program_theory?: string | null
          published?: boolean
          short_description?: string | null
          slug?: string
          sort_order?: number
          start_date?: string | null
          steps?: Json
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "courses_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      document_samples: {
        Row: {
          description: string | null
          doc_type: string
          file_url: string
          preview_url: string | null
          title: string
          updated_at: string
        }
        Insert: {
          description?: string | null
          doc_type: string
          file_url: string
          preview_url?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          description?: string | null
          doc_type?: string
          file_url?: string
          preview_url?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      gallery_images: {
        Row: {
          alt: string | null
          created_at: string
          id: string
          image_url: string
          is_published: boolean
          section: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          alt?: string | null
          created_at?: string
          id?: string
          image_url: string
          is_published?: boolean
          section?: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          alt?: string | null
          created_at?: string
          id?: string
          image_url?: string
          is_published?: boolean
          section?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      org_documents: {
        Row: {
          created_at: string
          doc_type: string
          file_url: string
          id: string
          is_published: boolean
          preview_url: string | null
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          doc_type?: string
          file_url: string
          id?: string
          is_published?: boolean
          preview_url?: string | null
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          doc_type?: string
          file_url?: string
          id?: string
          is_published?: boolean
          preview_url?: string | null
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      promocodes: {
        Row: {
          code: string
          created_at: string
          discount_amount: number | null
          discount_percent: number | null
          id: string
          is_active: boolean
          max_uses: number | null
          updated_at: string
          used_count: number
          valid_until: string | null
        }
        Insert: {
          code: string
          created_at?: string
          discount_amount?: number | null
          discount_percent?: number | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
          updated_at?: string
          used_count?: number
          valid_until?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          discount_amount?: number | null
          discount_percent?: number | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
          updated_at?: string
          used_count?: number
          valid_until?: string | null
        }
        Relationships: []
      }
      public_schedule: {
        Row: {
          city: string
          created_at: string
          dates_text: string | null
          id: string
          is_published: boolean
          month1_text: string | null
          month2_text: string | null
          month3_text: string | null
          quarter: number
          room: string | null
          sort_order: number
          time_text: string | null
          topic: string
          updated_at: string
          year: number
        }
        Insert: {
          city?: string
          created_at?: string
          dates_text?: string | null
          id?: string
          is_published?: boolean
          month1_text?: string | null
          month2_text?: string | null
          month3_text?: string | null
          quarter?: number
          room?: string | null
          sort_order?: number
          time_text?: string | null
          topic: string
          updated_at?: string
          year?: number
        }
        Update: {
          city?: string
          created_at?: string
          dates_text?: string | null
          id?: string
          is_published?: boolean
          month1_text?: string | null
          month2_text?: string | null
          month3_text?: string | null
          quarter?: number
          room?: string | null
          sort_order?: number
          time_text?: string | null
          topic?: string
          updated_at?: string
          year?: number
        }
        Relationships: []
      }
      teachers: {
        Row: {
          bio: string | null
          created_at: string
          credentials: string | null
          full_name: string
          id: string
          is_published: boolean
          photo_url: string | null
          position: string | null
          sort_order: number
          updated_at: string
        }
        Insert: {
          bio?: string | null
          created_at?: string
          credentials?: string | null
          full_name: string
          id?: string
          is_published?: boolean
          photo_url?: string | null
          position?: string | null
          sort_order?: number
          updated_at?: string
        }
        Update: {
          bio?: string | null
          created_at?: string
          credentials?: string | null
          full_name?: string
          id?: string
          is_published?: boolean
          photo_url?: string | null
          position?: string | null
          sort_order?: number
          updated_at?: string
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
      application_status: "new" | "in_progress" | "done" | "rejected"
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
      application_status: ["new", "in_progress", "done", "rejected"],
    },
  },
} as const
