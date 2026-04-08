// ============================================================
// Tipos de la base de datos — Company OS
//
// Generados manualmente a partir del esquema SQL (migraciones 001–017).
// Cuando conectes la CLI de Supabase a tu proyecto puedes regenerarlos:
//   npx supabase gen types typescript --project-id <id> > lib/supabase/types.ts
// ============================================================

export type Database = {
  public: {
    Tables: {
      empresas_grupo: {
        Row: {
          id: string
          nombre: string
          nombre_legal: string | null
          codigo: string
          cif: string
          pais: string | null
          moneda_base: string
          web: string | null
          email_general: string | null
          telefono: string | null
          logo_url: string | null
          color_marca: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['empresas_grupo']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string
          created_at?: string
          updated_at?: string
        }
      }
      catalogo_servicios: {
        Row: {
          id: string
          empresa_grupo_id: string
          nombre: string
          codigo: string
          descripcion: string | null
          created_at: string
          updated_at: string
        }
      }
      departamentos: {
        Row: {
          id: string
          empresa_grupo_id: string
          nombre: string
          codigo: string
          descripcion: string | null
          created_at: string
          updated_at: string
        }
      }
      servicios_y_depts: {
        Row: {
          id: string
          servicio_id: string
          departamento_id: string
          created_at: string
        }
      }
      rangos_internos: {
        Row: {
          id: string
          empresa_grupo_id: string
          nombre: string
          codigo: string
          orden: number | null
          descripcion: string | null
          created_at: string
          updated_at: string
        }
      }
      puestos: {
        Row: {
          id: string
          empresa_grupo_id: string
          nombre: string
          codigo: string
          descripcion: string | null
          created_at: string
          updated_at: string
        }
      }
      divisiones: {
        Row: {
          id: string
          nombre: string
          descripcion: string | null
          created_at: string
          updated_at: string
        }
      }
      roles: {
        Row: {
          id: string
          nombre: string
          descripcion: string | null
          nivel_acceso: 'global' | 'empresa' | 'personal'
          created_at: string
          updated_at: string
        }
      }
      ciudades: {
        Row: {
          id: string
          nombre: string
          pais: string | null
          created_at: string
          updated_at: string
        }
      }
      oficinas: {
        Row: {
          id: string
          nombre: string
          created_at: string
          updated_at: string
        }
      }
      personas: {
        Row: {
          id: string
          persona: string
          dni: string
          nombre: string
          apellido_primero: string
          apellido_segundo: string | null
          empresa_grupo_id: string
          ciudad_id: string
          oficina_id: string | null
          rango_id: string
          puesto_id: string
          division_id: string
          rol_id: string
          fecha_incorporacion: string
          fecha_baja: string | null
          activo: boolean
          rango_es_interino: boolean
          // Nuevos — migración 017
          email_corporativo: string | null
          email_personal: string | null
          telefono: string | null
          linkedin_url: string | null
          fecha_nacimiento: string | null
          foto_url: string | null
          modalidad_trabajo: 'Presencial' | 'Híbrido' | 'Remoto' | null
          nivel_ingles: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2' | 'Nativo' | null
          skills_tags: string[] | null
          auth_user_id: string | null
          created_at: string
          updated_at: string
        }
      }
      personas_departamentos: {
        Row: {
          id: string
          persona_id: string
          departamento_id: string
          porcentaje_tiempo: number
          created_at: string
          updated_at: string
        }
      }
      condiciones: {
        Row: {
          id: string
          persona_id: string
          fecha_inicio: string
          fecha_fin: string | null
          empresa_grupo_id: string
          departamento_id: string
          rango_id: string
          puesto_id: string
          division_id: string
          rol_id: string
          salario_bruto_anual: number
          tipo_contrato: 'Indefinido' | 'Temporal' | 'Prácticas' | 'Autónomo' | 'Becario' | 'Sustitución'
          jornada: 'Completa' | 'Parcial' | 'Media jornada'
          horas_semana: number
          benefits: string | null
          coste_seguridad_social: number | null
          notas: string | null
          // Nuevos — migración 017
          salario_variable_anual: number | null
          porcentaje_variable: number | null
          dias_vacaciones: number | null
          periodo_prueba_fin: string | null
          modalidad_trabajo: 'Presencial' | 'Híbrido' | 'Remoto' | null
          coste_hora_calculado: number | null
          deleted_at: string | null
          created_at: string
          updated_at: string
        }
      }
      ausencias: {
        Row: {
          id: string
          persona_id: string
          tipo: 'Vacaciones' | 'Baja médica' | 'Permiso personal' | 'Maternidad/Paternidad' | 'Formación' | 'Asunto propio' | 'Festivo'
          fecha_inicio: string
          fecha_fin: string
          notas: string | null
          // Nuevos — migración 017
          estado: 'Solicitada' | 'Aprobada' | 'Rechazada'
          aprobado_por_id: string | null
          dias_habiles: number | null
          created_at: string
          updated_at: string
        }
      }
      empresas: {
        Row: {
          id: string
          nombre_legal: string
          cif: string | null
          nombre_interno: string | null
          estado: 'Conocido' | 'Prospecto' | 'Cliente' | 'Baja' | 'Otros'
          tipo: 'Marca' | 'Fabricante' | 'Fondo' | 'Agencia' | 'Tecnología' | null
          tipo_conocido: string | null
          tipo_cliente: string | null
          estado_prospecto: string | null
          fecha_primer_contrato: string | null
          // Dirección estructurada (migración 017 — reemplaza el campo libre 'direccion')
          calle: string | null
          codigo_postal: string | null
          ciudad: string | null
          provincia: string | null
          pais: string | null
          sector: string | null
          web: string | null
          notas: string | null
          // Nuevos — migración 017
          linkedin_url: string | null
          telefono: string | null
          num_empleados: number | null
          facturacion_anual_estimada: number | null
          clasificacion_cuenta: 'A' | 'B' | 'C' | null
          moneda: string
          idioma_preferido: string | null
          fuente_captacion: 'Inbound' | 'Outbound' | 'Referido' | 'Evento' | 'Red propia' | 'Otro' | null
          responsable_cuenta_id: string | null
          created_at: string
          updated_at: string
        }
      }
      contactos_empresas: {
        Row: {
          id: string
          empresa_id: string
          nombre: string
          apellidos: string | null
          email: string | null
          // telefono renombrado a telefono_directo en migración 017
          telefono_directo: string | null
          movil: string | null
          cargo: string | null
          departamento: string | null
          es_decisor: boolean
          es_contacto_principal: boolean
          notas: string | null
          activo: boolean
          // Nuevos — migración 017
          linkedin_url: string | null
          rol_influencia: 'Champion' | 'Decision Maker' | 'Economic Buyer' | 'Influencer' | 'Blocker' | null
          fecha_ultimo_contacto: string | null
          idioma_preferido: string | null
          fecha_cumpleanos: string | null
          assistant_nombre: string | null
          assistant_email: string | null
          created_at: string
          updated_at: string
        }
      }
      proyectos: {
        Row: {
          id: string
          empresa_id: string | null
          empresa_grupo_id: string
          titulo: string
          descripcion: string | null
          tipo_proyecto: 'Interno' | 'Externo' | 'Facturable'
          tipo_partida: 'Puntual' | 'Recurrente'
          estado: 'Propuesta' | 'Confirmado' | 'Activo' | 'Pausado' | 'Finalizado' | 'Cancelado'
          responsable_id: string
          ppto_estimado: number
          explicacion_presupuestos: string | null
          fecha_activacion: string | null
          fecha_cierre: string | null
          notas: string | null
          // Nuevos — migración 017
          contacto_principal_id: string | null
          probabilidad_cierre: number | null
          valor_estimado_total: number | null
          margen_objetivo_pct: number | null
          tipo_facturacion: 'Precio fijo' | 'Por horas' | 'Retainer' | 'Éxito' | null
          tags: string[] | null
          fecha_propuesta: string | null
          created_at: string
          updated_at: string
        }
      }
      proyectos_departamentos: {
        Row: {
          id: string
          proyecto_id: string
          departamento_id: string
          created_at: string
        }
      }
      ordenes_trabajo: {
        Row: {
          id: string
          proyecto_id: string
          servicio_id: string | null
          departamento_id: string
          mes_anio: string
          porcentaje_ppto_mes: number
          partida_prevista: number
          partida_real: number | null
          aprobador_id: string
          estado: 'Propuesto' | 'Planificado' | 'Confirmado' | 'Facturado'
          fecha_inicio: string
          fecha_fin: string | null
          notas: string | null
          // Nuevos — migración 017
          titulo: string | null
          horas_planificadas: number | null
          horas_reales: number | null
          deleted_at: string | null
          created_at: string
          updated_at: string
        }
      }
      ordenes_trabajo_personas: {
        Row: {
          id: string
          orden_trabajo_id: string
          persona_id: string
          created_at: string
        }
      }
      asignaciones: {
        Row: {
          id: string
          orden_trabajo_id: string
          persona_id: string
          porcentaje_ppto_tm: number
          cuota_planificacion_id: string
          // Nuevos — migración 017
          horas_reales: number | null
          notas: string | null
          deleted_at: string | null
          created_at: string
          updated_at: string
        }
      }
      cuotas_planificacion: {
        Row: {
          id: string
          empresa_grupo_id: string
          nombre: string
          precio_hora: number
          inicio_validez: string
          fin_validez: string | null
          nota: string | null
          created_at: string
          updated_at: string
        }
      }
      horas_trabajables: {
        Row: {
          id: string
          empresa_grupo_id: string
          mes_trabajo: string
          horas: number
          departamento_id: string | null
          persona_id: string | null
          comentarios: string | null
          created_at: string
          updated_at: string
        }
      }
    }
  }
}

// ── Alias cortos para usar en componentes ──
// Así escribes EmpresaGrupo en vez de Database['public']['Tables']['empresas_grupo']['Row']

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
