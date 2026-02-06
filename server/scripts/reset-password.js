
import bcrypt from 'bcryptjs';
import sequelize from '../config/db.js';

async function resetPassword() {
  try {
    const password = '123456';
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    console.log(`Generated hash for '${password}': ${hash}`);

    // Check if user exists
    const [users] = await sequelize.query("SELECT * FROM users WHERE username = 'admin'");
    
    if (users.length === 0) {
      console.log('User admin not found. Creating one...');
      await sequelize.query(
        "INSERT INTO users (username, password_hash, email, role_id) VALUES (?, ?, ?, ?)",
        {
          replacements: ['admin', hash, 'admin@fleet.com', 1]
        }
      );
      console.log('User admin created successfully.');
    } else {
      console.log('User admin found. Updating password...');
      await sequelize.query(
        "UPDATE users SET password_hash = ? WHERE username = 'admin'",
        {
          replacements: [hash]
        }
      );
      console.log('Password updated successfully.');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error resetting password:', error);
    process.exit(1);
  }
}

resetPassword();
