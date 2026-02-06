import { Router } from 'express'
import bcrypt from 'bcryptjs'
import sequelize from '../config/db.js'

const router = Router()

/**
 * Get User List
 * GET /api/users
 */
router.get('/', async (req, res) => {
  const { page = 1, limit = 10, keyword } = req.query
  const offset = (page - 1) * limit
  
  try {
    let query = `
      SELECT u.id, u.username, u.email, u.phone, u.status, u.role_id, u.created_at, r.name as role_name 
      FROM users u 
      LEFT JOIN roles r ON u.role_id = r.id 
      WHERE 1=1
    `
    const replacements = []

    if (keyword) {
      query += ' AND (u.username LIKE ? OR u.email LIKE ? OR u.phone LIKE ?)'
      const k = `%${keyword}%`
      replacements.push(k, k, k)
    }

    query += ' ORDER BY u.created_at DESC LIMIT ? OFFSET ?'
    replacements.push(parseInt(limit), parseInt(offset))

    const [list] = await sequelize.query(query, { replacements })
    
    // Count total
    let countQuery = 'SELECT COUNT(*) as total FROM users u WHERE 1=1'
    const countReplacements = []
    
    if (keyword) {
      countQuery += ' AND (u.username LIKE ? OR u.email LIKE ? OR u.phone LIKE ?)'
      const k = `%${keyword}%`
      countReplacements.push(k, k, k)
    }

    const [[{ total }]] = await sequelize.query(countQuery, { replacements: countReplacements })

    res.json({
      code: 200,
      data: {
        list,
        total,
        page: parseInt(page),
        limit: parseInt(limit)
      }
    })
  } catch (error) {
    console.error('Get Users Error:', error)
    res.status(500).json({ code: 500, message: 'Server Error' })
  }
})

/**
 * Create User
 * POST /api/users
 */
router.post('/', async (req, res) => {
  const { username, password, email, phone, role_id, status } = req.body

  if (!username || !password || !role_id) {
    return res.status(400).json({ code: 400, message: '用户名、密码和角色必填' })
  }

  try {
    // Check if username exists
    const [existing] = await sequelize.query('SELECT id FROM users WHERE username = ?', {
      replacements: [username]
    })
    if (existing.length > 0) {
      return res.status(400).json({ code: 400, message: '用户名已存在' })
    }

    // Hash password
    const salt = await bcrypt.genSalt(10)
    const password_hash = await bcrypt.hash(password, salt)

    await sequelize.query(
      `INSERT INTO users (username, password_hash, email, phone, role_id, status) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      { replacements: [
        username, 
        password_hash, 
        email || null, 
        phone || null, 
        role_id, 
        status || 'active'
      ] }
    )

    res.json({ code: 200, message: '添加成功' })
  } catch (error) {
    console.error('Create User Error:', error)
    res.status(500).json({ code: 500, message: 'Server Error' })
  }
})

/**
 * Update User
 * PUT /api/users/:id
 */
router.put('/:id', async (req, res) => {
  const { id } = req.params
  const { email, phone, role_id, status, password } = req.body

  try {
    let query = 'UPDATE users SET email=?, phone=?, role_id=?, status=?'
    const replacements = [email, phone, role_id, status]

    if (password) {
      const salt = await bcrypt.genSalt(10)
      const password_hash = await bcrypt.hash(password, salt)
      query += ', password_hash=?'
      replacements.push(password_hash)
    }

    query += ' WHERE id=?'
    replacements.push(id)

    await sequelize.query(query, { replacements })
    res.json({ code: 200, message: '更新成功' })
  } catch (error) {
    console.error('Update User Error:', error)
    res.status(500).json({ code: 500, message: 'Server Error' })
  }
})

/**
 * Delete User
 * DELETE /api/users/:id
 */
router.delete('/:id', async (req, res) => {
  const { id } = req.params
  
  // Prevent deleting admin
  if (id == 1) {
    return res.status(403).json({ code: 403, message: '不能删除超级管理员' })
  }

  try {
    await sequelize.query('DELETE FROM users WHERE id=?', {
      replacements: [id]
    })
    res.json({ code: 200, message: '删除成功' })
  } catch (error) {
    console.error('Delete User Error:', error)
    res.status(500).json({ code: 500, message: 'Server Error' })
  }
})

export default router
