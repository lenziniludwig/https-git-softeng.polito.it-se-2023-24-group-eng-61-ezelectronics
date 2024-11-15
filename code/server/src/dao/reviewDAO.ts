import db from "../db/db";
import { ProductReview } from "../components/review";
import { ExistingReviewError, NoReviewProductError } from "../errors/reviewError";
import { use } from "passport";

/**
 * A class that implements the interaction with the database for all review-related operations.
 */
class ReviewDAO {
    /**
     * Adds a new review for a product
     * @param model The model of the product to review
     * @param username The username of the user who made the review
     * @param score The score assigned to the product, in the range [1, 5]
     * @param comment The comment made by the user
     * @returns A Promise that resolves to nothing
     */
    addReview(model: string, username: string, score: number, comment: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            const checkSql = "SELECT * FROM reviews WHERE model = ? AND user = ?";
            db.get(checkSql, [model, username], (err: Error | null, row: any) => {
                if (err) reject(err);
                else if (row) reject(new ExistingReviewError());
                else {
                    const date = new Date().toISOString().split('T')[0];
                    const sql = "INSERT INTO reviews (model, user, score, date, comment) VALUES (?, ?, ?, ?, ?)";
                    db.run(sql, [model, username, score, date, comment], (err: Error | null) => {
                        if (err) reject(err);
                        else resolve();
                    });
                }
            });
        });
    }

    /**
     * Returns all reviews for a product
     * @param model The model of the product to get reviews from
     * @returns A Promise that resolves to an array of ProductReview objects
     */
    getProductReviews(model: string): Promise<ProductReview[]> {
        return new Promise<ProductReview[]>((resolve, reject) => {
            const sql = "SELECT * FROM reviews WHERE model = ?";
            db.all(sql, [model], (err: Error | null, rows: any[]) => {
                if (err) {
                    reject(err);
                } else {
                    if (rows.length === 0) {
                        resolve([]);
                    }
                    const reviews = rows.map(row => new ProductReview(row.model, row.user, row.score, row.date, row.comment));
                    resolve(reviews);
                }
            });
        });
    }

    /**
     * Deletes the review made by a user for a product
     * @param model The model of the product to delete the review from
     * @param username The username of the user who made the review to delete
     * @returns A Promise that resolves to nothing
     */
    deleteReview(model: string, username: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            const checkSql = "SELECT * FROM reviews WHERE model = ? AND user = ?";
            db.get(checkSql, [model, username], (err: Error | null, row: any) => {
                if (err) reject(err);
                else if (!row) reject(new NoReviewProductError());
                else {
                    const sql = "DELETE FROM reviews WHERE model = ? AND user = ?";
                    db.run(sql, [model, username], (err: Error | null) => {
                        if (err) reject(err);
                        else resolve();
                    });
                }
            });
        });
    }

    /**
     * Deletes all reviews for a product
     * @param model The model of the product to delete the reviews from
     * @returns A Promise that resolves to nothing
     */
    deleteReviewsOfProduct(model: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            const sql = "DELETE FROM reviews WHERE model = ?";
            db.run(sql, [model], (err: Error | null) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }

    /**
     * Deletes all reviews of all products
     * @returns A Promise that resolves to nothing
     */
    deleteAllReviews(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            const sql = "DELETE FROM reviews";
            db.run(sql, [], (err: Error | null) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }
}

export default ReviewDAO;
