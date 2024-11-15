import { describe, test, expect, beforeAll, beforeEach, it, afterAll, jest} from "@jest/globals";

import crypto from "crypto";
import UserDAO from "../../src/dao/userDAO";
import db from "../../src/db/db";
import { Database } from "sqlite3";
import { UserAlreadyExistsError, UnauthorizedUserError, UserNotFoundError, UserIsAdminError } from "../../src/errors/userError";
import { userInfo } from "os";


import request from 'supertest'
import { app } from "../../index"

import UserController from "../../src/controllers/userController"
import Authenticator from "../../src/routers/auth"
import { Role, User } from "../../src/components/user"
import ErrorHandler from "../../src/helper"
import { before } from "node:test";

const baseURL = "/ezelectronics"

import CartController from "../../src/controllers/cartController";
import { Category, Product } from "../../src/components/product";
import CartDAO from "../../src/dao/cartDAO";
import { Cart } from "../../src/components/cart";
import ProductDAO from "../../src/dao/productDAO";
import ProductController from "../../src/controllers/productController";
import { LowProductStockError, ProductAlreadyExistsError, ProductNotFoundError } from "../../src/errors/productError";
import e from "express";
import { DateError } from "../../src/utilities";


jest.mock("crypto");
jest.mock("../../src/db/db.ts");
jest.mock("../../src/controllers/userController")
jest.mock("../../src/routers/auth")


//------------------------------------------ REGISTER PRODUCTS

describe("Register Products", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("Register a products", async () => {
        const prodComplete = {
            model: "model",
            category: Category.SMARTPHONE,
            quantity: 5,
            details: "details",
            sellingPrice: 100,
            arrivalDate: "2021-10-10"
        };
        
        jest.spyOn(ProductDAO.prototype, "getProductByModel").mockResolvedValue(null);
        jest.spyOn(ProductDAO.prototype, "registerProduct").mockResolvedValue();

        const cartController = new ProductController();
        await cartController.registerProducts(prodComplete.model, prodComplete.category, prodComplete.quantity, prodComplete.details, prodComplete.sellingPrice, prodComplete.arrivalDate);

        expect(ProductDAO.prototype.getProductByModel).toHaveBeenCalled();
        expect(ProductDAO.prototype.getProductByModel).toHaveBeenCalledWith(prodComplete.model);
        expect(ProductDAO.prototype.registerProduct).toHaveBeenCalled();
        expect(ProductDAO.prototype.registerProduct).toHaveBeenCalledWith(new Product(prodComplete.sellingPrice, prodComplete.model, prodComplete.category, prodComplete.arrivalDate, prodComplete.details, prodComplete.quantity));
    });

    
    test("Should throw error ProductAlreadyExistsError", async () => {
        const exProd = new Product(100, "model", Category.SMARTPHONE, "2021-10-10", "details", 5);
        jest.spyOn(ProductDAO.prototype, "getProductByModel").mockResolvedValue(exProd);

        const controller = new ProductController();
        await expect(controller.registerProducts(exProd.model, exProd.category, exProd.quantity, exProd.details, exProd.sellingPrice, exProd.arrivalDate)).rejects.toThrow(ProductAlreadyExistsError);
        expect(ProductDAO.prototype.getProductByModel).toHaveBeenCalled();
        expect(ProductDAO.prototype.getProductByModel).toHaveBeenCalledWith(exProd.model);
    });


    test("Should throw error: DateError", async () => {
        const exProd = new Product(100, "model", Category.SMARTPHONE, "2021-10-10", "details", 5);
        jest.spyOn(ProductDAO.prototype, "getProductByModel").mockResolvedValue(null);

        const controller = new ProductController();
        await expect(controller.registerProducts(exProd.model, exProd.category, exProd.quantity, exProd.details, exProd.sellingPrice, "3000-01-01")).rejects.toThrow(DateError);
        expect(ProductDAO.prototype.getProductByModel).toHaveBeenCalled();
        expect(ProductDAO.prototype.getProductByModel).toHaveBeenCalledWith(exProd.model);
    });

});

//------------------------------------------ CHANGE PRODUCT QUANTITY
describe("Change Product Quantity", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("Change product quantity", async () => {
        const prodComplete = {
            model: "model",
            category: Category.SMARTPHONE,
            quantity: 5,
            details: "details",
            sellingPrice: 100,
            arrivalDate: "2021-10-10"
        };

        jest.spyOn(ProductDAO.prototype, "getProductByModel").mockResolvedValue(prodComplete);
        jest.spyOn(ProductDAO.prototype, "updateProductQuantity").mockResolvedValue(10);

        const controller = new ProductController();
        const result = await controller.changeProductQuantity("modelRandom", 5, null);
        expect(result).toEqual(10);

        expect(ProductDAO.prototype.getProductByModel).toHaveBeenCalled();
        expect(ProductDAO.prototype.getProductByModel).toHaveBeenCalledWith("modelRandom");
    });

    test("Should throw error: ProductNotFoundError" , async () => {
        jest.spyOn(ProductDAO.prototype, "getProductByModel").mockResolvedValue(null);

        const controller = new ProductController();
        await expect(controller.changeProductQuantity("model", 5, null)).rejects.toThrow(ProductNotFoundError);
        expect(ProductDAO.prototype.getProductByModel).toHaveBeenCalled();
        expect(ProductDAO.prototype.getProductByModel).toHaveBeenCalledWith("model");
    });

    test("Should throw error: DateError" , async () => {
        const prodComplete = {
            model: "model",
            category: Category.SMARTPHONE,
            quantity: 5,
            details: "details",
            sellingPrice: 100,
            arrivalDate: "2021-10-10"
        };

        jest.spyOn(ProductDAO.prototype, "getProductByModel").mockResolvedValue(prodComplete);

        const controller = new ProductController();
        await expect(controller.changeProductQuantity("model", 5, "3000-01-01")).rejects.toThrow(DateError);
        expect(ProductDAO.prototype.getProductByModel).toHaveBeenCalled();
        expect(ProductDAO.prototype.getProductByModel).toHaveBeenCalledWith("model");
    });

});


//------------------------------------------ SELL PRODUCT

describe("Sell Product", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("Sell product", async () => {
        const prodComplete = {
            model: "model",
            category: Category.SMARTPHONE,
            quantity: 5,
            details: "details",
            sellingPrice: 100,
            arrivalDate: "2021-10-10"
        };

        jest.spyOn(ProductDAO.prototype, "getProductByModel").mockResolvedValue(prodComplete);
        jest.spyOn(ProductDAO.prototype, "updateProductQuantity").mockResolvedValue(5);

        const controller = new ProductController();
        const result = await controller.sellProduct(prodComplete.model, prodComplete.quantity-1, null);
        expect(result).toEqual(5);

        expect(ProductDAO.prototype.getProductByModel).toHaveBeenCalled();
        expect(ProductDAO.prototype.getProductByModel).toHaveBeenCalledWith(prodComplete.model);
        expect(ProductDAO.prototype.updateProductQuantity).toHaveBeenCalled();
        expect(ProductDAO.prototype.updateProductQuantity).toHaveBeenCalledWith(prodComplete.model, -4);

    });

    
    test("Should throw error: ProductNotFoundError", async () => {
        jest.spyOn(ProductDAO.prototype, "getProductByModel").mockResolvedValue(null);

        const controller = new ProductController();
        await expect(controller.sellProduct("model", 0, "2021-01-01")).rejects.toThrow(ProductNotFoundError);
    
        expect(ProductDAO.prototype.getProductByModel).toHaveBeenCalled();
        expect(ProductDAO.prototype.getProductByModel).toHaveBeenCalledWith("model");
    });

    test("Should throw error: LowProductStockError", async () => {
        const prodComplete = {
            model: "model",
            category: Category.SMARTPHONE,
            quantity: 1,
            details: "details",
            sellingPrice: 100,
            arrivalDate: "2021-10-10"
        };
        jest.spyOn(ProductDAO.prototype, "getProductByModel").mockResolvedValue(prodComplete);
        
        const controller = new ProductController();
        await expect(controller.sellProduct("model", 15, "date")).rejects.toThrow(LowProductStockError);

        expect(ProductDAO.prototype.getProductByModel).toHaveBeenCalled();
        expect(ProductDAO.prototype.getProductByModel).toHaveBeenCalledWith("model");

    });


    test("Should throw error: DateError", async () => {
        const prodComplete = {
            model: "model",
            category: Category.SMARTPHONE,
            quantity: 5,
            details: "details",
            sellingPrice: 100,
            arrivalDate: "2021-10-10"
        };
        jest.spyOn(ProductDAO.prototype, "getProductByModel").mockResolvedValue(prodComplete);

        const controller = new ProductController();
        await expect(controller.sellProduct("model", 1, "3000-01-01")).rejects.toThrow(DateError);

        expect(ProductDAO.prototype.getProductByModel).toHaveBeenCalled();
        expect(ProductDAO.prototype.getProductByModel).toHaveBeenCalledWith("model");
    });
});


//------------------------------------------ GET PRODUCTS

describe("Get Products", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("Get products", async () => {
        const products = [
            {
                model: "model",
                category: Category.SMARTPHONE,
                quantity: 5,
                details: "details",
                sellingPrice: 100,
                arrivalDate: "2021-10-10"
            },
            {
                model: "model2",
                category: Category.SMARTPHONE,
                quantity: 5,
                details: "details",
                sellingPrice: 100,
                arrivalDate: "2021-10-10"
            }
        ];

        jest.spyOn(ProductDAO.prototype, "getProducts").mockResolvedValue(products);

        const controller = new ProductController();
        const result = await controller.getProducts(null, null, null);
        expect(result).toEqual(products);

        expect(ProductDAO.prototype.getProducts).toHaveBeenCalled();
        expect(ProductDAO.prototype.getProducts).toHaveBeenCalledWith(null, null);
    });

    test("Should throw error: ProductNotFoundError", async () => {
        jest.spyOn(ProductDAO.prototype, "getProductByModel").mockResolvedValue(null);

        const controller = new ProductController();
        await expect(controller.getProducts("model", null, "modelModel")).rejects.toThrow(ProductNotFoundError);

        expect(ProductDAO.prototype.getProductByModel).toHaveBeenCalled();
        expect(ProductDAO.prototype.getProductByModel).toHaveBeenCalledWith("modelModel");
    });

});


//------------------------------------------ GET AVAIABLE PRODUCTS

describe("Get Available Products", () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("Get available products", async () => {
        const products = [
            {
                model: "model",
                category: Category.SMARTPHONE,
                quantity: 5,
                details: "details",
                sellingPrice: 100,
                arrivalDate: "2021-10-10"
            },
            {
                model: "model2",
                category: Category.SMARTPHONE,
                quantity: 5,
                details: "details",
                sellingPrice: 100,
                arrivalDate: "2021-10-10"
            }
        ];

        jest.spyOn(ProductDAO.prototype, "getProducts").mockResolvedValue(products);

        const controller = new ProductController();
        const result = await controller.getAvailableProducts(null, "randomCategory", "randomModel");
        expect(result).toEqual(products);

        expect(ProductDAO.prototype.getProducts).toHaveBeenCalled();
        expect(ProductDAO.prototype.getProducts).toHaveBeenCalledWith("randomCategory", "randomModel");

    });

    test("Should throw error: ProductNotFoundError", async () => {
        jest.spyOn(ProductDAO.prototype, "getProductByModel").mockResolvedValue(null);

        const controller = new ProductController();
        await expect(controller.getAvailableProducts("model", null, "modelModel")).rejects.toThrow(ProductNotFoundError);

        expect(ProductDAO.prototype.getProductByModel).toHaveBeenCalled();
        expect(ProductDAO.prototype.getProductByModel).toHaveBeenCalledWith("modelModel");
    });

    test("Should return empty array", async () => {
        const prodQuantityZero = {
            model: "model",
            category: Category.SMARTPHONE,
            quantity: 0,
            details: "details",
            sellingPrice: 100,
            arrivalDate: "2021-10-10"
        };
        
        jest.spyOn(ProductDAO.prototype, "getProductByModel").mockResolvedValue(prodQuantityZero);
        const controller = new ProductController();
        const result = await controller.getAvailableProducts("model", null, "modelModel");
        expect(result).toEqual([]);

        expect(ProductDAO.prototype.getProductByModel).toHaveBeenCalled();
        expect(ProductDAO.prototype.getProductByModel).toHaveBeenCalledWith("modelModel");
    });

});


//------------------------------------------ DELETE PRODUCT
describe("Delete Product", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("Delete product", async () => {
        const prodComplete = {
            model: "model",
            category: Category.SMARTPHONE,
            quantity: 5,
            details: "details",
            sellingPrice: 100,
            arrivalDate: "2021-10-10"
        };

        jest.spyOn(ProductDAO.prototype, "getProductByModel").mockResolvedValue(prodComplete);
        jest.spyOn(ProductDAO.prototype, "deleteProduct").mockResolvedValue(true);

        const controller = new ProductController();
        const result = await controller.deleteProduct("model");
        expect(result).toEqual(true);

        expect(ProductDAO.prototype.getProductByModel).toHaveBeenCalled();
        expect(ProductDAO.prototype.getProductByModel).toHaveBeenCalledWith("model");
        expect(ProductDAO.prototype.deleteProduct).toHaveBeenCalled();
        expect(ProductDAO.prototype.deleteProduct).toHaveBeenCalledWith("model");
    });

    test("Should throw error: ProductNotFoundError", async () => {
        jest.spyOn(ProductDAO.prototype, "getProductByModel").mockResolvedValue(null);
        
        const controller = new ProductController();
        await expect(controller.deleteProduct("model")).rejects.toThrow(ProductNotFoundError);

        expect(ProductDAO.prototype.getProductByModel).toHaveBeenCalled();
        expect(ProductDAO.prototype.getProductByModel).toHaveBeenCalledWith("model");
    });

});


//------------------------------------------ DELETE ALL PRODUCTS

describe("Delete all products", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("Delete all products", async () => {
        jest.spyOn(ProductDAO.prototype, "deleteAllProducts").mockResolvedValue(true);

        const controller = new ProductController();
        const result = await controller.deleteAllProducts();
        expect(result).toEqual(true);

        expect(ProductDAO.prototype.deleteAllProducts).toHaveBeenCalled();
        expect(ProductDAO.prototype.deleteAllProducts).toHaveBeenCalledWith();
    });

});

