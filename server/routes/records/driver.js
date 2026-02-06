import { Router } from 'express'
import sequelize from '../../config/db.js'

const router = Router()

// --- 体检记录 ---

router.get('/physical', async (req, res) => {
  const { page = 1, limit = 10, driver_id } = req.query
  const offset = (page - 1) * limit
  
  try {
    let query = 'SELECT p.*, d.name as driver_name FROM physical_records p JOIN drivers d ON p.driver_id = d.id WHERE 1=1'
    let countQuery = 'SELECT COUNT(*) as total FROM physical_records p JOIN drivers d ON p.driver_id = d.id WHERE 1=1'
    const replacements = []
    const countReplacements = []

    if (driver_id) {
      query += ' AND p.driver_id = ?'
      countQuery += ' AND p.driver_id = ?'
      replacements.push(driver_id)
      countReplacements.push(driver_id)
    }

    if (req.query.group_name) {
      query += ' AND d.group_name = ?'
      countQuery += ' AND d.group_name = ?'
      replacements.push(req.query.group_name)
      countReplacements.push(req.query.group_name)
    }

    query += ' ORDER BY p.created_at DESC LIMIT ? OFFSET ?'
    replacements.push(parseInt(limit), parseInt(offset))

    const [list] = await sequelize.query(query, { replacements })
    const [[{ total }]] = await sequelize.query(countQuery, { replacements: countReplacements })

    res.json({ code: 200, data: { list, total, page: parseInt(page), limit: parseInt(limit) } })
  } catch (error) {
    console.error('Get Physical Records Error:', error)
    res.status(500).json({ code: 500, message: 'Server Error' })
  }
})

router.post('/physical', async (req, res) => {
  const body = req.body
  const fields = ['driver_id', 'examination_date', 'expiry_date', 'hospital', 'result', 'issue', 'attachment_url']
  try {
    // 唯一性检查
    const [existing] = await sequelize.query(
      'SELECT id FROM physical_records WHERE driver_id = ?',
      { replacements: [body.driver_id] }
    )
    if (existing.length > 0) {
      return res.status(400).json({ code: 400, message: '该司机已存在体检记录，请直接在现有记录上修改' })
    }

    const placeholders = fields.map(() => '?').join(',')
    const sql = `INSERT INTO physical_records (${fields.join(',')}) VALUES (${placeholders})`
    const replacements = fields.map(f => body[f] !== undefined ? body[f] : null)
    await sequelize.query(sql, { replacements })
    res.json({ code: 200, message: '添加成功' })
  } catch (error) {
    console.error('Create Physical Record Error:', error)
    res.status(500).json({ code: 500, message: 'Server Error' })
  }
})

router.put('/physical/:id', async (req, res) => {
  const { id } = req.params
  const body = req.body
  const fields = ['driver_id', 'examination_date', 'expiry_date', 'hospital', 'result', 'attachment_url']
  try {
    const setClause = fields.map(f => `${f}=?`).join(',')
    const sql = `UPDATE physical_records SET ${setClause} WHERE id=?`
    const replacements = [...fields.map(f => body[f] !== undefined ? body[f] : null), id]
    await sequelize.query(sql, { replacements })
    res.json({ code: 200, message: '更新成功' })
  } catch (error) {
    console.error('Update Physical Record Error:', error)
    res.status(500).json({ code: 500, message: 'Server Error' })
  }
})

router.delete('/physical/:id', async (req, res) => {
  const { id } = req.params
  try {
    await sequelize.query('DELETE FROM physical_records WHERE id=?', { replacements: [id] })
    res.json({ code: 200, message: '删除成功' })
  } catch (error) {
    console.error('Delete Physical Record Error:', error)
    res.status(500).json({ code: 500, message: 'Server Error' })
  }
})

// --- 驾驶证管理 ---

router.get('/licenses', async (req, res) => {
  const { page = 1, limit = 10, driver_id } = req.query
  const offset = (page - 1) * limit
  
  try {
    let query = 'SELECT l.*, d.name as driver_name FROM driver_licenses l JOIN drivers d ON l.driver_id = d.id WHERE 1=1'
    const replacements = []

    if (driver_id) {
      query += ' AND l.driver_id = ?'
      replacements.push(driver_id)
    }

    query += ' ORDER BY l.created_at DESC LIMIT ? OFFSET ?'
    replacements.push(parseInt(limit), parseInt(offset))

    const [list] = await sequelize.query(query, { replacements })
    
    let countQuery = 'SELECT COUNT(*) as total FROM driver_licenses WHERE 1=1'
    const countReplacements = []
    
    if (driver_id) {
      countQuery += ' AND driver_id = ?'
      countReplacements.push(driver_id)
    }

    const [[{ total }]] = await sequelize.query(countQuery, { replacements: countReplacements })

    res.json({ code: 200, data: { list, total, page: parseInt(page), limit: parseInt(limit) } })
  } catch (error) {
    console.error('Get Driver Licenses Error:', error)
    res.status(500).json({ code: 500, message: 'Server Error' })
  }
})

router.post('/licenses', async (req, res) => {
  const body = req.body
  const fields = ['driver_id', 'license_number', 'license_type', 'issue_date', 'expiry_date', 'issue_organization', 'photo_url', 'status']
  try {
    const placeholders = fields.map(() => '?').join(',')
    const sql = `INSERT INTO driver_licenses (${fields.join(',')}) VALUES (${placeholders})`
    const replacements = fields.map(f => body[f] !== undefined ? body[f] : null)
    await sequelize.query(sql, { replacements })
    res.json({ code: 200, message: '添加成功' })
  } catch (error) {
    console.error('Create Driver License Error:', error)
    res.status(500).json({ code: 500, message: 'Server Error' })
  }
})

router.put('/licenses/:id', async (req, res) => {
  const { id } = req.params
  const body = req.body
  const fields = ['driver_id', 'license_number', 'license_type', 'issue_date', 'expiry_date', 'issue_organization', 'photo_url', 'status']
  try {
    const setClause = fields.map(f => `${f}=?`).join(',')
    const sql = `UPDATE driver_licenses SET ${setClause} WHERE id=?`
    const replacements = [...fields.map(f => body[f] !== undefined ? body[f] : null), id]
    await sequelize.query(sql, { replacements })
    res.json({ code: 200, message: '更新成功' })
  } catch (error) {
    console.error('Update Driver License Error:', error)
    res.status(500).json({ code: 500, message: 'Server Error' })
  }
})

router.delete('/licenses/:id', async (req, res) => {
  const { id } = req.params
  try {
    await sequelize.query('DELETE FROM driver_licenses WHERE id=?', { replacements: [id] })
    res.json({ code: 200, message: '删除成功' })
  } catch (error) {
    console.error('Delete Driver License Error:', error)
    res.status(500).json({ code: 500, message: 'Server Error' })
  }
})

export default router
