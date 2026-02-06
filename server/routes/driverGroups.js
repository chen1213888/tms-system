import { Router } from 'express'
import sequelize from '../config/db.js'

const router = Router()

console.log('Driver Group Routes Loaded')

/**
 * Get All Driver Groups (For Select)
 * GET /api/driver-groups/all
 */
router.get('/all', async (req, res) => {
  console.log('Hit /all route')
  try {
    const [list] = await sequelize.query('SELECT id, name FROM driver_groups ORDER BY name ASC')
    res.json({
      code: 200,
      data: list
    })
  } catch (error) {
    console.error('Get All Driver Groups Error:', error)
    res.status(500).json({ code: 500, message: 'Server Error' })
  }
})

/**
 * Get Driver Groups
 * GET /api/driver-groups
 */
router.get('/', async (req, res) => {
  console.log('Hit / route')
  const { page = 1, limit = 10, name } = req.query
  const offset = (page - 1) * limit

  try {
    let query = 'SELECT * FROM driver_groups WHERE 1=1'
    const replacements = []

    if (name) {
      query += ' AND name LIKE ?'
      replacements.push(`%${name}%`)
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?'
    replacements.push(parseInt(limit), parseInt(offset))

    const [list] = await sequelize.query(query, { replacements })

    let countQuery = 'SELECT COUNT(*) as total FROM driver_groups WHERE 1=1'
    const countReplacements = []

    if (name) {
      countQuery += ' AND name LIKE ?'
      countReplacements.push(`%${name}%`)
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
    console.error('Get Driver Groups Error:', error)
    res.status(500).json({ code: 500, message: 'Server Error' })
  }
})

/**
 * Create Driver Group
 * POST /api/driver-groups
 */
router.post('/', async (req, res) => {
  const { name, description } = req.body

  if (!name) {
    return res.status(400).json({ code: 400, message: '组别名称必填' })
  }

  try {
    const [existing] = await sequelize.query('SELECT id FROM driver_groups WHERE name = ?', {
      replacements: [name]
    })
    if (existing.length > 0) {
      return res.status(400).json({ code: 400, message: '该组别名称已存在' })
    }

    await sequelize.query(
      'INSERT INTO driver_groups (name, description) VALUES (?, ?)',
      { replacements: [name, description || ''] }
    )

    res.json({ code: 200, message: '添加成功' })
  } catch (error) {
    console.error('Create Driver Group Error:', error)
    res.status(500).json({ code: 500, message: 'Server Error' })
  }
})

/**
 * Update Driver Group
 * PUT /api/driver-groups/:id
 */
router.put('/:id', async (req, res) => {
  const { id } = req.params
  const { name, description } = req.body

  if (!name) {
    return res.status(400).json({ code: 400, message: '组别名称必填' })
  }

  try {
    // Check if name exists for other groups
    const [existing] = await sequelize.query('SELECT id FROM driver_groups WHERE name = ? AND id != ?', {
      replacements: [name, id]
    })
    if (existing.length > 0) {
      return res.status(400).json({ code: 400, message: '该组别名称已存在' })
    }

    await sequelize.query(
      'UPDATE driver_groups SET name=?, description=? WHERE id=?',
      { replacements: [name, description || '', id] }
    )

    res.json({ code: 200, message: '更新成功' })
  } catch (error) {
    console.error('Update Driver Group Error:', error)
    res.status(500).json({ code: 500, message: 'Server Error' })
  }
})

/**
 * Delete Driver Group
 * DELETE /api/driver-groups/:id
 */
router.delete('/:id', async (req, res) => {
  const { id } = req.params
  try {
    await sequelize.query('DELETE FROM driver_groups WHERE id=?', {
      replacements: [id]
    })
    res.json({ code: 200, message: '删除成功' })
  } catch (error) {
    console.error('Delete Driver Group Error:', error)
    res.status(500).json({ code: 500, message: 'Server Error' })
  }
})

export default router
