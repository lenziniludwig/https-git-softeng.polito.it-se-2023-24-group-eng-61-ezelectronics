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
import { Cart, ProductInCart } from "../../src/components/cart";
import ProductDAO from "../../src/dao/productDAO";
import { EmptyProductStockError, LowProductStockError, ProductNotFoundError } from "../../src/errors/productError";
import { CartNotFoundError, EmptyCartError, ProductNotInCartError } from "../../src/errors/cartError";
import e from "express";


jest.mock("crypto");
jest.mock("../../src/db/db.ts");
jest.mock("../../src/controllers/userController")
jest.mock("../../src/routers/auth")




//------------------------------------------ ADD TO CART
describe('ADD TO CART', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("should addToCart", async () => {
        const user = new User("username", "name", "surname", Role.CUSTOMER, "address", "birthdate");
        const productGot = {
            sellingPrice: 100,
            model: "switch games",
            category: Category.APPLIANCE,
            arrivalDate: "2025-01-01",
            details: "details",
            quantity: 1
        };
        jest.spyOn(ProductDAO.prototype, "getProductByModel").mockResolvedValue(productGot);
        jest.spyOn(CartDAO.prototype, "addToCart").mockResolvedValue();

        const cartController = new CartController();
        await cartController.addToCart(user, "id555111");

        expect(ProductDAO.prototype.getProductByModel).toHaveBeenCalled();
        expect(ProductDAO.prototype.getProductByModel).toHaveBeenCalledWith("id555111");
        expect(CartDAO.prototype.addToCart).toHaveBeenCalled();
        expect(CartDAO.prototype.addToCart).toHaveBeenCalledWith("username", new ProductInCart("switch games", 1, Category.APPLIANCE, 100));
    });

    test("Should throw error: ProductNotFoundError", async () => {
        const user = new User("username", "name", "surname", Role.CUSTOMER, "address", "birthdate");
        jest.spyOn(ProductDAO.prototype, "getProductByModel").mockResolvedValue(null);

        const cartController = new CartController();
        await expect(cartController.addToCart(user, "productId")).rejects.toThrow(ProductNotFoundError);
        
        expect(ProductDAO.prototype.getProductByModel).toHaveBeenCalled();
        expect(ProductDAO.prototype.getProductByModel).toHaveBeenCalledWith("productId");
    });

    
    test("Should throw error: EmptyProductStockError", async () => {
        const user = new User("username", "name", "surname", Role.CUSTOMER, "address", "birthdate");
        const productGot = {
            sellingPrice: 100,
            model: "switch games",
            category: Category.APPLIANCE,
            arrivalDate: "2025-01-01",
            details: "details",
            quantity: 0
        };
        jest.spyOn(ProductDAO.prototype, "getProductByModel").mockResolvedValue(productGot);

        const cartController = new CartController();
        await expect(cartController.addToCart(user, "id555111")).rejects.toThrow(EmptyProductStockError);
        
        expect(ProductDAO.prototype.getProductByModel).toHaveBeenCalled();
        expect(ProductDAO.prototype.getProductByModel).toHaveBeenCalledWith("id555111");
    });

});

//------------------------------------------ GET CART

describe('GET CART', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("should getCart", async () => {
        const user = new User("username", "name", "surname", Role.CUSTOMER, "address", "birthdate");
        const prodTmp = {
            model: "model",
            category: Category.APPLIANCE,
            price: 100,
            quantity: 1
        };
        const cartGot = new Cart("customer1", false, "2020-01-01", 50, [prodTmp]);
        jest.spyOn(CartDAO.prototype, "getCart").mockResolvedValue(cartGot);

        const cartController = new CartController();
        const result = await cartController.getCart(user);
        expect(result).toEqual(cartGot);

        expect(CartDAO.prototype.getCart).toHaveBeenCalled();
        expect(CartDAO.prototype.getCart).toHaveBeenCalledWith("username");

    });

    test("Should return an empty cart", async () => {
        const user = new User("username", "name", "surname", Role.CUSTOMER, "address", "birthdate");
        const cartEmpty = new Cart("username", false, '', 0, []);

        jest.spyOn(CartDAO.prototype, "getCart").mockResolvedValue(null);

        const cartController = new CartController();
        const result = await cartController.getCart(user);
        expect(result).toEqual(cartEmpty);

        expect(CartDAO.prototype.getCart).toHaveBeenCalled();
        expect(CartDAO.prototype.getCart).toHaveBeenCalledWith("username");
    });


});


//------------------------------------------ CHECKOUT CART

describe('CHECKOUT CART', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    // Ogni tanto questo test fallisce, ma non so il motivo (altre volte funziona bene)
    test("should checkoutCart", async () => {
        const user = new User("username", "name", "surname", Role.CUSTOMER, "address", "birthdate");
        const productNotInCart = {
            sellingPrice: 100,
            model: "model",
            category: Category.APPLIANCE,
            arrivalDate: "2025-01-01",
            details: "details",
            quantity: 100
        };
        const progInCartTmp = {
            model: "model",
            category: Category.APPLIANCE,
            price: 100,
            quantity: 1
        };
        const cartGot = new Cart("customer1", false, "2020-01-01", 50, [progInCartTmp]);
        jest.spyOn(CartDAO.prototype, "getCart").mockResolvedValue(cartGot);
        jest.spyOn(ProductDAO.prototype, "getProductByModel").mockResolvedValue(productNotInCart);
        jest.spyOn(CartDAO.prototype, "checkoutCart").mockResolvedValue();
        jest.spyOn(ProductDAO.prototype, "updateProductQuantity").mockResolvedValue(1);

        const cartController = new CartController();
        await cartController.checkoutCart(user);

        expect(CartDAO.prototype.getCart).toHaveBeenCalled();
        expect(CartDAO.prototype.getCart).toHaveBeenCalledWith("username");
        expect(ProductDAO.prototype.getProductByModel).toHaveBeenCalled();
        expect(ProductDAO.prototype.getProductByModel).toHaveBeenCalledWith("model");
        expect(CartDAO.prototype.checkoutCart).toHaveBeenCalled();
        const paymentDate = new Date().toISOString().split('T')[0];
        const total = cartGot.products.reduce((sum, p) => sum + p.price * p.quantity, 0);
        expect(CartDAO.prototype.checkoutCart).toHaveBeenCalledWith("username", paymentDate, total);
        expect(ProductDAO.prototype.updateProductQuantity).toHaveBeenCalled();
        expect(ProductDAO.prototype.updateProductQuantity).toHaveBeenCalledWith("model", -1);
    });

    test("should throw error: CartNotFoundError", async () => {
        const user = new User("username", "name", "surname", Role.CUSTOMER, "address", "birthdate");
        jest.spyOn(CartDAO.prototype, "getCart").mockResolvedValue(null);

        const cartController = new CartController();
        await expect(cartController.checkoutCart(user)).rejects.toThrow(CartNotFoundError);
        expect(CartDAO.prototype.getCart).toHaveBeenCalled();
        expect(CartDAO.prototype.getCart).toHaveBeenCalledWith("username");
    });


    // Qui: questo test ha il problema, se usi la dichiarazione a struttura, per product: [], l'ho risolto dichiarando direttamente new Cart
    test("should throw error: EmptyCartError", async () => {
        const user = new User("username", "name", "surname", Role.CUSTOMER, "address", "birthdate");
        const cart = new Cart ("customer1", false, "2020-01-01", 50, []);
        jest.spyOn(CartDAO.prototype, "getCart").mockResolvedValue(cart);

        const cartController = new CartController();
        await expect(cartController.checkoutCart(user)).rejects.toThrow(EmptyCartError);
        expect(CartDAO.prototype.getCart).toHaveBeenCalled();
        expect(CartDAO.prototype.getCart).toHaveBeenCalledWith("username");
    });


    test("should throw error: EmptyProductStockError", async () => {
        const user = new User("username", "name", "surname", Role.CUSTOMER, "address", "birthdate");
        const productNotInCart = {
            sellingPrice: 100,
            model: "model",
            category: Category.APPLIANCE,
            arrivalDate: "2025-01-01",
            details: "details",
            quantity: 0
        };
        const progInCartTmp = {
            model: "model",
            category: Category.APPLIANCE,
            price: 100,
            quantity: 1
        };
        const cartGot = new Cart("customer1", false, "2020-01-01", 50, [progInCartTmp]);
        jest.spyOn(CartDAO.prototype, "getCart").mockResolvedValue(cartGot);
        jest.spyOn(ProductDAO.prototype, "getProductByModel").mockResolvedValue(productNotInCart);

        const cartController = new CartController();
        await expect(cartController.checkoutCart(user)).rejects.toThrow(EmptyProductStockError);
        expect(CartDAO.prototype.getCart).toHaveBeenCalled();
        expect(CartDAO.prototype.getCart).toHaveBeenCalledWith("username");

    });

    test("should throw error: LowProductStockError", async () => {
        const user = new User("username", "name", "surname", Role.CUSTOMER, "address", "birthdate");
        const productNotInCart = {
            sellingPrice: 100,
            model: "model",
            category: Category.APPLIANCE,
            arrivalDate: "2025-01-01",
            details: "details",
            quantity: 1
        };
        const progInCartTmp = {
            model: "model",
            category: Category.APPLIANCE,
            price: 100,
            quantity: 5
        };
        const cartGot = new Cart("customer1", false, "2020-01-01", 50, [progInCartTmp]);
        jest.spyOn(CartDAO.prototype, "getCart").mockResolvedValue(cartGot);
        jest.spyOn(ProductDAO.prototype, "getProductByModel").mockResolvedValue(productNotInCart);

        const cartController = new CartController();
        await expect(cartController.checkoutCart(user)).rejects.toThrow(LowProductStockError);
        expect(CartDAO.prototype.getCart).toHaveBeenCalled();
        expect(CartDAO.prototype.getCart).toHaveBeenCalledWith("username");
    });


});

//------------------------------------------ GET CUSTOMER CARTS
describe('GET CUSTOMER CARTS', () => {
    test("should getCustomerCarts", async () => {
        const user = new User("username", "name", "surname", Role.CUSTOMER, "address", "birthdate");
        const tmpProductInCart = {
            model: "iphone12",
            category: Category.APPLIANCE,
            price: 100,
            quantity: 1,
        };

        const cart = {
            customer: "customer1",
            paid: false,
            paymentDate: "2020-01-01",
            total: 50,
            products: [tmpProductInCart]
        };
        jest.spyOn(CartDAO.prototype, "getCustomerCarts").mockResolvedValue([cart]);

        const cartController = new CartController();
        const result = await cartController.getCustomerCarts(user);
        expect(result).toEqual([cart]);

        expect(CartDAO.prototype.getCustomerCarts).toHaveBeenCalled();
        expect(CartDAO.prototype.getCustomerCarts).toHaveBeenCalledWith("username");
    });
});


//------------------------------------------ REMOVE PRODUCT FROM CART
describe('REMOVE PRODUCT FROM CART', () => {
    test("should removeProductFromCart", async () => {
        const user = new User("username", "name", "surname", Role.CUSTOMER, "address", "birthdate");
        const productNotInCart = {
            sellingPrice: 100,
            model: "iphone",
            category: Category.APPLIANCE,
            arrivalDate: "2025-01-01",
            details: "details",
            quantity: 100
        };
        const progInCartTmp = {
            model: "iphone",
            category: Category.APPLIANCE,
            price: 100,
            quantity: 1
        };

        const cart = {
            customer: "customer1",
            paid: false,
            paymentDate: "2020-01-01",
            total: 50,
            products: [progInCartTmp]
        };

        jest.spyOn(ProductDAO.prototype, "getProductByModel").mockResolvedValue(productNotInCart);
        jest.spyOn(CartDAO.prototype, "getCart").mockResolvedValue(cart);
        jest.spyOn(CartDAO.prototype, "removeProductFromCart").mockResolvedValue();

        const cartController = new CartController();
        await cartController.removeProductFromCart(user, "iphone");

        expect(ProductDAO.prototype.getProductByModel).toHaveBeenCalled();
        expect(ProductDAO.prototype.getProductByModel).toHaveBeenCalledWith("iphone");
        expect(CartDAO.prototype.getCart).toHaveBeenCalled();
        expect(CartDAO.prototype.getCart).toHaveBeenCalledWith("username");
        expect(CartDAO.prototype.removeProductFromCart).toHaveBeenCalled();
        expect(CartDAO.prototype.removeProductFromCart).toHaveBeenCalledWith("username", "iphone");
    });

  
    test("should throw error: ProductNotFoundError", async () => {
        const user = new User("username", "name", "surname", Role.CUSTOMER, "address", "birthdate");

        jest.spyOn(ProductDAO.prototype, "getProductByModel").mockResolvedValue(null);
 
        const cartController = new CartController();
        await expect(cartController.removeProductFromCart(user, "iphone")).rejects.toThrow(ProductNotFoundError);

        expect(ProductDAO.prototype.getProductByModel).toHaveBeenCalled();
        expect(ProductDAO.prototype.getProductByModel).toHaveBeenCalledWith("iphone");
    });
    
  

    test("should throw error: CartNotFoundError", async () => {
        const user = new User("username", "name", "surname", Role.CUSTOMER, "address", "birthdate");
        const productNotInCart = {
            sellingPrice: 100,
            model: "iphone",
            category: Category.APPLIANCE,
            arrivalDate: "2025-01-01",
            details: "details",
            quantity: 100
        };
        jest.spyOn(ProductDAO.prototype, "getProductByModel").mockResolvedValue(productNotInCart);
        jest.spyOn(CartDAO.prototype, "getCart").mockResolvedValue(null);

        const cartController = new CartController();
        await expect(cartController.removeProductFromCart(user, "model")).rejects.toThrow(CartNotFoundError);

        expect(ProductDAO.prototype.getProductByModel).toHaveBeenCalled();
        expect(ProductDAO.prototype.getProductByModel).toHaveBeenCalledWith("model");
        expect(CartDAO.prototype.getCart).toHaveBeenCalled();
        expect(CartDAO.prototype.getCart).toHaveBeenCalledWith("username");
    });

    test("should throw error: EmptyCartError", async () => {
        const user = new User("username", "name", "surname", Role.CUSTOMER, "address", "birthdate");
        const productNotInCart = {
            sellingPrice: 100,
            model: "iphone",
            category: Category.APPLIANCE,
            arrivalDate: "2025-01-01",
            details: "details",
            quantity: 100
        };

        const cart = new Cart("customer1", false, "2020-01-01", 50, []);

        jest.spyOn(ProductDAO.prototype, "getProductByModel").mockResolvedValue(productNotInCart);
        jest.spyOn(CartDAO.prototype, "getCart").mockResolvedValue(cart);

        const cartController = new CartController();
        await expect(cartController.removeProductFromCart(user, "model")).rejects.toThrow(EmptyCartError);

        expect(ProductDAO.prototype.getProductByModel).toHaveBeenCalled();
        expect(ProductDAO.prototype.getProductByModel).toHaveBeenCalledWith("model");
        expect(CartDAO.prototype.getCart).toHaveBeenCalled();
        expect(CartDAO.prototype.getCart).toHaveBeenCalledWith("username");

    });

    test("should throw error: ProductNotInCartError", async () => {
        const user = new User("username", "name", "surname", Role.CUSTOMER, "address", "birthdate");
        const productNotInCart = {
            sellingPrice: 100,
            model: "iphone",
            category: Category.APPLIANCE,
            arrivalDate: "2025-01-01",
            details: "details",
            quantity: 100
        };
        const progInCartTmp = {
            model: "iphone",
            category: Category.APPLIANCE,
            price: 100,
            quantity: 1
        };

        const cart = {
            customer: "customer1",
            paid: false,
            paymentDate: "2020-01-01",
            total: 50,
            products: [progInCartTmp]
        };

        jest.spyOn(ProductDAO.prototype, "getProductByModel").mockResolvedValue(productNotInCart);
        jest.spyOn(CartDAO.prototype, "getCart").mockResolvedValue(cart);

        const cartController = new CartController();
        await expect(cartController.removeProductFromCart(user, "model2")).rejects.toThrow(ProductNotInCartError);

        expect(ProductDAO.prototype.getProductByModel).toHaveBeenCalled();
        expect(ProductDAO.prototype.getProductByModel).toHaveBeenCalledWith("model2");
        expect(CartDAO.prototype.getCart).toHaveBeenCalled();
        expect(CartDAO.prototype.getCart).toHaveBeenCalledWith("username");
    });
});


//------------------------------------------ CLEAR CART
describe('CLEAR CART', () => {
    test("should clearCart", async () => {
        const cart = new Cart("customer1", false, "2020-01-01", 50, []);
        const user = new User("username", "name", "surname", Role.CUSTOMER, "address", "birthdate");
        jest.spyOn(CartDAO.prototype, "getCart").mockResolvedValue(cart);
        jest.spyOn(CartDAO.prototype, "clearCart").mockResolvedValue();


        const cartController = new CartController();
        await cartController.clearCart(user);

        expect(CartDAO.prototype.getCart).toHaveBeenCalled();
        expect(CartDAO.prototype.getCart).toHaveBeenCalledWith("username");
        expect(CartDAO.prototype.clearCart).toHaveBeenCalled();
        expect(CartDAO.prototype.clearCart).toHaveBeenCalledWith("username");
    });

    test("should throw error: CartNotFoundError", async () => {
        const user = new User("username", "name", "surname", Role.CUSTOMER, "address", "birthdate");
        jest.spyOn(CartDAO.prototype, "getCart").mockResolvedValue(null);

        const cartController = new CartController();
        await expect(cartController.clearCart(user)).rejects.toThrow(CartNotFoundError);

        expect(CartDAO.prototype.getCart).toHaveBeenCalled();
        expect(CartDAO.prototype.getCart).toHaveBeenCalledWith("username");
    });
    

});


//------------------------------------------ DELETE ALL CARTS
describe('DELETE ALL CARTS', () => {
    test("should deleteAllCarts", async () => {
        jest.spyOn(CartDAO.prototype, "deleteAllCarts").mockResolvedValue();

        const cartController = new CartController();
        await cartController.deleteAllCarts();

        expect(CartDAO.prototype.deleteAllCarts).toHaveBeenCalled();
        expect(CartDAO.prototype.deleteAllCarts).toHaveBeenCalledWith();
    });
});

//------------------------------------------ GET ALL CARTS
describe('GET ALL CARTS', () => {
    test("should getAllCarts", async () => {
        jest.spyOn(CartDAO.prototype, "getAllCarts").mockResolvedValue([]);

        const cartController = new CartController();
        const result = await cartController.getAllCarts();
        expect(result).toEqual([]);

        expect(CartDAO.prototype.getAllCarts).toHaveBeenCalled();
        expect(CartDAO.prototype.getAllCarts).toHaveBeenCalledWith();
    });
});

