import mysql from 'mysql2/promise'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function initDB() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      multipleStatements: true
    })

    console.log('Connected to MySQL server.')

    const sqlPath = path.resolve(__dirname, '../migrations/init.sql')
    const sql = fs.readFileSync(sqlPath, 'utf8')

    console.log('Executing initialization SQL...')
    await connection.query(sql)

    console.log('Database initialized successfully.')
    await connection.end()
  } catch (error) {
    console.error('Error initializing database:', error)
    process.exit(1)
  }
}

initDB()
