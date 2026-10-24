const sqlite3 = require('sqlite3');
const mysql = require('mysql2/promise');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

let dbType = 'sqlite'; // 'postgres', 'mysql', or 'sqlite'
let pgPool = null;
let mysqlPool = null;
let sqliteDb = null;

// Initialize connection
async function initDB() {
  const usePG = process.env.DATABASE_URL || (process.env.PGHOST && process.env.PGUSER && process.env.PGDATABASE);
  const useMySQL = process.env.DB_HOST && process.env.DB_USER && process.env.DB_NAME;

  if (usePG) {
    try {
      console.log('Attempting to connect to PostgreSQL database...');
      const poolConfig = process.env.DATABASE_URL 
        ? { connectionString: process.env.DATABASE_URL }
        : {
            host: process.env.PGHOST,
            user: process.env.PGUSER,
            password: process.env.PGPASSWORD,
            database: process.env.PGDATABASE,
            port: process.env.PGPORT || 5432
          };
      
      if (process.env.PGSSL !== 'false') {
        poolConfig.ssl = { rejectUnauthorized: false };
      }

      pgPool = new Pool(poolConfig);
      // Test connection
      await pgPool.query('SELECT NOW()');
      console.log('Successfully connected to PostgreSQL database.');
      dbType = 'postgres';
    } catch (err) {
      console.error('PostgreSQL connection failed. Trying MySQL...', err.message);
      await initMySQLFallback(useMySQL);
    }
  } else {
    await initMySQLFallback(useMySQL);
  }

  await createTables();
  await seedDatabase();

  // Safe check for admin phone without causing SQLite NOT NULL constraint failures
  try {
    const adminRec = await get("SELECT phone FROM customers WHERE email = 'admin@littlelarge.in'");
    if (adminRec && adminRec.phone === '9999999999') {
      // Retain phone to honor schema NOT NULL constraint
    }
  } catch (err) {
    // Non-blocking
  }

  // Auto-correct any products where discount_price was entered higher than price (swap so price is higher MRP)
  try {
    await run("UPDATE products SET price = discount_price, discount_price = price WHERE discount_price IS NOT NULL AND discount_price > price");
  } catch (err) {
    console.warn("Failed to auto-correct reversed product prices:", err.message);
  }

  // Reset broken/empty homepage_settings media_url to default hero_vacation.png
  try {
    await run("UPDATE homepage_settings SET media_url = 'images/hero_vacation.png' WHERE media_url IS NULL OR media_url = '' OR media_url LIKE '%placeholder%'");
  } catch (err) {
    console.warn("Failed to reset homepage settings hero media_url:", err.message);
  }
}

async function initMySQLFallback(useMySQL) {
  if (useMySQL) {
    try {
      console.log('Attempting to connect to MySQL database...');
      mysqlPool = mysql.createPool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT || 3306,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
      });
      // Test connection
      const conn = await mysqlPool.getConnection();
      console.log('Successfully connected to MySQL database.');
      conn.release();
      dbType = 'mysql';
    } catch (err) {
      console.error('MySQL connection failed. Falling back to SQLite3...', err.message);
      setupSQLite();
    }
  } else {
    console.log('No PostgreSQL or MySQL environment variables found. Using SQLite3 for local development...');
    setupSQLite();
  }
}

function setupSQLite() {
  dbType = 'sqlite';
  const dbPath = path.join(__dirname, 'little_to_large.db');
  sqliteDb = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('Failed to open SQLite database:', err.message);
    } else {
      console.log('Opened SQLite database at:', dbPath);
    }
  });
}

// Convert SQLite '?' placeholders to Postgres '$1', '$2' format
function convertPlaceholders(sql) {
  if (dbType !== 'postgres') return sql;
  let index = 1;
  return sql.replace(/\?/g, () => `$${index++}`);
}

// Unified Query wrappers
async function query(sql, params = []) {
  const finalSql = convertPlaceholders(sql);
  if (dbType === 'postgres') {
    const res = await pgPool.query(finalSql, params);
    return res.rows;
  } else if (dbType === 'mysql') {
    const [rows] = await mysqlPool.execute(finalSql, params);
    return rows;
  } else {
    return new Promise((resolve, reject) => {
      sqliteDb.all(finalSql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }
}

async function get(sql, params = []) {
  const finalSql = convertPlaceholders(sql);
  if (dbType === 'postgres') {
    const res = await pgPool.query(finalSql, params);
    return res.rows[0] || null;
  } else if (dbType === 'mysql') {
    const [rows] = await mysqlPool.execute(finalSql, params);
    return rows[0] || null;
  } else {
    return new Promise((resolve, reject) => {
      sqliteDb.get(finalSql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row || null);
      });
    });
  }
}

async function run(sql, params = []) {
  if (dbType === 'postgres') {
    let finalSql = convertPlaceholders(sql);
    // Append RETURNING * to INSERT queries to mimic lastID behavior safely
    const isInsert = finalSql.trim().toUpperCase().startsWith('INSERT INTO');
    if (isInsert && !finalSql.toUpperCase().includes('RETURNING')) {
      finalSql += ' RETURNING *';
    }
    const res = await pgPool.query(finalSql, params);
    const insertId = res.rows[0] ? res.rows[0].id : null;
    return { insertId, changes: res.rowCount };
  } else if (dbType === 'mysql') {
    const finalSql = convertPlaceholders(sql);
    const [result] = await mysqlPool.execute(finalSql, params);
    return { insertId: result.insertId, changes: result.affectedRows };
  } else {
    return new Promise((resolve, reject) => {
      sqliteDb.run(sql, params, function (err) {
        if (err) reject(err);
        else resolve({ insertId: this.lastID, changes: this.changes });
      });
    });
  }
}

async function createTables() {
  const isMySQL = dbType === 'mysql';
  const isPostgres = dbType === 'postgres';
  
  const ai = isMySQL ? 'AUTO_INCREMENT' : 'AUTOINCREMENT';
  const textType = isMySQL ? 'LONGTEXT' : 'TEXT';
  const idType = isPostgres ? 'SERIAL PRIMARY KEY' : `INTEGER PRIMARY KEY ${ai}`;
  const datetimeType = isPostgres ? 'TIMESTAMP' : 'DATETIME';
  
  // Customers
  await run(`
    CREATE TABLE IF NOT EXISTS customers (
      id ${idType},
      name VARCHAR(100) NOT NULL,
      email VARCHAR(100) UNIQUE NOT NULL,
      phone VARCHAR(15) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      address_line VARCHAR(255),
      city VARCHAR(100),
      state VARCHAR(100),
      pincode VARCHAR(10),
      avatar_url VARCHAR(255),
      phone_alt VARCHAR(15),
      address_line_2 VARCHAR(255),
      city_2 VARCHAR(100),
      state_2 VARCHAR(100),
      pincode_2 VARCHAR(10),
      created_at ${datetimeType} DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Products
  await run(`
    CREATE TABLE IF NOT EXISTS products (
      id ${idType},
      name VARCHAR(150) NOT NULL,
      category VARCHAR(50) NOT NULL,
      subcategory VARCHAR(50),
      price DECIMAL(10, 2) NOT NULL,
      discount_price DECIMAL(10, 2),
      stock INTEGER DEFAULT 0,
      description TEXT,
      size_variants VARCHAR(100),
      image_urls ${textType},
      rating DECIMAL(3, 2) DEFAULT 0.00,
      video_url VARCHAR(255),
      fabric VARCHAR(100),
      color VARCHAR(100),
      style VARCHAR(100),
      gender VARCHAR(50),
      return_window_days INTEGER DEFAULT 7,
      color_variants ${textType},
      color_images ${textType},
      created_at ${datetimeType} DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Orders
  await run(`
    CREATE TABLE IF NOT EXISTS orders (
      id ${idType},
      customer_id INTEGER,
      total_amount DECIMAL(10, 2) NOT NULL,
      status VARCHAR(50) DEFAULT 'Pending',
      shipping_address TEXT NOT NULL,
      payment_method VARCHAR(50) NOT NULL,
      created_at ${datetimeType} DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Order Items
  await run(`
    CREATE TABLE IF NOT EXISTS order_items (
      id ${idType},
      order_id INTEGER,
      product_id INTEGER,
      size VARCHAR(50),
      quantity INTEGER NOT NULL,
      price DECIMAL(10, 2) NOT NULL
    )
  `);

  // Payments
  await run(`
    CREATE TABLE IF NOT EXISTS payments (
      id ${idType},
      order_id INTEGER,
      transaction_id VARCHAR(100) UNIQUE NOT NULL,
      amount DECIMAL(10, 2) NOT NULL,
      method VARCHAR(50) NOT NULL,
      status VARCHAR(50) DEFAULT 'Pending',
      created_at ${datetimeType} DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Reviews
  await run(`
    CREATE TABLE IF NOT EXISTS reviews (
      id ${idType},
      customer_id INTEGER,
      product_id INTEGER,
      rating INTEGER NOT NULL,
      comment TEXT,
      media_urls TEXT,
      created_at ${datetimeType} DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Wishlist
  await run(`
    CREATE TABLE IF NOT EXISTS wishlist (
      id ${idType},
      customer_id INTEGER,
      product_id INTEGER,
      created_at ${datetimeType} DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Support Inquiries table centralized here
  await run(`
    CREATE TABLE IF NOT EXISTS inquiries (
      id ${idType},
      name VARCHAR(100) NOT NULL,
      email VARCHAR(100) NOT NULL,
      phone VARCHAR(15),
      subject VARCHAR(150),
      message TEXT NOT NULL,
      created_at ${datetimeType} DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Promotions table
  await run(`
    CREATE TABLE IF NOT EXISTS promotions (
      id ${idType},
      title VARCHAR(150) NOT NULL,
      subtitle VARCHAR(255),
      bg_color VARCHAR(50) DEFAULT 'var(--primary)',
      media_url TEXT,
      link_url TEXT,
      start_date ${datetimeType} NOT NULL,
      end_date ${datetimeType} NOT NULL,
      priority INTEGER DEFAULT 0,
      status VARCHAR(50) DEFAULT 'active',
      created_at ${datetimeType} DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Homepage Settings table
  await run(`
    CREATE TABLE IF NOT EXISTS homepage_settings (
      id ${idType},
      hero_title VARCHAR(250) NOT NULL,
      hero_subtitle VARCHAR(255),
      media_url VARCHAR(255),
      media_type VARCHAR(50) DEFAULT 'image', -- 'image' or 'video'
      festival_mode VARCHAR(50) DEFAULT 'none', -- 'none', 'diwali', 'christmas', etc.
      created_at ${datetimeType} DEFAULT CURRENT_TIMESTAMP,
      updated_at ${datetimeType} DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Multiple Hero Banners table for homepage slider manager
  await run(`
    CREATE TABLE IF NOT EXISTS hero_banners (
      id ${idType},
      title VARCHAR(150),
      subtitle VARCHAR(255),
      cta_text VARCHAR(50) DEFAULT 'Shop Now',
      media_url TEXT NOT NULL,
      media_type VARCHAR(50) DEFAULT 'image',
      link_url TEXT DEFAULT 'products.html',
      priority INTEGER DEFAULT 0,
      status VARCHAR(50) DEFAULT 'active',
      created_at ${datetimeType} DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Error Logs table
  await run(`
    CREATE TABLE IF NOT EXISTS error_logs (
      id ${idType},
      message TEXT NOT NULL,
      stack_trace TEXT,
      path VARCHAR(255),
      severity VARCHAR(50) DEFAULT 'error', -- 'low', 'warning', 'critical'
      status VARCHAR(50) DEFAULT 'new', -- 'new', 'investigating', 'resolved'
      suggested_fix TEXT,
      created_at ${datetimeType} DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Lookbook Pages table
  await run(`
    CREATE TABLE IF NOT EXISTS lookbook_pages (
      id ${idType},
      page_number INTEGER UNIQUE NOT NULL,
      image_url TEXT NOT NULL,
      created_at ${datetimeType} DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Coupons table
  await run(`
    CREATE TABLE IF NOT EXISTS coupons (
      id ${idType},
      code VARCHAR(50) UNIQUE NOT NULL,
      discount_type VARCHAR(50) DEFAULT 'percentage', -- 'percentage' or 'amount'
      discount_value DECIMAL(10, 2) NOT NULL,
      description VARCHAR(255),
      tag VARCHAR(50) DEFAULT 'OFFER',
      created_at ${datetimeType} DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Settings
  await run(`
    CREATE TABLE IF NOT EXISTS settings (
      key VARCHAR(100) PRIMARY KEY,
      value TEXT NOT NULL
    )
  `);

  // OTP Verifications Table
  await run('DROP TABLE IF EXISTS otp_verifications');
  await run(`
    CREATE TABLE IF NOT EXISTS otp_verifications (
      id ${idType},
      phone VARCHAR(15) UNIQUE NOT NULL,
      otp VARCHAR(6) NOT NULL,
      expires_at VARCHAR(100) NOT NULL
    )
  `);

  // Family Profiles Table
  await run(`
    CREATE TABLE IF NOT EXISTS family_profiles (
      id ${idType},
      customer_id INTEGER NOT NULL,
      name VARCHAR(100) NOT NULL,
      relationship VARCHAR(50) NOT NULL,
      age INTEGER,
      gender VARCHAR(50),
      top_size VARCHAR(20),
      bottom_size VARCHAR(20),
      shoe_size VARCHAR(20),
      created_at ${datetimeType} DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Careers & Job/Internship Opportunities Table
  await run(`
    CREATE TABLE IF NOT EXISTS careers (
      id ${idType},
      title VARCHAR(150) NOT NULL,
      role VARCHAR(100) NOT NULL,
      department VARCHAR(100) DEFAULT 'Fashion & E-Commerce',
      employment_type VARCHAR(50) DEFAULT 'Full-time', -- 'Full-time', 'Part-time', 'Internship', 'Contract', 'Remote'
      location VARCHAR(100) DEFAULT 'Gandhidham, Gujarat / Hybrid',
      experience VARCHAR(50) DEFAULT '0-2 Years',
      stipend_or_salary VARCHAR(100),
      timeline_deadline VARCHAR(50), -- e.g. '2026-11-30' or 'Immediate'
      requirements TEXT NOT NULL,
      description TEXT NOT NULL,
      status VARCHAR(20) DEFAULT 'open', -- 'open' or 'closed'
      created_at ${datetimeType} DEFAULT CURRENT_TIMESTAMP,
      updated_at ${datetimeType} DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Career Applications from Public Job Seekers / Interns
  await run(`
    CREATE TABLE IF NOT EXISTS career_applications (
      id ${idType},
      career_id INTEGER,
      applicant_name VARCHAR(100) NOT NULL,
      email VARCHAR(100) NOT NULL,
      phone VARCHAR(15) NOT NULL,
      portfolio_or_resume_url TEXT,
      cover_note TEXT,
      status VARCHAR(30) DEFAULT 'new', -- 'new', 'reviewing', 'shortlisted', 'rejected'
      created_at ${datetimeType} DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Product Color Variants Table
  await run(`
    CREATE TABLE IF NOT EXISTS product_variants (
      id ${idType},
      product_id INTEGER NOT NULL,
      color_name VARCHAR(100) NOT NULL,
      color_code VARCHAR(30) DEFAULT '#b91c1c',
      sku VARCHAR(100),
      price DECIMAL(10, 2),
      discount_price DECIMAL(10, 2),
      stock INTEGER DEFAULT 0,
      size_variants VARCHAR(100) DEFAULT 'S,M,L,XL',
      sizes_stock_json TEXT,
      image_urls TEXT,
      is_default INTEGER DEFAULT 0,
      created_at ${datetimeType} DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Store Policies Table (Replacement, Terms, Shipping, Privacy)
  await run(`
    CREATE TABLE IF NOT EXISTS store_policies (
      id ${idType},
      policy_key VARCHAR(50) UNIQUE NOT NULL,
      title VARCHAR(150) NOT NULL,
      content TEXT NOT NULL,
      updated_at ${datetimeType} DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Admin Security & TOTP 2FA Table
  await run(`
    CREATE TABLE IF NOT EXISTS admin_security (
      id ${idType},
      admin_email VARCHAR(100) UNIQUE NOT NULL,
      two_factor_enabled INTEGER DEFAULT 0,
      totp_secret VARCHAR(100),
      recovery_codes TEXT,
      updated_at ${datetimeType} DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Admin Staff & Department Role-Based Access Table
  await run(`
    CREATE TABLE IF NOT EXISTS admin_staff (
      id ${idType},
      name VARCHAR(100) NOT NULL,
      email VARCHAR(100) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      department VARCHAR(100) DEFAULT 'Fashion & Merchandising',
      role_title VARCHAR(100) DEFAULT 'Catalog Merchandiser',
      permissions TEXT DEFAULT '["products_read","products_write"]',
      valid_from VARCHAR(50),
      valid_until VARCHAR(50),
      status VARCHAR(20) DEFAULT 'active',
      created_at ${datetimeType} DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Alter tables to add new columns for user settings and dynamic product details
  const alterQueries = [
    `ALTER TABLE customers ADD COLUMN phone_alt VARCHAR(15)`,
    `ALTER TABLE customers ADD COLUMN address_line_2 VARCHAR(255)`,
    `ALTER TABLE customers ADD COLUMN city_2 VARCHAR(100)`,
    `ALTER TABLE customers ADD COLUMN state_2 VARCHAR(100)`,
    `ALTER TABLE customers ADD COLUMN pincode_2 VARCHAR(10)`,
    `ALTER TABLE customers ADD COLUMN avatar_url VARCHAR(255)`,
    
    `ALTER TABLE products ADD COLUMN video_url VARCHAR(255)`,
    `ALTER TABLE products ADD COLUMN fabric VARCHAR(100)`,
    `ALTER TABLE products ADD COLUMN color VARCHAR(100)`,
    `ALTER TABLE products ADD COLUMN style VARCHAR(100)`,
    `ALTER TABLE products ADD COLUMN gender VARCHAR(50)`,
    `ALTER TABLE products ADD COLUMN color_variants TEXT`,
    `ALTER TABLE products ADD COLUMN color_images TEXT`,
    `ALTER TABLE order_items ADD COLUMN color VARCHAR(50)`,
    `ALTER TABLE order_items ADD COLUMN variant_sku VARCHAR(100)`,
    `ALTER TABLE orders ADD COLUMN shiprocket_order_id VARCHAR(50)`,
    `ALTER TABLE orders ADD COLUMN shiprocket_shipment_id VARCHAR(50)`,
    `ALTER TABLE orders ADD COLUMN tracking_number VARCHAR(100)`,
    `ALTER TABLE orders ADD COLUMN tracking_link TEXT`,
    `ALTER TABLE orders ADD COLUMN return_reason TEXT`,
    `ALTER TABLE orders ADD COLUMN return_comments TEXT`,
    `ALTER TABLE products ADD COLUMN return_window_days INTEGER DEFAULT 7`,
    `ALTER TABLE reviews ADD COLUMN media_urls TEXT`
  ];

  for (const q of alterQueries) {
    try {
      await run(q);
    } catch (e) {
      // Ignore if columns already exist
    }
  }

  // PostgreSQL specific column type alterations for long AI generated URLs
  if (dbType === 'postgres') {
    const pgAlterQueries = [
      `ALTER TABLE promotions ALTER COLUMN media_url TYPE TEXT`,
      `ALTER TABLE promotions ALTER COLUMN link_url TYPE TEXT`,
      `ALTER TABLE lookbook_pages ALTER COLUMN image_url TYPE TEXT`,
      `ALTER TABLE products ALTER COLUMN video_url TYPE TEXT`,
      `ALTER TABLE order_items ALTER COLUMN size TYPE VARCHAR(50)`
    ];
    for (const q of pgAlterQueries) {
      try {
        await run(q);
      } catch (e) {
        console.warn('Postgres column alter warning:', e.message);
      }
    }
  }

  // Create database indexes for performance optimization (fixes website lagging)
  const indexQueries = [
    `CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id)`,
    `CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at)`,
    `CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id)`,
    `CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id)`,
    `CREATE INDEX IF NOT EXISTS idx_products_category ON products(category)`,
    `CREATE INDEX IF NOT EXISTS idx_products_subcategory ON products(subcategory)`,
    `CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id)`
  ];
  for (const q of indexQueries) {
    try {
      await run(q);
    } catch (e) {
      console.warn('Index creation warning:', e.message);
    }
  }
}

async function seedDatabase() {
  // Check if customers seeded
  const customerCount = await get('SELECT COUNT(*) as count FROM customers');
  if (parseInt(customerCount.count) === 0) {
    console.log('Seeding database with default accounts...');
    const customerHash = await bcrypt.hash('password123', 10);
    const adminHash = await bcrypt.hash('admin123', 10);

    // Regular Customer
    await run(`
      INSERT INTO customers (name, email, phone, password_hash, address_line, city, state, pincode)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, ['Rajesh Kumar', 'customer@littlelarge.in', '9876543210', customerHash, 'Flat 402, Sunshine Heights, MG Road', 'Bengaluru', 'Karnataka', '560001']);

    // Admin Customer (uses same table with identifier or email checks)
    await run(`
      INSERT INTO customers (name, email, phone, password_hash, address_line, city, state, pincode)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, ['Admin Manager', 'admin@littlelarge.in', '9999999999', adminHash, 'HQ Little to Large', 'Gandhidham', 'Gujarat', '370201']);
  }

  // Ensure primary administrator account indiancloths980@ltl.com exists
  try {
    const adminRec = await get("SELECT * FROM customers WHERE email = 'indiancloths980@ltl.com'");
    if (!adminRec) {
      const adminHash = await bcrypt.hash('LtL@983', 10);
      await run(`
        INSERT INTO customers (name, email, phone, password_hash, address_line, city, state, pincode)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, ['Admin Manager', 'indiancloths980@ltl.com', '9876543211', adminHash, 'HQ Little to Large', 'Gandhidham', 'Gujarat', '370201']);
    }
  } catch (err) {
    // Non-blocking
  }

  // Check if products seeded
  const productCount = await get('SELECT COUNT(*) as count FROM products');
  if (parseInt(productCount.count) === 0) {
    console.log('Seeding premium clothing product inventory with authentic Indian family fashion...');
    let seedItems = [];
    try {
      seedItems = require('./catalog_seed_data');
    } catch (e) {
      console.warn('Could not load catalog_seed_data:', e.message);
    }

    for (const p of seedItems) {
      await run(`
        INSERT INTO products (name, category, subcategory, price, discount_price, stock, description, size_variants, image_urls, rating, fabric, color, style, gender, return_window_days)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        p.name,
        p.category,
        p.subcategory,
        p.price,
        p.discount_price,
        p.stock,
        p.description,
        p.size_variants,
        p.image_urls,
        p.rating,
        p.fabric || 'Cotton',
        p.color || 'Multicolor',
        p.style || 'Ethnic',
        p.gender || 'Unisex',
        p.return_window_days || 7
      ]);
    }
    console.log(`Seeded ${seedItems.length} authentic family clothing products.`);
  }

  // Seed homepage settings
  const settingCount = await get('SELECT COUNT(*) as count FROM homepage_settings');
  if (parseInt(settingCount.count) === 0) {
    console.log('Seeding default homepage settings...');
    await run(`
      INSERT INTO homepage_settings (hero_title, hero_subtitle, media_url, media_type, festival_mode)
      VALUES (?, ?, ?, ?, ?)
    `, [
      'Coordinated Styles for Every Generation',
      'Discover premium matching vacation outfits, lounge wear, and festival wear tailored for the entire family.',
      'images/hero_vacation.png',
      'image',
      'none'
    ]);
  }

  // Seed default promotions
  const promoCount = await get('SELECT COUNT(*) as count FROM promotions');
  if (parseInt(promoCount.count) === 0) {
    console.log('Seeding active holiday promotions...');
    const now = new Date();
    const nextMonth = new Date();
    nextMonth.setMonth(now.getMonth() + 1);

    await run(`
      INSERT INTO promotions (title, subtitle, bg_color, media_url, link_url, start_date, end_date, priority, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      'Grand Festival Diwali Sale!',
      'Flat 15% discount on all silk ethnic wear outfits. Use code L2LHOLI.',
      'hsl(38, 92%, 50%)',
      'images/hero_ethnic.png',
      'products.html?category=ethnic',
      now.toISOString(),
      nextMonth.toISOString(),
      10,
      'active'
    ]);

    await run(`
      INSERT INTO promotions (title, subtitle, bg_color, media_url, link_url, start_date, end_date, priority, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      'Cyber Monday Smart Combos',
      'Buy 2 kidswear outfits and get a leather mojari set free! Use TWINNING500.',
      'hsl(243, 75%, 19%)',
      'images/hero_kids.png',
      'products.html?category=kids',
      now.toISOString(),
      nextMonth.toISOString(),
      5,
      'active'
    ]);
  }
  
  // Backfill products details if null (preserve original video_url)
  try {
    await run(`UPDATE products SET fabric = 'Cotton', color = 'Saffron', style = 'Ethnic', gender = 'Men' WHERE name LIKE '%kurta%' AND fabric IS NULL`);
    await run(`UPDATE products SET fabric = 'Cotton', color = 'Indigo', style = 'Western', gender = 'Men' WHERE name LIKE '%denim%' AND fabric IS NULL`);
    await run(`UPDATE products SET fabric = 'Silk', color = 'Emerald', style = 'Ethnic', gender = 'Women' WHERE name LIKE '%saree%' AND fabric IS NULL`);
    await run(`UPDATE products SET fabric = 'Cotton', color = 'Blue', style = 'Western', gender = 'Kids' WHERE name LIKE '%shorts%' AND fabric IS NULL`);
    await run(`UPDATE products SET fabric = 'Cotton', color = 'Red', style = 'Ethnic', gender = 'Women' WHERE fabric IS NULL`);
  } catch (e) {
    console.error('Failed to backfill product values:', e.message);
  }

  // Seed default lookbook pages
  try {
    const lookbookCount = await get('SELECT COUNT(*) as count FROM lookbook_pages');
    if (parseInt(lookbookCount.count) === 0) {
      console.log('Seeding lookbook pages database...');
      const defaultPages = [
        { page_number: 1, image_url: 'images/lookbook_p1.png' },
        { page_number: 2, image_url: 'images/lookbook_p2.png' },
        { page_number: 3, image_url: 'images/lookbook_p3.png' },
        { page_number: 4, image_url: 'images/lookbook_p4.png' },
        { page_number: 5, image_url: 'images/lookbook_p5.png' },
        { page_number: 6, image_url: 'images/lookbook_p6.png' }
      ];
      for (const page of defaultPages) {
        await run('INSERT INTO lookbook_pages (page_number, image_url) VALUES (?, ?)', [page.page_number, page.image_url]);
      }
    }

    // Seed default coupons
    const couponCount = await get('SELECT COUNT(*) as count FROM coupons');
    if (parseInt(couponCount.count) === 0) {
      console.log('Seeding default active promo coupons...');
      const defaultCoupons = [
        { code: 'WELCOME10', discount_type: 'percentage', discount_value: 10.00, description: 'Applicable on all products. No minimum purchase required.', tag: 'NEW USER' },
        { code: 'FAMILY40', discount_type: 'percentage', discount_value: 40.00, description: 'Save massive amounts on clutches, belts, and mojari footwear combos.', tag: 'ACCESSORIES' },
        { code: 'TWINNING500', discount_type: 'amount', discount_value: 500.00, description: 'Valid on purchase of minimum 2 kids outfits. Perfect for twins.', tag: 'MEGA SAVER' }
      ];
      for (const c of defaultCoupons) {
        await run('INSERT INTO coupons (code, discount_type, discount_value, description, tag) VALUES (?, ?, ?, ?, ?)', [c.code, c.discount_type, c.discount_value, c.description, c.tag]);
      }
    }

    // Seed default careers & internship opportunities
    const careerCount = await get('SELECT COUNT(*) as count FROM careers');
    if (parseInt(careerCount.count) === 0) {
      console.log('Seeding initial career and internship openings...');
      const defaultCareers = [
        {
          title: 'Fashion Merchandiser & Designer',
          role: 'Lead Ethnic Wear Stylist & Sourcing Specialist',
          department: 'Fashion & Design',
          employment_type: 'Full-time',
          location: 'Gandhidham, Gujarat / Hybrid',
          experience: '1-3 Years',
          stipend_or_salary: '₹30,000 - ₹45,000 / month',
          timeline_deadline: '2026-11-30',
          requirements: 'Degree in Fashion Design/Textiles (NIFT/NID preferred). Strong eye for Indian ethnic textiles (Chanderi, Bandhani, Chikankari). Experience working directly with artisan weaving clusters.',
          description: 'Drive the development of Little to Large seasonal family twinning collections. Work with master weavers across Gujarat and Rajasthan to bring contemporary festive wear to Indian families nationwide.',
          status: 'open'
        },
        {
          title: 'E-Commerce Operations & Growth Intern',
          role: 'Digital Storefront & Logistics Intern',
          department: 'Operations',
          employment_type: 'Internship',
          location: 'Gandhidham / Remote',
          experience: 'Freshers / Final Year Students',
          stipend_or_salary: '₹12,000 / month',
          timeline_deadline: '2026-11-15',
          requirements: 'Enthusiastic undergraduate or graduate student in Business, IT, or Commerce. Familiarity with e-commerce operations, order fulfillment, and social media coordination. Proactive communication skills.',
          description: 'Hands-on 3-to-6 month internship managing daily catalog listings, order tracking, customer inquiries, and festive campaign execution for our pan-India family store.',
          status: 'open'
        },
        {
          title: 'Digital Content & Ethnic Catalog Specialist',
          role: 'Visual Merchandiser & Social Copywriter',
          department: 'Marketing',
          employment_type: 'Full-time',
          location: 'Remote / Flexible',
          experience: '0-2 Years',
          stipend_or_salary: '₹25,000 - ₹35,000 / month',
          timeline_deadline: '2026-12-05',
          requirements: 'Deep appreciation for Indian festivals and regional apparel. Skillful in crafting compelling product storytelling, Instagram reels styling, and email newsletters. Basic graphic/video editing skills a plus.',
          description: 'Shape our brand voice across our website, Instagram, and festive newsletters. Create engaging ethnic lookbooks that celebrate Indian family togetherness.',
          status: 'open'
        }
      ];

      for (const c of defaultCareers) {
        await run(`
          INSERT INTO careers (title, role, department, employment_type, location, experience, stipend_or_salary, timeline_deadline, requirements, description, status)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [c.title, c.role, c.department, c.employment_type, c.location, c.experience, c.stipend_or_salary, c.timeline_deadline, c.requirements, c.description, c.status]);
      }
    }
  } catch (err) {
    console.error('Failed to seed lookbook pages, coupons, or careers:', err.message);
  }

  // Migrate any existing SVG hero paths to PNG and update Slide 1 to vacation image
  try {
    await run("UPDATE promotions SET media_url = 'images/hero_ethnic.png' WHERE media_url = 'images/hero_ethnic.svg'");
    await run("UPDATE promotions SET media_url = 'images/hero_kids.png' WHERE media_url = 'images/hero_kids.svg'");
    await run("UPDATE homepage_settings SET media_url = 'images/hero_vacation.png', hero_title = 'Coordinated Styles for Every Generation', hero_subtitle = 'Discover premium matching vacation outfits, lounge wear, and festival wear tailored for the entire family.' WHERE id = 1");
  } catch (e) {
    console.error('Failed to migrate/update hero slide backgrounds to PNG:', e.message);
  }

  // Update Kurti product description in database
  try {
    const kurtiDesc = "Brighten your daily style with this vibrant lime green short kurti from Little to Largée. Featuring a chic floral print, comfortable 3/4th sleeves, and a flattering buttoned neckline, it pairs effortlessly with your favorite jeans or trousers for a fresh, everyday look.\n\nFabric: 100% Breathable Cotton\nCare: Gentle machine wash";
    await run("UPDATE products SET description = ? WHERE LOWER(name) LIKE '%kurti%' OR LOWER(name) LIKE '%lime%' OR LOWER(name) LIKE '%maroon%' OR LOWER(name) LIKE '%baby%'", [kurtiDesc]);
    console.log('✔ Updated Kurti product description in database.');
  } catch (e) {
    console.error('Failed to update Kurti product description:', e.message);
  }

  // Seed default hero banners for homepage slider
  try {
    const bannerCount = await get('SELECT COUNT(*) as count FROM hero_banners');
    if (parseInt(bannerCount.count) === 0) {
      console.log('Seeding default homepage hero banners...');
      await run(`
        INSERT INTO hero_banners (title, subtitle, cta_text, media_url, media_type, link_url, priority, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, ['Coordinated Family Styles', 'Discover matching vacation outfits, lounge wear, and festival wear for the entire family.', 'Shop Collection', 'images/hero_vacation.png', 'image', 'products.html', 1, 'active']);

      await run(`
        INSERT INTO hero_banners (title, subtitle, cta_text, media_url, media_type, link_url, priority, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, ['Grand Ethnic Festival Sale', 'Flat 15% discount on all silk ethnic wear, dupattas, and handcrafted kurtis.', 'Explore Offers', 'images/hero_ethnic.png', 'image', 'offers.html', 2, 'active']);

      await run(`
        INSERT INTO hero_banners (title, subtitle, cta_text, media_url, media_type, link_url, priority, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, ['Trending Kids Fashion', 'Ultra soft 100% organic cotton outfits & footwear for little ones.', 'Shop Kids Wear', 'images/hero_kids.png', 'image', 'products.html?category=kids', 3, 'active']);
    }
  } catch (e) {
    console.error('Failed to seed hero banners:', e.message);
  }

  // Seed default system settings
  try {
    const settingsCount = await get('SELECT COUNT(*) as count FROM settings');
    if (parseInt(settingsCount.count) === 0) {
      console.log('Seeding default system settings...');
      await run("INSERT INTO settings (key, value) VALUES ('shipping_fee', '1')");
      await run("INSERT INTO settings (key, value) VALUES ('free_shipping_threshold', '999')");
      await run("INSERT INTO settings (key, value) VALUES ('allowed_pincodes', '36, 37, 38, 39')");
      await run("INSERT INTO settings (key, value) VALUES ('pincode_error_message', 'Please enter a valid Gujarat PIN Code.')");
    }
  } catch (e) {
    console.error('Failed to seed default settings:', e.message);
  }

  // Seed Store Policies if not present
  try {
    const policyCount = await get('SELECT COUNT(*) as count FROM store_policies');
    if (parseInt(policyCount.count) === 0) {
      console.log('Seeding official Little to Large store policies...');
      const defaultPolicies = [
        {
          key: 'replacement',
          title: '7-Day Hassle-Free Replacement Policy',
          content: `<h3>Our Commitment to Your Family's Perfect Fit</h3>
<p>At <strong>Little to Large</strong>, we prioritize your family's comfort and festive joy. If any garment received has sizing, fitting, stitching, or manufacturing defects, we offer a <strong>100% free doorstep replacement</strong> within 7 days of delivery.</p>
<h4>Replacement Terms &amp; Eligibility:</h4>
<ul>
  <li><strong>Timelines:</strong> Raise a replacement request within <strong>7 days</strong> of delivery through your Profile dashboard, official WhatsApp support (+91 7383874045), or by emailing <a href="mailto:indiancloths980@gmail.com">indiancloths980@gmail.com</a>.</li>
  <li><strong>Condition:</strong> Garments must be unwashed, unworn, and retain original brand tags and eco-friendly packaging intact.</li>
  <li><strong>Pickup &amp; Delivery:</strong> Our logistics partners (BlueDart / Delhivery) will arrange a reverse pickup from your doorstep and deliver your selected replacement size/color at zero extra shipping charge.</li>
  <li><strong>Non-Returnable Items:</strong> Clearance sale items explicitly marked as non-returnable (Return Window: 0 days) are exempt from replacement unless damaged in transit.</li>
</ul>`
        },
        {
          key: 'terms',
          title: 'Terms of Service &amp; E-Commerce Conditions',
          content: `<h3>Little to Large Terms &amp; Conditions of Sale</h3>
<p>Welcome to Little to Large (littletolargee.com). By using our platform, placing orders, or accessing our services, you agree to comply with Indian e-commerce consumer guidelines, IT Act provisions, and our operating guidelines.</p>
<h4>Commercial &amp; Product Policies:</h4>
<ul>
  <li><strong>Authenticity Guarantee:</strong> All fabrics, hand-block prints, and ethnic embroideries are sourced directly from certified artisan weaving centers and verified manufacturers across India.</li>
  <li><strong>Pricing &amp; Taxes:</strong> All prices listed on our platform are inclusive of GST (Goods and Services Tax). GSTIN: 24DDFPG6913P1Z8.</li>
  <li><strong>Payment Processing:</strong> We accept safe online payments through RBI-compliant gateways (Razorpay, UPI, RuPay, Net Banking) and verified Cash on Delivery with phone OTP validation.</li>
</ul>`
        },
        {
          key: 'shipping',
          title: 'Shipping, Delivery &amp; Tracking Policy',
          content: `<h3>Pan-India Express Family Delivery</h3>
<p>We deliver across 19,000+ Indian pincodes using trusted tier-1 express courier networks.</p>
<h4>Shipping Timelines &amp; Charges:</h4>
<ul>
  <li><strong>Free Delivery:</strong> All orders with a total value of <strong>₹999 and above</strong> qualify for 100% Free Shipping.</li>
  <li><strong>Standard Shipping:</strong> For orders below ₹999, a nominal flat convenience fee of ₹60 is applied at checkout.</li>
  <li><strong>Dispatch Window:</strong> Ready-to-wear items are dispatched within 24–48 hours from our Gandhidham fulfillment hub.</li>
  <li><strong>Delivery Estimates:</strong> Metro cities: 2–3 business days. Rest of India: 4–6 business days. Real-time live SMS &amp; WhatsApp tracking links are dispatched upon courier pickup.</li>
</ul>`
        },
        {
          key: 'privacy',
          title: 'Customer Privacy &amp; Data Protection Policy',
          content: `<h3>Privacy &amp; Family Confidentiality Commitment</h3>
<p>Your family's privacy and data security are sacred to us. We never sell, rent, or trade your contact information, measurement profiles, or order history to third-party ad brokers.</p>
<h4>Data Handling Practices:</h4>
<ul>
  <li><strong>Personal Data:</strong> We collect names, shipping addresses, phone numbers, and optional family sizing profiles strictly to fulfill orders and tailor size recommendations.</li>
  <li><strong>Payment Security:</strong> Card numbers, UPI PINs, and bank credentials are handled directly via PCI-DSS Level 1 certified gateways and are never stored on our servers.</li>
  <li><strong>Grievance Redressal:</strong> For any data removal or privacy inquiries, contact our designated Grievance Officer, Reenaben, at <a href="mailto:indiancloths980@gmail.com">indiancloths980@gmail.com</a>.</li>
</ul>`
        }
      ];

      for (const pol of defaultPolicies) {
        await run(`
          INSERT INTO store_policies (policy_key, title, content)
          VALUES (?, ?, ?)
        `, [pol.key, pol.title, pol.content]);
      }
    }
  } catch (e) {
    console.error('Failed to seed store policies:', e.message);
  }

  // Migrate existing single-color products into multi-color variant format
  try {
    const unmigrated = await query("SELECT id, name, price, discount_price, stock, size_variants, image_urls, color FROM products WHERE color_variants IS NULL OR color_variants = '' OR color_variants = '[]'");
    for (const p of unmigrated) {
      let images = [];
      try { images = JSON.parse(p.image_urls || '[]'); } catch (e) { images = [p.image_urls || '/images/products/placeholder.jpg']; }
      const colorName = p.color && p.color.trim() ? p.color.split(',')[0].trim() : 'Festive Hue';
      const sizes = (p.size_variants || 'S,M,L,XL').split(',').map(s => s.trim());
      const stockPerSize = Math.max(1, Math.floor((p.stock || 20) / sizes.length));
      const sizesStock = {};
      sizes.forEach(s => sizesStock[s] = stockPerSize);

      const defaultVariant = {
        id: 1,
        color_name: colorName,
        color_code: '#b91c1c',
        sku: `LTL-${p.id}-${colorName.slice(0, 3).toUpperCase()}`,
        price: p.price,
        discount_price: p.discount_price,
        stock: p.stock || 20,
        sizes: sizes,
        sizes_stock: sizesStock,
        images: images,
        is_default: true
      };

      await run('UPDATE products SET color_variants = ? WHERE id = ?', [JSON.stringify([defaultVariant]), p.id]);

      const existingPv = await get('SELECT id FROM product_variants WHERE product_id = ?', [p.id]);
      if (!existingPv) {
        await run(`
          INSERT INTO product_variants (product_id, color_name, color_code, sku, price, discount_price, stock, size_variants, sizes_stock_json, image_urls, is_default)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
        `, [p.id, colorName, '#b91c1c', defaultVariant.sku, p.price, p.discount_price, p.stock || 20, p.size_variants || 'S,M,L,XL', JSON.stringify(sizesStock), JSON.stringify(images)]);
      }
    }
  } catch (e) {
    console.error('Failed to migrate product variants:', e.message);
  }

  // Fix any unverified online payments that were mistakenly set to 'Completed' without Razorpay verification
  try {
    await run("UPDATE payments SET status = 'Pending' WHERE status IN ('Completed', 'Success') AND method != 'COD' AND (transaction_id LIKE 'PENDING-%' OR transaction_id LIKE 'COD-%' OR transaction_id NOT LIKE 'pay_%')");
    console.log('✔ Fixed unverified online payments status to Pending.');
  } catch (e) {
    console.error('Failed to fix unverified payments status:', e.message);
  }
}

module.exports = {
  initDB,
  query,
  get,
  run,
  getDbType: () => dbType
};
