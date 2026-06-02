import { neon } from '@neondatabase/serverless'
const DB = 'postgresql://neondb_owner:npg_xSqkcepYGZ47@ep-muddy-shape-am1uev5m-pooler.c-5.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require'
const sql = neon(DB)

// Ver estructura de la tabla
const cols = await sql`
  SELECT column_name, data_type, column_default
  FROM information_schema.columns
  WHERE table_name = 'solicitudes_revendedor'
  ORDER BY ordinal_position
`
console.log('Columnas:', cols.map(c => c.column_name).join(', '))

// Ver si ya existe
const existe = await sql`SELECT id, nombre, email FROM solicitudes_revendedor WHERE email = 'guille.aol@gmail.com'`
if (existe.length > 0) {
  console.log('Ya existe:', existe[0])
  process.exit(0)
}

// Insertar
const r = await sql`
  INSERT INTO solicitudes_revendedor (
    nombre, apellido, email, whatsapp, empresa, provincia,
    descuento_pct, token_acceso, token_acceso_activo,
    aprobado, skip_pin, tipo_usuario, puede_pedir_online,
    estado, created_at
  ) VALUES (
    'Guillermo', 'Sandler', 'guille.aol@gmail.com', '5491127399430',
    'Febecos', 'Buenos Aires',
    18, 'ADMIN2025', true,
    true, true, 'admin', true,
    'aprobado', NOW()
  ) RETURNING id, nombre, email, token_acceso, descuento_pct
`
console.log('✓ Restaurado:', r[0])
