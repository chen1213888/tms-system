-- 创建数据库
SET FOREIGN_KEY_CHECKS = 0;

DROP DATABASE IF EXISTS fleet_db;
CREATE DATABASE IF NOT EXISTS fleet_db DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE fleet_db;

-- 用户表
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL COMMENT '用户名',
    password_hash VARCHAR(255) NOT NULL COMMENT '密码哈希',
    email VARCHAR(100) UNIQUE COMMENT '邮箱',
    phone VARCHAR(20) COMMENT '手机号',
    status ENUM('active', 'inactive') DEFAULT 'active' COMMENT '状态',
    role_id INT COMMENT '角色ID',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_username (username),
    INDEX idx_role_id (role_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';

-- 角色表
CREATE TABLE IF NOT EXISTS roles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) UNIQUE NOT NULL COMMENT '角色名称',
    description VARCHAR(255) COMMENT '角色描述',
    permissions JSON COMMENT '权限配置',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='角色表';

-- 菜单表
CREATE TABLE IF NOT EXISTS menus (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL COMMENT '菜单名称',
    path VARCHAR(100) COMMENT '路由路径',
    component VARCHAR(100) COMMENT '组件路径',
    icon VARCHAR(50) COMMENT '图标',
    parent_id INT DEFAULT 0 COMMENT '父菜单ID',
    sort_order INT DEFAULT 0 COMMENT '排序',
    status ENUM('enabled', 'disabled') DEFAULT 'enabled' COMMENT '状态',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_parent_id (parent_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='菜单表';

-- 司机表
CREATE TABLE IF NOT EXISTS drivers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL COMMENT '姓名',
    phone VARCHAR(20) UNIQUE NOT NULL COMMENT '手机号',
    id_card VARCHAR(18) UNIQUE NOT NULL COMMENT '身份证号',
    address VARCHAR(255) COMMENT '地址',
    emergency_contact VARCHAR(50) COMMENT '紧急联系人',
    emergency_phone VARCHAR(20) COMMENT '紧急联系电话',
    marital_status ENUM('unmarried', 'married', 'divorced', 'widowed') DEFAULT 'unmarried' COMMENT '婚姻状态',
    transport_qualification ENUM('general', 'dangerous_goods') DEFAULT 'general' COMMENT '运输资质',
    group_name VARCHAR(50) COMMENT '所属组别',
    status ENUM('active', 'inactive', 'retired', 'deleted') DEFAULT 'active' COMMENT '状态',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_id_card (id_card),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='司机表';

-- 驾驶证表
CREATE TABLE IF NOT EXISTS driver_licenses (
    id INT PRIMARY KEY AUTO_INCREMENT,
    driver_id INT NOT NULL COMMENT '司机ID',
    license_number VARCHAR(20) UNIQUE NOT NULL COMMENT '驾驶证号',
    license_type VARCHAR(10) NOT NULL COMMENT '准驾车型',
    issue_date DATE NOT NULL COMMENT '初次领证日期',
    expiry_date DATE NOT NULL COMMENT '有效期限',
    issue_organization VARCHAR(100) COMMENT '发证机关',
    photo_url VARCHAR(255) COMMENT '证件照片',
    status ENUM('valid', 'expired', 'suspended') DEFAULT 'valid' COMMENT '状态',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE CASCADE,
    INDEX idx_driver_id (driver_id),
    INDEX idx_expiry_date (expiry_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='驾驶证表';

-- 车辆表
CREATE TABLE IF NOT EXISTS vehicles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    plate_number VARCHAR(20) UNIQUE NOT NULL COMMENT '车牌号',
    registration_date DATE COMMENT '注册日期',
    vehicle_type ENUM('tractor', 'single_truck') NOT NULL COMMENT '车辆类型',
    brand VARCHAR(50) COMMENT '品牌',
    model VARCHAR(50) COMMENT '型号',
    color VARCHAR(20) COMMENT '颜色',
    vin_code VARCHAR(17) UNIQUE COMMENT '车架号',
    engine_number VARCHAR(20) COMMENT '发动机号',
    purchase_date DATE COMMENT '购买日期',
    purchase_price DECIMAL(10,2) COMMENT '购买价格',
    current_mileage INT DEFAULT 0 COMMENT '当前里程',
    group_name VARCHAR(50) COMMENT '所属组别',
    status ENUM('active', 'maintenance', 'retired', 'accident', 'deleted') DEFAULT 'active' COMMENT '状态',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_plate_number (plate_number),
    INDEX idx_vehicle_type (vehicle_type),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='车辆表';

-- 挂车表
CREATE TABLE IF NOT EXISTS trailers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    plate_number VARCHAR(20) UNIQUE NOT NULL COMMENT '车牌号',
    registration_date DATE COMMENT '注册日期',
    trailer_type VARCHAR(20) NOT NULL COMMENT '挂车类型',
    length DECIMAL(4,1) COMMENT '长度(米)',
    width DECIMAL(4,1) COMMENT '宽度(米)',
    height DECIMAL(4,1) COMMENT '高度(米)',
    capacity DECIMAL(6,2) COMMENT '载重(吨)',
    brand VARCHAR(50) COMMENT '品牌',
    model VARCHAR(50) COMMENT '型号',
    purchase_date DATE COMMENT '购买日期',
    group_name VARCHAR(50) COMMENT '所属组别',
    status ENUM('active', 'maintenance', 'retired', 'deleted') DEFAULT 'active' COMMENT '状态',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_plate_number (plate_number),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='挂车表';

-- 体检记录表
CREATE TABLE IF NOT EXISTS physical_records (
    id INT PRIMARY KEY AUTO_INCREMENT,
    driver_id INT NOT NULL COMMENT '司机ID',
    examination_date DATE NOT NULL COMMENT '体检日期',
    expiry_date DATE NOT NULL COMMENT '到期日期',
    hospital VARCHAR(100) COMMENT '体检医院',
    result ENUM('qualified', 'unqualified', 'pending') DEFAULT 'qualified' COMMENT '体检结果',
    issue VARCHAR(255) COMMENT '问题点',
    attachment_url VARCHAR(255) COMMENT '附件地址',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE CASCADE,
    INDEX idx_driver_id (driver_id),
    INDEX idx_expiry_date (expiry_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='体检记录表';

-- 保险记录表
CREATE TABLE IF NOT EXISTS insurance_records (
    id INT PRIMARY KEY AUTO_INCREMENT,
    type ENUM('driver', 'vehicle', 'trailer') NOT NULL COMMENT '保险类型',
    target_id INT NOT NULL COMMENT '关联对象ID',
    insurance_company VARCHAR(100) NOT NULL COMMENT '保险公司',
    policy_number VARCHAR(50) NOT NULL COMMENT '保单号',
    coverage_amount DECIMAL(10,2) COMMENT '保额',
    premium DECIMAL(10,2) COMMENT '保费',
    start_date DATE NOT NULL COMMENT '开始日期',
    end_date DATE NOT NULL COMMENT '结束日期',
    attachment_url VARCHAR(255) COMMENT '附件地址',
    status ENUM('active', 'expired', 'cancelled') DEFAULT 'active' COMMENT '状态',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_type_target (type, target_id),
    INDEX idx_end_date (end_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='保险记录表';

-- 保养记录表
CREATE TABLE IF NOT EXISTS maintenance_records (
    id INT PRIMARY KEY AUTO_INCREMENT,
    type ENUM('vehicle', 'trailer') NOT NULL COMMENT '保养类型',
    target_id INT NOT NULL COMMENT '关联对象ID',
    maintenance_date DATE NOT NULL COMMENT '保养日期',
    next_maintenance_date DATE COMMENT '下次保养日期',
    maintenance_mileage INT COMMENT '保养时里程',
    maintenance_items TEXT COMMENT '保养项目',
    cost DECIMAL(8,2) COMMENT '保养费用',
    maintenance_shop VARCHAR(100) COMMENT '保养店铺',
    attachment_url VARCHAR(255) COMMENT '附件地址',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_type_target (type, target_id),
    INDEX idx_next_maintenance (next_maintenance_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='保养记录表';

-- 挂车年审记录表
CREATE TABLE IF NOT EXISTS inspection_records (
    id INT PRIMARY KEY AUTO_INCREMENT,
    type ENUM('vehicle', 'trailer') NOT NULL COMMENT '年审类型',
    target_id INT NOT NULL COMMENT '关联对象ID',
    inspection_date DATE NOT NULL COMMENT '年审日期',
    next_inspection_date DATE NOT NULL COMMENT '下次年审日期',
    inspection_agency VARCHAR(100) COMMENT '年审机构',
    result ENUM('passed', 'failed', 'pending') DEFAULT 'passed' COMMENT '年审结果',
    attachment_url VARCHAR(255) COMMENT '附件地址',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_type_target (type, target_id),
    INDEX idx_next_inspection (next_inspection_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='年审记录表';

-- 司机组别表
CREATE TABLE IF NOT EXISTS driver_groups (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) UNIQUE NOT NULL COMMENT '组别名称',
    description VARCHAR(255) COMMENT '组别描述',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='司机组别表';

-- 车辆组别表
CREATE TABLE IF NOT EXISTS vehicle_groups (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) UNIQUE NOT NULL COMMENT '组别名称',
    description VARCHAR(255) COMMENT '组别描述',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='车辆组别表';

-- 挂车组别表
CREATE TABLE IF NOT EXISTS trailer_groups (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) UNIQUE NOT NULL COMMENT '组别名称',
    description VARCHAR(255) COMMENT '组别描述',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='挂车组别表';

-- 初始化角色数据
INSERT INTO roles (name, description, permissions) VALUES
('super_admin', '超级管理员', '{"all": true}'),
('fleet_manager', '车队管理员', '{"drivers": ["read", "write"], "vehicles": ["read", "write"], "trailers": ["read", "write"]}'),
('normal_user', '普通用户', '{"drivers": ["read"], "vehicles": ["read"], "trailers": ["read"]}');

-- 初始化菜单数据
INSERT INTO menus (name, path, component, icon, parent_id, sort_order) VALUES
('首页', '/dashboard', 'Dashboard', 'el-icon-s-home', 0, 1),
('司机管理', '/drivers', 'Drivers', 'el-icon-user', 0, 2),
('司机列表', '/drivers/list', 'DriverList', 'el-icon-tickets', 2, 1),
('体检管理', '/drivers/physical', 'PhysicalManage', 'el-icon-first-aid-kit', 2, 2),
('保险管理', '/drivers/insurance', 'InsuranceManage', 'el-icon-s-finance', 2, 3),
('驾驶证管理', '/drivers/license', 'LicenseManage', 'el-icon-document', 2, 4),
('车辆管理', '/vehicles', 'Vehicles', 'el-icon-truck', 0, 3),
('车辆列表', '/vehicles/list', 'VehicleList', 'el-icon-tickets', 7, 1),
('保险管理', '/vehicles/insurance', 'VehicleInsurance', 'el-icon-s-finance', 7, 2),
('保养管理', '/vehicles/maintenance', 'VehicleMaintenance', 'el-icon-tools', 7, 3),
('年审管理', '/vehicles/inspection', 'VehicleInspection', 'el-icon-date', 7, 4),
('挂车管理', '/trailers', 'Trailers', 'el-icon-ship', 0, 4),
('挂车列表', '/trailers/list', 'TrailerList', 'el-icon-tickets', 12, 1),
('保养管理', '/trailers/maintenance', 'TrailerMaintenance', 'el-icon-tools', 12, 2),
('年审管理', '/trailers/inspection', 'TrailerInspection', 'el-icon-date', 12, 3),
('系统管理', '/system', 'System', 'el-icon-setting', 0, 5),
('用户管理', '/system/users', 'UserManage', 'el-icon-user-solid', 16, 1),
('角色管理', '/system/roles', 'RoleManage', 'el-icon-s-custom', 16, 2),
('菜单管理', '/system/menus', 'MenuManage', 'el-icon-menu', 16, 3);

-- 初始化超级管理员用户 (密码: 123456)
INSERT INTO users (username, password_hash, email, role_id) VALUES
('admin', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin@fleet.com', 1);

SET FOREIGN_KEY_CHECKS = 1;