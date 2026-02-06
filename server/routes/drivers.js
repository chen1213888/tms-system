
import { Router } from 'express'
import { QueryTypes } from 'sequelize'
import sequelize from '../config/db.js'

const router = Router()

/**
 * Get Driver List
 * GET /api/drivers
 */
router.get('/', async (req, res) => {
  const { page = 1, limit = 10, name, phone, group_name, sort, order } = req.query
  const pageNum = Math.max(1, parseInt(page) || 1)
  const limitNum = Math.max(1, parseInt(limit) || 10)
  const offset = (pageNum - 1) * limitNum
  
  try {
    // Modify query to include license types
    let query = `
      SELECT 
        d.*,
        GROUP_CONCAT(dl.license_type SEPARATOR ', ') as license_types
      FROM drivers d
      LEFT JOIN driver_licenses dl ON d.id = dl.driver_id AND dl.status = 'valid'
      WHERE d.status != 'deleted'
    `
    const replacements = []

    if (name) {
      query += ' AND d.name LIKE ?'
      replacements.push(`%${name}%`)
    }
    
    if (phone) {
      query += ' AND d.phone LIKE ?'
      replacements.push(`%${phone}%`)
    }

    if (group_name) {
      query += ' AND d.group_name LIKE ?'
      replacements.push(`%${group_name}%`)
    }
    
    query += ' GROUP BY d.id'

    // Sorting logic
    if (sort && order) {
      if (sort === 'age') {
        // Sort by id_card substring (birth year/month/day)
        // Note: ID card structure usually puts birth year at index 7 (1-based) for 4 digits
        // SUBSTRING(id_card, 7, 8) extracts YYYYMMDD
        // Older birth date = Older age, so ASC date means DESC age
        const dir = order === 'ascending' ? 'DESC' : 'ASC'
        query += ` ORDER BY SUBSTRING(d.id_card, 7, 8) ${dir}`
      } else if (sort === 'created_at') {
        const dir = order === 'ascending' ? 'ASC' : 'DESC'
        query += ` ORDER BY d.created_at ${dir}`
      } else {
        query += ' ORDER BY d.created_at DESC'
      }
    } else {
      query += ' ORDER BY d.created_at DESC'
    }

    query += ' LIMIT ? OFFSET ?'
    replacements.push(limitNum, offset)

    const list = await sequelize.query(query, { 
      replacements,
      type: QueryTypes.SELECT
    })
    
    // Count total
    let countQuery = "SELECT COUNT(*) as total FROM drivers WHERE status != 'deleted'"
    const countReplacements = []
    
    if (name) {
      countQuery += ' AND name LIKE ?'
      countReplacements.push(`%${name}%`)
    }
    
    if (phone) {
      countQuery += ' AND phone LIKE ?'
      countReplacements.push(`%${phone}%`)
    }

    if (group_name) {
      countQuery += ' AND group_name LIKE ?'
      countReplacements.push(`%${group_name}%`)
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
    console.error('Get Drivers Error:', error)
    res.status(500).json({ code: 500, message: error.message || 'Server Error' })
  }
})

/**
 * Create Driver
 * POST /api/drivers
 */
router.post('/', async (req, res) => {
  const { name, phone, id_card, address, emergency_contact, emergency_phone, group_name } = req.body

  if (!name || !phone || !id_card) {
    return res.status(400).json({ code: 400, message: '姓名、手机号、身份证号必填' })
  }

  try {
    // Check if phone or id_card exists
    const [existing] = await sequelize.query('SELECT id FROM drivers WHERE id_card = ? OR phone = ?', {
      replacements: [id_card, phone]
    })
    if (existing.length > 0) {
      return res.status(400).json({ code: 400, message: '该手机号或身份证号已存在' })
    }

    await sequelize.query(
      'INSERT INTO drivers (name, phone, id_card, address, emergency_contact, emergency_phone, group_name, marital_status, transport_qualification) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      { replacements: [
        name, 
        phone, 
        id_card, 
        address || '', 
        emergency_contact || '', 
        emergency_phone || '',
        group_name || null,
        req.body.marital_status || 'unmarried',
        req.body.transport_qualification || 'general'
      ] }
    )

    res.json({ code: 200, message: '添加成功' })
  } catch (error) {
    console.error('Create Driver Error:', error)
    res.status(500).json({ code: 500, message: 'Server Error' })
  }
})

/**
 * Update Driver
 * PUT /api/drivers/:id
 */
router.put('/:id', async (req, res) => {
  const { id } = req.params
  const { 
    name, 
    phone, 
    id_card, 
    address, 
    emergency_contact, 
    emergency_phone, 
    group_name,
    marital_status, 
    transport_qualification, 
    status 
  } = req.body

  try {
    await sequelize.query(
      'UPDATE drivers SET name=?, phone=?, id_card=?, address=?, emergency_contact=?, emergency_phone=?, group_name=?, marital_status=?, transport_qualification=?, status=? WHERE id=?',
      { replacements: [
        name, 
        phone, 
        id_card, 
        address, 
        emergency_contact, 
        emergency_phone, 
        group_name,
        marital_status, 
        transport_qualification, 
        status, 
        id
      ] }
    )
    res.json({ code: 200, message: '更新成功' })
  } catch (error) {
    console.error('Update Driver Error:', error)
    res.status(500).json({ code: 500, message: 'Server Error' })
  }
})

/**
 * Delete Driver (Soft Delete)
 * DELETE /api/drivers/:id
 */
router.delete('/:id', async (req, res) => {
  const { id } = req.params
  try {
    await sequelize.query('UPDATE drivers SET status="deleted" WHERE id=?', {
      replacements: [id]
    })
    res.json({ code: 200, message: '删除成功' })
  } catch (error) {
    console.error('Delete Driver Error:', error)
    res.status(500).json({ code: 500, message: 'Server Error' })
  }
})

export default router
