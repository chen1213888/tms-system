import { Router } from 'express'
import sequelize from '../config/db.js'
import { isAdmin } from '../middleware/auth.js'

const router = Router()

/**
 * 获取操作日志列表
 * GET /api/logs
 */
router.get('/', isAdmin, async (req, res) => {
  const { page = 1, limit = 20, module, action, username, startDate, endDate } = req.query
  const offset = (page - 1) * limit
  
  try {
    let query = 'SELECT * FROM operation_logs WHERE 1=1'
    const replacements = []

    if (module) {
      query += ' AND module = ?'
      replacements.push(module)
    }
    
    if (action) {
      query += ' AND action = ?'
      replacements.push(action)
    }

    if (username) {
      query += ' AND username LIKE ?'
      replacements.push(`%${username}%`)
    }

    if (startDate) {
      query += ' AND created_at >= ?'
      replacements.push(startDate)
    }

    if (endDate) {
      query += ' AND created_at <= ?'
      replacements.push(endDate + ' 23:59:59')
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?'
    replacements.push(parseInt(limit), parseInt(offset))

    const [list] = await sequelize.query(query, { replacements })
    
    // 获取总数
    let countQuery = 'SELECT COUNT(*) as total FROM operation_logs WHERE 1=1'
    const countReplacements = []
    
    if (module) {
      countQuery += ' AND module = ?'
      countReplacements.push(module)
    }
    
    if (action) {
      countQuery += ' AND action = ?'
      countReplacements.push(action)
    }

    if (username) {
      countQuery += ' AND username LIKE ?'
      countReplacements.push(`%${username}%`)
    }

    if (startDate) {
      countQuery += ' AND created_at >= ?'
      countReplacements.push(startDate)
    }

    if (endDate) {
      countQuery += ' AND created_at <= ?'
      countReplacements.push(endDate + ' 23:59:59')
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
    console.error('Get Operation Logs Error:', error)
    res.status(500).json({ code: 500, message: 'Server Error' })
  }
})

/**
 * 获取日志详情
 * GET /api/logs/:id
 */
router.get('/:id', isAdmin, async (req, res) => {
  const { id } = req.params
  try {
    const [[log]] = await sequelize.query('SELECT * FROM operation_logs WHERE id = ?', {
      replacements: [id]
    })
    if (!log) {
      return res.status(404).json({ code: 404, message: '日志不存在' })
    }
    res.json({ code: 200, data: log })
  } catch (error) {
    console.error('Get Log Detail Error:', error)
    res.status(500).json({ code: 500, message: 'Server Error' })
  }
})

export default router
