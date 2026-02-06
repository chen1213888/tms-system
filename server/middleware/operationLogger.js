import sequelize from '../config/db.js';

/**
 * 操作日志中间件
 */
export const operationLogger = async (req, res, next) => {
  // 仅记录非 GET 请求（创建、更新、删除）
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    // 重写 res.json 以便捕获响应结果
    const originalJson = res.json;
    res.json = function (data) {
      // 仅记录操作成功的操作（约定业务 code 为 200）
      if (data && data.code === 200) {
        const user = req.user || {};
        
        // 提取模块名（如 /api/drivers -> drivers）
        // 我们结合 baseUrl 和 path，并去掉 ID 部分
        const fullPath = (req.baseUrl + req.path).replace(/\/api\//, '/');
        const module = fullPath.split('/')
          .filter(p => p && !/^\d+$/.test(p)) // 过滤掉空字符串和纯数字ID
          .join('/');
        
        // 确定操作类型
        let action = 'UPDATE';
        if (req.method === 'POST') action = 'CREATE';
        if (req.method === 'DELETE') action = 'DELETE';
        
        const target_id = req.params.id || '';
        const details = JSON.stringify({
          body: req.body,
          params: req.params,
          query: req.query
        });
        
        const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.ip;

        // 异步记录日志，不阻塞主流程
        sequelize.query(
          'INSERT INTO operation_logs (user_id, username, module, action, target_id, details, ip) VALUES (?, ?, ?, ?, ?, ?, ?)',
          { 
            replacements: [
              user.id || 0, 
              user.username || 'unknown', 
              module, 
              action, 
              target_id, 
              details, 
              ip 
            ] 
          }
        ).catch(err => {
          console.error('Operation Logging Error:', err);
        });
      }
      return originalJson.call(this, data);
    };
  }
  next();
};
