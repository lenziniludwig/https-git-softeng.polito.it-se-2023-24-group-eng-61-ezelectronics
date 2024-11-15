import { User, Role } from "./components/user"
const DATE_ERROR = "Input date is not compatible with the current date"
const INVALID_CREDENTIALS = "Invalid username or password."
const USER_ALREADY_LOGGED_IN = "User is already logged in."

/**
 * Represents a utility class.
 */
class Utility {
    /**
     * Checks if a user is a manager.
     * @param {User} user - The user to check.
     * @returns True if the user is a manager, false otherwise.
     */
    static isManager(user: User): boolean {
        return user.role === Role.MANAGER
    }
    /**
     * Checks if a user is a customer.
     * @param {User} user - The user to check.
     * @returns True if the user is a customer, false otherwise.
     */
    static isCustomer(user: User): boolean {
        return user.role === Role.CUSTOMER
    }

    static isAdmin(user: User): boolean {
        return user.role === Role.ADMIN
    }

}

class DateError extends Error {
    customMessage: string
    customCode: number

    constructor() {
        super()
        this.customMessage = DATE_ERROR
        this.customCode = 400
    }
}

class InvalidCredentialsError extends Error {
    customMessage: string
    customCode: number

    constructor() {
        super()
        this.customMessage = INVALID_CREDENTIALS
        this.customCode = 401
    }
}

class UserAlreadyLoggedInError extends Error {
    customMessage: string
    customCode: number

    constructor() {
        super()
        this.customMessage = USER_ALREADY_LOGGED_IN
        this.customCode = 400
    }

}

export { Utility, DateError, InvalidCredentialsError, UserAlreadyLoggedInError }