import { Sequelize } from 'sequelize';

let sequelize = null;

/**
 * Initializes the Sequelize instance.
 * This function should be called only once when the application is ready to connect to the database.
 * @returns {Sequelize} The initialized sequelize instance.
 */
const initSequelize = () => {
  if (sequelize) {
    console.warn('Sequelize has already been initialized.');
    return sequelize;
  }

  // Environment variables must be loaded before calling this function.
  sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      dialect: process.env.DB_DIALECT,
      logging: false, // Set to console.log to see executed SQL queries
    }
  );

  return sequelize;
};

/**
 * Retrieves the singleton Sequelize instance.
 * Throws an error if Sequelize has not been initialized yet.
 * @returns {Sequelize} The sequelize instance.
 */
const getSequelize = () => {
  if (!sequelize) {
    throw new Error('Sequelize has not been initialized. Call initSequelize() first.');
  }
  return sequelize;
};

/**
 * Tests the database connection using the initialized Sequelize instance.
 * Exits the process on failure.
 */
const connectDB = async () => {
  try {
    // We get the instance here to ensure it's initialized.
    const dbInstance = getSequelize();
    await dbInstance.authenticate();
    console.log('MySQL Connection has been established successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    process.exit(1); // Exit process with failure
  }
};

// Export the functions to control the lifecycle of the Sequelize instance.
export { initSequelize, getSequelize, connectDB };