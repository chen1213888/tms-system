import { Router } from 'express'
import { QueryTypes } from 'sequelize'
import sequelize from '../config/db.js'

const router = Router()

/**
 * Get All Vehicle Groups (For Select)
 * GET /api/vehicle-groups/all
 */
router.get('/all', async (req, res) => {
  try {
    const list = await sequelize.query('SELECT id, name FROM vehicle_groups ORDER BY name ASC', {
      type: QueryTypes.SELECT
    })
    res.json({
      code: 200,
      data: list
    })
  } catch (error) {
    console.error('Get All Vehicle Groups Error:', error)
    res.status(500).json({ code: 500, message: error.message || 'Server Error' })
  }
})

/**
 * Get Vehicle Groups
 * GET /api/vehicle-groups
 */
router.get('/', async (req, res) => {
  const { page = 1, limit = 10, name } = req.query
  const pageNum = Math.max(1, parseInt(page) || 1)
  const limitNum = Math.max(1, parseInt(limit) || 10)
  const offset = (pageNum - 1) * limitNum

  try {
    let query = 'SELECT * FROM vehicle_groups WHERE 1=1'
    const replacements = []

    if (name) {
      query += ' AND name LIKE ?'
      replacements.push(`%${name}%`)
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?'
    replacements.push(limitNum, offset)

    const list = await sequelize.query(query, { 
      replacements,
      type: QueryTypes.SELECT
    })

    let countQuery = 'SELECT COUNT(*) as total FROM vehicle_groups WHERE 1=1'
    const countReplacements = []

    if (name) {
      countQuery += ' AND name LIKE ?'
      countReplacements.push(`%${name}%`)
    }

    const countResult = await sequelize.query(countQuery, { 
      replacements: countReplacements,
      type: QueryTypes.SELECT
    })
    const total = countResult[0].total

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
    console.error('Get Vehicle Groups Error:', error)
    res.status(500).json({ code: 500, message: error.message || 'Server Error' })
  }
})

/**
 * Create Vehicle Group
 * POST /api/vehicle-groups
 */
router.post('/', async (req, res) => {
  const { name, description } = req.body

  if (!name) {
    return res.status(400).json({ code: 400, message: '组别名称必填' })
  }

  try {
    const [existing] = await sequelize.query('SELECT id FROM vehicle_groups WHERE name = ?', {
      replacements: [name]
    })
    if (existing.length > 0) {
      return res.status(400).json({ code: 400, message: '该组别名称已存在' })
    }

    await sequelize.query(
      'INSERT INTO vehicle_groups (name, description) VALUES (?, ?)',
      { replacements: [name, description || ''] }
    )

    res.json({ code: 200, message: '添加成功' })
  } catch (error) {
    console.error('Create Vehicle Group Error:', error)
    res.status(500).json({ code: 500, message: 'Server Error' })
  }
})

/**
 * Update Vehicle Group
 * PUT /api/vehicle-groups/:id
 */
router.put('/:id', async (req, res) => {
  const { id } = req.params
  const { name, description } = req.body

  if (!name) {
    return res.status(400).json({ code: 400, message: '组别名称必填' })
  }

  try {
    const [existing] = await sequelize.query('SELECT id FROM vehicle_groups WHERE name = ? AND id != ?', {
      replacements: [name, id]
    })
    if (existing.length > 0) {
      return res.status(400).json({ code: 400, message: '该组别名称已存在' })
    }

    await sequelize.query(
      'UPDATE vehicle_groups SET name=?, description=? WHERE id=?',
      { replacements: [name, description || '', id] }
    )

    res.json({ code: 200, message: '更新成功' })
  } catch (error) {
    console.error('Update Vehicle Group Error:', error)
    res.status(500).json({ code: 500, message: 'Server Error' })
  }
})

/**
 * Delete Vehicle Group
 * DELETE /api/vehicle-groups/:id
 */
router.delete('/:id', async (req, res) => {
  const { id } = req.params
  try {
    await sequelize.query('DELETE FROM vehicle_groups WHERE id=?', {
      replacements: [id]
    })
    res.json({ code: 200, message: '删除成功' })
  } catch (error) {
    console.error('Delete Vehicle Group Error:', error)
    res.status(500).json({ code: 500, message: 'Server Error' })
  }
})

export default router
