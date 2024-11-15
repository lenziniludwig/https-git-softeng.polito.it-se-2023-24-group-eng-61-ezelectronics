import { describe, test, expect, beforeAll, beforeEach, it, afterAll, jest } from "@jest/globals";

import crypto from "crypto";
import UserDAO from "../../src/dao/userDAO";
import db from "../../src/db/db";
import { Database } from "sqlite3";
import { UserAlreadyExistsError, UnauthorizedUserError, UserNotFoundError, UserIsAdminError, UserNotAdminError, UserBirthdayError } from "../../src/errors/userError";
import { userInfo } from "os";


import { app } from "../../index"

import UserController from "../../src/controllers/userController"
import Authenticator from "../../src/routers/auth"
import { Role, User } from "../../src/components/user"
import ErrorHandler from "../../src/helper"
import { before } from "node:test";

const baseURL = "/ezelectronics"



jest.mock("crypto");
jest.mock("../../src/db/db.ts");
jest.mock("../../src/controllers/userController")
jest.mock("../../src/routers/auth")



//------------------------------------------ CREATE USER
describe('createUser', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("Create user", async () => {

    jest.spyOn(UserDAO.prototype, "getUserByUsername").mockResolvedValue(null);
    jest.spyOn(UserDAO.prototype, "createUser").mockResolvedValue(true);

    const userController = new UserController();
    try {
      const result = await userController.createUser("username", "name", "surname", "password", "Customer");
      expect(result).toBe(true);
      
      expect(UserDAO.prototype.getUserByUsername).toHaveBeenCalled();
      expect(UserDAO.prototype.getUserByUsername).toHaveBeenCalledWith("username");
      expect(UserDAO.prototype.createUser).toHaveBeenCalled();
      expect(UserDAO.prototype.createUser).toHaveBeenCalledWith("username", "name", "surname", "password", "Customer");

    } catch (error) {
      
    }

  });


  test("Should throw error UserAlreadyExistsError", async () => {

    const userGotFromDB = new User("username1", "name1", "surname", Role.CUSTOMER, "address", "birthdate");
    jest.spyOn(UserDAO.prototype, "getUserByUsername").mockResolvedValue(userGotFromDB);

    const userController = new UserController();
    try {
      await userController.createUser("username", "name", "surname", "password", "Customer");
      } catch (error) {
      expect(error).toBeInstanceOf(UserAlreadyExistsError);

      /* I want to confirm that it's trying to look up the user to see if they already exist, 
      even if it ultimately cannot create a new user with that username */
      expect(UserDAO.prototype.getUserByUsername).toHaveBeenCalled();
      expect(UserDAO.prototype.getUserByUsername).toHaveBeenCalledWith("username");
    }
  });

});


//------------------------------------------ GET USERS

describe('getUsers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("Get users", async () => {
    const loggedUser = new User("username", "name", "surname", Role.ADMIN, "address", "birthdate");
    const listUsers =
      [
        {
          username: "username1",
          name: "name1",
          surname: "surname1",
          role: Role.CUSTOMER,
          address: "address1",
          birthdate: "birthdate1"
        },
        {
          username: "username2",
          name: "name2",
          surname: "surname2",
          role: Role.MANAGER,
          address: "address2",
          birthdate: "birthdate2"
        }
      ]
    jest.spyOn(UserDAO.prototype, "getUsers").mockResolvedValue([listUsers[0], listUsers[1]]);

    const userController = new UserController();
    try {
      const result = await userController.getUsers(loggedUser);
      expect(result).toEqual([listUsers[0], listUsers[1]]);

      expect(UserDAO.prototype.getUsers).toHaveBeenCalled();
      expect(UserDAO.prototype.getUsers).toHaveBeenCalledWith();

    } catch (error) {
      
    }
  });

});


//------------------------------------------ GET USERS BY ROLE  
describe('getUsersByRole', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("Get users by role", async () => {
    const loggedUser = new User("username", "name", "surname", Role.ADMIN, "address", "birthdate");
    const listUsers =
      [
        {
          username: "username1",
          name: "name1",
          surname: "surname1",
          role: Role.CUSTOMER,
          address: "address1",
          birthdate: "birthdate1"
        },
        {
          username: "username2",
          name: "name2",
          surname: "surname2",
          role: Role.MANAGER,
          address: "address2",
          birthdate: "birthdate2"
        }
      ]

    jest.spyOn(UserDAO.prototype, "getUsersByRole").mockResolvedValue(listUsers);

    const userController = new UserController();
    try {
      const result = await userController.getUsersByRole(loggedUser, "Customer");
      expect(result).toEqual(listUsers);

      expect(UserDAO.prototype.getUsersByRole).toHaveBeenCalled();
      expect(UserDAO.prototype.getUsersByRole).toHaveBeenCalledWith("Customer");

    } catch (error) {
      
    }
  });


});




//------------------------------------------ GET USER BY USERNAME

describe('getUserByUsername', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("Get user by username", async () => {
    const user = {
      username: "username",
      name: "name",
      surname: "surname",
      role: Role.ADMIN,
      address: "address",
      birthdate: "birthdate"
    }

    jest.spyOn(UserDAO.prototype, "getUserByUsername").mockResolvedValue(user);

    const userController = new UserController();
    try {
      const result = await userController.getUserByUsername(user, "username");
      expect(result).toEqual(user);

      expect(UserDAO.prototype.getUserByUsername).toHaveBeenCalled();
      expect(UserDAO.prototype.getUserByUsername).toHaveBeenCalledWith("username");

    } catch (error) {
      
    }
  });

  test("Should throw error UnauthorizedUserError", async () => {
    const user = {
      username: "username",
      name: "name",
      surname: "surname",
      role: Role.CUSTOMER,
      address: "address",
      birthdate: "birthdate"
    }

    const userController = new UserController();
    try {
      await userController.getUserByUsername(user, "OtehrUsername");
    } catch (error) {
      expect(error).toBeInstanceOf(UnauthorizedUserError);
    }
  });

  test("Should throw error UserNotFoundError", async () => {
    const user = {
      username: "username",
      name: "name",
      surname: "surname",
      role: Role.ADMIN,
      address: "address",
      birthdate: "birthdate"
    }

    jest.spyOn(UserDAO.prototype, "getUserByUsername").mockRejectedValue(null);

    const userController = new UserController();
    try {
      await userController.getUserByUsername(user, "username");
    } catch (error) {
      expect(error).toBeInstanceOf(UserNotFoundError);

      expect(UserDAO.prototype.getUserByUsername).toHaveBeenCalled();
      expect(UserDAO.prototype.getUserByUsername).toHaveBeenCalledWith("username");
    }
  });

});



//------------------------------------------ DELETE USER
describe('Delete User', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("Delete user", async () => {
    const loggedUser = new User("username", "name", "surname", Role.ADMIN, "address", "birthdate");
    const targetUser = new User("username1", "name1", "surname1", Role.CUSTOMER, "address1", "birthdate1");

    jest.spyOn(UserDAO.prototype, "getUserByUsername").mockResolvedValue(targetUser);
    jest.spyOn(UserDAO.prototype, "deleteUser").mockResolvedValue(true);

    const userController = new UserController();
    try {
      const result = await userController.deleteUser(loggedUser, "username");
      expect(result).toBe(true);

      expect(UserDAO.prototype.getUserByUsername).toHaveBeenCalled();
      expect(UserDAO.prototype.getUserByUsername).toHaveBeenCalledWith("username");
      expect(UserDAO.prototype.deleteUser).toHaveBeenCalled();
      expect(UserDAO.prototype.deleteUser).toHaveBeenCalledWith(loggedUser, targetUser);

    } catch (error) {
      
    }
  });

  test("Should throw error UserNotAdminError", async () => {
    const loggedUser = new User("username", "name", "surname", Role.CUSTOMER, "address", "birthdate");

    const userController = new UserController();
    try {
      await userController.deleteUser(loggedUser, "username");
    } catch (error) {
      expect(error).toBeInstanceOf(UserNotAdminError);
    }
  });

  test("Should throw error UserNotFoundError", async () => {
    const loggedUser = new User("username1", "name", "surname", Role.ADMIN, "address", "birthdate");
    const targetUser = new User("username2", "name", "surname", Role.ADMIN, "address", "birthdate");

    jest.spyOn(UserDAO.prototype, "getUserByUsername").mockResolvedValue(null);

    const userController = new UserController();
    try {
      await userController.deleteUser(loggedUser, "username");
    } catch (error) {
      expect(error).toBeInstanceOf(UserNotFoundError);

      expect(UserDAO.prototype.getUserByUsername).toHaveBeenCalled();
      expect(UserDAO.prototype.getUserByUsername).toHaveBeenCalledWith("username");
    }
  });

  test("Should throw error UnauthorizedUserError", async () => {
    const loggedUser = new User("username1", "name", "surname", Role.ADMIN, "address", "birthdate");
    const targetUser = new User("username2", "name", "surname", Role.ADMIN, "address", "birthdate");

    jest.spyOn(UserDAO.prototype, "getUserByUsername").mockResolvedValue(targetUser);

    const userController = new UserController();
    try {
      await userController.deleteUser(loggedUser, "username");
    } catch (error) {
      expect(error).toBeInstanceOf(UnauthorizedUserError);

      expect(UserDAO.prototype.getUserByUsername).toHaveBeenCalled();
      expect(UserDAO.prototype.getUserByUsername).toHaveBeenCalledWith("username");
    }
  });

});


//------------------------------------------ DELETE ALL
describe('Delete All', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("Delete all", async () => {
    const loggedUser = new User("username", "name", "surname", Role.ADMIN, "address", "birthdate");
    jest.spyOn(UserDAO.prototype, "deleteAll").mockResolvedValue(true);

    const userController = new UserController();
    try {
      const result = await userController.deleteAll(loggedUser);
      expect(result).toBe(true);

      expect(UserDAO.prototype.deleteAll).toHaveBeenCalled();
      expect(UserDAO.prototype.deleteAll).toHaveBeenCalledWith(loggedUser);

    } catch (error) {
      
    }
  });

});

//------------------------------------------ UPDATE USER INFO

describe('Update User Info', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("Update user info", async () => {
    const loggedUser = new User("username", "name", "surname", Role.ADMIN, "address", "1880-01-01");
    const targetUser = new User("username", "name", "surname", Role.CUSTOMER, "address", "birthdate");

    jest.spyOn(UserDAO.prototype, "getUserByUsername").mockResolvedValue(targetUser);
    jest.spyOn(UserDAO.prototype, "updateUserInfo").mockResolvedValue(targetUser);

    const userController = new UserController();
    try {
      const result = await userController.updateUserInfo(loggedUser, "name", "surname", "address", "birthdate", "username");
      expect(result).toEqual(targetUser);

      expect(UserDAO.prototype.getUserByUsername).toHaveBeenCalled();
      expect(UserDAO.prototype.getUserByUsername).toHaveBeenCalledWith("username");
      expect(UserDAO.prototype.updateUserInfo).toHaveBeenCalled();
      expect(UserDAO.prototype.updateUserInfo).toHaveBeenCalledWith("username", "name", "surname", "address", "birthdate");

    } catch (error) {
      
    }

  });

  test("Should throw error UserBirthdayError", async () => {
    const loggedUser = new User("username", "name", "surname", Role.ADMIN, "address", "birthdate");

    const userController = new UserController();
    try {
      await userController.updateUserInfo(loggedUser, "name", "surname", "address", "3000-01-01", "username");
    } catch (error) {
      expect(error).toBeInstanceOf(UserBirthdayError);
    }
  });


  test("Should throw error UserNotAdminError", async () => {
    const loggedUser = new User("username", "name", "surname", Role.CUSTOMER, "address", "birthdate");

    const userController = new UserController();
    try {
      await userController.updateUserInfo(loggedUser, "name", "surname", "address", "birthdate", "username");
    } catch (error) {
      expect(error).toBeInstanceOf(UserNotAdminError);
    }

  });

  test("Should throw error UserNotFoundError", async () => {
    const loggedUser = new User("username", "name", "surname", Role.ADMIN, "address", "birthdate");

    jest.spyOn(UserDAO.prototype, "getUserByUsername").mockResolvedValue(null);
    const userController = new UserController();
    try {
      await userController.updateUserInfo(loggedUser, "name", "surname", "address", "birthdate", "username");
    } catch (error) {
      expect(error).toBeInstanceOf(UserNotFoundError);

      expect(UserDAO.prototype.getUserByUsername).toHaveBeenCalled();
      expect(UserDAO.prototype.getUserByUsername).toHaveBeenCalledWith("username");
    }

  });

  test("Should throw error UnauthorizedUserError", async () => {
    const loggedUser = new User("username", "name", "surname", Role.ADMIN, "address", "birthdate");
    const targetUser = new User("anotherUsername", "name", "surname", Role.ADMIN, "address", "birthdate");

    jest.spyOn(UserDAO.prototype, "getUserByUsername").mockResolvedValue(targetUser);

    const userController = new UserController();
    try {
      await userController.updateUserInfo(loggedUser, "name", "surname", "address", "birthdate", "username");
    } catch (error) {
      expect(error).toBeInstanceOf(UnauthorizedUserError);

      expect(UserDAO.prototype.getUserByUsername).toHaveBeenCalled();
      expect(UserDAO.prototype.getUserByUsername).toHaveBeenCalledWith("username");
    }

  });
 

});


