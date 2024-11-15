import {
  describe,
  test,
  expect,
  beforeAll,
  afterAll,
  jest,
} from "@jest/globals";
import { Role, User } from "../../src/components/user";
import UserDAO from "../../src/dao/userDAO";
import crypto from "crypto";
import db from "../../src/db/db";
import { Database } from "sqlite3";

// Mocking the dependencies
jest.mock("crypto");
jest.mock("../../src/db/db.ts");

// createUser
test("It should resolve true", async () => {
  const userDAO = new UserDAO();
  const mockDBRun = jest
    .spyOn(db, "run")
    .mockImplementation((sql, params, callback) => {
      callback(null);
      return {} as Database;
    });
  const mockRandomBytes = jest
    .spyOn(crypto, "randomBytes")
    .mockImplementation((size) => {
      return Buffer.from("salt");
    });
  const mockScrypt = jest
    .spyOn(crypto, "scrypt")
    .mockImplementation(async (password, salt, keylen) => {
      return Buffer.from("hashedPassword");
    });
  const result = await userDAO.createUser(
    "username",
    "name",
    "surname",
    "password",
    "role"
  );
  expect(result).toBe(true);
  mockRandomBytes.mockRestore();
  mockDBRun.mockRestore();
  mockScrypt.mockRestore();
});

// getUsers

test("It should return an array of users", async () => {
  const userDAO = new UserDAO();
  const mockRows = [
    {
      username: "user1",
      name: "John",
      surname: "Doe",
      role: "Customer",
      address: "123 Main St",
      birthdate: "1990-01-01",
    },
    {
      username: "user2",
      name: "Jane",
      surname: "Doe",
      role: "Manager",
      address: "456 Elm St",
      birthdate: "1985-05-05",
    },
  ];
  const mockDBAll = jest
    .spyOn(db, "all")
    .mockImplementation((sql, params, callback) => {
      callback(null, mockRows);
      return {} as Database;
    });

  const result = await userDAO.getUsers();

  expect(result).toEqual([
    new User(
      "user1",
      "John",
      "Doe",
      Role.CUSTOMER,
      "123 Main St",
      "1990-01-01"
    ),
    new User("user2", "Jane", "Doe", Role.MANAGER, "456 Elm St", "1985-05-05"),
  ]);

  mockDBAll.mockRestore();
});

// getUsersByRole
test("It should return an array of users with the specified role", async () => {
  const userDAO = new UserDAO();
  const mockRows = [
    {
      username: "user1",
      name: "John",
      surname: "Doe",
      role: "Customer",
      address: "123 Main St",
      birthdate: "1990-01-01",
    },
    {
      username: "user2",
      name: "Jane",
      surname: "Doe",
      role: "Customer",
      address: "456 Elm St",
      birthdate: "1985-05-05",
    },
  ];
  const mockDBAll = jest
    .spyOn(db, "all")
    .mockImplementation((sql, params, callback) => {
      callback(null, mockRows);
      return {} as Database;
    });

  const result = await userDAO.getUsersByRole("Customer");

  expect(result).toEqual([
    new User(
      "user1",
      "John",
      "Doe",
      Role.CUSTOMER,
      "123 Main St",
      "1990-01-01"
    ),
    new User("user2", "Jane", "Doe", Role.CUSTOMER, "456 Elm St", "1985-05-05"),
  ]);

  mockDBAll.mockRestore();
});

// getUserByUsername a

test("It should return the user with the specified username", async () => {
  const userDAO = new UserDAO();
  const mockRow = {
    username: "user1",
    name: "John",
    surname: "Doe",
    role: "Customer",
    address: "123 Main St",
    birthdate: "1990-01-01",
  };
  const mockDBGet = jest
    .spyOn(db, "get")
    .mockImplementation((sql, params, callback) => {
      callback(null, mockRow);
      return {} as Database;
    });

  const result = await userDAO.getUserByUsername("user1");

  expect(result).toEqual(
    new User("user1", "John", "Doe", Role.CUSTOMER, "123 Main St", "1990-01-01")
  );

  mockDBGet.mockRestore();
});

// getUserByUsername b

test("It should return null if the user does not exist", async () => {
  const userDAO = new UserDAO();
  const mockDBGet = jest
    .spyOn(db, "get")
    .mockImplementation((sql, params, callback) => {
      callback(null, null);
      return {} as Database;
    });

  const result = await userDAO.getUserByUsername("nonexistentUser");

  expect(result).toBeNull();

  mockDBGet.mockRestore();
});

// updateUserInfo

test("It should update user info and resolve to the updated user", async () => {
  // Mocking the database run function
  const mockDBRun = jest
    .spyOn(db, "run")
    .mockImplementation((sql, params, callback) => {
      callback(null);
      return {} as Database;
    });

  // Mocking getUserByUsername method to return a predefined user
  const mockGetUserByUsername = jest
    .spyOn(UserDAO.prototype, "getUserByUsername")
    .mockResolvedValueOnce({
      username: "username",
      name: "newName",
      surname: "newSurname",
      address: "newAddress",
      birthdate: "newBirthdate",
      role: Role.CUSTOMER,
    });

  const userDAO = new UserDAO();

  // Calling the method to update user info
  const updatedUser = await userDAO.updateUserInfo(
    "username",
    "newName",
    "newSurname",
    "newAddress",
    "newBirthdate"
  );

  // Expectations
  expect(updatedUser.username).toBe("username");
  expect(updatedUser.name).toBe("newName");
  expect(updatedUser.surname).toBe("newSurname");
  expect(updatedUser.address).toBe("newAddress");
  expect(updatedUser.birthdate).toBe("newBirthdate");

  // Restore mocked functions
  mockDBRun.mockRestore();
  mockGetUserByUsername.mockRestore();
});

// deletes

describe("UserDAO", () => {
  describe("deleteUser", () => {
    test("It should resolve true when the user is successfully deleted by an admin", async () => {
      const userDAO = new UserDAO();

      const mockDeleteUserCarts = jest
        .spyOn(userDAO as any, "deleteUserCarts")
        .mockResolvedValue(undefined);
      const mockDeleteUserReviews = jest
        .spyOn(userDAO as any, "deleteUserReviews")
        .mockResolvedValue(undefined);
      const mockDBRun = jest
        .spyOn(db, "run")
        .mockImplementation(
          (
            sql: string,
            params: any[],
            callback: (err: Error | null) => void
          ) => {
            callback(null);
            return {} as any;
          }
        );

      const deleter = new User("admin", "Admin", "Admin", Role.ADMIN, "", "");
      const user = new User(
        "user1",
        "name1",
        "surname1",
        Role.CUSTOMER,
        "address1",
        "1990-01-01"
      );

      await expect(userDAO.deleteUser(deleter, user)).resolves.toBe(true);

      mockDeleteUserCarts.mockRestore();
      mockDeleteUserReviews.mockRestore();
      mockDBRun.mockRestore();
    });

    test("It should reject with an error when the database query fails", async () => {
      const userDAO = new UserDAO();

      const mockDeleteUserCarts = jest
        .spyOn(userDAO as any, "deleteUserCarts")
        .mockResolvedValue(undefined);
      const mockDeleteUserReviews = jest
        .spyOn(userDAO as any, "deleteUserReviews")
        .mockResolvedValue(undefined);
      const mockDBRun = jest
        .spyOn(db, "run")
        .mockImplementation(
          (
            sql: string,
            params: any[],
            callback: (err: Error | null) => void
          ) => {
            callback(new Error("Database error"));
            return {} as any;
          }
        );

      const deleter = new User("admin", "Admin", "Admin", Role.ADMIN, "", "");
      const user = new User(
        "user1",
        "name1",
        "surname1",
        Role.CUSTOMER,
        "address1",
        "1990-01-01"
      );

      await expect(userDAO.deleteUser(deleter, user)).rejects.toThrow(
        "Database error"
      );

      mockDeleteUserCarts.mockRestore();
      mockDeleteUserReviews.mockRestore();
      mockDBRun.mockRestore();
    });
  });

  describe("deleteAll", () => {
    const userDAO = new UserDAO();

    test("It should resolve true when all non-admin users are successfully deleted", async () => {
      const mockDeleteUserCarts = jest
        .spyOn(userDAO as any, "deleteUserCarts")
        .mockResolvedValue(undefined);
      const mockDeleteUserReviews = jest
        .spyOn(userDAO as any, "deleteUserReviews")
        .mockResolvedValue(undefined);
      const mockDBAll = jest
        .spyOn(db, "all")
        .mockImplementation(
          (sql: string, callback: (err: Error | null, rows: any[]) => void) => {
            callback(null, [{ username: "user1" }, { username: "user2" }]);
            return {} as Database;
          }
        );
      const mockDBRun = jest
        .spyOn(db, "run")
        .mockImplementation(
          (sql: string, callback: (err: Error | null) => void) => {
            callback(null);
            return {} as Database;
          }
        );

      await expect(userDAO.deleteAll()).resolves.toBe(true);

      mockDeleteUserCarts.mockRestore();
      mockDeleteUserReviews.mockRestore();
      mockDBAll.mockRestore();
      mockDBRun.mockRestore();
    });
  });
});
