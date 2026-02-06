import { Router } from 'express'
import sequelize from '../config/db.js'

const router = Router()

/**
 * Get Role List
 * GET /api/roles
 */
router.get('/', async (req, res) => {
  try {
    const [list] = await sequelize.query('SELECT * FROM roles ORDER BY id ASC')
    res.json({
      code: 200,
      data: list
    })
  } catch (error) {
    console.error('Get Roles Error:', error)
    res.status(500).json({ code: 500, message: 'Server Error' })
  }
})

/**
 * Create Role
 * POST /api/roles
 */
router.post('/', async (req, res) => {
  const { name, description, permissions } = req.body

  if (!name) {
    return res.status(400).json({ code: 400, message: '角色名称必填' })
  }

  try {
    // Check if name exists
    const [existing] = await sequelize.query('SELECT id FROM roles WHERE name = ?', {
      replacements: [name]
    })
    if (existing.length > 0) {
      return res.status(400).json({ code: 400, message: '角色名称已存在' })
    }

    await sequelize.query(
      'INSERT INTO roles (name, description, permissions) VALUES (?, ?, ?)',
      { replacements: [
        name, 
        description || '', 
        JSON.stringify(permissions || {})
      ] }
    )

    res.json({ code: 200, message: '添加成功' })
  } catch (error) {
    console.error('Create Role Error:', error)
    res.status(500).json({ code: 500, message: 'Server Error' })
  }
})

/**
 * Update Role
 * PUT /api/roles/:id
 */
router.put('/:id', async (req, res) => {
  const { id } = req.params
  const { name, description, permissions } = req.body

  // Prevent updating super_admin name/permissions if necessary, but here we allow it except id 1 name usually
  if (id == 1 && name !== 'super_admin') {
     // Optional: prevent renaming super_admin
  }

  try {
    await sequelize.query(
      'UPDATE roles SET name=?, description=?, permissions=? WHERE id=?',
      { replacements: [
        name, 
        description, 
        JSON.stringify(permissions), 
        id
      ] }
    )
    res.json({ code: 200, message: '更新成功' })
  } catch (error) {
    console.error('Update Role Error:', error)
    res.status(500).json({ code: 500, message: 'Server Error' })
  }
})

/**
 * Delete Role
 * DELETE /api/roles/:id
 */
router.delete('/:id', async (req, res) => {
  const { id } = req.params
  
  if (id == 1) {
    return res.status(403).json({ code: 403, message: '不能删除超级管理员角色' })
  }

  try {
    // Check if role is used
    const [users] = await sequelize.query('SELECT id FROM users WHERE role_id = ? LIMIT 1', {
      replacements: [id]
    })
    if (users.length > 0) {
      return res.status(400).json({ code: 400, message: '该角色下还有用户，无法删除' })
    }

    await sequelize.query('DELETE FROM roles WHERE id=?', {
      replacements: [id]
    })
    res.json({ code: 200, message: '删除成功' })
  } catch (error) {
    console.error('Delete Role Error:', error)
    res.status(500).json({ code: 500, message: 'Server Error' })
  }
})

export default router
