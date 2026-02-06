import sequelize from '../config/db.js'
import bcrypt from 'bcryptjs'

const seed = async () => {
  try {
    console.log('Connecting to database...')
    await sequelize.authenticate()
    console.log('Database connected.')

    const count = 40; // 生成 40 条数据
    const today = new Date();
    
    // 辅助函数：生成随机日期
    const getRandomDate = (baseDate, daysOffset) => {
      const d = new Date(baseDate);
      d.setDate(baseDate.getDate() + daysOffset);
      return d.toISOString().split('T')[0];
    };

    // 1. 清理旧数据
    console.log('Cleaning old data...')
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0')
    await sequelize.query('TRUNCATE TABLE physical_records')
    await sequelize.query('TRUNCATE TABLE insurance_records')
    await sequelize.query('TRUNCATE TABLE maintenance_records')
    await sequelize.query('TRUNCATE TABLE inspection_records')
    await sequelize.query('TRUNCATE TABLE driver_licenses')
    await sequelize.query('TRUNCATE TABLE drivers')
    await sequelize.query('TRUNCATE TABLE vehicles')
    await sequelize.query('TRUNCATE TABLE trailers')
    await sequelize.query('TRUNCATE TABLE driver_groups')
    await sequelize.query('TRUNCATE TABLE vehicle_groups')
    await sequelize.query('TRUNCATE TABLE trailer_groups')
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1')

    // 2. Seed Groups
    console.log('Seeding Groups...')
    const groups = ['第一车队', '第二车队', '临时车队'];
    for (const group of groups) {
      await sequelize.query('INSERT INTO driver_groups (name, description) VALUES (?, ?)', { replacements: [group, `${group}描述`] })
      await sequelize.query('INSERT INTO vehicle_groups (name, description) VALUES (?, ?)', { replacements: [group, `${group}描述`] })
      await sequelize.query('INSERT INTO trailer_groups (name, description) VALUES (?, ?)', { replacements: [group, `${group}描述`] })
    }

    // 3. Seed Drivers
    console.log(`Seeding ${count} Drivers...`)
    const driverNames = ['张', '王', '李', '赵', '陈', '刘', '周', '吴', '朱', '孙'];
    const driverSuffix = ['伟', '强', '勇', '敏', '涛', '杰', '军', '平', '辉', '波'];
    
    for (let i = 1; i <= count; i++) {
      const name = driverNames[i % 10] + driverSuffix[Math.floor(i / 5) % 10] + i;
      const phone = `138${i.toString().padStart(8, '0')}`;
      const id_card = `11010119800101${i.toString().padStart(4, '0')}`;
      await sequelize.query(
        'INSERT INTO drivers (name, phone, id_card, address, status, group_name) VALUES (?, ?, ?, ?, ?, ?)',
        { replacements: [name, phone, id_card, '北京市某区', 'active', groups[i % 3]] }
      )
    }

    // 4. Seed Vehicles
    console.log(`Seeding ${count} Vehicles...`)
    const brands = ['解放', '东风', '重汽', '福田', '沃尔沃'];
    for (let i = 1; i <= count; i++) {
      const plate = `京A${i.toString().padStart(5, '0')}`;
      const type = i % 2 === 0 ? 'tractor' : 'single_truck';
      const vin = `LFP${i.toString().padStart(14, '0')}`;
      const engine = `E${i.toString().padStart(9, '0')}`;
      await sequelize.query(
        'INSERT INTO vehicles (plate_number, vehicle_type, brand, model, vin_code, engine_number, purchase_date, status, group_name, registration_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        { replacements: [plate, type, brands[i % 5], 'Model-' + i, vin, engine, '2022-01-01', 'active', groups[i % 3], '2022-01-01'] }
      )
    }

    // 5. Seed Trailers
    console.log(`Seeding ${count} Trailers...`)
    const trailerTypes = ['飞翼挂车', '柜车'];
    for (let i = 1; i <= count; i++) {
      const plate = `京A${i.toString().padStart(4, '0')}挂`;
      const type = trailerTypes[i % 2];
      await sequelize.query(
        'INSERT INTO trailers (plate_number, trailer_type, length, width, height, capacity, brand, model, purchase_date, status, group_name, registration_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        { replacements: [plate, type, 13.0, 2.5, 1.5, 30.0, '中集', 'ZJ-' + i, '2022-01-01', 'active', groups[i % 3], '2022-01-01'] }
      )
    }

    // 获取所有 ID
    const [driverList] = await sequelize.query('SELECT id FROM drivers')
    const [vehicleList] = await sequelize.query('SELECT id FROM vehicles')
    const [trailerList] = await sequelize.query('SELECT id FROM trailers')

    // 5. Seed Records (每种记录生成一些即将到期的)
    console.log('Seeding Records with expiring dates...')
    
    for (let i = 0; i < count; i++) {
      // 这里的逻辑是：一部分数据是 15 天内到期（触发预警），一部分是 60 天后到期（不触发）
      const isExpiring = i < 25; // 前 25 个设为即将到期
      const offset = isExpiring ? 10 : 60;
      const expiryDate = getRandomDate(today, offset);
      const startDate = getRandomDate(today, -350);

      // 体检记录
      await sequelize.query(
        'INSERT INTO physical_records (driver_id, examination_date, expiry_date, hospital, result) VALUES (?, ?, ?, ?, ?)',
        { replacements: [driverList[i].id, startDate, expiryDate, '人民医院', 'qualified'] }
      );

      // 驾驶证
      await sequelize.query(
        'INSERT INTO driver_licenses (driver_id, license_number, license_type, issue_date, expiry_date, issue_organization, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
        { replacements: [driverList[i].id, 'LIC' + i, 'A2', '2015-01-01', expiryDate, '车管所', 'valid'] }
      );

      // 车辆保险
      await sequelize.query(
        'INSERT INTO insurance_records (type, target_id, insurance_company, policy_number, start_date, end_date, premium, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        { replacements: ['vehicle', vehicleList[i].id, '平安保险', 'VPOL' + i, startDate, expiryDate, 8000, 'active'] }
      );

      // 司机保险
      await sequelize.query(
        'INSERT INTO insurance_records (type, target_id, insurance_company, policy_number, start_date, end_date, premium, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        { replacements: ['driver', driverList[i].id, '中国人寿', 'DPOL' + i, startDate, expiryDate, 500, 'active'] }
      );

      // 挂车保险
      await sequelize.query(
        'INSERT INTO insurance_records (type, target_id, insurance_company, policy_number, start_date, end_date, premium, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        { replacements: ['trailer', trailerList[i].id, '太平洋保险', 'TPOL' + i, startDate, expiryDate, 3000, 'active'] }
      );

      // 车辆保养
      await sequelize.query(
        'INSERT INTO maintenance_records (type, target_id, maintenance_date, next_maintenance_date, maintenance_mileage, maintenance_items, cost, maintenance_shop) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        { replacements: ['vehicle', vehicleList[i].id, startDate, expiryDate, 50000, '基础保养', 1000, '途虎'] }
      );

      // 挂车保养
      await sequelize.query(
        'INSERT INTO maintenance_records (type, target_id, maintenance_date, next_maintenance_date, maintenance_mileage, maintenance_items, cost, maintenance_shop) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        { replacements: ['trailer', trailerList[i].id, startDate, expiryDate, 20000, '轴承保养', 500, '快修店'] }
      );

      // 车辆年审
      await sequelize.query(
        'INSERT INTO inspection_records (type, target_id, inspection_date, next_inspection_date, inspection_agency, result) VALUES (?, ?, ?, ?, ?, ?)',
        { replacements: ['vehicle', vehicleList[i].id, startDate, expiryDate, '检测场', 'passed'] }
      );

      // 挂车年审
      await sequelize.query(
        'INSERT INTO inspection_records (type, target_id, inspection_date, next_inspection_date, inspection_agency, result) VALUES (?, ?, ?, ?, ?, ?)',
        { replacements: ['trailer', trailerList[i].id, startDate, expiryDate, '检测场', 'passed'] }
      );
    }

    console.log('Bulk mock data seeded successfully! 🎉')
    process.exit(0)
  } catch (error) {
    console.error('Seeding failed:', error)
    process.exit(1)
  }
}

seed()
