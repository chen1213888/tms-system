import { Router } from 'express'
import { QueryTypes } from 'sequelize'
import sequelize from '../config/db.js'

const router = Router()

/**
 * Get Trailer List
 * GET /api/trailers
 */
router.get('/', async (req, res) => {
  const { page = 1, limit = 10, keyword, group_name } = req.query
  const pageNum = Math.max(1, parseInt(page) || 1)
  const limitNum = Math.max(1, parseInt(limit) || 10)
  const offset = (pageNum - 1) * limitNum
  
  try {
    let query = "SELECT * FROM trailers WHERE status != 'deleted'"
    const replacements = []

    if (keyword) {
      query += ' AND (plate_number LIKE ?)'
      const k = `%${keyword}%`
      replacements.push(k)
    }

    if (group_name) {
      query += ' AND group_name = ?'
      replacements.push(group_name)
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?'
    replacements.push(limitNum, offset)

    const list = await sequelize.query(query, { 
      replacements,
      type: QueryTypes.SELECT
    })
    
    // Count total
    let countQuery = "SELECT COUNT(*) as total FROM trailers WHERE status != 'deleted'"
    const countReplacements = []
    
    if (keyword) {
      countQuery += ' AND (plate_number LIKE ?)'
      const k = `%${keyword}%`
      countReplacements.push(k)
    }

    if (group_name) {
      countQuery += ' AND group_name = ?'
      countReplacements.push(group_name)
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
    console.error('Get Trailers Error:', error)
    res.status(500).json({ code: 500, message: 'Server Error' })
  }
})

/**
 * Create Trailer
 * POST /api/trailers
 */
router.post('/', async (req, res) => {
  const { plate_number, registration_date, trailer_type, length, width, height, capacity, brand, model, purchase_date, group_name } = req.body

  if (!plate_number || !trailer_type) {
    return res.status(400).json({ code: 400, message: '车牌号和挂车类型必填' })
  }

  try {
    // Check if plate_number exists
    const [existing] = await sequelize.query('SELECT id FROM trailers WHERE plate_number = ?', {
      replacements: [plate_number]
    })
    if (existing.length > 0) {
      return res.status(400).json({ code: 400, message: '该车牌号已存在' })
    }

    await sequelize.query(
      `INSERT INTO trailers (plate_number, registration_date, trailer_type, length, width, height, capacity, brand, model, purchase_date, group_name) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      { replacements: [
        plate_number, 
        registration_date || null,
        trailer_type, 
        length || null, 
        width || null, 
        height || null, 
        capacity || null, 
        brand || '', 
        model || '', 
        purchase_date || null,
        group_name || null
      ] }
    )

    res.json({ code: 200, message: '添加成功' })
  } catch (error) {
    console.error('Create Trailer Error:', error)
    res.status(500).json({ code: 500, message: 'Server Error' })
  }
})

/**
 * Update Trailer
 * PUT /api/trailers/:id
 */
router.put('/:id', async (req, res) => {
  const { id } = req.params
  const { plate_number, registration_date, trailer_type, length, width, height, capacity, brand, model, purchase_date, status, group_name } = req.body

  try {
    await sequelize.query(
      `UPDATE trailers SET plate_number=?, registration_date=?, trailer_type=?, length=?, width=?, height=?, capacity=?, brand=?, model=?, purchase_date=?, status=?, group_name=? 
       WHERE id=?`,
      { replacements: [
        plate_number, 
        registration_date,
        trailer_type, 
        length, 
        width, 
        height, 
        capacity, 
        brand, 
        model, 
        purchase_date, 
        status, 
        group_name,
        id
      ] }
    )
    res.json({ code: 200, message: '更新成功' })
  } catch (error) {
    console.error('Update Trailer Error:', error)
    res.status(500).json({ code: 500, message: 'Server Error' })
  }
})

/**
 * Delete Trailer (Soft Delete)
 * DELETE /api/trailers/:id
 */
router.delete('/:id', async (req, res) => {
  const { id } = req.params
  try {
    await sequelize.query('UPDATE trailers SET status="deleted" WHERE id=?', {
      replacements: [id]
    })
    res.json({ code: 200, message: '删除成功' })
  } catch (error) {
    console.error('Delete Trailer Error:', error)
    res.status(500).json({ code: 500, message: 'Server Error' })
  }
})

export default router
