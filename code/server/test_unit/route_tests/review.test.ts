import { describe, test, expect, jest, beforeAll, beforeEach, afterAll, afterEach } from "@jest/globals"
import request from 'supertest'
import { app } from "../../index"

import Authenticator from "../../src/routers/auth";
import { cleanup } from "../../src/db/cleanup";
import ErrorHandler from "../../src/helper";
import ReviewController from "../../src/controllers/reviewController";
import { Role, User } from "../../src/components/user";

jest.mock("../../src/controllers/reviewController");
jest.mock("../../src/routers/auth");

const baseURL = "/ezelectronics"

describe('ReviewRoutes', () => {
    afterEach(async () => {
        jest.clearAllMocks();
    });

    describe('POST /reviews/:model', () => {
        
        test('should add a review and return 200 status', async () => {

            const reviewTest = {
                score: 5,
                comment: "Absolutely fantastic!"
            }

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next()
            });
            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {
                return next()
            });
            jest.spyOn(ReviewController.prototype, "addReview").mockResolvedValueOnce()

            const response = await request(app)
                .post(baseURL + '/reviews/testModel')
                .send(reviewTest);

            expect(response.status).toBe(200);
            expect(response.text).toBe('');
            expect(ReviewController.prototype.addReview).toHaveBeenCalledWith('testModel', undefined, 5, "Absolutely fantastic!");
        });

        test('should add a review and return 401 status', async () => {

            const reviewTest = {
                score: 5,
                comment: "Absolutely fantastic!"
            }
            
            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {
                return next();
            });

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return res.status(401).json({ error: "Unauthenticated user", status: 401 })
            });

            jest.spyOn(ReviewController.prototype, "addReview").mockResolvedValueOnce()

            const response = await request(app)
                .post(baseURL + '/reviews/testModel')
                .send(reviewTest);

            expect(response.status).toBe(401);
        });

        test('should add a review but the user is not a customer and return 401 status', async () => {

            const reviewTest = {
                score: 5,
                comment: "Absolutely fantastic!"
            }
            
            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {
                return res.status(401).json({ error: "Unauthenticated user", status: 401 });
            });

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next();
            });

            jest.spyOn(ReviewController.prototype, "addReview").mockResolvedValueOnce()

            const response = await request(app)
                .post(baseURL + '/reviews/testModel')
                .send(reviewTest);

            expect(response.status).toBe(401);
        });

        test('should return 422 if validation fails', async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next()
            });
            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {
                return next()
            });
    
            const response = await request(app)
                .post(baseURL + '/reviews/testModel')
                .send({ score: 'invalid', comment: '' });
    
            expect(response.status).toBe(422);
        });
    });

    describe('GET /reviews/:model', () => {
        test('should return all reviews for a product, return 200', async () => {
            const review1 = { model: 'testModel', user: 'userA', score: 4, comment: 'Excellent!', date: '2022-02-01' }
            const review2 = { model: 'testModel', user: 'userB', score: 3, comment: 'Average!', date: '2022-02-02' }
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next()
            });
            jest.spyOn(ReviewController.prototype, "getProductReviews").mockResolvedValueOnce([review1, review2])

            const response = await request(app)
                .get(baseURL + '/reviews/testModel');

            expect(response.status).toBe(200);
            expect(response.body).toEqual([review1, review2]);
            expect(ReviewController.prototype.getProductReviews).toHaveBeenCalledWith('testModel');
        });

        test('should return all reviews for a product but the user is not logged-in, return 401', async () => {
            const review1 = { model: 'testModel', user: 'userA', score: 4, comment: 'Excellent!', date: '2022-02-01' }
            const review2 = { model: 'testModel', user: 'userB', score: 3, comment: 'Average!', date: '2022-02-02' }
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return res.status(401).json({ error: "Unauthenticated user", status: 401 });
            });
            jest.spyOn(ReviewController.prototype, "getProductReviews").mockResolvedValueOnce([review1, review2])

            const response = await request(app)
                .get(baseURL + '/reviews/testModel');

            expect(response.status).toBe(401);
        });
    });

    describe('DELETE /reviews/:model', () => {
        test('should delete a review and return 200 status', async () => {
            const user = new User("usernameLU", "nameLU", "surnameLU", Role.CUSTOMER, "user", "user");
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next()
            });
            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {
                return next()
            });
            jest.spyOn(ReviewController.prototype, "deleteReview").mockResolvedValueOnce()

            const response = await request(app)
                .delete(baseURL + '/reviews/testModel')

            expect(response.status).toBe(200);
            expect(response.text).toBe('');
            expect(ReviewController.prototype.deleteReview).toHaveBeenCalledWith('testModel',undefined);
        });

        test('should delete a review but the user is not logged-in, return 401', async () => {
            const user = new User("usernameLU", "nameLU", "surnameLU", Role.CUSTOMER, "user", "user");
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return res.status(401).json({ error: "Unauthenticated user", status: 401 });
            });
            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {
                return next()
            });
            jest.spyOn(ReviewController.prototype, "deleteReview").mockResolvedValueOnce()

            const response = await request(app)
                .delete(baseURL + '/reviews/testModel')

            expect(response.status).toBe(401);
        });

        test('should delete a review but the user is not customer, return 401', async () => {
            const user = new User("usernameLU", "nameLU", "surnameLU", Role.CUSTOMER, "user", "user");
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next();
            });
            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {
                return res.status(401).json({ error: "Unauthorized user", status: 401 });
            });
            jest.spyOn(ReviewController.prototype, "deleteReview").mockResolvedValueOnce()

            const response = await request(app)
                .delete(baseURL + '/reviews/testModel')

            expect(response.status).toBe(401);
        });
    });

    describe('DELETE /reviews/:model/all', () => {
        test('should delete all reviews for a product and return 200 status', async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next()
            });
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                return next()
            });
            jest.spyOn(ReviewController.prototype, "deleteReviewsOfProduct").mockResolvedValueOnce()

            const response = await request(app)
                .delete(baseURL + '/reviews/testModel/all');

            expect(response.status).toBe(200);
            expect(response.text).toBe('');
            expect(ReviewController.prototype.deleteReviewsOfProduct).toHaveBeenCalledWith('testModel');
        });

        test('should delete all reviews for a product but the user is not logged-in, return 401', async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return res.status(401).json({ error: "Unauthenticated user", status: 401 });
            });
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                return next()
            });
            jest.spyOn(ReviewController.prototype, "deleteReviewsOfProduct").mockResolvedValueOnce()

            const response = await request(app)
                .delete(baseURL + '/reviews/testModel/all');

            expect(response.status).toBe(401);
        });

        test('should delete all reviews for a product but the user is not admin or manager, return 401', async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next();
            });
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                return res.status(401).json({ error: "Unauthorized user", status: 401 });
            });
            jest.spyOn(ReviewController.prototype, "deleteReviewsOfProduct").mockResolvedValueOnce()

            const response = await request(app)
                .delete(baseURL + '/reviews/testModel/all');

            expect(response.status).toBe(401);
        });
    });

    describe('DELETE /reviews', () => {
        test('should delete all reviews and return 200 status', async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next()
            });
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                return next()
            });
            jest.spyOn(ReviewController.prototype, "deleteAllReviews").mockResolvedValueOnce()

            const response = await request(app).delete(baseURL + '/reviews');
            expect(response.status).toBe(200);
            expect(ReviewController.prototype.deleteAllReviews).toHaveBeenCalled();
        });

        test('should delete all reviews but the user is not logged-in, return 401 status', async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return res.status(401).json({ error: "Unauthenticated user", status: 401 });
            });
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                return next()
            });
            jest.spyOn(ReviewController.prototype, "deleteAllReviews").mockResolvedValueOnce()

            const response = await request(app).delete(baseURL + '/reviews');
            expect(response.status).toBe(401);
        });
        
       test('should delete all reviews but the user is not admin or manager, return 401 status', async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next();
            });
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => {
                return res.status(401).json({ error: "Unauthorized user", status: 401 });
            });
            jest.spyOn(ReviewController.prototype, "deleteAllReviews").mockResolvedValueOnce()

            const response = await request(app).delete(baseURL + '/reviews');
            expect(response.status).toBe(401);
        });
    });
});

// --- Adds a new review by a single customer to a product
//     ---return 404 if `model` does not represent an existing product in the database
//     ---return 409 if there is an existing review for the product made by the customer
//     ---LIST OF TESTs:
//         1. logged customer add review
//         2. no-logged customer add review (MANCA)
//         3. logged customer add review with `model` does not represent an existing prod (MANCA)
//         4. logged customer add review but there is an existing review for the product made by the same customer (MANCA)

// ---Returns all reviews made for a specific product
//     ---LIST OF TESTs:
//         1. no-logged user return all reviews (MANCA)
//         2. logged user return all Reviews

// ---Deletes the review made by the current user for a specific product
//     ---return 404 if `model` does not represent an existing product in the database
//     ---return 404 if the current user does not have a review for the product identified by `model`
//     ---LIST OF TESTs:
//         1. no-logged deletes the review
//         2. logged customer deletes the review 
//         3. logged customer deletes the review with `model` does not represent an existing product in the database (MANCA)
//         4. logged customer deletes the review with the current user does not have a review for the product identified by `model`
// --- Deletes all reviews of all existing products
//     ---LIST OF TESTs:
//         1. no-admin deletes all reviews
//         2. admin deletes all reviews