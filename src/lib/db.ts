// src/lib/db.ts — Neon DB client compartido para el portal de revendedores
import { neon } from '@neondatabase/serverless'

export function getDb() {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('DATABASE_URL no configurada')
  return neon(url)
}
