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
import ReviewDAO from "../../src/dao/reviewDAO";
import ReviewController from "../../src/controllers/reviewController";
import { ProductReview } from "../../src/components/review";
import e from "express";

jest.mock("crypto");
jest.mock("../../src/db/db.ts");
jest.mock("../../src/controllers/userController")
jest.mock("../../src/routers/auth")



//------------------------------------------ ADD REVIEW
describe('Add Review', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("Add review", async () => {
        const productGot = {
            sellingPrice: 100,
            model: "pentium",
            category: Category.LAPTOP,
            arrivalDate: "2021-01-01",
            details: "not so ggod for performance but good in time",
            quantity: 10
        }

        const user = {
            username: "username",
            name: "name",
            surname: "surname",
            role: Role.CUSTOMER,
            address: "address",
            birthdate: "birthdate"
        }

        jest.spyOn(ProductDAO.prototype, "getProductByModel").mockResolvedValue(productGot);
        jest.spyOn(ReviewDAO.prototype, "addReview").mockResolvedValue();

        const reviewController = new ReviewController();
        await reviewController.addReview("pentium", user, 5, "comment");

        expect(ProductDAO.prototype.getProductByModel).toHaveBeenCalled();
        expect(ProductDAO.prototype.getProductByModel).toHaveBeenCalledWith("pentium");
        expect(ReviewDAO.prototype.addReview).toHaveBeenCalled();
        expect(ReviewDAO.prototype.addReview).toHaveBeenCalledWith("pentium", "username", 5, "comment")
    });

    
    test("Should throw error ProductNotFoundError", async () => {
        const user = {
            username: "username",
            name: "name",
            surname: "surname",
            role: Role.CUSTOMER,
            address: "address",
            birthdate: "birthdate"
        }

        jest.spyOn(ProductDAO.prototype, "getProductByModel").mockResolvedValue(null);

        const reviewController = new ReviewController();
        await expect(reviewController.addReview("model", user, 0, "comment")).rejects.toThrow(ProductNotFoundError);
        
        expect(ProductDAO.prototype.getProductByModel).toHaveBeenCalled();
        expect(ProductDAO.prototype.getProductByModel).toHaveBeenCalledWith("model");


    });


});



//------------------------------------------ GET PRODUCT REVIEWS

describe('Get Product Reviews', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("Get product reviews", async () => {
        const tmpProd = {
            sellingPrice: 100,
            model: "model",
            category: Category.LAPTOP,
            arrivalDate: "2021-01-01",
            details: "not so ggod for performance but good in time",
            quantity: 10
        }
        const tmpProdRew = new ProductReview("model", "user", 5, "date", "comment");

        jest.spyOn(ProductDAO.prototype, "getProductByModel").mockResolvedValue(tmpProd);
        jest.spyOn(ReviewDAO.prototype, "getProductReviews").mockResolvedValue([tmpProdRew]);

        const reviewController = new ReviewController();
        const result = await reviewController.getProductReviews("model");
        expect(result).toEqual([tmpProdRew]);

        expect(ReviewDAO.prototype.getProductReviews).toHaveBeenCalled();
        expect(ReviewDAO.prototype.getProductReviews).toHaveBeenCalledWith("model");

    });

});


//------------------------------------------ DELETE REVIEW

describe('Delete Review', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("Delete review", async () => {
        const user = {
            username: "username",
            name: "name",
            surname: "surname",
            role: Role.CUSTOMER,
            address: "address",
            birthdate: "birthdate"
        }

        const productGot = {
            sellingPrice: 100,
            model: "pentium",
            category: Category.LAPTOP,
            arrivalDate: "2021-01-01",
            details: "not so ggod for performance but good in time",
            quantity: 10
        }


        jest.spyOn(ProductDAO.prototype, "getProductByModel").mockResolvedValue(productGot);
        jest.spyOn(ReviewDAO.prototype, "deleteReview").mockResolvedValue();

        const reviewController = new ReviewController();
        await reviewController.deleteReview("model", user);

        expect(ProductDAO.prototype.getProductByModel).toHaveBeenCalled();
        expect(ProductDAO.prototype.getProductByModel).toHaveBeenCalledWith("model");

        expect(ReviewDAO.prototype.deleteReview).toHaveBeenCalled();
        expect(ReviewDAO.prototype.deleteReview).toHaveBeenCalledWith("model", "username");

    });

    test("Should throw error ProductNotFoundError", async () => {
        const user = {
            username: "username",
            name: "name",
            surname: "surname",
            role: Role.CUSTOMER,
            address: "address",
            birthdate: "birthdate"
        }

        jest.spyOn(ProductDAO.prototype, "getProductByModel").mockResolvedValue(null);

        const reviewController = new ReviewController();
        await expect(reviewController.deleteReview("modelNotExisting", user)).rejects.toThrow(ProductNotFoundError);
        
        expect(ProductDAO.prototype.getProductByModel).toHaveBeenCalled();
        expect(ProductDAO.prototype.getProductByModel).toHaveBeenCalledWith("modelNotExisting");
    });

});


//------------------------------------------ DELETE REVIEWS OF PRODUCT
describe('Delete Reviews of Product', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("Delete reviews of product", async () => {
        const productGot = {
            sellingPrice: 100,
            model: "pentium",
            category: Category.LAPTOP,
            arrivalDate: "2021-01-01",
            details: "not so ggod for performance but good in time",
            quantity: 10
        }


        jest.spyOn(ProductDAO.prototype, "getProductByModel").mockResolvedValue(productGot);
        jest.spyOn(ReviewDAO.prototype, "deleteReviewsOfProduct").mockResolvedValue();

        const reviewController = new ReviewController();
        await reviewController.deleteReviewsOfProduct("model");

        expect(ProductDAO.prototype.getProductByModel).toHaveBeenCalled();
        expect(ProductDAO.prototype.getProductByModel).toHaveBeenCalledWith("model");

    });

    test("Should throw error ProductNotFoundError", async () => {

        jest.spyOn(ProductDAO.prototype, "getProductByModel").mockResolvedValue(null);

        const reviewController = new ReviewController();
        await expect(reviewController.deleteReviewsOfProduct("modelNotExisting")).rejects.toThrow(ProductNotFoundError);
       
        expect(ProductDAO.prototype.getProductByModel).toHaveBeenCalled();
        expect(ProductDAO.prototype.getProductByModel).toHaveBeenCalledWith("modelNotExisting");
    });

});


//------------------------------------------ DELETE ALL REVIEWS
describe('Delete All Reviews', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("Delete all reviews", async () => {
        jest.spyOn(ReviewDAO.prototype, "deleteAllReviews").mockResolvedValue();

        const reviewController = new ReviewController();
        await reviewController.deleteAllReviews();

        expect(ReviewDAO.prototype.deleteAllReviews).toHaveBeenCalled();
        expect(ReviewDAO.prototype.deleteAllReviews).toHaveBeenCalledWith();
    });
});
