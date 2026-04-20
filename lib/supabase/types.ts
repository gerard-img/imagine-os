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
      asignaciones: {
        Row: {
          created_at: string
          cuota_planificacion_id: string
          deleted_at: string | null
          horas_reales: number | null
          id: string
          notas: string | null
          orden_trabajo_id: string
          persona_id: string
          porcentaje_ppto_tm: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          cuota_planificacion_id: string
          deleted_at?: string | null
          horas_reales?: number | null
          id?: string
          notas?: string | null
          orden_trabajo_id: string
          persona_id: string
          porcentaje_ppto_tm: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          cuota_planificacion_id?: string
          deleted_at?: string | null
          horas_reales?: number | null
          id?: string
          notas?: string | null
          orden_trabajo_id?: string
          persona_id?: string
          porcentaje_ppto_tm?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "asignaciones_cuota_planificacion_id_fkey"
            columns: ["cuota_planificacion_id"]
            isOneToOne: false
            referencedRelation: "cuotas_planificacion"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asignaciones_equipo_id_fkey"
            columns: ["persona_id"]
            isOneToOne: false
            referencedRelation: "personas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asignaciones_orden_trabajo_id_fkey"
            columns: ["orden_trabajo_id"]
            isOneToOne: false
            referencedRelation: "ordenes_trabajo"
            referencedColumns: ["id"]
          },
        ]
      }
      ausencias: {
        Row: {
          aprobado_por_id: string | null
          created_at: string
          dias_habiles: number | null
          estado: string
          fecha_fin: string
          fecha_inicio: string
          id: string
          notas: string | null
          persona_id: string
          tipo: string
          updated_at: string
        }
        Insert: {
          aprobado_por_id?: string | null
          created_at?: string
          dias_habiles?: number | null
          estado?: string
          fecha_fin: string
          fecha_inicio: string
          id?: string
          notas?: string | null
          persona_id: string
          tipo: string
          updated_at?: string
        }
        Update: {
          aprobado_por_id?: string | null
          created_at?: string
          dias_habiles?: number | null
          estado?: string
          fecha_fin?: string
          fecha_inicio?: string
          id?: string
          notas?: string | null
          persona_id?: string
          tipo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ausencias_aprobado_por_id_fkey"
            columns: ["aprobado_por_id"]
            isOneToOne: false
            referencedRelation: "personas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ausencias_persona_id_fkey"
            columns: ["persona_id"]
            isOneToOne: false
            referencedRelation: "personas"
            referencedColumns: ["id"]
          },
        ]
      }
      catalogo_servicios: {
        Row: {
          codigo: string
          created_at: string
          descripcion: string | null
          empresa_grupo_id: string
          id: string
          nombre: string
          updated_at: string
        }
        Insert: {
          codigo: string
          created_at?: string
          descripcion?: string | null
          empresa_grupo_id: string
          id?: string
          nombre: string
          updated_at?: string
        }
        Update: {
          codigo?: string
          created_at?: string
          descripcion?: string | null
          empresa_grupo_id?: string
          id?: string
          nombre?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "catalogo_servicios_empresa_grupo_id_fkey"
            columns: ["empresa_grupo_id"]
            isOneToOne: false
            referencedRelation: "empresas_grupo"
            referencedColumns: ["id"]
          },
        ]
      }
      ciudades: {
        Row: {
          created_at: string
          id: string
          nombre: string
          pais: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          nombre: string
          pais?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          nombre?: string
          pais?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      condiciones: {
        Row: {
          benefits: string | null
          coste_hora_calculado: number | null
          coste_seguridad_social: number | null
          created_at: string
          deleted_at: string | null
          departamento_id: string
          dias_vacaciones: number | null
          division_id: string
          empresa_grupo_id: string
          fecha_fin: string | null
          fecha_inicio: string
          horas_semana: number
          id: string
          jornada: string
          modalidad_trabajo: string | null
          notas: string | null
          periodo_prueba_fin: string | null
          persona_id: string
          porcentaje_variable: number | null
          puesto_id: string
          rango_id: string
          rol_id: string
          salario_bruto_anual: number
          salario_variable_anual: number | null
          tipo_contrato: string
          updated_at: string
        }
        Insert: {
          benefits?: string | null
          coste_hora_calculado?: number | null
          coste_seguridad_social?: number | null
          created_at?: string
          deleted_at?: string | null
          departamento_id: string
          dias_vacaciones?: number | null
          division_id: string
          empresa_grupo_id: string
          fecha_fin?: string | null
          fecha_inicio: string
          horas_semana: number
          id?: string
          jornada: string
          modalidad_trabajo?: string | null
          notas?: string | null
          periodo_prueba_fin?: string | null
          persona_id: string
          porcentaje_variable?: number | null
          puesto_id: string
          rango_id: string
          rol_id: string
          salario_bruto_anual: number
          salario_variable_anual?: number | null
          tipo_contrato: string
          updated_at?: string
        }
        Update: {
          benefits?: string | null
          coste_hora_calculado?: number | null
          coste_seguridad_social?: number | null
          created_at?: string
          deleted_at?: string | null
          departamento_id?: string
          dias_vacaciones?: number | null
          division_id?: string
          empresa_grupo_id?: string
          fecha_fin?: string | null
          fecha_inicio?: string
          horas_semana?: number
          id?: string
          jornada?: string
          modalidad_trabajo?: string | null
          notas?: string | null
          periodo_prueba_fin?: string | null
          persona_id?: string
          porcentaje_variable?: number | null
          puesto_id?: string
          rango_id?: string
          rol_id?: string
          salario_bruto_anual?: number
          salario_variable_anual?: number | null
          tipo_contrato?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "condiciones_departamento_id_fkey"
            columns: ["departamento_id"]
            isOneToOne: false
            referencedRelation: "departamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "condiciones_division_id_fkey"
            columns: ["division_id"]
            isOneToOne: false
            referencedRelation: "divisiones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "condiciones_empresa_grupo_id_fkey"
            columns: ["empresa_grupo_id"]
            isOneToOne: false
            referencedRelation: "empresas_grupo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "condiciones_persona_id_fkey"
            columns: ["persona_id"]
            isOneToOne: false
            referencedRelation: "personas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "condiciones_puesto_id_fkey"
            columns: ["puesto_id"]
            isOneToOne: false
            referencedRelation: "puestos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "condiciones_rango_id_fkey"
            columns: ["rango_id"]
            isOneToOne: false
            referencedRelation: "rangos_internos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "condiciones_rol_id_fkey"
            columns: ["rol_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      contactos_empresas: {
        Row: {
          activo: boolean
          apellidos: string | null
          assistant_email: string | null
          assistant_nombre: string | null
          cargo: string | null
          created_at: string
          departamento: string | null
          email: string | null
          empresa_id: string
          es_contacto_principal: boolean
          es_decisor: boolean
          fecha_cumpleanos: string | null
          fecha_ultimo_contacto: string | null
          id: string
          idioma_preferido: string | null
          linkedin_url: string | null
          movil: string | null
          nombre: string
          notas: string | null
          rol_influencia: string | null
          telefono_directo: string | null
          updated_at: string
        }
        Insert: {
          activo?: boolean
          apellidos?: string | null
          assistant_email?: string | null
          assistant_nombre?: string | null
          cargo?: string | null
          created_at?: string
          departamento?: string | null
          email?: string | null
          empresa_id: string
          es_contacto_principal?: boolean
          es_decisor?: boolean
          fecha_cumpleanos?: string | null
          fecha_ultimo_contacto?: string | null
          id?: string
          idioma_preferido?: string | null
          linkedin_url?: string | null
          movil?: string | null
          nombre: string
          notas?: string | null
          rol_influencia?: string | null
          telefono_directo?: string | null
          updated_at?: string
        }
        Update: {
          activo?: boolean
          apellidos?: string | null
          assistant_email?: string | null
          assistant_nombre?: string | null
          cargo?: string | null
          created_at?: string
          departamento?: string | null
          email?: string | null
          empresa_id?: string
          es_contacto_principal?: boolean
          es_decisor?: boolean
          fecha_cumpleanos?: string | null
          fecha_ultimo_contacto?: string | null
          id?: string
          idioma_preferido?: string | null
          linkedin_url?: string | null
          movil?: string | null
          nombre?: string
          notas?: string | null
          rol_influencia?: string | null
          telefono_directo?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contactos_empresas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      cuotas_planificacion: {
        Row: {
          created_at: string
          empresa_grupo_id: string
          fin_validez: string | null
          id: string
          inicio_validez: string
          nombre: string
          nota: string | null
          precio_hora: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          empresa_grupo_id: string
          fin_validez?: string | null
          id?: string
          inicio_validez: string
          nombre: string
          nota?: string | null
          precio_hora: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          empresa_grupo_id?: string
          fin_validez?: string | null
          id?: string
          inicio_validez?: string
          nombre?: string
          nota?: string | null
          precio_hora?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cuotas_por_rango_empresa_grupo_id_fkey"
            columns: ["empresa_grupo_id"]
            isOneToOne: false
            referencedRelation: "empresas_grupo"
            referencedColumns: ["id"]
          },
        ]
      }
      departamentos: {
        Row: {
          codigo: string
          created_at: string
          descripcion: string | null
          empresa_grupo_id: string
          id: string
          nombre: string
          updated_at: string
        }
        Insert: {
          codigo: string
          created_at?: string
          descripcion?: string | null
          empresa_grupo_id: string
          id?: string
          nombre: string
          updated_at?: string
        }
        Update: {
          codigo?: string
          created_at?: string
          descripcion?: string | null
          empresa_grupo_id?: string
          id?: string
          nombre?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "departamentos_empresa_grupo_id_fkey"
            columns: ["empresa_grupo_id"]
            isOneToOne: false
            referencedRelation: "empresas_grupo"
            referencedColumns: ["id"]
          },
        ]
      }
      divisiones: {
        Row: {
          created_at: string
          descripcion: string | null
          id: string
          nombre: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          descripcion?: string | null
          id?: string
          nombre: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          descripcion?: string | null
          id?: string
          nombre?: string
          updated_at?: string
        }
        Relationships: []
      }
      empresas: {
        Row: {
          calle: string | null
          cif: string | null
          ciudad: string | null
          clasificacion_cuenta: string | null
          codigo_postal: string | null
          created_at: string
          estado: string
          estado_prospecto: string | null
          facturacion_anual_estimada: number | null
          fecha_primer_contrato: string | null
          fuente_captacion: string | null
          id: string
          idioma_preferido: string | null
          linkedin_url: string | null
          moneda: string
          nombre_interno: string | null
          nombre_legal: string
          notas: string | null
          num_empleados: number | null
          pais: string | null
          provincia: string | null
          responsable_cuenta_id: string | null
          sector: string | null
          telefono: string | null
          tipo: string | null
          tipo_cliente: string | null
          tipo_conocido: string | null
          updated_at: string
          web: string | null
        }
        Insert: {
          calle?: string | null
          cif?: string | null
          ciudad?: string | null
          clasificacion_cuenta?: string | null
          codigo_postal?: string | null
          created_at?: string
          estado: string
          estado_prospecto?: string | null
          facturacion_anual_estimada?: number | null
          fecha_primer_contrato?: string | null
          fuente_captacion?: string | null
          id?: string
          idioma_preferido?: string | null
          linkedin_url?: string | null
          moneda?: string
          nombre_interno?: string | null
          nombre_legal: string
          notas?: string | null
          num_empleados?: number | null
          pais?: string | null
          provincia?: string | null
          responsable_cuenta_id?: string | null
          sector?: string | null
          telefono?: string | null
          tipo?: string | null
          tipo_cliente?: string | null
          tipo_conocido?: string | null
          updated_at?: string
          web?: string | null
        }
        Update: {
          calle?: string | null
          cif?: string | null
          ciudad?: string | null
          clasificacion_cuenta?: string | null
          codigo_postal?: string | null
          created_at?: string
          estado?: string
          estado_prospecto?: string | null
          facturacion_anual_estimada?: number | null
          fecha_primer_contrato?: string | null
          fuente_captacion?: string | null
          id?: string
          idioma_preferido?: string | null
          linkedin_url?: string | null
          moneda?: string
          nombre_interno?: string | null
          nombre_legal?: string
          notas?: string | null
          num_empleados?: number | null
          pais?: string | null
          provincia?: string | null
          responsable_cuenta_id?: string | null
          sector?: string | null
          telefono?: string | null
          tipo?: string | null
          tipo_cliente?: string | null
          tipo_conocido?: string | null
          updated_at?: string
          web?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "empresas_responsable_cuenta_id_fkey"
            columns: ["responsable_cuenta_id"]
            isOneToOne: false
            referencedRelation: "personas"
            referencedColumns: ["id"]
          },
        ]
      }
      empresas_grupo: {
        Row: {
          cif: string
          codigo: string
          color_marca: string | null
          created_at: string
          email_general: string | null
          id: string
          logo_url: string | null
          moneda_base: string
          nombre: string
          nombre_legal: string | null
          pais: string | null
          telefono: string | null
          updated_at: string
          web: string | null
        }
        Insert: {
          cif: string
          codigo: string
          color_marca?: string | null
          created_at?: string
          email_general?: string | null
          id?: string
          logo_url?: string | null
          moneda_base?: string
          nombre: string
          nombre_legal?: string | null
          pais?: string | null
          telefono?: string | null
          updated_at?: string
          web?: string | null
        }
        Update: {
          cif?: string
          codigo?: string
          color_marca?: string | null
          created_at?: string
          email_general?: string | null
          id?: string
          logo_url?: string | null
          moneda_base?: string
          nombre?: string
          nombre_legal?: string | null
          pais?: string | null
          telefono?: string | null
          updated_at?: string
          web?: string | null
        }
        Relationships: []
      }
      horas_trabajables: {
        Row: {
          comentarios: string | null
          created_at: string
          departamento_id: string | null
          empresa_grupo_id: string
          horas: number
          id: string
          mes_trabajo: string
          persona_id: string | null
          updated_at: string
        }
        Insert: {
          comentarios?: string | null
          created_at?: string
          departamento_id?: string | null
          empresa_grupo_id: string
          horas: number
          id?: string
          mes_trabajo: string
          persona_id?: string | null
          updated_at?: string
        }
        Update: {
          comentarios?: string | null
          created_at?: string
          departamento_id?: string | null
          empresa_grupo_id?: string
          horas?: number
          id?: string
          mes_trabajo?: string
          persona_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "horas_trabajables_departamento_id_fkey"
            columns: ["departamento_id"]
            isOneToOne: false
            referencedRelation: "departamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "horas_trabajables_empresa_grupo_id_fkey"
            columns: ["empresa_grupo_id"]
            isOneToOne: false
            referencedRelation: "empresas_grupo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "horas_trabajables_equipo_id_fkey"
            columns: ["persona_id"]
            isOneToOne: false
            referencedRelation: "personas"
            referencedColumns: ["id"]
          },
        ]
      }
      oficinas: {
        Row: {
          created_at: string
          id: string
          nombre: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          nombre: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          nombre?: string
          updated_at?: string
        }
        Relationships: []
      }
      ordenes_trabajo: {
        Row: {
          aprobador_id: string
          created_at: string
          deleted_at: string | null
          departamento_id: string
          estado: string
          fecha_fin: string | null
          fecha_inicio: string
          horas_planificadas: number | null
          horas_reales: number | null
          id: string
          mes_anio: string
          notas: string | null
          partida_prevista: number
          partida_real: number | null
          porcentaje_ppto_mes: number
          proyecto_id: string
          servicio_id: string | null
          titulo: string | null
          updated_at: string
        }
        Insert: {
          aprobador_id: string
          created_at?: string
          deleted_at?: string | null
          departamento_id: string
          estado: string
          fecha_fin?: string | null
          fecha_inicio: string
          horas_planificadas?: number | null
          horas_reales?: number | null
          id?: string
          mes_anio: string
          notas?: string | null
          partida_prevista: number
          partida_real?: number | null
          porcentaje_ppto_mes: number
          proyecto_id: string
          servicio_id?: string | null
          titulo?: string | null
          updated_at?: string
        }
        Update: {
          aprobador_id?: string
          created_at?: string
          deleted_at?: string | null
          departamento_id?: string
          estado?: string
          fecha_fin?: string | null
          fecha_inicio?: string
          horas_planificadas?: number | null
          horas_reales?: number | null
          id?: string
          mes_anio?: string
          notas?: string | null
          partida_prevista?: number
          partida_real?: number | null
          porcentaje_ppto_mes?: number
          proyecto_id?: string
          servicio_id?: string | null
          titulo?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ordenes_trabajo_aprobador_id_fkey"
            columns: ["aprobador_id"]
            isOneToOne: false
            referencedRelation: "personas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordenes_trabajo_departamento_id_fkey"
            columns: ["departamento_id"]
            isOneToOne: false
            referencedRelation: "departamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordenes_trabajo_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "proyectos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordenes_trabajo_servicio_id_fkey"
            columns: ["servicio_id"]
            isOneToOne: false
            referencedRelation: "catalogo_servicios"
            referencedColumns: ["id"]
          },
        ]
      }
      ordenes_trabajo_personas: {
        Row: {
          created_at: string
          id: string
          orden_trabajo_id: string
          persona_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          orden_trabajo_id: string
          persona_id: string
        }
        Update: {
          created_at?: string
          id?: string
          orden_trabajo_id?: string
          persona_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ordenes_trabajo_equipo_equipo_id_fkey"
            columns: ["persona_id"]
            isOneToOne: false
            referencedRelation: "personas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordenes_trabajo_equipo_orden_trabajo_id_fkey"
            columns: ["orden_trabajo_id"]
            isOneToOne: false
            referencedRelation: "ordenes_trabajo"
            referencedColumns: ["id"]
          },
        ]
      }
      personas: {
        Row: {
          activo: boolean
          apellido_primero: string
          apellido_segundo: string | null
          auth_user_id: string | null
          ciudad_id: string
          created_at: string
          division_id: string
          dni: string
          email_corporativo: string | null
          email_personal: string | null
          empresa_grupo_id: string
          fecha_baja: string | null
          fecha_incorporacion: string | null
          fecha_nacimiento: string | null
          foto_url: string | null
          id: string
          linkedin_url: string | null
          modalidad_trabajo: string | null
          nivel_ingles: string | null
          nombre: string
          oficina_id: string | null
          persona: string
          puesto_id: string | null
          rango_es_interino: boolean
          rango_id: string | null
          rol_id: string
          skills_tags: string[] | null
          telefono: string | null
          updated_at: string
        }
        Insert: {
          activo?: boolean
          apellido_primero: string
          apellido_segundo?: string | null
          auth_user_id?: string | null
          ciudad_id: string
          created_at?: string
          division_id: string
          dni: string
          email_corporativo?: string | null
          email_personal?: string | null
          empresa_grupo_id: string
          fecha_baja?: string | null
          fecha_incorporacion?: string | null
          fecha_nacimiento?: string | null
          foto_url?: string | null
          id?: string
          linkedin_url?: string | null
          modalidad_trabajo?: string | null
          nivel_ingles?: string | null
          nombre: string
          oficina_id?: string | null
          persona: string
          puesto_id?: string | null
          rango_es_interino?: boolean
          rango_id?: string | null
          rol_id: string
          skills_tags?: string[] | null
          telefono?: string | null
          updated_at?: string
        }
        Update: {
          activo?: boolean
          apellido_primero?: string
          apellido_segundo?: string | null
          auth_user_id?: string | null
          ciudad_id?: string
          created_at?: string
          division_id?: string
          dni?: string
          email_corporativo?: string | null
          email_personal?: string | null
          empresa_grupo_id?: string
          fecha_baja?: string | null
          fecha_incorporacion?: string | null
          fecha_nacimiento?: string | null
          foto_url?: string | null
          id?: string
          linkedin_url?: string | null
          modalidad_trabajo?: string | null
          nivel_ingles?: string | null
          nombre?: string
          oficina_id?: string | null
          persona?: string
          puesto_id?: string | null
          rango_es_interino?: boolean
          rango_id?: string | null
          rol_id?: string
          skills_tags?: string[] | null
          telefono?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "equipo_ciudad_id_fkey"
            columns: ["ciudad_id"]
            isOneToOne: false
            referencedRelation: "ciudades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipo_empresa_grupo_id_fkey"
            columns: ["empresa_grupo_id"]
            isOneToOne: false
            referencedRelation: "empresas_grupo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipo_oficina_id_fkey"
            columns: ["oficina_id"]
            isOneToOne: false
            referencedRelation: "oficinas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipo_puesto_id_fkey"
            columns: ["puesto_id"]
            isOneToOne: false
            referencedRelation: "puestos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipo_rango_id_fkey"
            columns: ["rango_id"]
            isOneToOne: false
            referencedRelation: "rangos_internos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "personas_division_id_fkey"
            columns: ["division_id"]
            isOneToOne: false
            referencedRelation: "divisiones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "personas_rol_id_fkey"
            columns: ["rol_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      personas_departamentos: {
        Row: {
          created_at: string
          departamento_id: string
          id: string
          persona_id: string
          porcentaje_tiempo: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          departamento_id: string
          id?: string
          persona_id: string
          porcentaje_tiempo?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          departamento_id?: string
          id?: string
          persona_id?: string
          porcentaje_tiempo?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "personas_departamentos_departamento_id_fkey"
            columns: ["departamento_id"]
            isOneToOne: false
            referencedRelation: "departamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "personas_departamentos_persona_id_fkey"
            columns: ["persona_id"]
            isOneToOne: false
            referencedRelation: "personas"
            referencedColumns: ["id"]
          },
        ]
      }
      proyectos: {
        Row: {
          archivado_at: string | null
          contacto_principal_id: string | null
          created_at: string
          deleted_at: string | null
          descripcion: string | null
          empresa_grupo_id: string
          empresa_id: string | null
          estado: string
          explicacion_presupuestos: string | null
          fecha_activacion: string | null
          fecha_cierre: string | null
          fecha_propuesta: string | null
          id: string
          margen_objetivo_pct: number | null
          notas: string | null
          ppto_estimado: number
          probabilidad_cierre: number | null
          responsable_id: string
          tags: string[] | null
          tipo_facturacion: string | null
          tipo_partida: string
          tipo_proyecto: string
          titulo: string
          updated_at: string
          valor_estimado_total: number | null
        }
        Insert: {
          archivado_at?: string | null
          contacto_principal_id?: string | null
          created_at?: string
          deleted_at?: string | null
          descripcion?: string | null
          empresa_grupo_id: string
          empresa_id?: string | null
          estado: string
          explicacion_presupuestos?: string | null
          fecha_activacion?: string | null
          fecha_cierre?: string | null
          fecha_propuesta?: string | null
          id?: string
          margen_objetivo_pct?: number | null
          notas?: string | null
          ppto_estimado: number
          probabilidad_cierre?: number | null
          responsable_id: string
          tags?: string[] | null
          tipo_facturacion?: string | null
          tipo_partida: string
          tipo_proyecto: string
          titulo: string
          updated_at?: string
          valor_estimado_total?: number | null
        }
        Update: {
          archivado_at?: string | null
          contacto_principal_id?: string | null
          created_at?: string
          deleted_at?: string | null
          descripcion?: string | null
          empresa_grupo_id?: string
          empresa_id?: string | null
          estado?: string
          explicacion_presupuestos?: string | null
          fecha_activacion?: string | null
          fecha_cierre?: string | null
          fecha_propuesta?: string | null
          id?: string
          margen_objetivo_pct?: number | null
          notas?: string | null
          ppto_estimado?: number
          probabilidad_cierre?: number | null
          responsable_id?: string
          tags?: string[] | null
          tipo_facturacion?: string | null
          tipo_partida?: string
          tipo_proyecto?: string
          titulo?: string
          updated_at?: string
          valor_estimado_total?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "proyectos_aprobador_final_id_fkey"
            columns: ["responsable_id"]
            isOneToOne: false
            referencedRelation: "personas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proyectos_contacto_principal_id_fkey"
            columns: ["contacto_principal_id"]
            isOneToOne: false
            referencedRelation: "contactos_empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proyectos_empresa_grupo_id_fkey"
            columns: ["empresa_grupo_id"]
            isOneToOne: false
            referencedRelation: "empresas_grupo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proyectos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      proyectos_departamentos: {
        Row: {
          created_at: string
          departamento_id: string
          id: string
          proyecto_id: string
        }
        Insert: {
          created_at?: string
          departamento_id: string
          id?: string
          proyecto_id: string
        }
        Update: {
          created_at?: string
          departamento_id?: string
          id?: string
          proyecto_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "proyectos_departamentos_departamento_id_fkey"
            columns: ["departamento_id"]
            isOneToOne: false
            referencedRelation: "departamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proyectos_departamentos_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "proyectos"
            referencedColumns: ["id"]
          },
        ]
      }
      puestos: {
        Row: {
          codigo: string
          created_at: string
          descripcion: string | null
          empresa_grupo_id: string
          id: string
          nombre: string
          updated_at: string
        }
        Insert: {
          codigo: string
          created_at?: string
          descripcion?: string | null
          empresa_grupo_id: string
          id?: string
          nombre: string
          updated_at?: string
        }
        Update: {
          codigo?: string
          created_at?: string
          descripcion?: string | null
          empresa_grupo_id?: string
          id?: string
          nombre?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "puestos_empresa_grupo_id_fkey"
            columns: ["empresa_grupo_id"]
            isOneToOne: false
            referencedRelation: "empresas_grupo"
            referencedColumns: ["id"]
          },
        ]
      }
      rangos_internos: {
        Row: {
          codigo: string
          created_at: string
          descripcion: string | null
          empresa_grupo_id: string
          id: string
          nombre: string
          orden: number | null
          updated_at: string
        }
        Insert: {
          codigo: string
          created_at?: string
          descripcion?: string | null
          empresa_grupo_id: string
          id?: string
          nombre: string
          orden?: number | null
          updated_at?: string
        }
        Update: {
          codigo?: string
          created_at?: string
          descripcion?: string | null
          empresa_grupo_id?: string
          id?: string
          nombre?: string
          orden?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rangos_internos_empresa_grupo_id_fkey"
            columns: ["empresa_grupo_id"]
            isOneToOne: false
            referencedRelation: "empresas_grupo"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          created_at: string
          descripcion: string | null
          id: string
          nivel_acceso: string
          nombre: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          descripcion?: string | null
          id?: string
          nivel_acceso?: string
          nombre: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          descripcion?: string | null
          id?: string
          nivel_acceso?: string
          nombre?: string
          updated_at?: string
        }
        Relationships: []
      }
      servicios_y_depts: {
        Row: {
          created_at: string
          departamento_id: string
          id: string
          servicio_id: string
        }
        Insert: {
          created_at?: string
          departamento_id: string
          id?: string
          servicio_id: string
        }
        Update: {
          created_at?: string
          departamento_id?: string
          id?: string
          servicio_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "servicios_y_depts_departamento_id_fkey"
            columns: ["departamento_id"]
            isOneToOne: false
            referencedRelation: "departamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "servicios_y_depts_servicio_id_fkey"
            columns: ["servicio_id"]
            isOneToOne: false
            referencedRelation: "catalogo_servicios"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_mi_empresa_grupo_id: { Args: never; Returns: string }
      get_mi_nivel_acceso: { Args: never; Returns: string }
      get_mi_persona_id: { Args: never; Returns: string }
      puede_escribir_por_empresa: { Args: { eg_id: string }; Returns: boolean }
      puede_leer_por_empresa: { Args: { eg_id: string }; Returns: boolean }
      vincular_persona_por_email: {
        Args: { p_auth_user_id: string; p_email: string }
        Returns: undefined
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

// ── Alias cortos para usar en componentes ──
// Generados por scripts/patch-types.mjs — no editar a mano.

export type EmpresaGrupo = Database['public']['Tables']['empresas_grupo']['Row']
export type CatalogoServicio = Database['public']['Tables']['catalogo_servicios']['Row']
export type Departamento = Database['public']['Tables']['departamentos']['Row']
export type ServicioYDept = Database['public']['Tables']['servicios_y_depts']['Row']
export type RangoInterno = Database['public']['Tables']['rangos_internos']['Row']
export type Puesto = Database['public']['Tables']['puestos']['Row']
export type Division = Database['public']['Tables']['divisiones']['Row']
export type Rol = Database['public']['Tables']['roles']['Row']
export type Ciudad = Database['public']['Tables']['ciudades']['Row']
export type Oficina = Database['public']['Tables']['oficinas']['Row']
export type Persona = Database['public']['Tables']['personas']['Row']
export type PersonaDepartamento = Database['public']['Tables']['personas_departamentos']['Row']
export type Condicion = Database['public']['Tables']['condiciones']['Row']
export type Ausencia = Database['public']['Tables']['ausencias']['Row']
export type Empresa = Database['public']['Tables']['empresas']['Row']
export type ContactoEmpresa = Database['public']['Tables']['contactos_empresas']['Row']
export type Proyecto = Database['public']['Tables']['proyectos']['Row']
export type ProyectoDepartamento = Database['public']['Tables']['proyectos_departamentos']['Row']
export type OrdenTrabajo = Database['public']['Tables']['ordenes_trabajo']['Row']
export type OrdenTrabajoPersona = Database['public']['Tables']['ordenes_trabajo_personas']['Row']
export type Asignacion = Database['public']['Tables']['asignaciones']['Row']
export type CuotaPlanificacion = Database['public']['Tables']['cuotas_planificacion']['Row']
export type HorasTrabajables = Database['public']['Tables']['horas_trabajables']['Row']
