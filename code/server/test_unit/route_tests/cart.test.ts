import { describe, test, expect, jest, beforeAll, beforeEach, afterAll, afterEach } from "@jest/globals"
import request from 'supertest'
import { app } from "../../index"

import Authenticator from "../../src/routers/auth";
import { cleanup } from "../../src/db/cleanup";
import ErrorHandler from "../../src/helper";
import cartController from "../../src/controllers/cartController";
import { Category, Product } from "../../src/components/product";
import { group } from "console";
import exp from "constants";

jest.mock("../../src/controllers/cartController");
jest.mock("../../src/routers/auth");

const baseURL = "/ezelectronics"

describe("Cart routes", () => {
    afterEach(async () => {
        jest.clearAllMocks();
    });
    describe("GET /carts", () => {
        test("should return 401, admin return current cart", async () => {

            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return next();
            })

            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {
                return res.status(401).json({ error: "User is not a customer", status: 401 });
            })

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next()
            })

            const response = await request(app).get(`${baseURL}/carts`)
            expect(response.status).toBe(401)
        })

        test("should return 200, customer return current cart", async () => {

            const testCart = {customer: "test", paid: false, paymentDate: "null", total: 200, products: [{model: "test",quantity: 2, category: Category.SMARTPHONE, price: 100}]}
            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {
                return next();
            })

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next()
            })

            jest.spyOn(cartController.prototype, "getCart").mockResolvedValueOnce(testCart)
            const response = await request(app).get(`${baseURL}/carts`)
            expect(response.status).toBe(200)
            expect(response.body).toEqual(testCart)
        })

        test("should return 401 user non logged in return current cart", async () => {

            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {
                return next();
            })
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return res.status(401).json({ error: "Unauthenticated user", status: 401 });
            })

            const response = await request(app).get(`${baseURL}/carts`)
            expect(response.status).toBe(401)
        })   
    })

    describe("POST /carts", () => {
        test("should return 401, not logged in customer add product into cart", async () => {
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return next();
            });

            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {
                return next();
            });

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return res.status(401).json({ error: "Unauthorized user", status: 401 });
            });

            const response = await request(app).post(`${baseURL}/carts`).send({model: "test"})
            expect(response.status).toBe(401)
        })


        test("should return 200, customer logged in add product into cart", async () => {
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return next();
            });

            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {
                return next();
            });

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next();
            });

            jest.spyOn(cartController.prototype, "addToCart").mockResolvedValueOnce()
            const response = await request(app).post(`${baseURL}/carts`).send({model: "test"})
            expect(response.status).toBe(200)
        })

        test("should return 422, customer logged in add product into cart but model doesn' exist", async () => {
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return next();
            });

            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {
                return next();
            });

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next();
            });

            jest.spyOn(cartController.prototype, "addToCart").mockResolvedValueOnce()
            const response = await request(app).post(`${baseURL}/carts`).send({model: ""})
            expect(response.status).toBe(422)
        })
    })

    describe("PATCH /carts", () => {
        test("should return 401, not logged in customer simulate Payment", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return res.status(401).json({ error: "Unauthorized user", status: 401 });
            });

            const response = await request(app).patch(`${baseURL}/carts`)
            expect(response.status).toBe(401)
        })

        test("should return 401, not customer simulate Payment", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next();
            });

            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {
                return res.status(401).json({ error: "User is not a customer", status: 401 });
            });

            const response = await request(app).patch(`${baseURL}/carts`)
            expect(response.status).toBe(401)
        })

        test("should return 200, customer simulate Payment", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next();
            });

            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {
                return next();
            });

            jest.spyOn(cartController.prototype, "checkoutCart").mockResolvedValueOnce()
            const response = await request(app).patch(`${baseURL}/carts`)
            expect(response.status).toBe(200)
        })
    })

    describe("GET /carts/history", () => {
        test("should return 401, not logged in customer get history", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return res.status(401).json({ error: "Unauthorized user", status: 401 });
            });

            const response = await request(app).get(`${baseURL}/carts/history`)
            expect(response.status).toBe(401)
        })

        test("should return 401, not customer get history", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next();
            });

            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {
                return res.status(401).json({ error: "User is not a customer", status: 401 });
            });

            const response = await request(app).get(`${baseURL}/carts/history`)
            expect(response.status).toBe(401)
        })

        test("should return 200, customer get history", async () => {
            
            const testCart1 = {customer: "test1", paid: false, paymentDate: "null", total: 300, products: [{model: "test1",quantity: 3, category: Category.LAPTOP, price: 100}]};
            const testCart2 = {customer: "test2", paid: true, paymentDate: "2022-10-10", total: 400, products: [{model: "test2",quantity: 4, category: Category.APPLIANCE, price: 100}]};
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next();
            });

            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {
                return next();
            });

            jest.spyOn(cartController.prototype, "getCustomerCarts").mockResolvedValueOnce([testCart1,testCart2])
            const response = await request(app).get(`${baseURL}/carts/history`)
            expect(response.status).toBe(200)
            expect(response.body).toEqual([testCart1,testCart2])
        })
    })

    describe("DELETE /carts/products/:model", () => {
        test("should return 401, not logged in customer remove product from cart", async () => {
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return next();
            });

            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {
                return next();
            });

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return res.status(401).json({ error: "Unauthorized user", status: 401 });
            });

            const response = await request(app).delete(`${baseURL}/carts/products/test`)
            expect(response.status).toBe(401)
        })

        test("should return 401, not customer remove product from cart", async () => {
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return next();
            });

            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {
                return res.status(401).json({ error: "User is not a customer", status: 401 });
            });

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next();
            });

            const response = await request(app).delete(`${baseURL}/carts/products/test`)
            expect(response.status).toBe(401)
        })

        test("should return 200, customer remove product from cart", async () => {
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return next();
            });

            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {
                return next();
            });

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next();
            });

            jest.spyOn(cartController.prototype, "removeProductFromCart").mockResolvedValueOnce()
            const response = await request(app).delete(`${baseURL}/carts/products/testCart`)
            expect(response.status).toBe(200)
        })
    })

    describe("DELETE /carts/current", () => {
        test("should return 401, not logged in customer empty cart", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return res.status(401).json({ error: "Unauthorized user", status: 401 });
            });

            const response = await request(app).delete(`${baseURL}/carts/current`)
            expect(response.status).toBe(401)
        })

        test("should return 401, not customer empty cart", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next();
            });

            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {
                return res.status(401).json({ error: "User is not a customer", status: 401 });
            });

            const response = await request(app).delete(`${baseURL}/carts/current`)
            expect(response.status).toBe(401)
        })

        test("should return 200, customer empty cart", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next();
            });

            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {
                return next();
            });

            jest.spyOn(cartController.prototype, "clearCart").mockResolvedValueOnce()
            const response = await request(app).delete(`${baseURL}/carts/current`)
            expect(response.status).toBe(200)
        })
    })

    describe("DELETE /carts", () => {
        test("should return 401, not customer delete all carts", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return res.status(401).json({ error: "Unauthorized user", status: 401 });
            });

            const response = await request(app).delete(`${baseURL}/carts`)
            expect(response.status).toBe(401)
        })

        test("should return 401, not admin delete all carts", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next();
            });

            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                return res.status(401).json({ error: "User is not an admin", status: 401 });
            });

            const response = await request(app).delete(`${baseURL}/carts`)
            expect(response.status).toBe(401)
        })

        test("should return 200, admin delete all carts", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next();
            });

            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                return next();
            });

            jest.spyOn(cartController.prototype, "deleteAllCarts").mockResolvedValueOnce()
            const response = await request(app).delete(`${baseURL}/carts`)
            expect(response.status).toBe(200)
        })
    })

    describe("GET /carts/all", () => {
        test("should return 401, not logged-in get all carts", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return res.status(401).json({ error: "Unauthorized user", status: 401 });
            });

            const response = await request(app).get(`${baseURL}/carts/all`)
            expect(response.status).toBe(401)
        });

        test("should return 401, not admin get all carts", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next();
            });

            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                return res.status(401).json({ error: "User is not an admin", status: 401 });
            });

            const response = await request(app).get(`${baseURL}/carts/all`)
            expect(response.status).toBe(401)
        })

        test("should return 200, admin get all carts", async () => {
            const testCart1 = {customer: "test1", paid: false, paymentDate: "null", total: 300, products: [{model: "test1",quantity: 3, category: Category.LAPTOP, price: 100}]};
            const testCart2 = {customer: "test2", paid: true, paymentDate: "2022-10-10", total: 400, products: [{model: "test2",quantity: 4, category: Category.APPLIANCE, price: 100}]};
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next();
            });

            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                return next();
            });

            jest.spyOn(cartController.prototype, "getAllCarts").mockResolvedValueOnce([testCart1,testCart2])

            const response = await request(app).get(`${baseURL}/carts/all`)
            expect(response.status).toBe(200)
            expect(response.body).toEqual([testCart1,testCart2])
        })
    })
})
// --- Returns the current cart of the logged in user  
//     ---LIST OF TESTs:
//         1. admin return current cart
//         2. customer return current cart 
//         3. user non loggato return current cart

// --- Adds a product instance, identified by the model, to the current cart of the logged in user
//     --- return 404 if `model` does not represent an existing product
//     --- return 409 if `model` represents a product whose available quantity is 0
//     ---LIST OF TESTs:
//         1. customer logged in add product
//         2. not logged in customer add product
//         3. customer add product with  `model` does not represent an existing product
//         4. customer add product with  `model` represents a product whose available quantity is 0

// --- Simulates payment for the current cart of the logged in user
//     --- return 404 if there is no information about an _unpaid_ cart in the database
//     --- return 400 if there is information about an _unpaid_ cart but the cart contains no product
//     --- return 409 if there is at least one product in the cart whose available quantity in the stock is 0
//     --- return 409 if there is at least one product in the cart whose quantity is higher than the available quantity in the stock
//     --- LIST OF TESTs:
//         1. not logged user  simulate Payment
//         2. customer simulate Payment
//         3. customer simulate a payment of a cart not in Database
//         4. customer simulate a payment of empty cart 
//         5. customer simulate a payment with at least one product in the cart whose quantity is higher than the available quantity in the stock
//         6. customer simulate a payment with at least one product in the cart whose available quantity in the stock is 0
// --- GET HISTORY OF THE CARTS
//     ---LIST OF TEST:
//         1. logged customer return the history
//         2. no-logged user return the history

// ---Removes an instance of a product from the current cart of the logged in user
//     ---return 404 if `model` represents a product that is not in the cart
//     ---return 404 if there is no information about an _unpaid_ cart for the user, or if there is such information but there are no products in the cart
//     ---return 404 if `model` does not represent an existing product
//     ---LIST OF TESTs:
//         1. no-logged user remove a product from the current cart
//         2. logged user remove a product from the current Cart
//         3. logged user remove a product with `model` does not represent an existing product
//         4. logged user remove a product with no information about an _unpaid_ cart for the user, or if there is such information but there are no products in the cart
//         5. logged user remove a product with `model` does not represent an existing product

// ---Empties the current cart by deleting all of its products
//     ---return 404 if there is no information about an _unpaid_ cart for the user
//     ---LIST OF TESTs:
//         1. no-logged customer empties the current Cart
//         2. logged customer empties the current Cart
//         3. logged customer empties the current Cart without information about an _unpaid_ cart for the user
    
// ---Deletes all existing carts of all users, both current and past
//     ---LIST OF TESTs:
//         1. customer deletes all existing carts 
//         2. admin deletes all existing carts 

// ---Returns all carts of all users, both current and past.
//         ---LIST OF TESTs:
//             1. customer returns all existing carts 
//             2. admin returns all existing carts 