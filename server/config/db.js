import { Sequelize } from 'sequelize'
import dotenv from 'dotenv'

dotenv.config()

// Log database configuration status (for debugging)
console.log('Database Configuration Check:');
console.log('DB_HOST:', process.env.MYSQL_HOST || process.env.DB_HOST ? '(Set)' : '(Missing)');
console.log('DB_USER:', process.env.MYSQL_USER || process.env.DB_USER ? '(Set)' : '(Missing)');
console.log('DB_PASS:', process.env.MYSQL_PASSWORD || process.env.DB_PASS ? '(Set)' : '(Missing)');
console.log('DB_NAME:', process.env.MYSQL_DATABASE || process.env.DB_NAME ? '(Set)' : '(Missing)');

const sequelize = new Sequelize(
  process.env.MYSQL_DATABASE || process.env.DB_NAME,
  process.env.MYSQL_USER || process.env.DB_USER,
  process.env.MYSQL_PASSWORD || process.env.DB_PASS,
  {
    host: process.env.MYSQL_HOST || process.env.DB_HOST,
    port: process.env.MYSQL_PORT || process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
)

export default sequelize
