import db from "../db/db";
import { Product, Category } from "../components/product";

class ProductDAO {

    /**
     * Registers a new product in the database.
     * @param product The product to register.
     * @returns A Promise that resolves to nothing.
     */
    registerProduct(product: Product): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            const sql = `INSERT INTO products (model, category, quantity, details, sellingPrice, arrivalDate) VALUES (?, ?, ?, ?, ?, ?)`;
            db.run(sql, [product.model, product.category, product.quantity, product.details, product.sellingPrice, product.arrivalDate], (err: Error | null) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }

    /**
     * Updates the quantity of a product in the database.
     * @param model The model of the product to update.
     * @param newQuantity The new quantity to set.
     * @returns A Promise that resolves to the updated quantity.
     */
    updateProductQuantity(model: string, newQuantity: number): Promise<number> {
        return new Promise<number>((resolve, reject) => {
            const sql = `UPDATE products SET quantity = quantity + ? WHERE model = ?`;
            db.run(sql, [newQuantity, model], function (err: Error | null) {
                if (err) reject(err);
                else resolve(newQuantity);
            });
        });
    }

    /**
     * Retrieves all products from the database, optionally filtered by category or model.
     * @param category Optional category to filter by.
     * @param model Optional model to filter by.
     * @returns A Promise that resolves to an array of Product objects.
     */
    getProducts(category: string | null, model: string | null): Promise<Product[]> {
        return new Promise<Product[]>((resolve, reject) => {
            let sql = `SELECT * FROM products`;
            const params: any[] = [];
            if (category) {
                sql += ` WHERE category = ?`;
                params.push(category);
            }
            if (model) {
                sql += category ? ` AND model = ?` : ` WHERE model = ?`;
                params.push(model);
            }
            db.all(sql, params, (err: Error | null, rows: any[]) => {
                if (err) reject(err);
                else {
                    const products = rows.map(row => new Product(row.sellingPrice, row.model, row.category, row.arrivalDate, row.details, row.quantity));
                    resolve(products);
                }
            });
        });
    }

    /**
     * Retrieves all available products (with quantity above 0) from the database, optionally filtered by category or model.
     * @param category Optional category to filter by.
     * @param model Optional model to filter by.
     * @returns A Promise that resolves to an array of Product objects.
     */
    getProductByModel(model: string): Promise<Product | null> {
        return new Promise<Product | null>((resolve, reject) => {
            const sql = `SELECT * FROM products WHERE model = ?`;
            db.get(sql, [model], (err: Error | null, row: any) => {
                if (err) reject(err);
                else {
                    if (row) {
                        const product = new Product(row.sellingPrice, row.model, row.category, row.arrivalDate, row.details, row.quantity);
                        resolve(product);
                    } else resolve(null);
                }
            });
        });
    }

    /**
     * Deletes a product from the database.
     * @param model The model of the product to delete.
     * @returns A Promise that resolves to true if the product was deleted.
     */
    async deleteProduct(model: string): Promise<boolean> {
        return new Promise<boolean>(async (resolve, reject) => {
            await this.deleteProductReviews(model);

            db.run(`DELETE FROM products WHERE model = ?`, [model], function (err) {
                if (err) return reject(err);
                else resolve(true);
            });
        });
    }

    /**
     * Deletes all reviews for a product.
     * @param model The model of the product.
     * @returns A promise that resolves when the operation is complete.
     */
    async deleteProductReviews(model: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            db.run(`DELETE FROM reviews WHERE model = ?`, [model], (err) => {
                if (err) return reject(err);
                resolve();
            });
        });
    }

    /**
     * Deletes all products from the database.
     * @returns A promise that resolves to true if all products were deleted successfully.
     */
    async deleteAllProducts(): Promise<boolean> {
        return new Promise<boolean>(async (resolve, reject) => {
            await this.deleteAllProductReviews();

            db.run(`DELETE FROM products`, (err) => {
                if (err) reject(err);
                else resolve(true);
            });
        });
    }

    /**
     * Deletes all reviews for all products.
     * @returns A promise that resolves when the operation is complete.
     */
    private async deleteAllProductReviews(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            db.run(`DELETE FROM reviews`, (err) => {
                if (err) return reject(err);
                resolve();
            });
        });
    }
}

export default ProductDAO;
