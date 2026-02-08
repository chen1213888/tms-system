/**
 * This is a API server
 */

import express from 'express'
import cors from 'cors'
import path from 'path'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import authRoutes from './routes/auth.js'
import dashboardRoutes from './routes/dashboard.js'
import driverRoutes from './routes/drivers.js'
import driverGroupRoutes from './routes/driverGroups.js'
import vehicleRoutes from './routes/vehicles.js'
import vehicleGroupRoutes from './routes/vehicleGroups.js'
import trailerRoutes from './routes/trailers.js'
import trailerGroupRoutes from './routes/trailerGroups.js'
import userRoutes from './routes/users.js'
import roleRoutes from './routes/roles.js'
import logRoutes from './routes/logs.js'
import commonRecordRoutes from './routes/records/common.js'
import driverRecordRoutes from './routes/records/driver.js'
import { authenticateToken, isAdmin } from './middleware/auth.js'
import { operationLogger } from './middleware/operationLogger.js'

// for esm mode
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// load env
dotenv.config()

const app = express()

// Debug middleware
app.use((req, res, next) => {
  console.log(`[Request] ${req.method} ${req.url} - IP: ${req.ip} - Headers: ${JSON.stringify(req.headers)}`)
  next()
})

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

/**
 * API Routes
 */
// Public routes
app.use('/api/auth', authRoutes)

// Protected routes (Require Token)
const apiRouter = express.Router()
apiRouter.use(authenticateToken)
apiRouter.use(operationLogger)

apiRouter.use('/dashboard', dashboardRoutes)
apiRouter.use('/drivers', driverRoutes)
apiRouter.use('/driver-groups', driverGroupRoutes)
apiRouter.use('/vehicles', vehicleRoutes)
apiRouter.use('/vehicle-groups', vehicleGroupRoutes)
apiRouter.use('/trailers', trailerRoutes)
apiRouter.use('/trailer-groups', trailerGroupRoutes)
apiRouter.use('/users', isAdmin, userRoutes)
apiRouter.use('/roles', isAdmin, roleRoutes)
apiRouter.use('/logs', isAdmin, logRoutes)
apiRouter.use('/records', commonRecordRoutes)
apiRouter.use('/driver-records', driverRecordRoutes)

app.use('/api', apiRouter)

/**
 * health
 */
app.use(
  '/api/health',
  (req, res, next) => {
    res.status(200).json({
      success: true,
      message: 'ok',
    })
  },
)

/**
 * Static files for frontend
 */
import fs from 'fs'

// ...

if (process.env.NODE_ENV === 'production') {
  const clientDistPath = path.join(__dirname, '../client/dist')
  console.log('Client dist path:', clientDistPath)
  try {
    console.log('Dist files:', fs.readdirSync(clientDistPath))
  } catch (e) {
    console.error('Failed to read dist directory:', e.message)
  }

  app.use(express.static(clientDistPath))
  // ...确保 API 请求不会被通配符路由捕获
  app.get('*', (req, res, next) => {
    // 如果是 /api 开头的请求，调用 next() 交给后面的 404 处理
    if (req.path.startsWith('/api')) {
       return next()
    }
    res.sendFile(path.join(clientDistPath, 'index.html'))
  })
}

/**
 * error handler middleware
 */
app.use((error, req, res, next) => {
  console.error(error)
  res.status(500).json({
    success: false,
    error: 'Server internal error',
  })
})

/**
 * 404 handler
 */
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'API not found',
  })
})

export default app
