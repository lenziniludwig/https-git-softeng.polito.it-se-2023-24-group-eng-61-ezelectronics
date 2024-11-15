"use strict"

import db from "./db";

/**
 * Deletes all data from the database.
 * This function must be called before any integration test, to ensure a clean database state for each test run.
 */

export function cleanup() {
    return new Promise<void>((resolve, reject) => {
        db.serialize(() => {
            // Delete all data from the database.
            db.run("DELETE FROM products_in_cart")
            db.run("DELETE FROM carts")
            db.run("DELETE FROM reviews")
            db.run("DELETE FROM products")
            db.run("DELETE FROM users")
        })
        resolve()
    })
}