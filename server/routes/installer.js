import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { Sequelize } from 'sequelize';
import db from '../models/index.js';

const router = express.Router();

// Helper function to get the path to the .env file in the server directory
const getEnvPath = () => {
  // Use fileURLToPath to ensure correct path conversion on all platforms, especially Windows
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  // Navigate up from /routes to /server to find the target .env path
  return path.join(__dirname, '..', '.env');
};

// @desc    Test MySQL database connection
// @route   POST /api/installer/test-db
// @access  Public
router.post('/test-db', async (req, res) => {
  const { dbHost, dbUser, dbPassword, dbName } = req.body;
  const dbPort = 3306; // Hardcode DB port to avoid user error

  if (!dbHost || !dbUser || !dbName) {
    return res.status(400).json({ message: 'All database connection fields (except port) are required.' });
  }

  let tempSequelize;
  try {
    tempSequelize = new Sequelize(dbName, dbUser, dbPassword, {
      host: dbHost,
      port: dbPort,
      dialect: 'mysql',
      logging: false,
    });
    await tempSequelize.authenticate();
    res.status(200).json({ message: 'Database connection successful.' });
  } catch (error) {
    console.error('DB Connection Test Error:', error);
    res.status(400).json({ message: 'Database connection failed.', error: error.message });
  } finally {
    if (tempSequelize) {
      await tempSequelize.close();
    }
  }
});

// @desc    Write .env configuration file
// @route   POST /api/installer/write-config
// @access  Public
router.post('/write-config', async (req, res) => {
  const { dbHost, dbUser, dbPassword, dbName, dbPort } = req.body;
  if (!dbHost || !dbUser || !dbName || !dbPort) {
    return res.status(400).json({ message: 'All database connection fields are required.' });
  }
  const jwtSecret = [...Array(32)].map(() => Math.random().toString(36)[2]).join('');

  const envContent = `
# Server Configuration
PORT=5000
JWT_SECRET=${jwtSecret}
ADMIN_RESTART_TOKEN=dev-restart-key

# Database Configuration - MySQL
DB_HOST=${dbHost}
DB_USER=${dbUser}
DB_PASSWORD=${dbPassword}
DB_NAME=${dbName}
DB_PORT=3306
DB_DIALECT=mysql
`;

  try {
    await fs.writeFile(getEnvPath(), envContent.trim());
    res.status(200).json({ message: 'Configuration file written successfully. Please restart the server.' });
  } catch (error) {
    console.error('Write Config Error:', error);
    res.status(500).json({ message: 'Failed to write configuration file.', error: error.message });
  }
});

// @desc    Create initial admin user
// @route   POST /api/installer/create-admin
// @access  Public
router.post('/create-admin', async (req, res) => {
  const { firstName, lastName, email, password } = req.body;

  if (!firstName || !lastName || !email || !password) {
    return res.status(400).json({ message: 'All admin fields are required.' });
  }

  try {
    // The db object is now correctly imported.
    const { User, sequelize } = db;

    // 1. Sync database tables to ensure they exist
    // Using { force: true } ensures a clean install by dropping existing tables.
    await sequelize.sync({ force: true });

    // 2. Check if an admin already exists
    const adminExists = await User.findOne({ where: { role: 'admin' } });
    if (adminExists) {
      return res.status(400).json({ message: 'An admin user already exists.' });
    }

    // 3. Create the admin user
    const admin = await User.create({
      firstName,
      lastName,
      email,
      password,
      role: 'admin',
    });

    // Create a lock file to prevent installer from running again
    await fs.writeFile(path.join(path.dirname(getEnvPath()), 'installer.lock'), 'installed');

    res.status(201).json({ message: 'Admin user created and database synchronized. Installation complete!', adminId: admin.id });

  } catch (error) {
    console.error('Create Admin Error:', error);
    if (error.name === 'SequelizeConnectionError' || error.name === 'SequelizeAccessDeniedError') {
       return res.status(503).json({ message: 'Database not connected. Please restart the server after writing the config.' });
    }
    res.status(500).json({ message: 'Failed to create admin user.', error: error.message });
  }
});

export default router;
