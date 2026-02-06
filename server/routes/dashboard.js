import { Router } from 'express'
import sequelize from '../config/db.js'

const router = Router()

router.get('/statistics', async (req, res) => {
  try {
    const results = await Promise.all([
      sequelize.query('SELECT COUNT(*) as count FROM vehicles WHERE status != "retired"'),
      sequelize.query('SELECT COUNT(*) as count FROM trailers WHERE status != "retired"'),
      sequelize.query('SELECT COUNT(*) as count FROM drivers WHERE status != "retired"'),
      // 仅统计已过期的记录（日期小于当前日期），且仅统计每个资产最新一条记录
      sequelize.query(`
        SELECT COUNT(*) as count FROM (
          SELECT pr.driver_id, MAX(pr.expiry_date) as latest_expiry
          FROM physical_records pr
          JOIN drivers d ON pr.driver_id = d.id
          WHERE d.status != 'retired'
          GROUP BY pr.driver_id
        ) t WHERE t.latest_expiry < CURDATE()
      `),
      sequelize.query(`
        SELECT COUNT(*) as count FROM (
          SELECT ir.target_id, MAX(ir.end_date) as latest_end
          FROM insurance_records ir
          JOIN drivers d ON ir.target_id = d.id
          WHERE ir.type = 'driver' AND d.status != 'retired'
          GROUP BY ir.target_id
        ) t WHERE t.latest_end < CURDATE()
      `),
      sequelize.query(`
        SELECT COUNT(*) as count FROM (
          SELECT ir.target_id, MAX(ir.end_date) as latest_end
          FROM insurance_records ir
          JOIN vehicles v ON ir.target_id = v.id
          WHERE ir.type = 'vehicle' AND v.status != 'retired'
          GROUP BY ir.target_id
        ) t WHERE t.latest_end < CURDATE()
      `),
      sequelize.query(`
        SELECT COUNT(*) as count FROM (
          SELECT ir.target_id, MAX(ir.end_date) as latest_end
          FROM insurance_records ir
          JOIN trailers t ON ir.target_id = t.id
          WHERE ir.type = 'trailer' AND t.status != 'retired'
          GROUP BY ir.target_id
        ) t WHERE t.latest_end < CURDATE()
      `),
      sequelize.query(`
        SELECT COUNT(*) as count FROM (
          SELECT mr.target_id, MAX(mr.next_maintenance_date) as latest_next
          FROM maintenance_records mr
          JOIN vehicles v ON mr.target_id = v.id
          WHERE mr.type = 'vehicle' AND v.status != 'retired'
          GROUP BY mr.target_id
        ) t WHERE t.latest_next < CURDATE()
      `),
      sequelize.query(`
        SELECT COUNT(*) as count FROM (
          SELECT mr.target_id, MAX(mr.next_maintenance_date) as latest_next
          FROM maintenance_records mr
          JOIN trailers tr ON mr.target_id = tr.id
          WHERE mr.type = 'trailer' AND tr.status != 'retired'
          GROUP BY mr.target_id
        ) t WHERE t.latest_next < CURDATE()
      `),
      sequelize.query(`
        SELECT COUNT(*) as count FROM (
          SELECT ins.target_id, MAX(ins.next_inspection_date) as latest_next
          FROM inspection_records ins
          JOIN vehicles v ON ins.target_id = v.id
          WHERE ins.type = 'vehicle' AND v.status != 'retired'
          GROUP BY ins.target_id
        ) t WHERE t.latest_next < CURDATE()
      `),
      sequelize.query(`
        SELECT COUNT(*) as count FROM (
          SELECT ins.target_id, MAX(ins.next_inspection_date) as latest_next
          FROM inspection_records ins
          JOIN trailers tr ON ins.target_id = tr.id
          WHERE ins.type = 'trailer' AND tr.status != 'retired'
          GROUP BY ins.target_id
        ) t WHERE t.latest_next < CURDATE()
      `)
    ])

    const getCount = (res) => {
      if (res && res[0] && res[0][0]) {
        return parseInt(res[0][0].count) || 0
      }
      return 0
    }

    res.json({
      code: 200,
      data: {
        totalVehicles: getCount(results[0]),
        totalTrailers: getCount(results[1]),
        totalDrivers: getCount(results[2]),
        expiringPhysical: getCount(results[3]),
        expiringDriverInsurance: getCount(results[4]),
        expiringVehicleInsurance: getCount(results[5]),
        expiringTrailerInsurance: getCount(results[6]),
        expiringVehicleMaintenance: getCount(results[7]),
        expiringTrailerMaintenance: getCount(results[8]),
        expiringVehicleInspection: getCount(results[9]),
        expiringTrailerInspection: getCount(results[10])
      }
    })
  } catch (error) {
    console.error('Dashboard Stats Error:', error)
    res.status(500).json({ code: 500, message: 'Internal Server Error' })
  }
})

export default router
