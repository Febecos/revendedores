import { neon } from '@neondatabase/serverless';
const url = process.env.DATABASE_URL;
const sql = neon(url);
const res = await sql`INSERT INTO fv_pedidos (numero, estado, payload) VALUES ('TEST-001', 'pendiente_confirmacion', '{"revendedor":{"nombre":"Test Revendedor","email":"test@test.com","whatsapp":"1155"},"items":[{"codigo":"PANEL-X","descripcion":"Panel Solar 500W","cantidad":5,"subtotal":815},{"codigo":"BRACKET-UF5000","descripcion":"Bracket baterias","cantidad":2,"subtotal":143}],"totales":{"neto":958,"iva":201.18,"total":1159.18}}'::jsonb) ON CONFLICT (numero) DO UPDATE SET estado='pendiente_confirmacion' RETURNING numero,estado`;
console.log('pedido FV insertado:', res[0]);
