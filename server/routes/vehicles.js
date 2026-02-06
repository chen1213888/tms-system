import { Router } from 'express'
import { QueryTypes } from 'sequelize'
import sequelize from '../config/db.js'

const router = Router()

/**
 * Get Vehicle List
 * GET /api/vehicles
 */
router.get('/', async (req, res) => {
  const { page = 1, limit = 10, keyword, type, group_name } = req.query
  const pageNum = Math.max(1, parseInt(page) || 1)
  const limitNum = Math.max(1, parseInt(limit) || 10)
  const offset = (pageNum - 1) * limitNum
  
    try {
    let query = "SELECT * FROM vehicles WHERE status != 'deleted'"
    const replacements = []

    if (keyword) {
      query += ' AND (plate_number LIKE ? OR vin_code LIKE ?)'
      const k = `%${keyword}%`
      replacements.push(k, k)
    }

    if (type) {
      query += ' AND vehicle_type = ?'
      replacements.push(type)
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
    let countQuery = "SELECT COUNT(*) as total FROM vehicles WHERE status != 'deleted'"
    const countReplacements = []
    
    if (keyword) {
      countQuery += ' AND (plate_number LIKE ? OR vin_code LIKE ?)'
      const k = `%${keyword}%`
      countReplacements.push(k, k)
    }

    if (type) {
      countQuery += ' AND vehicle_type = ?'
      countReplacements.push(type)
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
    console.error('Get Vehicles Error:', error)
    res.status(500).json({ code: 500, message: error.message || 'Server Error' })
  }
})

/**
 * Create Vehicle
 * POST /api/vehicles
 */
router.post('/', async (req, res) => {
  const { plate_number, registration_date, vehicle_type, brand, model, color, vin_code, engine_number, purchase_date, purchase_price, current_mileage, group_name } = req.body

  if (!plate_number || !vehicle_type) {
    return res.status(400).json({ code: 400, message: '车牌号和车辆类型必填' })
  }

  try {
    // Check if plate_number exists
    const [existing] = await sequelize.query('SELECT id FROM vehicles WHERE plate_number = ?', {
      replacements: [plate_number]
    })
    if (existing.length > 0) {
      return res.status(400).json({ code: 400, message: '该车牌号已存在' })
    }

    await sequelize.query(
      `INSERT INTO vehicles (plate_number, registration_date, vehicle_type, brand, model, color, vin_code, engine_number, purchase_date, purchase_price, current_mileage, group_name) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      { replacements: [
        plate_number, 
        registration_date || null,
        vehicle_type, 
        brand || '', 
        model || '', 
        color || '', 
        vin_code || null, 
        engine_number || '', 
        purchase_date || null, 
        purchase_price || null, 
        current_mileage || 0,
        group_name || null
      ] }
    )

    res.json({ code: 200, message: '添加成功' })
  } catch (error) {
    console.error('Create Vehicle Error:', error)
    res.status(500).json({ code: 500, message: 'Server Error' })
  }
})

/**
 * Update Vehicle
 * PUT /api/vehicles/:id
 */
router.put('/:id', async (req, res) => {
  const { id } = req.params
  const { plate_number, registration_date, vehicle_type, brand, model, color, vin_code, engine_number, purchase_date, purchase_price, current_mileage, status, group_name } = req.body

  try {
    await sequelize.query(
      `UPDATE vehicles SET plate_number=?, registration_date=?, vehicle_type=?, brand=?, model=?, color=?, vin_code=?, engine_number=?, purchase_date=?, purchase_price=?, current_mileage=?, status=?, group_name=? 
       WHERE id=?`,
      { replacements: [
        plate_number, 
        registration_date,
        vehicle_type, 
        brand, 
        model, 
        color, 
        vin_code, 
        engine_number, 
        purchase_date, 
        purchase_price, 
        current_mileage, 
        status, 
        group_name,
        id
      ] }
    )
    res.json({ code: 200, message: '更新成功' })
  } catch (error) {
    console.error('Update Vehicle Error:', error)
    res.status(500).json({ code: 500, message: 'Server Error' })
  }
})

/**
 * Delete Vehicle (Soft Delete)
 * DELETE /api/vehicles/:id
 */
router.delete('/:id', async (req, res) => {
  const { id } = req.params
  try {
    await sequelize.query("UPDATE vehicles SET status='deleted' WHERE id=?", {
      replacements: [id]
    })
    res.json({ code: 200, message: '删除成功' })
  } catch (error) {
    console.error('Delete Vehicle Error:', error)
    res.status(500).json({ code: 500, message: 'Server Error' })
  }
})

export default router
