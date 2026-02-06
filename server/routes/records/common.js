import { Router } from 'express'
import sequelize from '../../config/db.js'

const router = Router()

/**
 * 通用记录查询
 * GET /api/records/:category
 * category: insurance, maintenance, inspection
 */
router.get('/:category', async (req, res) => {
  const { category } = req.params
  const { page = 1, limit = 10, type, target_id } = req.query
  const pageNum = Math.max(1, parseInt(page) || 1)
  const limitNum = Math.max(1, parseInt(limit) || 10)
  const offset = (pageNum - 1) * limitNum

  let tableName = ''
  switch(category) {
    case 'insurance': tableName = 'insurance_records'; break;
    case 'maintenance': tableName = 'maintenance_records'; break;
    case 'inspection': tableName = 'inspection_records'; break;
    default: return res.status(400).json({ code: 400, message: 'Invalid category' })
  }
  
  try {
    let query = ''
    let countQuery = ''
    
    if (type === 'driver') {
      query = `SELECT t.*, d.group_name FROM ${tableName} t LEFT JOIN drivers d ON t.target_id = d.id`
      countQuery = `SELECT COUNT(*) as total FROM ${tableName} t LEFT JOIN drivers d ON t.target_id = d.id`
    } else if (type === 'vehicle') {
      query = `SELECT t.*, v.group_name FROM ${tableName} t LEFT JOIN vehicles v ON t.target_id = v.id`
      countQuery = `SELECT COUNT(*) as total FROM ${tableName} t LEFT JOIN vehicles v ON t.target_id = v.id`
    } else if (type === 'trailer') {
      query = `SELECT t.*, tr.group_name FROM ${tableName} t LEFT JOIN trailers tr ON t.target_id = tr.id`
      countQuery = `SELECT COUNT(*) as total FROM ${tableName} t LEFT JOIN trailers tr ON t.target_id = tr.id`
    } else {
      query = `SELECT t.* FROM ${tableName} t`
      countQuery = `SELECT COUNT(*) as total FROM ${tableName} t`
    }
    
    query += ' WHERE 1=1'
    countQuery += ' WHERE 1=1'
    
    const replacements = []
    const countReplacements = []

    if (type) {
      query += ' AND t.type = ?'
      countQuery += ' AND t.type = ?'
      replacements.push(type)
      countReplacements.push(type)
    }
    if (target_id) {
      query += ' AND t.target_id = ?'
      countQuery += ' AND t.target_id = ?'
      replacements.push(target_id)
      countReplacements.push(target_id)
    }
    
    // 增加组别搜索逻辑
    if (req.query.group_name) {
      if (type === 'driver') {
        query += ' AND d.group_name = ?'
        countQuery += ' AND d.group_name = ?'
      } else if (type === 'vehicle') {
        query += ' AND v.group_name = ?'
        countQuery += ' AND v.group_name = ?'
      } else if (type === 'trailer') {
        query += ' AND tr.group_name = ?'
        countQuery += ' AND tr.group_name = ?'
      }
      replacements.push(req.query.group_name)
      countReplacements.push(req.query.group_name)
    }

    query += ' ORDER BY t.created_at DESC LIMIT ? OFFSET ?'
    replacements.push(limitNum, offset)

    const [list] = await sequelize.query(query, { replacements })
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
    console.error(`Get ${category} Records Error:`, error)
    res.status(500).json({ code: 500, message: error.message || 'Server Error' })
  }
})

/**
 * 通用记录创建
 * POST /api/records/:category
 */
router.post('/:category', async (req, res) => {
  const { category } = req.params
  const body = req.body

  let tableName = ''
  let fields = []
  let values = []
  
  switch(category) {
    case 'insurance': 
      tableName = 'insurance_records';
      fields = ['type', 'target_id', 'insurance_company', 'policy_number', 'coverage_amount', 'premium', 'start_date', 'end_date', 'attachment_url', 'status'];
      break;
    case 'maintenance': 
      tableName = 'maintenance_records';
      fields = ['type', 'target_id', 'maintenance_date', 'next_maintenance_date', 'maintenance_mileage', 'maintenance_items', 'cost', 'maintenance_shop', 'attachment_url'];
      break;
    case 'inspection': 
      tableName = 'inspection_records';
      fields = ['type', 'target_id', 'inspection_date', 'next_inspection_date', 'inspection_agency', 'result', 'attachment_url'];
      break;
    default: return res.status(400).json({ code: 400, message: 'Invalid category' })
  }

  try {
    // 唯一性检查：保险和年审记录每个资产只能有一条
    const [existing] = await sequelize.query(
      `SELECT id FROM ${tableName} WHERE type = ? AND target_id = ?`,
      { replacements: [body.type, body.target_id] }
    )
    if (existing.length > 0) {
      return res.status(400).json({ code: 400, message: '该资产已存在记录，请直接在现有记录上修改' })
    }

    const placeholders = fields.map(() => '?').join(',')
    const sql = `INSERT INTO ${tableName} (${fields.join(',')}) VALUES (${placeholders})`
    const replacements = fields.map(f => body[f] !== undefined ? body[f] : null)

    await sequelize.query(sql, { replacements })
    res.json({ code: 200, message: '添加成功' })
  } catch (error) {
    console.error(`Create ${category} Record Error:`, error)
    res.status(500).json({ code: 500, message: 'Server Error' })
  }
})

/**
 * 通用记录更新
 * PUT /api/records/:category/:id
 */
router.put('/:category/:id', async (req, res) => {
  const { category, id } = req.params
  const body = req.body

  let tableName = ''
  let fields = []
  
  switch(category) {
    case 'insurance': 
      tableName = 'insurance_records';
      fields = ['type', 'target_id', 'insurance_company', 'policy_number', 'coverage_amount', 'premium', 'start_date', 'end_date', 'attachment_url', 'status'];
      break;
    case 'maintenance': 
      tableName = 'maintenance_records';
      fields = ['type', 'target_id', 'maintenance_date', 'next_maintenance_date', 'maintenance_mileage', 'maintenance_items', 'cost', 'maintenance_shop', 'attachment_url'];
      break;
    case 'inspection': 
      tableName = 'inspection_records';
      fields = ['type', 'target_id', 'inspection_date', 'next_inspection_date', 'inspection_agency', 'result', 'attachment_url'];
      break;
    default: return res.status(400).json({ code: 400, message: 'Invalid category' })
  }

  try {
    const setClause = fields.map(f => `${f}=?`).join(',')
    const sql = `UPDATE ${tableName} SET ${setClause} WHERE id=?`
    const replacements = [...fields.map(f => body[f] !== undefined ? body[f] : null), id]

    await sequelize.query(sql, { replacements })
    res.json({ code: 200, message: '更新成功' })
  } catch (error) {
    console.error(`Update ${category} Record Error:`, error)
    res.status(500).json({ code: 500, message: 'Server Error' })
  }
})

/**
 * 通用记录删除
 * DELETE /api/records/:category/:id
 */
router.delete('/:category/:id', async (req, res) => {
  const { category, id } = req.params

  let tableName = ''
  switch(category) {
    case 'insurance': tableName = 'insurance_records'; break;
    case 'maintenance': tableName = 'maintenance_records'; break;
    case 'inspection': tableName = 'inspection_records'; break;
    default: return res.status(400).json({ code: 400, message: 'Invalid category' })
  }

  try {
    await sequelize.query(`DELETE FROM ${tableName} WHERE id=?`, {
      replacements: [id]
    })
    res.json({ code: 200, message: '删除成功' })
  } catch (error) {
    console.error(`Delete ${category} Record Error:`, error)
    res.status(500).json({ code: 500, message: 'Server Error' })
  }
})

export default router
