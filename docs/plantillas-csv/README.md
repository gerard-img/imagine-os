# Plantillas CSV para carga masiva en Imagine OS

## Cómo usar

1. Abre la plantilla CSV en Google Sheets (Archivo → Importar → Subir)
2. Rellena los datos usando los valores de referencia de `_REFERENCIA_IDS.csv`
3. Exporta como CSV (Archivo → Descargar → CSV)
4. En Supabase: tabla → Insert → Import data from CSV

## Plantillas disponibles

| Archivo | Tabla destino | Uso |
|---------|--------------|-----|
| `personas.csv` | personas | Equipo del holding |
| `empresas.csv` | empresas | Clientes y prospectos |
| `proyectos.csv` | proyectos | Proyectos de clientes |
| `condiciones.csv` | condiciones | Contratos y condiciones laborales |
| `contactos_empresas.csv` | contactos_empresas | Contactos de clientes |
| `_REFERENCIA_IDS.csv` | — | IDs de lookup para rellenar las otras plantillas |

## Importante

- La columna `id` se puede dejar vacía — Supabase la genera automáticamente.
- `created_at` y `updated_at` también se generan solos.
- Los campos marcados como FK necesitan un UUID válido. Consulta `_REFERENCIA_IDS.csv`.
