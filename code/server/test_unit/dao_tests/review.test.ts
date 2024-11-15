import db from "../../src/db/db";
import { ProductReview } from "../../src/components/review";
import ReviewDAO from "../../src/dao/reviewDAO";
import { ExistingReviewError, NoReviewProductError } from "../../src/errors/reviewError";
import { describe, test, expect, beforeAll, beforeEach, it, afterEach, afterAll, jest} from "@jest/globals";

jest.mock("../../src/db/db.ts");

describe("ReviewDAO", () => {
  let reviewDAO: ReviewDAO;

  beforeEach(() => {
    reviewDAO = new ReviewDAO();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("addReview", () => {
    // Test for successfully adding a review
    test("should add a new review successfully", async () => {
      const getMock = jest.spyOn(db, "get");
      const runMock = jest.spyOn(db, "run");

      getMock.mockImplementation((sql, params, callback) => 
        callback(null, null));

      runMock.mockImplementation((sql, params, callback) => 
        callback(null));

      await expect(
        reviewDAO.addReview("Model123", "user1", 5, "Great product!")
      ).resolves.toBeUndefined();

      expect(getMock).toHaveBeenCalledTimes(1);
      expect(getMock).toHaveBeenCalledWith(
        "SELECT * FROM reviews WHERE model = ? AND user = ?",
        ["Model123", "user1"],
        expect.any(Function)
      );

      expect(runMock).toHaveBeenCalledTimes(1);
      expect(runMock).toHaveBeenCalledWith(
        "INSERT INTO reviews (model, user, score, date, comment) VALUES (?, ?, ?, ?, ?)",
        [
          "Model123",
          "user1",
          5,
          expect.any(String), // The date
          "Great product!",
        ],
        expect.any(Function)
      );
    });

    // Test for handling existing reviews
    test("should handle existing reviews gracefully", async () => {
      const getMock = jest.spyOn(db, "get");

      getMock.mockImplementation((sql, params, callback) => 
        callback(null, {}) // Existing review found
      );

      await expect(
        reviewDAO.addReview("Model123", "user1", 5, "Great product!")
      ).rejects.toThrow(ExistingReviewError);

      expect(getMock).toHaveBeenCalledTimes(1);
      expect(getMock).toHaveBeenCalledWith(
        "SELECT * FROM reviews WHERE model = ? AND user = ?",
        ["Model123", "user1"],
        expect.any(Function)
      );
    });

    // Test for handling database errors on checking existing reviews
    test("should handle database errors gracefully when checking for existing reviews", async () => {
      const getMock = jest.spyOn(db, "get");
      const errorMessage = "Database error";

      getMock.mockImplementation((sql, params, callback) => 
        callback(new Error(errorMessage), null)
      );

      await expect(
        reviewDAO.addReview("Model123", "user1", 5, "Great product!")
      ).rejects.toThrow(errorMessage);

      expect(getMock).toHaveBeenCalledTimes(1);
      expect(getMock).toHaveBeenCalledWith(
        "SELECT * FROM reviews WHERE model = ? AND user = ?",
        ["Model123", "user1"],
        expect.any(Function)
      );
    });

    // Test for handling database errors on inserting new review
    test("should handle database errors gracefully when inserting a new review", async () => {
      const getMock = jest.spyOn(db, "get");
      const runMock = jest.spyOn(db, "run");
      const errorMessage = "Database error";

      getMock.mockImplementation((sql, params, callback) => 
        callback(null, null) // No existing review
      );

      runMock.mockImplementation((sql, params, callback) => 
        callback(new Error(errorMessage))
      );

      await expect(
        reviewDAO.addReview("Model123", "user1", 5, "Great product!")
      ).rejects.toThrow(errorMessage);

      expect(getMock).toHaveBeenCalledTimes(1);
      expect(getMock).toHaveBeenCalledWith(
        "SELECT * FROM reviews WHERE model = ? AND user = ?",
        ["Model123", "user1"],
        expect.any(Function)
      );

      expect(runMock).toHaveBeenCalledTimes(1);
      expect(runMock).toHaveBeenCalledWith(
        "INSERT INTO reviews (model, user, score, date, comment) VALUES (?, ?, ?, ?, ?)",
        [
          "Model123",
          "user1",
          5,
          expect.any(String), // The date
          "Great product!",
        ],
        expect.any(Function)
      );
    });
  });

  describe("getProductReviews", () => {
    // Test for successfully returning all reviews
    test("should return all reviews for a product successfully", async () => {
      const allMock = jest.spyOn(db, "all");
      const mockRows = [
        {
          model: "Model123",
          user: "user1",
          score: 5,
          date: "2023-06-01",
          comment: "Great product!",
        },
        {
          model: "Model123",
          user: "user2",
          score: 4,
          date: "2023-06-02",
          comment: "Good value for money.",
        },
      ];

      allMock.mockImplementation((sql, params, callback) => 
        callback(null, mockRows)
      );

      const expectedReviews = mockRows.map(
        (row) =>
          new ProductReview(
            row.model,
            row.user,
            row.score,
            row.date,
            row.comment
          )
      );

      await expect(reviewDAO.getProductReviews("Model123")).resolves.toEqual(
        expectedReviews
      );

      expect(allMock).toHaveBeenCalledTimes(1);
      expect(allMock).toHaveBeenCalledWith(
        "SELECT * FROM reviews WHERE model = ?",
        ["Model123"],
        expect.any(Function)
      );
    });

    // Test for handling no reviews found
    test("should return empty array when no reviews are found for the product", async () => {
      const allMock = jest.spyOn(db, "all");

      allMock.mockImplementation((sql, params, callback) => 
        callback(null, [])
      );

      await expect(reviewDAO.getProductReviews("Model123")).resolves.toStrictEqual([]);

      expect(allMock).toHaveBeenCalledTimes(1);
      expect(allMock).toHaveBeenCalledWith(
        "SELECT * FROM reviews WHERE model = ?",
        ["Model123"],
        expect.any(Function)
      );
    });

    // Test for handling database errors
    test("should handle database errors gracefully", async () => {
      const allMock = jest.spyOn(db, "all");
      const errorMessage = "Database error";

      allMock.mockImplementation((sql, params, callback) => 
        callback(new Error(errorMessage), null)
      );

      await expect(reviewDAO.getProductReviews("Model123")).rejects.toThrow(
        errorMessage
      );

      expect(allMock).toHaveBeenCalledTimes(1);
      expect(allMock).toHaveBeenCalledWith(
        "SELECT * FROM reviews WHERE model = ?",
        ["Model123"],
        expect.any(Function)
      );
    });
  });

  describe("deleteReview", () => {
    // Test for successfully deleting a review
    test("should delete a review successfully", async () => {
      const getMock = jest.spyOn(db, "get");
      const runMock = jest.spyOn(db, "run");

      getMock.mockImplementation((sql, params, callback) => 
        callback(null, { model: "Model123", username: "user1" }) // Review exists
      );

      runMock.mockImplementation((sql, params, callback) => 
        callback(null) // No error on delete
      );

      await expect(
        reviewDAO.deleteReview("Model123", "user1")
      ).resolves.toBeUndefined();

      expect(getMock).toHaveBeenCalledTimes(1);
      expect(getMock).toHaveBeenCalledWith(
        "SELECT * FROM reviews WHERE model = ? AND user = ?",
        ["Model123", "user1"],
        expect.any(Function)
      );

      expect(runMock).toHaveBeenCalledTimes(1);
      expect(runMock).toHaveBeenCalledWith(
        "DELETE FROM reviews WHERE model = ? AND user = ?",
        ["Model123", "user1"],
        expect.any(Function)
      );
    });

    // Test for handling non-existing review
    test("should handle non-existing review gracefully", async () => {
      const getMock = jest.spyOn(db, "get");

      getMock.mockImplementation((sql, params, callback) => 
        callback(null, null)// Review does not exist
      );

      await expect(reviewDAO.deleteReview("Model123", "user1")).rejects.toThrow(
        NoReviewProductError
      );

      expect(getMock).toHaveBeenCalledTimes(1);
      expect(getMock).toHaveBeenCalledWith(
        "SELECT * FROM reviews WHERE model = ? AND user = ?",
        ["Model123", "user1"],
        expect.any(Function)
      );
    });

    // Test for handling database errors
    test("should handle database errors gracefully", async () => {
      const getMock = jest.spyOn(db, "get");
      const runMock = jest.spyOn(db, "run");
      const errorMessage = "Database error";

      getMock.mockImplementation((sql, params, callback) => 
        callback(null, { model: "Model123", username: "user1" }) // Review exists
      );

      runMock.mockImplementation((sql, params, callback) => 
        callback(new Error(errorMessage)) // Error on delete
      );

      await expect(reviewDAO.deleteReview("Model123", "user1")).rejects.toThrow(
        errorMessage
      );

      expect(getMock).toHaveBeenCalledTimes(1);
      expect(getMock).toHaveBeenCalledWith(
        "SELECT * FROM reviews WHERE model = ? AND user = ?",
        ["Model123", "user1"],
        expect.any(Function)
      );

      expect(runMock).toHaveBeenCalledTimes(1);
      expect(runMock).toHaveBeenCalledWith(
        "DELETE FROM reviews WHERE model = ? AND user = ?",
        ["Model123", "user1"],
        expect.any(Function)
      );
    });
  });

  describe("deleteReviewsOfProduct", () => {
    // Test for successfully deleting all reviews of a product
    test("should delete all reviews of a product successfully", async () => {
      const runMock = jest.spyOn(db, "run");

      runMock.mockImplementation((sql, params, callback) => 
        callback(null) // No error on delete
      );

      await expect(
        reviewDAO.deleteReviewsOfProduct("Model123")
      ).resolves.toBeUndefined();

      expect(runMock).toHaveBeenCalledTimes(1);
      expect(runMock).toHaveBeenCalledWith(
        "DELETE FROM reviews WHERE model = ?",
        ["Model123"],
        expect.any(Function)
      );
    });

    // Test for handling database errors
    test("should handle database errors gracefully", async () => {
      const runMock = jest.spyOn(db, "run");
      const errorMessage = "Database error";

      runMock.mockImplementation((sql, params, callback) => 
        callback(new Error(errorMessage)) // Error on delete
      );

      await expect(
        reviewDAO.deleteReviewsOfProduct("Model123")
      ).rejects.toThrow(errorMessage);

      expect(runMock).toHaveBeenCalledTimes(1);
      expect(runMock).toHaveBeenCalledWith(
        "DELETE FROM reviews WHERE model = ?",
        ["Model123"],
        expect.any(Function)
      );
    });
  });

  describe("deleteAllReviews", () => {
    // Test for successfully deleting all reviews
    test("should delete all reviews successfully", async () => {
      const runMock = jest.spyOn(db, "run");

      runMock.mockImplementation((sql, params, callback) => 
        callback(null) // No error on delete
      );

      await expect(reviewDAO.deleteAllReviews()).resolves.toBeUndefined();

      expect(runMock).toHaveBeenCalledTimes(1);
      expect(runMock).toHaveBeenCalledWith(
        "DELETE FROM reviews",
        [],
        expect.any(Function)
      );
    });

    // Test for handling database errors
    test("should handle database errors gracefully", async () => {
      const runMock = jest.spyOn(db, "run");
      const errorMessage = "Database error";

      runMock.mockImplementation((sql, params, callback) => 
        callback(new Error(errorMessage)) // Error on delete
      );

      await expect(reviewDAO.deleteAllReviews()).rejects.toThrow(errorMessage);

      expect(runMock).toHaveBeenCalledTimes(1);
      expect(runMock).toHaveBeenCalledWith(
        "DELETE FROM reviews",
        [],
        expect.any(Function)
      );
    });
  });
});
