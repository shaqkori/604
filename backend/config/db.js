const mysql = require("mysql2/promise");

// Database credentials
const DB_HOST = process.env.DB_HOST;
const DB_USER = process.env.DB_USER;
const DB_PASSWORD = process.env.DB_PASSWORD;
const DB_NAME = process.env.DB_NAME;

// Create a connection pool
const pool = mysql.createPool({
  host: DB_HOST,
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Function to test database connection
async function testConnection() {
  let connection; // Declare connection outside try to ensure it's accessible in finally
  try {
    connection = await pool.getConnection();
    console.log("Connected to database");

    await createTables(connection); // Create tables
    await insertCategories(connection); // Insert default categories
  } catch (error) {
    console.error("Database connection failed:", error);
    process.exit(1);
  } finally {
    if (connection) {
      connection.release(); // Ensure connection is released even if errors occur
    }
  }
}

// Function to create tables
async function createTables(connection) {
  try {
    // Users table
    const [usersResult] = await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(255) PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    // Check warningStatus to see if table already existed
    if (usersResult.warningStatus > 0) {
      console.log("Table 'users' already exists.");
    } else {
      console.log("Table 'users' created successfully.");
    }

    // Categories table
    const [categoriesResult] = await connection.execute(`
      CREATE TABLE IF NOT EXISTS categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    if (categoriesResult.warningStatus > 0) {
      console.log("Table 'categories' already exists.");
    } else {
      console.log("Table 'categories' created successfully.");
    }

    // Transactions table
    const [transactionsResult] = await connection.execute(`
      CREATE TABLE IF NOT EXISTS transactions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        category_id INT,
        description TEXT,
        date DATE NOT NULL,
        type ENUM('income', 'expense') NOT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
        INDEX (user_id),
        INDEX (category_id)
      )
    `);
    if (transactionsResult.warningStatus > 0) {
      console.log("Table 'transactions' already exists.");
    } else {
      console.log("Table 'transactions' created successfully.");
    }

    // Savings table
    const [savingsResult] = await connection.execute(`
      CREATE TABLE IF NOT EXISTS savings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        targetAmount DECIMAL(10,2) NOT NULL,
        currentAmount DECIMAL(10,2) DEFAULT 0,
        dateCreated DATE NOT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX (user_id)
      )
    `);
    if (savingsResult.warningStatus > 0) {
      console.log("Table 'savings' already exists.");
    } else {
      console.log("Table 'savings' created successfully.");
    }

    console.log("All table checks complete.");
  } catch (error) {
    console.error("Error creating tables:", error);
    process.exit(1);
  }
}

// Function to insert default categories
async function insertCategories(connection) {
  try {
    const categories = [
      "Food",
      "Rent",
      "Entertainment",
      "Utilities",
      "Savings",
      "Income",
    ];

    for (const category of categories) {
      // INSERT IGNORE will insert only if the 'name' is not already present
      // due to the UNIQUE constraint on the 'name' column.
      await connection.execute(
        `INSERT IGNORE INTO categories (name) VALUES (?)`,
        [category]
      );
    }

    console.log("Default categories inserted (if not already present)");
  } catch (error) {
    console.error("Error inserting categories:", error);
    process.exit(1);
  }
}

// Execute the connection test and table creation
testConnection();

// Export the pool for other modules to use
module.exports = pool;
