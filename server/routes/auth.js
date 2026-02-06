import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import sequelize from '../config/db.js'
import { authenticateToken } from '../middleware/auth.js'

const router = Router()

/**
 * User Login
 * POST /api/auth/login
 */
router.post('/login', async (req, res) => {
  const { username, password } = req.body

  if (!username || !password) {
    return res.status(400).json({ code: 400, message: '用户名和密码不能为空' })
  }

  try {
    const [users] = await sequelize.query(`
      SELECT u.*, r.description as role_name 
      FROM users u 
      LEFT JOIN roles r ON u.role_id = r.id 
      WHERE u.username = ? 
      LIMIT 1
    `, {
      replacements: [username]
    })

    const user = users[0]

    if (!user) {
      return res.status(401).json({ code: 401, message: '用户名或密码错误' })
    }

    // 验证密码
    const isValid = await bcrypt.compare(password, user.password_hash)
    if (!isValid) {
      return res.status(401).json({ code: 401, message: '用户名或密码错误' })
    }

    // 签发 Token，有效期为 24 小时
    const token = jwt.sign(
      { id: user.id, username: user.username, role_id: user.role_id, role_name: user.role_name },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '24h' }
    )

    res.json({
      code: 200,
      message: '登录成功',
      data: {
        token,
        userInfo: {
          id: user.id,
          username: user.username,
          role_id: user.role_id,
          role_name: user.role_name
        }
      }
    })
  } catch (error) {
    console.error('Login Error:', error)
    res.status(500).json({ code: 500, message: '服务器内部错误' })
  }
})

/**
 * Get User Info
 * GET /api/auth/userinfo
 */
router.get('/userinfo', authenticateToken, async (req, res) => {
  res.json({
    code: 200,
    data: req.user
  })
})

export default router
