import sqlite3 from 'sqlite3';

const db = new sqlite3.Database('testdb.db');

db.serialize(() => {
    // Drop existing tables
    db.run("DROP TABLE IF EXISTS users");
    db.run("DROP TABLE IF EXISTS products");
    db.run("DROP TABLE IF EXISTS carts");
    db.run("DROP TABLE IF EXISTS products_in_cart");
    db.run("DROP TABLE IF EXISTS reviews");

    // Create users table
    db.run(`CREATE TABLE users (
        username TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        surname TEXT NOT NULL,
        role TEXT NOT NULL,
        address TEXT,
        birthdate TEXT,
        password TEXT NOT NULL,
        salt TEXT NOT NULL
    )`);

    // Create products table
    db.run(`CREATE TABLE products (
        model TEXT PRIMARY KEY,
        category TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        details TEXT,
        sellingPrice REAL NOT NULL,
        arrivalDate TEXT
    )`);

    // Create carts table
    db.run(`CREATE TABLE carts (
        cart_id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer TEXT NOT NULL,
        paid BOOLEAN NOT NULL,
        paymentDate TEXT,
        total REAL NOT NULL,
        FOREIGN KEY (customer) REFERENCES users(username) ON DELETE CASCADE
    )`);

    // Create products_in_cart table
    db.run(`CREATE TABLE products_in_cart (
        cart_id INTEGER NOT NULL,
        model TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        category TEXT NOT NULL,
        price REAL NOT NULL,
        FOREIGN KEY (cart_id) REFERENCES carts(cart_id),
        FOREIGN KEY (model) REFERENCES products(model) ON DELETE CASCADE
    )`);

    // Create reviews table
    db.run(`CREATE TABLE reviews (
        model TEXT NOT NULL,
        user TEXT NOT NULL,
        score INTEGER NOT NULL,
        date TEXT NOT NULL,
        comment TEXT NOT NULL,
        FOREIGN KEY (model) REFERENCES products(model),
        FOREIGN KEY (user) REFERENCES users(username) ON DELETE CASCADE
    )`);

    console.log('Test database setup complete.');
});

db.close();
