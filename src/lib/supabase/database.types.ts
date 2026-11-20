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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      ai_assistant_settings: {
        Row: {
          enabled: boolean
          id: boolean
          max_output_tokens: number
          model_slug: string
          require_human_approval: boolean
          system_instructions: string
          temperature: number
          tone: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          enabled?: boolean
          id?: boolean
          max_output_tokens?: number
          model_slug?: string
          require_human_approval?: boolean
          system_instructions?: string
          temperature?: number
          tone?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          enabled?: boolean
          id?: boolean
          max_output_tokens?: number
          model_slug?: string
          require_human_approval?: boolean
          system_instructions?: string
          temperature?: number
          tone?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      ai_conversations: {
        Row: {
          channel: string
          created_at: string
          id: string
          organization_id: string | null
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          channel?: string
          created_at?: string
          id?: string
          organization_id?: string | null
          status?: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          channel?: string
          created_at?: string
          id?: string
          organization_id?: string | null
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_conversations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_knowledge_sources: {
        Row: {
          content: string
          created_at: string
          created_by: string | null
          id: string
          organization_id: string | null
          published_at: string | null
          search_vector: unknown
          source_type: string
          status: string
          tags: string[]
          title: string
          updated_at: string
          updated_by: string | null
          version: number
        }
        Insert: {
          content: string
          created_at?: string
          created_by?: string | null
          id?: string
          organization_id?: string | null
          published_at?: string | null
          search_vector?: unknown
          source_type?: string
          status?: string
          tags?: string[]
          title: string
          updated_at?: string
          updated_by?: string | null
          version?: number
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string | null
          id?: string
          organization_id?: string | null
          published_at?: string | null
          search_vector?: unknown
          source_type?: string
          status?: string
          tags?: string[]
          title?: string
          updated_at?: string
          updated_by?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "ai_knowledge_sources_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_messages: {
        Row: {
          citations: Json
          content: string
          conversation_id: string
          created_at: string
          feedback: string | null
          id: string
          input_tokens: number | null
          model_slug: string | null
          organization_id: string | null
          output_tokens: number | null
          prompt_version: number | null
          role: string
          user_id: string | null
        }
        Insert: {
          citations?: Json
          content: string
          conversation_id: string
          created_at?: string
          feedback?: string | null
          id?: string
          input_tokens?: number | null
          model_slug?: string | null
          organization_id?: string | null
          output_tokens?: number | null
          prompt_version?: number | null
          role: string
          user_id?: string | null
        }
        Update: {
          citations?: Json
          content?: string
          conversation_id?: string
          created_at?: string
          feedback?: string | null
          id?: string
          input_tokens?: number | null
          model_slug?: string | null
          organization_id?: string | null
          output_tokens?: number | null
          prompt_version?: number | null
          role?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "ai_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_messages_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_prompt_versions: {
        Row: {
          changelog: string | null
          created_at: string
          created_by: string | null
          id: string
          model_slug: string
          published_at: string | null
          status: string
          system_instructions: string
          version: number
        }
        Insert: {
          changelog?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          model_slug: string
          published_at?: string | null
          status?: string
          system_instructions: string
          version?: never
        }
        Update: {
          changelog?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          model_slug?: string
          published_at?: string | null
          status?: string
          system_instructions?: string
          version?: never
        }
        Relationships: []
      }
      assets: {
        Row: {
          asset_tag: string | null
          assigned_to: string | null
          category: string
          created_at: string
          hostname: string | null
          id: string
          ip_address: unknown
          license_expires_on: string | null
          mac_address: unknown
          manufacturer: string | null
          model: string | null
          name: string
          notes: string | null
          operating_system: string | null
          organization_id: string
          purchase_cost: number | null
          purchased_on: string | null
          serial_number: string | null
          status: string
          updated_at: string
          warranty_until: string | null
        }
        Insert: {
          asset_tag?: string | null
          assigned_to?: string | null
          category?: string
          created_at?: string
          hostname?: string | null
          id?: string
          ip_address?: unknown
          license_expires_on?: string | null
          mac_address?: unknown
          manufacturer?: string | null
          model?: string | null
          name: string
          notes?: string | null
          operating_system?: string | null
          organization_id: string
          purchase_cost?: number | null
          purchased_on?: string | null
          serial_number?: string | null
          status?: string
          updated_at?: string
          warranty_until?: string | null
        }
        Update: {
          asset_tag?: string | null
          assigned_to?: string | null
          category?: string
          created_at?: string
          hostname?: string | null
          id?: string
          ip_address?: unknown
          license_expires_on?: string | null
          mac_address?: unknown
          manufacturer?: string | null
          model?: string | null
          name?: string
          notes?: string | null
          operating_system?: string | null
          organization_id?: string
          purchase_cost?: number | null
          purchased_on?: string | null
          serial_number?: string | null
          status?: string
          updated_at?: string
          warranty_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assets_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          details: Json
          entity_id: string | null
          entity_type: string
          id: number
          organization_id: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          details?: Json
          entity_id?: string | null
          entity_type: string
          id?: never
          organization_id?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          details?: Json
          entity_id?: string | null
          entity_type?: string
          id?: never
          organization_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_rules: {
        Row: {
          actions: Json
          conditions: Json
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_enabled: boolean
          name: string
          requires_approval: boolean
          trigger_event: string
          updated_at: string
        }
        Insert: {
          actions?: Json
          conditions?: Json
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_enabled?: boolean
          name: string
          requires_approval?: boolean
          trigger_event: string
          updated_at?: string
        }
        Update: {
          actions?: Json
          conditions?: Json
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_enabled?: boolean
          name?: string
          requires_approval?: boolean
          trigger_event?: string
          updated_at?: string
        }
        Relationships: []
      }
      automation_runs: {
        Row: {
          created_at: string
          error_message: string | null
          finished_at: string | null
          id: string
          result_payload: Json
          rule_id: string | null
          started_at: string | null
          status: string
          trigger_payload: Json
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          finished_at?: string | null
          id?: string
          result_payload?: Json
          rule_id?: string | null
          started_at?: string | null
          status?: string
          trigger_payload?: Json
        }
        Update: {
          created_at?: string
          error_message?: string | null
          finished_at?: string | null
          id?: string
          result_payload?: Json
          rule_id?: string | null
          started_at?: string | null
          status?: string
          trigger_payload?: Json
        }
        Relationships: [
          {
            foreignKeyName: "automation_runs_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "automation_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          category: string
          created_at: string
          id: string
          mime_type: string | null
          name: string
          organization_id: string
          size_bytes: number | null
          storage_path: string
          uploaded_by: string | null
        }
        Insert: {
          category?: string
          created_at?: string
          id?: string
          mime_type?: string | null
          name: string
          organization_id: string
          size_bytes?: number | null
          storage_path: string
          uploaded_by?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          mime_type?: string | null
          name?: string
          organization_id?: string
          size_bytes?: number | null
          storage_path?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      interventions: {
        Row: {
          actual_end: string | null
          actual_start: string | null
          assigned_to: string | null
          created_at: string
          created_by: string | null
          customer_approved_at: string | null
          customer_notes: string | null
          description: string | null
          duration_minutes: number | null
          id: string
          location: string | null
          organization_id: string
          resolution: string | null
          scheduled_end: string | null
          scheduled_start: string | null
          status: string
          ticket_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          actual_end?: string | null
          actual_start?: string | null
          assigned_to?: string | null
          created_at?: string
          created_by?: string | null
          customer_approved_at?: string | null
          customer_notes?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          location?: string | null
          organization_id: string
          resolution?: string | null
          scheduled_end?: string | null
          scheduled_start?: string | null
          status?: string
          ticket_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          actual_end?: string | null
          actual_start?: string | null
          assigned_to?: string | null
          created_at?: string
          created_by?: string | null
          customer_approved_at?: string | null
          customer_notes?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          location?: string | null
          organization_id?: string
          resolution?: string | null
          scheduled_end?: string | null
          scheduled_start?: string | null
          status?: string
          ticket_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "interventions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interventions_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string
          created_at: string
          href: string | null
          id: string
          organization_id: string | null
          read_at: string | null
          title: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          href?: string | null
          id?: string
          organization_id?: string | null
          read_at?: string | null
          title: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          href?: string | null
          id?: string
          organization_id?: string | null
          read_at?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
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
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id: string
          role?: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string
          role?: string
          status?: string
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
          address: string | null
          address_line1: string | null
          billing_address: Json
          billing_email: string | null
          brand_color: string
          city: string | null
          company_size: string | null
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          country: string | null
          created_at: string
          description: string | null
          enabled_modules: Json
          external_reference: string | null
          id: string
          internal_notes: string | null
          legal_name: string | null
          name: string
          phone: string | null
          postal_code: string | null
          sector: string | null
          slug: string
          status: string
          updated_at: string
          vat_number: string | null
          website: string | null
        }
        Insert: {
          address?: string | null
          address_line1?: string | null
          billing_address?: Json
          billing_email?: string | null
          brand_color?: string
          city?: string | null
          company_size?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          country?: string | null
          created_at?: string
          description?: string | null
          enabled_modules?: Json
          external_reference?: string | null
          id?: string
          internal_notes?: string | null
          legal_name?: string | null
          name: string
          phone?: string | null
          postal_code?: string | null
          sector?: string | null
          slug: string
          status?: string
          updated_at?: string
          vat_number?: string | null
          website?: string | null
        }
        Update: {
          address?: string | null
          address_line1?: string | null
          billing_address?: Json
          billing_email?: string | null
          brand_color?: string
          city?: string | null
          company_size?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          country?: string | null
          created_at?: string
          description?: string | null
          enabled_modules?: Json
          external_reference?: string | null
          id?: string
          internal_notes?: string | null
          legal_name?: string | null
          name?: string
          phone?: string | null
          postal_code?: string | null
          sector?: string | null
          slug?: string
          status?: string
          updated_at?: string
          vat_number?: string | null
          website?: string | null
        }
        Relationships: []
      }
      owner_bootstrap_requests: {
        Row: {
          bootstrap_token: string
          created_at: string
          id: string
        }
        Insert: {
          bootstrap_token: string
          created_at?: string
          id?: string
        }
        Update: {
          bootstrap_token?: string
          created_at?: string
          id?: string
        }
        Relationships: []
      }
      platform_settings: {
        Row: {
          description: string
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          description?: string
          key: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Update: {
          description?: string
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string
          id: string
          is_active: boolean
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id: string
          is_active?: boolean
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          is_active?: boolean
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      service_contracts: {
        Row: {
          auto_renew: boolean
          billing_frequency: string
          contract_number: string | null
          created_at: string
          currency: string
          ends_on: string | null
          hourly_rate: number | null
          id: string
          included_hours: number
          monthly_price: number | null
          name: string
          notes: string | null
          organization_id: string
          plan_name: string | null
          renewal_notice_days: number
          services: Json
          starts_on: string | null
          status: string
          support_sla_hours: number | null
          updated_at: string
        }
        Insert: {
          auto_renew?: boolean
          billing_frequency?: string
          contract_number?: string | null
          created_at?: string
          currency?: string
          ends_on?: string | null
          hourly_rate?: number | null
          id?: string
          included_hours?: number
          monthly_price?: number | null
          name: string
          notes?: string | null
          organization_id: string
          plan_name?: string | null
          renewal_notice_days?: number
          services?: Json
          starts_on?: string | null
          status?: string
          support_sla_hours?: number | null
          updated_at?: string
        }
        Update: {
          auto_renew?: boolean
          billing_frequency?: string
          contract_number?: string | null
          created_at?: string
          currency?: string
          ends_on?: string | null
          hourly_rate?: number | null
          id?: string
          included_hours?: number
          monthly_price?: number | null
          name?: string
          notes?: string | null
          organization_id?: string
          plan_name?: string | null
          renewal_notice_days?: number
          services?: Json
          starts_on?: string | null
          status?: string
          support_sla_hours?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_contracts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      service_invoice_items: {
        Row: {
          created_at: string
          description: string
          id: string
          invoice_id: string
          line_total: number
          quantity: number
          tax_rate: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          invoice_id: string
          line_total?: number
          quantity?: number
          tax_rate?: number
          unit_price?: number
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          invoice_id?: string
          line_total?: number
          quantity?: number
          tax_rate?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "service_invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "service_invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      service_invoices: {
        Row: {
          contract_id: string | null
          created_at: string
          created_by: string | null
          currency: string
          due_date: string | null
          id: string
          invoice_number: string
          issue_date: string
          notes: string | null
          organization_id: string
          pdf_storage_path: string | null
          status: string
          subtotal: number
          tax_total: number
          total: number
          updated_at: string
        }
        Insert: {
          contract_id?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          due_date?: string | null
          id?: string
          invoice_number: string
          issue_date?: string
          notes?: string | null
          organization_id: string
          pdf_storage_path?: string | null
          status?: string
          subtotal?: number
          tax_total?: number
          total?: number
          updated_at?: string
        }
        Update: {
          contract_id?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          due_date?: string | null
          id?: string
          invoice_number?: string
          issue_date?: string
          notes?: string | null
          organization_id?: string
          pdf_storage_path?: string | null
          status?: string
          subtotal?: number
          tax_total?: number
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_invoices_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "service_contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_invoices_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      service_payments: {
        Row: {
          amount: number
          created_at: string
          currency: string
          id: string
          invoice_id: string
          method: string
          organization_id: string
          paid_at: string | null
          recorded_by: string | null
          reference: string | null
          status: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          id?: string
          invoice_id: string
          method: string
          organization_id: string
          paid_at?: string | null
          recorded_by?: string | null
          reference?: string | null
          status?: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          invoice_id?: string
          method?: string
          organization_id?: string
          paid_at?: string | null
          recorded_by?: string | null
          reference?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "service_invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_payments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_members: {
        Row: {
          created_at: string
          created_by: string | null
          department: string
          employee_number: string | null
          employment_status: string
          ended_on: string | null
          id: string
          internal_phone: string | null
          job_title: string
          manager_id: string | null
          notes: string | null
          permissions: Json
          started_on: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          department?: string
          employee_number?: string | null
          employment_status?: string
          ended_on?: string | null
          id?: string
          internal_phone?: string | null
          job_title?: string
          manager_id?: string | null
          notes?: string | null
          permissions?: Json
          started_on?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          department?: string
          employee_number?: string | null
          employment_status?: string
          ended_on?: string | null
          id?: string
          internal_phone?: string | null
          job_title?: string
          manager_id?: string | null
          notes?: string | null
          permissions?: Json
          started_on?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      support_tickets: {
        Row: {
          assigned_to: string | null
          category: string
          created_at: string
          created_by: string
          description: string
          due_at: string | null
          id: string
          organization_id: string
          priority: string
          resolved_at: string | null
          status: string
          ticket_number: string
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          category?: string
          created_at?: string
          created_by: string
          description: string
          due_at?: string | null
          id?: string
          organization_id: string
          priority?: string
          resolved_at?: string | null
          status?: string
          ticket_number?: string
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          category?: string
          created_at?: string
          created_by?: string
          description?: string
          due_at?: string | null
          id?: string
          organization_id?: string
          priority?: string
          resolved_at?: string | null
          status?: string
          ticket_number?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_messages: {
        Row: {
          body: string
          created_at: string
          id: string
          is_internal: boolean
          organization_id: string
          sender_id: string
          ticket_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          is_internal?: boolean
          organization_id: string
          sender_id: string
          ticket_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          is_internal?: boolean
          organization_id?: string
          sender_id?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_messages_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_messages_ticket_org_fkey"
            columns: ["ticket_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id", "organization_id"]
          },
        ]
      }
      work_logs: {
        Row: {
          billable: boolean
          contract_id: string | null
          created_at: string
          description: string
          id: string
          logged_by: string
          minutes: number
          organization_id: string
          ticket_id: string | null
          worked_at: string
        }
        Insert: {
          billable?: boolean
          contract_id?: string | null
          created_at?: string
          description: string
          id?: string
          logged_by: string
          minutes: number
          organization_id: string
          ticket_id?: string | null
          worked_at?: string
        }
        Update: {
          billable?: boolean
          contract_id?: string | null
          created_at?: string
          description?: string
          id?: string
          logged_by?: string
          minutes?: number
          organization_id?: string
          ticket_id?: string | null
          worked_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_logs_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "service_contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_logs_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
