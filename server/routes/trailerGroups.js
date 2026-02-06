import { Router } from 'express'
import sequelize from '../config/db.js'

const router = Router()

/**
 * Get All Trailer Groups (For Select)
 * GET /api/trailer-groups/all
 */
router.get('/all', async (req, res) => {
  try {
    const [list] = await sequelize.query('SELECT id, name FROM trailer_groups ORDER BY name ASC')
    res.json({
      code: 200,
      data: list
    })
  } catch (error) {
    console.error('Get All Trailer Groups Error:', error)
    res.status(500).json({ code: 500, message: 'Server Error' })
  }
})

/**
 * Get Trailer Groups
 * GET /api/trailer-groups
 */
router.get('/', async (req, res) => {
  const { page = 1, limit = 10, name } = req.query
  const offset = (page - 1) * limit

  try {
    let query = 'SELECT * FROM trailer_groups WHERE 1=1'
    const replacements = []

    if (name) {
      query += ' AND name LIKE ?'
      replacements.push(`%${name}%`)
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?'
    replacements.push(parseInt(limit), parseInt(offset))

    const [list] = await sequelize.query(query, { replacements })

    let countQuery = 'SELECT COUNT(*) as total FROM trailer_groups WHERE 1=1'
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
    console.error('Get Trailer Groups Error:', error)
    res.status(500).json({ code: 500, message: 'Server Error' })
  }
})

/**
 * Create Trailer Group
 * POST /api/trailer-groups
 */
router.post('/', async (req, res) => {
  const { name, description } = req.body

  if (!name) {
    return res.status(400).json({ code: 400, message: '组别名称必填' })
  }

  try {
    const [existing] = await sequelize.query('SELECT id FROM trailer_groups WHERE name = ?', {
      replacements: [name]
    })
    if (existing.length > 0) {
      return res.status(400).json({ code: 400, message: '该组别名称已存在' })
    }

    await sequelize.query(
      'INSERT INTO trailer_groups (name, description) VALUES (?, ?)',
      { replacements: [name, description || ''] }
    )

    res.json({ code: 200, message: '添加成功' })
  } catch (error) {
    console.error('Create Trailer Group Error:', error)
    res.status(500).json({ code: 500, message: 'Server Error' })
  }
})

/**
 * Update Trailer Group
 * PUT /api/trailer-groups/:id
 */
router.put('/:id', async (req, res) => {
  const { id } = req.params
  const { name, description } = req.body

  if (!name) {
    return res.status(400).json({ code: 400, message: '组别名称必填' })
  }

  try {
    const [existing] = await sequelize.query('SELECT id FROM trailer_groups WHERE name = ? AND id != ?', {
      replacements: [name, id]
    })
    if (existing.length > 0) {
      return res.status(400).json({ code: 400, message: '该组别名称已存在' })
    }

    await sequelize.query(
      'UPDATE trailer_groups SET name=?, description=? WHERE id=?',
      { replacements: [name, description || '', id] }
    )

    res.json({ code: 200, message: '更新成功' })
  } catch (error) {
    console.error('Update Trailer Group Error:', error)
    res.status(500).json({ code: 500, message: 'Server Error' })
  }
})

/**
 * Delete Trailer Group
 * DELETE /api/trailer-groups/:id
 */
router.delete('/:id', async (req, res) => {
  const { id } = req.params
  try {
    await sequelize.query('DELETE FROM trailer_groups WHERE id=?', {
      replacements: [id]
    })
    res.json({ code: 200, message: '删除成功' })
  } catch (error) {
    console.error('Delete Trailer Group Error:', error)
    res.status(500).json({ code: 500, message: 'Server Error' })
  }
})

export default router
