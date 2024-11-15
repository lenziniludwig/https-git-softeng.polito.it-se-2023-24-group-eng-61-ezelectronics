import db from "../db/db"
import { User } from "../components/user"
import crypto from "crypto"

/**
 * A class that implements the interaction with the database for all user-related operations.
 * You are free to implement any method you need here, as long as the requirements are satisfied.
 */
class UserDAO {

    /**
     * Checks whether the information provided during login (username and password) is correct.
     * @param username The username of the user.
     * @param plainPassword The password of the user (in plain text).
     * @returns A Promise that resolves to true if the user is authenticated, false otherwise.
     */
    getIsUserAuthenticated(username: string, plainPassword: string): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            try {
                const sql = "SELECT username, password, salt FROM users WHERE username = ?"
                db.get(sql, [username], (err: Error | null, row: any) => {
                    if (err) reject(err)
                    //If there is no user with the given username, or the user salt is not saved in the database, the user is not authenticated.
                    if (!row || row.username !== username || !row.salt) {
                        resolve(false)
                    } else {
                        //Hashes the plain password using the salt and then compares it with the hashed password stored in the database
                        const hashedPassword = crypto.scryptSync(plainPassword, row.salt, 16)
                        const passwordHex = Buffer.from(row.password, "hex")
                        if (!crypto.timingSafeEqual(passwordHex, hashedPassword)) resolve(false)
                        resolve(true)
                    }

                })
            } catch (error) {
                reject(error)
            }

        });
    }

    /**
     * Creates a new user and saves their information in the database
     * @param username The username of the user. It must be unique.
     * @param name The name of the user
     * @param surname The surname of the user
     * @param password The password of the user. It must be encrypted using a secure algorithm (e.g. scrypt, bcrypt, argon2)
     * @param role The role of the user. It must be one of the three allowed types ("Manager", "Customer", "Admin")
     * @returns A Promise that resolves to true if the user has been created.
     */
    createUser(username: string, name: string, surname: string, password: string, role: string): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            const salt = crypto.randomBytes(16)
            const hashedPassword = crypto.scryptSync(password, salt, 16)
            const sql = "INSERT INTO users(username, name, surname, role, password, salt) VALUES(?, ?, ?, ?, ?, ?)"
            db.run(sql, [username, name, surname, role, hashedPassword, salt], (err: Error | null) => {
                if (err) reject(err)
                resolve(true)
            })

        })
    }

    /**
     * Returns all users from the database.
     * @returns A Promise that resolves to an array of users.
     */
    getUsers(): Promise<User[]> {
        return new Promise<User[]>((resolve, reject) => {
            const sql = "SELECT * FROM users";
            db.all(sql, [], (err: Error | null, rows: any[]) => {
                if (err) reject(err);
                
                const users: User[] = rows.map(row => new User(row.username, row.name, row.surname, row.role, row.address, row.birthdate));
                resolve(users);
            });
        });
    }

    /**
     * Returns all users with a specific role from the database.
     * @param role The role of the users to retrieve
     * @returns A Promise that resolves to an array of users with the specified role.
     */
    getUsersByRole(role: string): Promise<User[]> {
        return new Promise<User[]>((resolve, reject) => {
            const sql = "SELECT * FROM users WHERE role = ?";
            db.all(sql, [role], (err: Error | null, rows: any[]) => {
                if (err) reject(err);

                const users: User[] = rows.map(row => new User(row.username, row.name, row.surname, row.role, row.address, row.birthdate));
                resolve(users);
            });
        });
    }


    /**
     * Returns a user object from the database based on the username.
     * @param username The username of the user to retrieve
     * @returns A Promise that resolves the information of the requested user
     */
    getUserByUsername(username: string): Promise<User | null> {
        return new Promise<User>((resolve, reject) => {
            const sql = "SELECT * FROM users WHERE username = ?"
            db.get(sql, [username], (err: Error | null, row: any) => {
                if (err) reject(err)
                if (!row) return resolve(null)
                
                const user: User = new User(row.username, row.name, row.surname, row.role, row.address, row.birthdate)
                resolve(user)
            })

        })
    }

    /**
     * Deletes a user from the database based on the username.
     * @param username The username of the user to delete
     * @returns A Promise that resolves to true if the user has been deleted.
     */
    async deleteUser(deleter: User, user: User): Promise<boolean> {
        return new Promise<boolean>(async (resolve, reject) => {
            await this.deleteUserCarts(user.username);
            await this.deleteUserReviews(user.username);

            db.run(`DELETE FROM users WHERE username = ?`, [user.username], function (err) {
                if (err) reject(err);
                resolve(true);
            });
        });
    }

    /**
     * Deletes all carts and related products for a user.
     * @param username The username of the user.
     * @returns A promise that resolves when the operation is complete.
     */
    private async deleteUserCarts(username: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            db.serialize(() => {
                db.all(`SELECT cart_id FROM carts WHERE customer = ?`, [username], (err, carts) => {
                    if (err) reject(err);

                    const cartIds = carts.map((cart: { cart_id: number }) => cart.cart_id);
                    if (cartIds.length === 0) resolve();

                    const placeholders = cartIds.map(() => '?').join(',');
                    db.run(`DELETE FROM products_in_cart WHERE cart_id IN (${placeholders})`, cartIds, (err) => {
                        if (err) reject(err);

                        db.run(`DELETE FROM carts WHERE customer = ?`, [username], (err) => {
                            if (err) reject(err);
                            resolve();
                        });
                    });
                });
            });
        });
    }

    /**
     * Deletes all reviews for a user.
     * @param username The username of the user.
     * @returns A promise that resolves when the operation is complete.
     */
    private async deleteUserReviews(username: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            db.run(`DELETE FROM reviews WHERE user = ?`, [username], (err) => {
                if (err) reject(err);
                resolve();
            });
        });
    }

    /**
     * Deletes all non-Admin users from the database.
     * @returns A Promise that resolves to true if all non-Admin users have been deleted.
     */
    async deleteAll(): Promise<boolean> {
        return new Promise<boolean>(async (resolve, reject) => {
            const nonAdminUsers = await new Promise<string[]>((resolve, reject) => {
                db.all(`SELECT username FROM users WHERE role != 'Admin'`, (err, rows) => {
                    if (err) reject(err);
                    const usernames = rows.map((row: { username: string }) => row.username);
                    resolve(usernames);
                });
            });

            for (const username of nonAdminUsers) {
                await this.deleteUserCarts(username);
                await this.deleteUserReviews(username);
            }

            db.run(`DELETE FROM users WHERE role != 'Admin'`, (err) => {
                if (err) reject(err);
                resolve(true);
            });
        });
    }

    /**
     * Updates the personal information of a user in the database.
     * @param username The username of the user to update
     * @param name The new name of the user
     * @param surname The new surname of the user
     * @param address The new address of the user
     * @param birthdate The new birthdate of the user
     * @returns A Promise that resolves to the updated user
     */
    async updateUserInfo(username: string, name: string, surname: string, address: string, birthdate: string): Promise<User> {
        return new Promise<User>((resolve, reject) => {
            const sql = "UPDATE users SET name = ?, surname = ?, address = ?, birthdate = ? WHERE username = ?";
            db.run(sql, [name, surname, address, birthdate, username], async (err: Error | null) => {
                if (err) reject(err)
                const user = await this.getUserByUsername(username);
                resolve(user);
            });
        });
    }
}
export default UserDAO