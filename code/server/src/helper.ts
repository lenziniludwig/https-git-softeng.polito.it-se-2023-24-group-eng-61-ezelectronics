const { validationResult } = require("express-validator")
import express from "express"
import { UserNotAdminError, UserNotFoundError, UnauthorizedUserError, UserAlreadyExistsError, UserBirthdayError } from "./errors/userError"
import { ProductNotFoundError, LowProductStockError, ProductAlreadyExistsError, EmptyProductStockError } from "./errors/productError"
import { InvalidCredentialsError, DateError } from "./utilities"
import { CartNotFoundError, EmptyCartError, ProductNotInCartError } from "./errors/cartError"
import { NoReviewProductError, ExistingReviewError } from "./errors/reviewError"

/**
 * The ErrorHandler class is used to handle errors in the application.
 */
class ErrorHandler {

    /**
     * Validates the request object and returns an error if the request object is not formatted properly, according to the middlewares used when defining the request.
     * @param req - The request object
     * @param res - The response object
     * @param next - The next function
     * @returns Returns the next function if there are no errors or a response with a status code of 422 if there are errors.
     */
    validateRequest(req: any, res: any, next: any) {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            let error = "The parameters are not formatted properly\n\n"
            errors.array().forEach((e: any) => {
                error += "- Parameter: **" + e.param + "** - Reason: *" + e.msg + "* - Location: *" + e.location + "*\n\n"
            })
            return res.status(422).json({ error: error })
        }
        return next()
    }

    validatefilterRequest(req: any, res: any, next: any) {
        const errors = validationResult(req);
        let error = "The parameters are not formatted properly\n\n";
    
        const { grouping, category, model } = req.query;
        if (grouping === undefined && (category !== undefined || model !== undefined)) {
            error += "Error: If 'grouping' is null, both 'category' and 'model' must also be null.\n\n";
        } else if (grouping === 'category' && (category === undefined || model !== undefined)) {
            error += "Error: If 'grouping' is 'category', 'category' cannot be null and 'model' must be null.\n\n";
        } else if (grouping === 'model' && (model === undefined || category !== undefined)) {
            error += "Error: If 'grouping' is 'model', 'model' cannot be null and 'category' must be null.\n\n";
        }
    
        if (!errors.isEmpty() || error !== "The parameters are not formatted properly\n\n") {
            errors.array().forEach((e: any) => {
                error += "- Parameter: **" + e.param + "** - Reason: *" + e.msg + "* - Location: *" + e.location + "*\n\n";
            });
            return res.status(422).json({ error: error });
        }
    
        return next();
    }

    /**
     * Registers the error handler.
     * @param router - The router object
     */
    static registerErrorHandler(router: express.Application) {
        router.use((err: any, req: any, res: any, next: any) => {
            if (err instanceof InvalidCredentialsError ||
                err instanceof UserNotFoundError ||
                err instanceof UserNotAdminError ||
                err instanceof UnauthorizedUserError ||
                err instanceof UserAlreadyExistsError ||
                err instanceof UserBirthdayError ||
                err instanceof ProductNotFoundError ||
                err instanceof LowProductStockError ||
                err instanceof ProductAlreadyExistsError ||
                err instanceof CartNotFoundError ||
                err instanceof EmptyProductStockError ||
                err instanceof EmptyCartError ||
                err instanceof ProductNotInCartError ||
                err instanceof DateError ||
                err instanceof NoReviewProductError ||
                err instanceof ExistingReviewError) {
                return res.status(err.customCode).json({ error: err.customMessage });
            }
            console.error("Unhandled error:", err);
            return res.status(err.customCode || 503).json({
                error: err.customMessage || "Internal Server Error",
                status: err.customCode || 503
            });
        })
    }
}

export default ErrorHandler