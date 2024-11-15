// --- REGISTER THE ARRIVAL OF A SET OF PRODUCTS THAT HAVE THE SAME MODEL 
//     --- return 409 if MODEL ALREADY EXISTING 
//     --- return 400 if `arrivalDate` is after the current date
//     --- LIST OF TESTs:
//         1. customer add product 
//         2. admin add product
//         3. register product whose model already exist 
//         4. register model with arrivalDate is after the current date
//         5. unlogged user register product
// --- Increases the available quantity of a set of products
//     --- return 404 if `model` does not represent a product in the database
//     --- return 400 if `changeDate` is after the current date
//     --- return 400 if changeDate` is before the product's `arrivalDate`
//     --- LIST OF TESTs:
//         1. non-Admin increses the stock
//         2. admin increses the stock of a not existing product
//         3. admin increase the stock with a `changeDate` is after the current date
//         4. admin increase the stock with a changeDate` is before the product's `arrivalDate`
// --- RECORD A PRODUCT'S SALE
//     --- return 404 if `model` does not represent a product in the database
//     --- return 400  if `sellingDate` is after the current date
//     --- return 400  if `sellingDate` is before the product's `arrivalDate`
//     --- return 409  if `model` represents a product whose available quantity is 0
//     --- return 409 if the available quantity of `model` is lower than the requested `quantity`
//     ---LIST OF TESTs:
//         1. non-admin sell a product 
//         2. admin sell an not existing product 
//         3. admin sell a product with `sellingDate` is after the current date
//         4. admin sell a product with `sellingDate` is before the product's `arrivalDate`
//         5. admin sell a quantity greater than available stock.
//         6. admin sell a product whose available quantity is 0.
// --- RETURN ALL PRODUCT
//     --- return 422 if `grouping` is null and any of `category` or `model` is not null
//     --- return 422 if `grouping` is `category` and `category` is null OR `model` is not null
//     --- return 422 if `grouping` is `model` and `model` is null OR `category` is not null
//     --- return 404 if `model` does not represent a product in the database (only when `grouping` is `model`)
//     ---LIST of TESTs: 
//         1. un-logged user try to return the list 
//         2. logged user try to return the list 
//         3. logged user try to return the list with `grouping` is null and any of `category` or `model` is not null
//         4. logged user try to return the list with `grouping` is `category` and `category` is null OR `model` is not null
//         5. logged user try to return the list with `grouping` is `model` and `model` is null OR `category` is not null
//         6. logged user try to return the list with `model` does not represent a product in the database (only when `grouping` is `model`)
// --- Deletes one product from the database,
//     --- return 404 if `model` does not represent a product in the database
//     --- LIST OF TESTs:
//         1. non-admin delete a product  that exist
//         2. admin delete a product that exist
//         3. admin delete a product that not exist
// --- DELETE ALL PRODUCTS 
//     ---LIST OF TESTs:
//     --- non-admin deletes every product 
//     --- admin deletes every product 

import { describe, test, expect, jest, beforeAll, beforeEach, afterAll, afterEach } from "@jest/globals"
import request from 'supertest'
import { app } from "../../index"

import Authenticator from "../../src/routers/auth";
import { cleanup } from "../../src/db/cleanup";
import ErrorHandler from "../../src/helper";
import ProductController from "../../src/controllers/productController";
import { Category } from "../../src/components/product";
import { group } from "console";

jest.mock("../../src/controllers/productController");
jest.mock("../../src/routers/auth");

const baseURL = "/ezelectronics"

describe('Product Routes', () => {

    afterEach(async () => {
        jest.clearAllMocks();
    });

    describe('POST /products', () => {

        test('should return 200 when admin adds a product', async () => {

            const product = {
                model: "model1",
                category: "Laptop",
                quantity: 10,
                details: "details",
                sellingPrice: 999.99,
                arrivalDate: "2022-10-10"
            }

            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return next()
            })

            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                return next()
            })
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next()
            })

            jest.spyOn(ProductController.prototype, "registerProducts").mockResolvedValueOnce()

            const response = await request(app).post(baseURL + "/products").send(product)
            expect(response.status).toBe(200)
            //expect(ProductController.prototype.registerProducts).toHaveBeenCalled() 

        });

        test('should return 422 validation error', async () => {

            const product = {
                model: "",
                category: "Laptop",
                quantity: 10,
                details: "details",
                sellingPrice: 999.99,
                arrivalDate: "2022-10-10"
            }
            jest.spyOn(Authenticator.prototype,"isAdminOrManager").mockImplementation((req, res, next) => {
                return next()
            })
            jest.spyOn(Authenticator.prototype,"isLoggedIn").mockImplementation((req, res, next) => {
                return next()
            })

            jest.spyOn(ProductController.prototype, "registerProducts").mockResolvedValueOnce()

            const response = await request(app).post(baseURL + "/products").send(product)
            expect(response.status).toBe(422)

        });
        
        test('should return 401 if an no logged user tries to add a product', async () => {
            const product = {
                model: "model1",
                category: "Laptop",
                quantity: 10,
                details: "details",
                sellingPrice: 999.99,
                arrivalDate: "2022-10-10"
            }

            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return next();
            })

            jest.spyOn(Authenticator.prototype,"isAdminOrManager").mockImplementation((req, res, next) => {
                return next();
            })

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return res.status(401).json({ error: "Unauthenticated user", status: 401 })
            })

            jest.spyOn(ProductController.prototype, "registerProducts").mockResolvedValueOnce()

            const response = await request(app).post(baseURL + "/products").send(product)
            expect(response.status).toBe(401)
        });

        test('should return 401 if a user is not admin or manager', async () => {
            const product = {
                model: "model1",
                category: "Laptop",
                quantity: 10,
                details: "details",
                sellingPrice: 999.99,
                arrivalDate: "2022-10-10"
            }

            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return next()
            })

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next()
            })

            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                return res.status(401).json({ error: "Unauthenticated user", status: 401 })
            })

            jest.spyOn(ProductController.prototype, "registerProducts").mockResolvedValueOnce()

            const response = await request(app).post(baseURL + "/products").send(product)
            expect(response.status).toBe(401)
        })
    })

    describe('GET /products', () => {
        test('should return 200 when admin gets all products', async () => {
            
            const product = { model: "model1", category: Category.SMARTPHONE, quantity: 10, details: "details", sellingPrice: 999.99, arrivalDate: "2022-10-10" }
            
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return next();
            });

            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
            return next();
            });

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
            return next();
            });

            jest.spyOn(ProductController.prototype, "getProducts").mockResolvedValueOnce([product]);

            const response = await request(app).get(baseURL + `/products`)
            expect(response.status).toBe(200);
            expect(ProductController.prototype.getProducts).toHaveBeenCalled();
            expect(response.body).toEqual([product])
        });
    })

    describe('GET /products/available', () => {
        test('should return 200 when admin gets a product', async () => {
            const productSmartphone = { model: "model1", category: Category.SMARTPHONE, quantity: 10, details: "details", sellingPrice: 999.99, arrivalDate: "2022-10-10" }
            const productLaptop = { model: "model2", category: Category.LAPTOP, quantity: 20, details: "details2", sellingPrice: 899.99, arrivalDate: "2022-11-11" }
            const productAppliance = { model: "model3", category: Category.APPLIANCE, quantity: 30, details: "details3", sellingPrice: 799.99, arrivalDate: "2022-12-12" }

            jest.spyOn(ErrorHandler.prototype, "validatefilterRequest").mockImplementation((req, res, next) => {
                return next();
            });

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
            return next();
            });

            jest.spyOn(ProductController.prototype, "getAvailableProducts").mockResolvedValueOnce([productSmartphone,productLaptop,productAppliance]);

            //const response = await request(app).get(baseURL + `/products?grouping=model&category=${Category.SMARTPHONE}&model=${product.model}`);
            const response = await request(app).get(baseURL + `/products/available`)
            expect(response.status).toBe(200);
            expect(ProductController.prototype.getAvailableProducts).toHaveBeenCalled();
            expect(response.body).toEqual([productSmartphone,productLaptop,productAppliance])
        });

        test('should return 401 when unlogged user tries to get a product', async () => {
            const productSmartphone = { model: "model1", category: Category.SMARTPHONE, quantity: 10, details: "details", sellingPrice: 999.99, arrivalDate: "2022-10-10" }
            const productLaptop = { model: "model2", category: Category.LAPTOP, quantity: 20, details: "details2", sellingPrice: 899.99, arrivalDate: "2022-11-11" }
            const productAppliance = { model: "model3", category: Category.APPLIANCE, quantity: 30, details: "details3", sellingPrice: 799.99, arrivalDate: "2022-12-12" }

            jest.spyOn(ErrorHandler.prototype, "validatefilterRequest").mockImplementation((req, res, next) => {
                return next();
            });

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return res.status(401).json({ error: "Unauthorized user", status: 401 });
            });

            jest.spyOn(ProductController.prototype, "getAvailableProducts").mockResolvedValueOnce([productSmartphone,productLaptop,productAppliance]);

            //const response = await request(app).get(baseURL + `/products?grouping=model&category=${Category.SMARTPHONE}&model=${product.model}`);
            const response = await request(app).get(baseURL + `/products/available`)
            expect(response.status).toBe(401);
        });

        test('should return 422 when validation error', async () => {
            const productSmartphone = { model: "model1", category: Category.SMARTPHONE, quantity: 10, details: "details", sellingPrice: 999.99, arrivalDate: "2022-10-10" }
            const productLaptop = { model: "model2", category: Category.LAPTOP, quantity: 20, details: "details2", sellingPrice: 899.99, arrivalDate: "2022-11-11" }
            const productAppliance = { model: "model3", category: Category.APPLIANCE, quantity: 30, details: "details3", sellingPrice: 799.99, arrivalDate: "2022-12-12" }

            jest.spyOn(ErrorHandler.prototype, "validatefilterRequest").mockImplementation((req, res, next) => {
                return res.status(422).json({ error: "Validation error", status: 422 });
            });

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next();
            });

            jest.spyOn(ProductController.prototype, "getAvailableProducts").mockResolvedValueOnce([productSmartphone,productLaptop,productAppliance]);

            const response = await request(app).get(baseURL + `/products?grouping=category&category=computer&model=${productSmartphone.model}`);
            //const response = await request(app).get(baseURL + `/products/available`)
            expect(response.status).toBe(422);
        });
    })

    describe('DELETE /products/:model', () => {
        test('should return 200 when admin deletes a product', async () => {

            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return next();
            });

            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                return next();
            });

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next();
            });

            jest.spyOn(ProductController.prototype, "deleteProduct").mockResolvedValueOnce(true);

            const response = await request(app).delete(baseURL + "/products/testModel");
            expect(response.status).toBe(200);
            expect(ProductController.prototype.deleteProduct).toHaveBeenCalled();
            expect(ProductController.prototype.deleteProduct).toHaveBeenCalledWith("testModel");
        });

        test('should return 401 when non-admin tries to delete a product', async () => {

            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return next();
            });

            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                return res.status(401).json({ error: "Unauthorized user", status: 401 });
            });

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next();
            });

            jest.spyOn(ProductController.prototype, "deleteProduct").mockResolvedValueOnce(false);

            const response = await request(app).delete(baseURL + "/products/testModel");
            expect(response.status).toBe(401);
        });
    });

    describe('DELETE /products', () => {
        test('should return 200 when admin deletes all products', async () => {
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return next();
            });

            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                return next();
            });

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next();
            });

            jest.spyOn(ProductController.prototype, "deleteAllProducts").mockResolvedValueOnce(true);

            const response = await request(app).delete(baseURL + `/products`);
            expect(response.status).toBe(200);
            expect(ProductController.prototype.deleteAllProducts).toHaveBeenCalled();
        });

        test('should return 401 when non-admin tries to delete all products', async () => {
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return next();
            });

            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                return res.status(401).json({ error: "Unauthorized user", status: 401 });
            });

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next();
            });

            jest.spyOn(ProductController.prototype, "deleteAllProducts").mockResolvedValueOnce(false);

            const response = await request(app).delete(baseURL + `/products`)
            expect(response.status).toBe(401);
        });

        test('should return 401 when non-logged in tries to delete all products', async () => {
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return next();
            });

            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                return next();
            });

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return res.status(401).json({ error: "Unauthorized user", status: 401 });
            });

            jest.spyOn(ProductController.prototype, "deleteAllProducts").mockResolvedValueOnce(false);

            const response = await request(app).delete(baseURL + `/products`)
            expect(response.status).toBe(401);
        });
    })

    describe('PATCH /products/:model', () => {
        test('should return 200 when admin increases the stock', async () => {
            const product = {model: "modeltest",quantity: 10,changeDate: "2022-10-10"}

            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return next();
            });

            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                return next();
            });

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next();
            });

            jest.spyOn(ProductController.prototype, "changeProductQuantity").mockResolvedValueOnce(product.quantity)

            const response = await request(app).patch(baseURL + `/products/${product.model}`).send(product)
            expect(response.status).toBe(200)
            expect(response.body.quantity).toEqual(product.quantity);
            expect(ProductController.prototype.changeProductQuantity).toHaveBeenCalled()
            expect(ProductController.prototype.changeProductQuantity).toHaveBeenCalledWith(product.model, product.quantity, product.changeDate)
        });

        test('should return 401 when non-admin tries to increase the stock', async () => {
            const product = {model: "modeltest",quantity: 10,changeDate: "2022-10-10"}

            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return next();
            });

            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                return res.status(401).json({ error: "Unauthorized user", status: 401 });
            });

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next();
            });

            jest.spyOn(ProductController.prototype, "changeProductQuantity").mockResolvedValueOnce(product.quantity)

            const response = await request(app).patch(baseURL + `/products/${product.model}`).send(product)
            expect(response.status).toBe(401)
        });

        test('should return 422 when validation error', async () => {
            const product = {model: "model",quantity: 10,changeDate: ""}

            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                return next();
            });

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next();
            });

            jest.spyOn(ProductController.prototype, "changeProductQuantity").mockResolvedValueOnce(product.quantity)

            const response = await request(app).patch(baseURL + `/products/${product.model}`).send(product)
            expect(response.status).toBe(422)
        });

        test('should return 404 when model is not valid', async () => {
            const product = {model: "",quantity: 10,changeDate: ""}

            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                return next();
            });

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next();
            });

            jest.spyOn(ProductController.prototype, "changeProductQuantity").mockResolvedValueOnce(product.quantity)

            const response = await request(app).patch(baseURL + `/products/${product.model}`).send(product)
            expect(response.status).toBe(404)
        });

        test('should return 401 when unlogged user tries to increase the stock', async () => {
            const product = {model: "modeltest",quantity: 10,changeDate: "2022-10-10"}

            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return next();
            });

            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                return next();
            });

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return res.status(401).json({ error: "Unauthorized user", status: 401 });
            });

            jest.spyOn(ProductController.prototype, "changeProductQuantity").mockResolvedValueOnce(product.quantity)

            const response = await request(app).patch(baseURL + `/products/${product.model}`).send(product)
            expect(response.status).toBe(401)
        });
    })

    describe('PATCH /products/:model/sell', () => {
        test('should return 200 when admin sells a product', async () => {
            const product = {model: "modeltest",quantity: 10,sellingDate: "2022-10-10"}

            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return next();
            });

            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                return next();
            });

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next();
            });

            jest.spyOn(ProductController.prototype, "sellProduct").mockResolvedValueOnce(product.quantity)

            const response = await request(app).patch(baseURL + `/products/${product.model}/sell`).send(product)
            expect(response.status).toBe(200)
            expect(response.body.quantity).toEqual(product.quantity);
            expect(ProductController.prototype.sellProduct).toHaveBeenCalled()
            expect(ProductController.prototype.sellProduct).toHaveBeenCalledWith(product.model, product.quantity, product.sellingDate)
        });

        test('should return 401 when non-admin tries to sell a product', async () => {
            const product = {model: "modeltest",quantity: 10,sellingDate: "2022-10-10"}

            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return next();
            });

            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                return res.status(401).json({ error: "Unauthorized user", status: 401 });
            });

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next();
            });

            jest.spyOn(ProductController.prototype, "sellProduct").mockResolvedValueOnce(product.quantity)

            const response = await request(app).patch(baseURL + `/products/${product.model}/sell`).send(product)
            expect(response.status).toBe(401)
        });

        test('should return 422 when validation error', async () => {   
            const product = {model: "model",quantity: 10,sellingDate: ""}

            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                return next();
            });

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next();
            });

            jest.spyOn(ProductController.prototype, "sellProduct").mockResolvedValueOnce(product.quantity)

            const response = await request(app).patch(baseURL + `/products/${product.model}/sell`).send(product)
            expect(response.status).toBe(422)
        });

        test('should return 401 when unlogged user tries to sell a product', async () => {
            const product = {model: "modeltest",quantity: 10,sellingDate: "2022-10-10"}

            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return next();
            });

            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                return next();
            });

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return res.status(401).json({ error: "Unauthorized user", status: 401 });
            });

            jest.spyOn(ProductController.prototype, "sellProduct").mockResolvedValueOnce(product.quantity)

            const response = await request(app).patch(baseURL + `/products/${product.model}/sell`).send(product)
            expect(response.status).toBe(401)
        });
    })
})