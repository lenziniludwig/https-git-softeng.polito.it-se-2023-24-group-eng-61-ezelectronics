import sqlite3 from 'sqlite3';
import db from "../db/db"
import { Cart, ProductInCart } from '../components/cart';
import { Category, Product } from '../components/product';

/**
 * A class that implements the interaction with the database for all cart-related operations.
 */
class CartDAO {

    /**
     * Adds a product to the current cart of a customer.
     * If the product already exists in the cart, increases its quantity by 1.
     * If there is no current cart, creates a new one.
     *
     * @param {string} customer - The username of the customer.
     * @param {ProductInCart} product - The product to add to the cart.
     * @returns {Promise<void>}
     */

    async addToCart(customer: string, product: ProductInCart): Promise<void> {
        return new Promise((resolve, reject) => {
            const self = this;
            db.serialize(() => {
                db.get(
                    `SELECT * FROM carts WHERE customer = ? AND paid = 0`,
                    [customer],
                    (err, cart: { cart_id: number } | undefined) => {
                        if (err) reject(err);

                        if (cart) {
                            db.get(
                                `SELECT * FROM products_in_cart WHERE cart_id = ? AND model = ?`,
                                [cart.cart_id, product.model],
                                (err, productInCart: { cart_id: number; model: string; quantity: number; category: string; price: number } | undefined) => {
                                    if (err) reject(err);

                                    if (productInCart) {
                                        db.run(
                                            `UPDATE products_in_cart SET quantity = quantity + 1 WHERE cart_id = ? AND model = ?`,
                                            [productInCart.cart_id, product.model],
                                            (err) => {
                                                if (err) reject(err);
                                                self.updateCartTotal(cart.cart_id);
                                                resolve();
                                            }
                                        );
                                    } else {
                                        db.run(
                                            `INSERT INTO products_in_cart (cart_id, model, quantity, category, price) VALUES (?, ?, ?, ?, ?)`,
                                            [cart.cart_id, product.model, 1, product.category, product.price],
                                            (err) => {
                                                if (err) reject(err);
                                                self.updateCartTotal(cart.cart_id);
                                                resolve();
                                            }
                                        );
                                    }
                                }
                            );
                        } else {
                            db.run(
                                `INSERT INTO carts (customer, paid, paymentDate, total) VALUES (?, ?, ?, ?)`,
                                [customer, 0, null, 0],
                                function (this: sqlite3.RunResult, err) {
                                    if (err) reject(err);

                                    const cartId = this.lastID;
                                    db.run(
                                        `INSERT INTO products_in_cart (cart_id, model, quantity, category, price) VALUES (?, ?, ?, ?, ?)`,
                                        [cartId, product.model, 1, product.category, product.price],
                                        (err) => {
                                            if (err) reject(err);
                                            self.updateCartTotal(cartId);
                                            resolve();
                                        }
                                    );
                                }
                            );
                        }
                    }
                );
            });
        });
    }

    /**
     * Retrieves the current cart of a customer.
     * @param customer The username of the customer
     * @returns The current cart or null if not found
     */
    async getCart(customer: string): Promise<Cart | null> {
        return new Promise((resolve, reject) => {
            db.serialize(() => {
                db.get(
                    `SELECT * FROM carts WHERE customer = ? AND paid = 0`,
                    [customer],
                    (err, cart: any) => {
                        if (err) reject(err);
                        if (!cart) resolve(null);
                        
                        if (cart){
                        db.all(
                            `SELECT * FROM products_in_cart WHERE cart_id = ?`,
                            [cart.cart_id],
                            (err, products: { model: string; quantity: number; category: string; price: number }[]) => {
                                if (err) reject(err);
                                if (products.length === 0) resolve(new Cart(cart.customer, cart.paid, cart.paymentDate, cart.total, []));
                                else{
                                    const productList = products.map((p) => new ProductInCart(p.model, p.quantity, p.category as Category, p.price));
                                    resolve(new Cart(cart.customer, cart.paid, cart.paymentDate, cart.total, productList));
                                }
                            }
                        );}
                    }
                );
            });
        });
    }

    /**
 * Creates a new cart for a customer.
 * @param customer The username of the customer
 * @returns A promise that resolves when the cart is created
 */
    async createCart(customer: string): Promise<void> {
        return new Promise((resolve, reject) => {
            db.run(
                `INSERT INTO carts (customer, paid, paymentDate, total) VALUES (?, 0, NULL, 0)`,
                [customer],
                (err) => {
                    if (err) return reject(err);
                    resolve();
                }
            );
        });
    }


    /**
     * Checks out the current cart of a customer, setting it as paid and recording the payment date and total.
     *
     * @param {string} customer - The username of the customer.
     * @param {string} paymentDate - The date of payment in format YYYY-MM-DD.
     * @param {number} total - The total cost of the cart.
     * @returns {Promise<void>}
     */
    async checkoutCart(customer: string, paymentDate: string, total: number): Promise<void> {
        return new Promise((resolve, reject) => {
            db.serialize(() => {
                db.get(
                    `SELECT * FROM carts WHERE customer = ? AND paid = 0`,
                    [customer],
                    (err, cart: { cart_id: number } | undefined) => {
                        if (err) return reject(err);

                        db.run(
                            `UPDATE carts SET paid = 1, paymentDate = ?, total = ? WHERE cart_id = ?`,
                            [paymentDate, total, cart.cart_id],
                            (err) => {
                                if (err) return reject(err);
                                resolve();
                            }
                        );
                    }
                );
            });
        });
    }

    /**
     * Retrieves the history of paid carts of a customer.
     *
     * @param {string} customer - The username of the customer.
     * @returns {Promise<Cart[]>} - An array of paid carts.
     */
    async getCustomerCarts(customer: string): Promise<Cart[]> {
        return new Promise((resolve, reject) => {
            db.serialize(() => {
                db.all(
                    `SELECT * FROM carts WHERE customer = ? AND paid = 1`,
                    [customer],
                    (err, carts: { cart_id: number; customer: string; paid: boolean; paymentDate: string | null; total: number }[]) => {
                        if (err) reject(err);

                        const cartPromises = carts.map(cart => new Promise<Cart>((resolve, reject) => {
                            db.all(
                                `SELECT * FROM products_in_cart WHERE cart_id = ?`,
                                [cart.cart_id],
                                (err, products: { model: string; quantity: number; category: string; price: number }[]) => {
                                    if (err) reject(err);

                                    const productList = products.map(p => new ProductInCart(p.model, p.quantity, p.category as Category, p.price));
                                    resolve(new Cart(cart.customer, cart.paid, cart.paymentDate, cart.total, productList));
                                }
                            );
                        }));

                        Promise.all(cartPromises).then(resolve).catch(reject);
                    }
                );
            });
        });
    }

    /**
     * Removes a product from the current cart of a customer.
     * If the product quantity is greater than 1, decreases its quantity by 1.
     * If the product quantity is 1, removes the product from the cart.
     *
     * @param {string} customer - The username of the customer.
     * @param {string} productModel - The model of the product to remove.
     * @returns {Promise<void>}
     */
    async removeProductFromCart(customer: string, model: string): Promise<void> {
        return new Promise((resolve, reject) => {
            db.serialize(() => {
                db.get(
                    `SELECT * FROM carts WHERE customer = ? AND paid = 0`,
                    [customer],
                    (err, cart: { cart_id: number } | undefined) => {
                        if (err) reject(err);

                        db.get(
                            `SELECT * FROM products_in_cart WHERE cart_id = ? AND model = ?`,
                            [cart.cart_id, model],
                            (err, product: { cart_id: number; model: string; quantity: number } | undefined) => {
                                if (err) reject(err);

                                if (product.quantity > 1) {
                                    db.run(
                                        `UPDATE products_in_cart SET quantity = quantity - 1 WHERE cart_id = ? AND model = ?`,
                                        [product.cart_id, product.model],
                                        (err) => {
                                            if (err) reject(err);
                                            this.updateCartTotal(cart.cart_id);
                                            resolve();
                                        }
                                    );
                                } else {
                                    db.run(
                                        `DELETE FROM products_in_cart WHERE cart_id = ? AND model = ?`,
                                        [product.cart_id, product.model],
                                        (err) => {
                                            if (err) reject(err);
                                            this.updateCartTotal(cart.cart_id);
                                            resolve();
                                        }
                                    );
                                }
                            }
                        );
                    }
                );
            });
        });
    }

    /**
     * Clears the current cart of a customer by removing all products from it.
     *
     * @param {string} customer - The username of the customer.
     * @returns {Promise<void>}
     */
    async clearCart(customer: string): Promise<void> {
        return new Promise((resolve, reject) => {
            db.serialize(() => {
                db.get(
                    `SELECT * FROM carts WHERE customer = ? AND paid = 0`,
                    [customer],
                    (err, cart: { cart_id: number } | undefined) => {
                        if (err) reject(err);

                        db.run(
                            `DELETE FROM products_in_cart WHERE cart_id = ?`,
                            [cart.cart_id],
                            (err) => {
                                if (err) reject(err);
                                this.updateCartTotal(cart.cart_id);
                                resolve();
                            }
                        );
                    }
                );
            });
        });
    }

    /**
     * Deletes all carts from the database.
     *
     * @returns {Promise<void>}
     */
    async deleteAllCarts(): Promise<void> {
        return new Promise((resolve, reject) => {
            db.serialize(() => {

                db.run(`DELETE FROM products_in_cart`, (err) => {
                    if (err) reject(err);
                    resolve();
                });
                
                db.run(`DELETE FROM carts`, (err) => {
                    if (err) reject(err);

                    
                });
            });
        });
    }

    /**
     * Retrieves all carts from the database.
     *
     * @returns {Promise<Cart[]>} - An array of all carts.
     */
    async getAllCarts(): Promise<Cart[]> {
        return new Promise((resolve, reject) => {
            db.serialize(() => {
                db.all(`SELECT * FROM carts`, (err, carts: { cart_id: number; customer: string; paid: boolean; paymentDate: string | null; total: number }[]) => {
                    if (err) reject(err);

                    const cartPromises = carts.map(cart => new Promise<Cart>((resolve, reject) => {
                        db.all(
                            `SELECT * FROM products_in_cart WHERE cart_id = ?`,
                            [cart.cart_id],
                            (err, products: { model: string; quantity: number; category: string; price: number }[]) => {
                                if (err) reject(err);

                                const productList = products.map(p => new ProductInCart(p.model, p.quantity, p.category as Category, p.price));
                                resolve(new Cart(cart.customer, cart.paid, cart.paymentDate, cart.total, productList));
                            }
                        );
                    }));

                    Promise.all(cartPromises).then(resolve).catch(reject);
                });
            });
        });
    }

    /**
     * Updates the total price of the cart by summing up the prices of all products in the cart.
     *
     * @param {number} cartId - The ID of the cart to update.
     * @returns {Promise<void>}
     */
    async updateCartTotal(cartId: number): Promise<void> {
        return new Promise((resolve, reject) => {
            db.serialize(() => {
                db.all(`SELECT * FROM products_in_cart WHERE cart_id = ?`, [cartId], (err, products: { price: number; quantity: number }[]) => {
                    if (err) reject(err);

                    const total = products.reduce((sum, product) => sum + (product.price * product.quantity), 0);
                    db.run(
                        `UPDATE carts SET total = ? WHERE cart_id = ?`,
                        [total, cartId],
                        (err) => {
                            if (err) reject(err);
                            resolve();
                        }
                    );
                }
                );
            });
        });
    }
}

export default CartDAO;
