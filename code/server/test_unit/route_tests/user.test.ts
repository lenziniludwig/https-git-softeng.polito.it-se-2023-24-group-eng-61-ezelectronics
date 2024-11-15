import { describe, test, expect, jest, beforeAll, beforeEach, afterAll, afterEach } from "@jest/globals"
import request from 'supertest'
import { app } from "../../index"

import { cleanup } from "../../src/db/cleanup"

import { Role, User } from "../../src/components/user"

import UserController from "../../src/controllers/userController"

import ErrorHandler from "../../src/helper"

import Authenticator from "../../src/routers/auth"

const baseURL = "/ezelectronics"

jest.mock("../../src/controllers/userController")
jest.mock("../../src/routers/auth")

let testAdmin = new User("admin", "admin", "admin", Role.ADMIN, "", "")
let testCustomer = new User("customer", "customer", "customer", Role.CUSTOMER, "", "")

// beforeAll(async () => {
//     // await postUser(testAdmin)
//     // const adminResponse = await request(app).post(baseURL + '/sessions').send({ username: "admin", password: "admin" });
//     // const customerResponse = await request(app).post(baseURL + '/sessions').send({ username: "admin", password: "admin" });
//     // const managerResponse = await request(app).post(baseURL + '/sessions').send({ username: "admin", password: "admin" });
//     // const adminSessionId = adminResponse.headers["set-cookie"];
//     // const customerSessionId = customerResponse.headers["set-cookie"];
//     // const managerSessionId = managerResponse.headers["set-cookie"];

// });

afterEach(async () => {
    jest.clearAllMocks();
});

describe("Route unit tests", () => {

    describe("POST /users", () => {
        //We are testing a route that creates a user. This route calls the createUser method of the UserController, uses the express-validator 'body' method to validate the input parameters and the ErrorHandler to validate the request
        //All of these dependencies are mocked to test the route in isolation
        //For the success case, we expect that the dependencies all work correctly and the route returns a 200 success code
        test("It should return a 200 success code", async () => {
            const inputUser = { username: "test", name: "test", surname: "test", password: "test", role: "Manager" }
            //We mock the ErrorHandler validateRequest method to return the next function, because we are not testing the validation logic here (we assume it works correctly)
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return next()
            })
            //We mock the UserController createUser method to return true, because we are not testing the UserController logic here (we assume it works correctly)
            jest.spyOn(UserController.prototype, "createUser").mockResolvedValueOnce(true)

            // We send a request to the route we are testing. We are in a situation where:
            //     - The input parameters are 'valid' (= the validation logic is mocked to be correct)
            //     - The user creation function is 'successful' (= the UserController logic is mocked to be correct)
            //   We expect the 'createUser' function to have been called with the input parameters and to return a 200 success code
            //   Since we mock the dependencies and we are testing the route in isolation, we do not need to check that the user has actually been created

            const response = await request(app).post(baseURL + "/users").send(inputUser)
            expect(response.status).toBe(200)
            expect(UserController.prototype.createUser).toHaveBeenCalled()
            expect(UserController.prototype.createUser).toHaveBeenCalledWith(inputUser.username, inputUser.name, inputUser.surname, inputUser.password, inputUser.role)
        })

        test("It should return a 422 error code validation error", async () => {
            const inputUser = { username: "", name: "test", surname: "test", password: "test", role: "Manager" }
            jest.spyOn(UserController.prototype, "createUser").mockResolvedValueOnce(false)

            const response = await request(app).post(baseURL + "/users").send(inputUser)
            expect(response.status).toBe(422)
        })

    })

    describe("GET /users", () => {
        test("It returns an array of users", async () => {

            const user1 = new User("usernameLU", "nameLU", "surnameLU", Role.CUSTOMER, "user", "user");
            const user2 = new User("usernameLC", "nameLC", "surnameLC", Role.CUSTOMER, "user", "user");
            //The route we are testing calls the getUsers method of the UserController and the isAdmin method of the Authenticator
            //We mock the 'getUsers' method to return an array of users, because we are not testing the UserC
            jest.spyOn(UserController.prototype, "getUsers").mockResolvedValueOnce([user1, user2])
            //We mock the 'isAdmin' method to return the next function, because we are not testing the Authenticator logic here (we assume it works correctly)
            jest.spyOn(Authenticator.prototype, "isAdmin").mockImplementation((req, res, next) => {
                return next();
            })
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next();
            })

            //We send a request to the route we are testing. We are in a situation where:
            //  - The user is an Admin (= the Authenticator logic is mocked to be correct)
            //  - The getUsers function returns an array of users (= the UserController logic is mocked to be correct)
            //We expect the 'getUsers' function to have been called, the route to return a 200 success code and the expected array
            const response = await request(app).get(baseURL + "/users")
            expect(response.status).toBe(200)
            expect(UserController.prototype.getUsers).toHaveBeenCalled()
            expect(response.body).toEqual([user1, user2])
        })

        test("It should fail if the user is not an Admin", async () => {
            //In this case, we are testing the situation where the route returns an error code because the user is not an Admin
            //We mock the 'isAdmin' method to return a 401 error code, because we are not testing the Authenticator logic here (we assume it works correctly)
            //jest.spyOn(UserController.prototype, "getUsers").mockResolvedValueOnce([testAdmin, testCustomer])

            jest.spyOn(Authenticator.prototype, "isAdmin").mockImplementation((req, res, next) => {
                return res.status(401).json({ error: "User is not an admin", status: 401 })
                // return next();
            })
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next();
            })

            //By calling the route with this mocked dependency, we expect the route to return a 401 error code
            const response = await request(app).get(baseURL + "/users")
            expect(response.status).toBe(401)
        })

        test("It should fail if the user is not logged-in", async () => {
            //In this case, we are testing the situation where the route returns an error code because the user is not an Admin
            //We mock the 'isAdmin' method to return a 401 error code, because we are not testing the Authenticator logic here (we assume it works correctly)
            //jest.spyOn(UserController.prototype, "getUsers").mockResolvedValueOnce([testAdmin, testCustomer])

            jest.spyOn(Authenticator.prototype, "isAdmin").mockImplementation((req, res, next) => {
                return next();
            })
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return res.status(401).json({ error: "User is not an admin", status: 401 });
            })

            //By calling the route with this mocked dependency, we expect the route to return a 401 error code
            const response = await request(app).get(baseURL + "/users")
            expect(response.status).toBe(401);
        })
    })

    describe("GET /users/roles/:role", () => {

        test("It returns an array of users with a specific role, return 200", async () => {

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next();
            });
            jest.spyOn(Authenticator.prototype, "isAdmin").mockImplementation((req, res, next) => {
                return next();
            });
            const user1 = new User("usernameLU", "nameLU", "surnameLU", Role.CUSTOMER, "", "");
            const user2 = new User("usernameLC", "nameLC", "surnameLC", Role.CUSTOMER, "", "");
            jest.spyOn(UserController.prototype, "getUsersByRole").mockResolvedValueOnce([user1, user2]);

            const response = await request(app).get(baseURL + "/users/roles/Customer");
            expect(response.status).toBe(200);
            // expect(UserController.prototype.getUsersByRole).toHaveBeenCalled();
            expect(response.body).toEqual([user1, user2]);
        })

        test("It should fail if the role is not valid, return 422", async () => {
            //In this case we are testing a scenario where the role parameter is not among the three allowed ones
            //We need the 'isAdmin' method to return the next function, because the route checks if the user is an Admin before validating the role
            jest.spyOn(Authenticator.prototype, "isAdmin").mockImplementation((req, res, next) => {
                return next();
            })
            //We mock the 'param' method of the express-validator to throw an error, because we are not testing the validation logic here (we assume it works correctly)
            jest.mock('express-validator', () => ({
                param: jest.fn().mockImplementation(() => {
                    throw new Error("Invalid value");
                }),
            }));
            //We mock the 'validateRequest' method to receive an error and return a 422 error code, because we are not testing the validation logic here (we assume it works correctly)
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return res.status(422).json({ error: "The parameters are not formatted properly" });
            })
            //We call the route with dependencies mocked to simulate an error scenario, and expect a 422 code
            const response = await request(app).get(baseURL + "/users/roles/Invalid")
            expect(response.status).toBe(422)
        })

        test("It should fail if the user is not logged-in, return 401", async () => {
            //In this case, we are testing the situation where the route returns an error code because the user is not an Admin
            //We mock the 'isAdmin' method to return a 401 error code, because we are not testing the Authenticator logic here (we assume it works correctly)
            //jest.spyOn(UserController.prototype, "getUsers").mockResolvedValueOnce([testAdmin, testCustomer])

            jest.spyOn(Authenticator.prototype, "isAdmin").mockImplementation((req, res, next) => {
                return next();
            })
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return res.status(401).json({ error: "User is not an admin", status: 401 });
            })

            //By calling the route with this mocked dependency, we expect the route to return a 401 error code
            const response = await request(app).get(baseURL + "/users/roles/Customer")
            expect(response.status).toBe(401);
        })

        test("It should fail if the user is not admin, return 401", async () => {
            //In this case, we are testing the situation where the route returns an error code because the user is not an Admin
            //We mock the 'isAdmin' method to return a 401 error code, because we are not testing the Authenticator logic here (we assume it works correctly)
            //jest.spyOn(UserController.prototype, "getUsers").mockResolvedValueOnce([testAdmin, testCustomer])

            jest.spyOn(Authenticator.prototype, "isAdmin").mockImplementation((req, res, next) => {
                return res.status(401).json({ error: "User is not an admin", status: 401 })
            })
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next();
            })

            //By calling the route with this mocked dependency, we expect the route to return a 401 error code
            const response = await request(app).get(baseURL + "/users/roles/Customer")
            expect(response.status).toBe(401);
        })
    })

    describe("GET /users/:username", () => {
        test("It returns a users with a specific username, return 200", async () => {
            const user = new User("usernameLU", "nameLU", "surnameLU", Role.CUSTOMER, "", "");
            jest.spyOn(UserController.prototype, "getUserByUsername").mockResolvedValueOnce(user);
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next();
            });

            const response = await request(app).get(baseURL + "/users/usernameLU");
            expect(response.status).toBe(200);
            expect(response.body).toEqual(user);
        })

        test("It returns a users with a specific username but the user is not legged-in, return 401", async () => {
            const user = new User("usernameLU", "nameLU", "surnameLU", Role.CUSTOMER, "", "");
            jest.spyOn(UserController.prototype, "getUserByUsername").mockResolvedValueOnce(user);
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return res.status(401).json({ error: "User is not an admin", status: 401 })
            });

            const response = await request(app).get(baseURL + "/users/usernameLU");
            expect(response.status).toBe(401);
        })

        // test("It should fail if the username is not valid, return 422", async () => {
        //     //In this case we are testing a scenario where the role parameter is not among the three allowed ones
        //     //We need the 'isAdmin' method to return the next function, because the route checks if the user is an Admin before validating the role
        //     jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
        //         return next();
        //     })
        //     //We mock the 'param' method of the express-validator to throw an error, because we are not testing the validation logic here (we assume it works correctly)
        //     jest.mock('express-validator', () => ({
        //         param: jest.fn().mockImplementation(() => {
        //             throw new Error("Invalid value");
        //         }),
        //     }));
        //     //We mock the 'validateRequest' method to receive an error and return a 422 error code, because we are not testing the validation logic here (we assume it works correctly)
        //     jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
        //         return res.status(422).json({ error: "The parameters are not formatted properly" });
        //     })
        //     //We call the route with dependencies mocked to simulate an error scenario, and expect a 422 code
        //     const response = await request(app).get(baseURL + `/users/${null}`)
        //     expect(response.status).toBe(422)
        // })
    })

    describe("DELETE /users/:username", () => {
        test("It deletes a single user", async () => {
            jest.spyOn(UserController.prototype, "deleteUser").mockResolvedValueOnce(true);
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next();
            });
            jest.spyOn(Authenticator.prototype, "isAdmin").mockImplementation((req, res, next) => {
                return next();
            });
            const response = await request(app).delete(baseURL + "/users/test");
            expect(response.status).toBe(200);
        })

        test("It deletes a single user is not logged-in, return 401", async () => {
            jest.spyOn(UserController.prototype, "deleteUser").mockResolvedValueOnce(true);
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return res.status(401).json({ error: "User is not an admin", status: 401 })
            });
            const response = await request(app).delete(baseURL + "/users/test");
            expect(response.status).toBe(401);
        })

        // test("It should fail if the username is not valid, return 422", async () => {
        //     //In this case we are testing a scenario where the role parameter is not among the three allowed ones
        //     //We need the 'isAdmin' method to return the next function, because the route checks if the user is an Admin before validating the role
        //     jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
        //         return next();
        //     })
        //     //We mock the 'param' method of the express-validator to throw an error, because we are not testing the validation logic here (we assume it works correctly)
        //     jest.mock('express-validator', () => ({
        //         param: jest.fn().mockImplementation(() => {
        //             throw new Error("Invalid value");
        //         }),
        //     }));
        //     //We mock the 'validateRequest' method to receive an error and return a 422 error code, because we are not testing the validation logic here (we assume it works correctly)
        //     jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
        //         return res.status(422).json({ error: "The parameters are not formatted properly" });
        //     })
        //     //We call the route with dependencies mocked to simulate an error scenario, and expect a 422 code
        //     const response = await request(app).delete(baseURL + "/users/" + 1234)
        //     expect(response.status).toBe(422)
        // })
    })

    describe("DELETE /users", () => {

        test("It deletes all users", async () => {
            jest.spyOn(UserController.prototype, "deleteAll").mockResolvedValueOnce(true);

            jest.spyOn(Authenticator.prototype, "isAdmin").mockImplementation((req, res, next) => {
                return next();
            })
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
               return next();
            });
            const response = await request(app).delete(baseURL + "/users")
            expect(response.status).toBe(200)
        })

        test("It deletes all users without admin permission, return 401", async () => {
            jest.spyOn(UserController.prototype, "deleteAll").mockResolvedValueOnce(true);
            jest.spyOn(Authenticator.prototype, "isAdmin").mockImplementation((req, res, next) => {
                return res.status(401).json({ error: "User is not an admin", status: 401 })
            })
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next();
            })
            const response = await request(app).delete(baseURL + "/users")
            expect(response.status).toBe(401)
        })

        test("It deletes all users with the no logged-in user, return 401", async () => {
            jest.spyOn(UserController.prototype, "deleteAll").mockResolvedValueOnce(true);
            jest.spyOn(Authenticator.prototype, "isAdmin").mockImplementation((req, res, next) => {
                return next();
            })
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return res.status(401).json({ error: "User is not an admin", status: 401})
            })
            const response = await request(app).delete(baseURL + "/users")
            expect(response.status).toBe(401)
        })
    })

    describe("PATCH /users/:username", () => {
            test("It updates the personal information of a single user, return 200", async () => {
           
                const updatedUser = {
                    username: "test",
                    name: "updatedName",
                    surname: "updatedSurname",
                    address: "updatedAddress",
                    role: Role.CUSTOMER,
                    birthdate: "2020-01-01"
                };
    
                jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                    return next()
                })
    
                jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                    return next()
                })
    
                jest.spyOn(UserController.prototype, "updateUserInfo").mockResolvedValueOnce(updatedUser);
    
                const response = await request(app).patch(`${baseURL}/users/test`).send({name: updatedUser.name, surname: updatedUser.surname, address: updatedUser.address, birthdate: updatedUser.birthdate})
    
                expect(response.status).toBe(200);
                expect(response.body).toEqual(updatedUser);
                expect(UserController.prototype.updateUserInfo).toHaveBeenCalledWith(undefined,updatedUser.name,updatedUser.surname,updatedUser.address,updatedUser.birthdate,updatedUser.username);
            });
    
            test("It updates the personal information of a single user with missed inforation, return 422", async () => {
               
                const updatedUser = {
                    username: "test",
                    name: "updatedName",
                    surname: "updatedSurname",
                    address: "updatedAddress",
                    role: Role.CUSTOMER,
                    birthdate: "2020-01-01"
                };
    
                jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                    return next()
                })
    
                jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                    return next()
                })
    
                jest.spyOn(UserController.prototype, "updateUserInfo").mockResolvedValueOnce(updatedUser);
    
                const response = await request(app).patch(`${baseURL}/users/test`).send({name: null, surname: updatedUser.surname, address: updatedUser.address, birthdate: updatedUser.birthdate})
    
                expect(response.status).toBe(422);
            });

            test("It updates the personal information of a single user but user is non-logged in, return 401", async () => {
               
                const updatedUser = {
                    username: "test",
                    name: "updatedName",
                    surname: "updatedSurname",
                    address: "updatedAddress",
                    role: Role.CUSTOMER,
                    birthdate: "2020-01-01"
                };
    
                jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                    return next()
                })
    
                jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                    return res.status(401).json({ error: "User is not an admin", status: 401 })
                })
    
                jest.spyOn(UserController.prototype, "updateUserInfo").mockResolvedValueOnce(updatedUser);
    
                const response = await request(app).patch(`${baseURL}/users/test`).send({name: updatedUser.name, surname: updatedUser.surname, address: updatedUser.address, birthdate: updatedUser.birthdate})
    
                expect(response.status).toBe(401);
            });
        });
});


// manca aggiornare dati per username e tornare ruolo per username 


// // // --- GET THE LIST OF ALL USERS ---
// // // --- GET LIST OF ALL USERS WITH A SPECIFIC ROLE ---
// // //       ---LIST OF TESTs:
// // //          1. call like customer
// // //          2. call like Admin
// // // --- RETURN A SINGLE USER WITH A SPECIFIC USERNAME ---
// // //       --- RETURN 404 IF THE user that does not exist in the database
// // //       --- RETURN 401 IF USERNAME is not equal to the username of the logged user calling the route and the user calling the route is not an Admin
// // //      --- lIST OF TESTs:
// // //          1. return hitself
// // //          2. return username like a customer
// // //          3. return username like a admin

// // //--- DELETE A SPECIFIC USER (Admins can delete any non-Admin user but not another admin / each user can delete themselves)
// // //      --- RETURN 404 if the username doesn't exist in database
// // //      --- RETURN 401 if the username is not equal to the username of the logged user calling the route, and the user calling the route is not an Admin
// // //      --- RETURN 401 if the user is a Admin and username rappresent another admin
// // //      --- LIST OF TESTs:
// // //          1. delete an no existing username
// // //          2. Admin delete an Admin
// // //          3. Admin delete a user
// // //          4. delete themselves
// // //--- DELETE ALL NON-ADMIN USERS
// // //--- Updates the personal information of a single user
// // //      ---RETURN 404 `username` represents a user that does not exist
// // //      ---RETURN 401 `username` does not correspond to the username of the logged in user
// // //      ---RETURN 400 `birthdate` is after the current date
// // //      ---RETURN 401 `username` is not equal to the username of the logged user calling the route, and the user calling the route is not an Admin
// // //      --- LIST OF TESTs:
// // //          1. update some personal information of logged user
// // //          2. update some personal information of another user without Admin privilege
// // //          3. update some personal iformation of a user that doesn't exist
// // //          4. update some personal information of a user with Admin privilage
// // //          5. update birthday with value after the current date
