import e from "express";
import { User } from "../components/user";
import UserDAO from "../dao/userDAO";
import { UserAlreadyExistsError, UserNotAdminError, UserNotFoundError, UnauthorizedUserError, UserIsAdminError, UserBirthdayError } from "../errors/userError";

/**
 * Represents a controller for managing users.
 * All methods of this class must interact with the corresponding DAO class to retrieve or store data.
 */
class UserController {
  private dao: UserDAO;

  constructor() {
    this.dao = new UserDAO();
  }

  /**
   * Creates a new user.
   * @param username - The username of the new user. It must not be null and it must not be already taken.
   * @param name - The name of the new user. It must not be null.
   * @param surname - The surname of the new user. It must not be null.
   * @param password - The password of the new user. It must not be null.
   * @param role - The role of the new user. It must not be null and it can only be one of the three allowed types ("Manager", "Customer", "Admin")
   * @returns A Promise that resolves to true if the user has been created.
   */
  async createUser(username: string, name: string, surname: string, password: string, role: string): Promise<boolean> {
    const user = await this.dao.getUserByUsername(username);
    if (user) {
      throw new UserAlreadyExistsError();
    }
    return await this.dao.createUser(username, name, surname, password, role);
  }

  /**
   * Returns all users.
   * @returns A Promise that resolves to an array of users.
   */
  async getUsers(loggedUser: User): Promise<User[]> {
    return await this.dao.getUsers();
  }

  /**
   * Returns all users with a specific role.
   * @param role - The role of the users to retrieve. It can only be one of the three allowed types ("Manager", "Customer", "Admin")
   * @returns A Promise that resolves to an array of users with the specified role.
   */
  async getUsersByRole(loggedUser: User, role: string): Promise<User[]> {
    return await this.dao.getUsersByRole(role);
  }

  /**
   * Returns a specific user.
   * The function has different behavior depending on the role of the user calling it:
   * - Admins can retrieve any user
   * - Other roles can only retrieve their own information
   * @param username - The username of the user to retrieve. The user must exist.
   * @returns A Promise that resolves to the user with the specified username.
   */
  async getUserByUsername(loggedUser: User, username: string): Promise<User> {
    if (loggedUser.role !== "Admin" && loggedUser.username !== username) {
      throw new UnauthorizedUserError();
    }
    const user = await this.dao.getUserByUsername(username);
    if(!user) {
      throw new UserNotFoundError();
    }

    return user;
  }

  /**
   * Deletes a specific user
   * The function has different behavior depending on the role of the user calling it:
   * - Admins can delete any non-Admin user
   * - Other roles can only delete their own account
   * @param username - The username of the user to delete. The user must exist.
   * @returns A Promise that resolves to true if the user has been deleted.
   */
  async deleteUser(loggedUser: User, username: string): Promise<boolean> {
    if (loggedUser.role !== "Admin" && loggedUser.username !== username) {
      throw new UserNotAdminError();
    }

    const targetUser = await this.dao.getUserByUsername(username);
    if (!targetUser) {
      throw new UserNotFoundError();
    }
    if (loggedUser.role === "Admin" && targetUser.role === "Admin" && loggedUser.username !== username) {
      throw new UnauthorizedUserError();
    }

    return await this.dao.deleteUser(loggedUser, targetUser);
  }

  /**
   * Deletes all non-Admin users
   * @returns A Promise that resolves to true if all non-Admin users have been deleted.
   */
  async deleteAll(loggedUser: User): Promise<boolean> {
    return await this.dao.deleteAll();
  }

  /**
   * Updates the personal information of one user. The user can only update their own information.
   * @param user The user who wants to update their information
   * @param name The new name of the user
   * @param surname The new surname of the user
   * @param address The new address of the user
   * @param birthdate The new birthdate of the user
   * @param username The username of the user to update. It must be equal to the username of the user parameter.
   * @returns A Promise that resolves to the updated user
   */
  async updateUserInfo(loggedUser: User, name: string, surname: string, address: string, birthdate: string, username: string): Promise<User> {
    if (new Date(birthdate) > new Date()) {
      throw new UserBirthdayError();
    }
    if (loggedUser.role !== "Admin" && loggedUser.username !== username) {
      throw new UserNotAdminError();
    }

    const targetUser = await this.dao.getUserByUsername(username);
    if (!targetUser) {
      throw new UserNotFoundError();
    }
    if (loggedUser.role === "Admin" && targetUser.role === "Admin" && loggedUser.username !== username) {
      throw new UnauthorizedUserError();
    }
    return await this.dao.updateUserInfo(username, name, surname, address, birthdate);
  }
}

export default UserController;
