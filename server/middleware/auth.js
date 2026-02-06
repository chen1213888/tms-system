import jwt from 'jsonwebtoken'

/**
 * Token 验证中间件
 */
export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    return res.status(401).json({ code: 401, message: '未登录' })
  }

  jwt.verify(token, process.env.JWT_SECRET || 'secret', (err, user) => {
    if (err) {
      return res.status(401).json({ code: 401, message: 'Token 无效或已过期' })
    }
    req.user = user
    next()
  })
}

/**
 * 管理员权限验证中间件
 */
export const isAdmin = (req, res, next) => {
  if (req.user && req.user.role_id === 1) {
    next()
  } else {
    res.status(403).json({ code: 403, message: '权限不足，仅管理员可操作' })
  }
}
