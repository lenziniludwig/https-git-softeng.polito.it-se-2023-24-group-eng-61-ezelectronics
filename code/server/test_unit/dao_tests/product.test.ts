import db from "../../src/db/db";
import { Product, Category } from "../../src/components/product";
import ProductDAO from "../../src/dao/productDAO";
import { describe, test, expect, beforeAll, beforeEach, it, afterEach, afterAll, jest} from "@jest/globals";

jest.mock("../../src/db/db.ts");

describe("ProductDAO", () => {
  let productDAO: ProductDAO;
  let mockProduct: Product;

  beforeEach(() => {
    productDAO = new ProductDAO();
    mockProduct = new Product(
      999.99,
      "Model123",
      Category.SMARTPHONE,
      "2023-06-01",
      "Latest smartphone model",
      10
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // Test for Successful Registration:
  test("should register a new product successfully", async () => {
    const runMock = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => 
        callback(null));

    await expect(
      productDAO.registerProduct(mockProduct)
    ).resolves.toBeUndefined();

    expect(runMock).toHaveBeenCalledTimes(1);
    expect(runMock).toHaveBeenCalledWith(
      expect.any(String),
      [
        mockProduct.model,
        mockProduct.category,
        mockProduct.quantity,
        mockProduct.details,
        mockProduct.sellingPrice,
        mockProduct.arrivalDate,
      ],
      expect.any(Function)
    );
  });

  // Test for Handling Database Errors:

  test("should handle database errors gracefully", async () => {
    const errorMessage = "Database error";
    const runMock = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => 
      callback(new Error(errorMessage)));

    await expect(productDAO.registerProduct(mockProduct)).rejects.toThrow(
      errorMessage
    );

    expect(runMock).toHaveBeenCalledTimes(1);
    expect(runMock).toHaveBeenCalledWith(
      expect.any(String),
      [
        mockProduct.model,
        mockProduct.category,
        mockProduct.quantity,
        mockProduct.details,
        mockProduct.sellingPrice,
        mockProduct.arrivalDate,
      ],
      expect.any(Function)
    );
  });
});

describe("ProductDAO", () => {
  let productDAO: ProductDAO;

  beforeEach(() => {
    productDAO = new ProductDAO();
  });

  afterEach(() => {
    jest.clearAllMocks(); // Clear mock calls and instances after each test
  });

  // updateProductQuantity a
  test("should update the product quantity successfully", async () => {
    const runMock = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => 
      callback(null));

    const model = "Model123";
    const newQuantity = 5;

    await expect(
      productDAO.updateProductQuantity(model, newQuantity)
    ).resolves.toEqual(newQuantity);

    expect(runMock).toHaveBeenCalledTimes(1);
    expect(runMock).toHaveBeenCalledWith(
      expect.stringContaining("UPDATE products SET quantity = quantity +"), // More specific query check
      [newQuantity, model],
      expect.any(Function) // The callback function
    );
  });

  // updateProductQuantity b
  test("should throw an error if updating the product quantity fails", async () => {
    const mockError = new Error("Database error");
    const runMock = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => 
      callback(mockError));

    const model = "Model123";
    const newQuantity = 5;

    await expect(
      productDAO.updateProductQuantity(model, newQuantity)
    ).rejects.toThrow("Database error");

    expect(runMock).toHaveBeenCalledTimes(1);
    expect(runMock).toHaveBeenCalledWith(
      expect.stringContaining("UPDATE products SET quantity = quantity +"), // More specific query check
      [newQuantity, model],
      expect.any(Function) // The callback function
    );
  });
});

describe("ProductDAO", () => {
  let productDAO: ProductDAO;

  beforeEach(() => {
    productDAO = new ProductDAO();
  });

  afterEach(() => {
    jest.clearAllMocks(); // Clear mock calls and instances after each test
  });

  // getProducts a
  test("should retrieve all products successfully", async () => {
    const mockRows = [
      {
        sellingPrice: 999.99,
        model: "Model123",
        category: "Smartphone",
        arrivalDate: "2023-06-01",
        details: "Latest smartphone model",
        quantity: 10,
      },
      {
        sellingPrice: 1299.99,
        model: "Model456",
        category: "Laptop",
        arrivalDate: "2023-06-02",
        details: "High performance laptop",
        quantity: 5,
      },
    ];
    const allMock = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => 
      callback(null, mockRows));

    const products = await productDAO.getProducts(null, null);
    const product1 = new Product(999.99, "Model123", Category.SMARTPHONE, "2023-06-01", "Latest smartphone model", 10);
    const product2 = new Product(1299.99, "Model456", Category.LAPTOP, "2023-06-02", "High performance laptop", 5);
    expect(products).toHaveLength(2);
    expect(products[0]).toMatchObject(JSON.parse(JSON.stringify(product1)));
    expect(products[1]).toMatchObject(JSON.parse(JSON.stringify(product2)));

    expect(allMock).toHaveBeenCalledTimes(1);
    expect(allMock).toHaveBeenCalledWith(
      expect.stringContaining("SELECT * FROM products"), // More specific query check
      [],
      expect.any(Function) // The callback function
    );
  });

  // getProducts b
  test("should retrieve products filtered by category", async () => {
    const mockRows = [
      {
        sellingPrice: 999.99,
        model: "Model123",
        category: "Smartphone",
        arrivalDate: "2023-06-01",
        details: "Latest smartphone model",
        quantity: 10,
      },
    ];
    const allMock = jest.spyOn(db, "all").mockImplementation((sql, params, callback) =>
      callback(null, mockRows));

    const products = await productDAO.getProducts("Smartphone", null);
    const product1 = new Product(999.99, "Model123", Category.SMARTPHONE, "2023-06-01", "Latest smartphone model", 10);

    expect(products).toHaveLength(1);
    expect(products[0]).toMatchObject(JSON.parse(JSON.stringify(product1)));

    expect(allMock).toHaveBeenCalledTimes(1);
    expect(allMock).toHaveBeenCalledWith(
      expect.stringContaining("SELECT * FROM products WHERE category = ?"), // More specific query check
      ["Smartphone"],
      expect.any(Function) // The callback function
    );
  });

  // getProducts c
  test("should retrieve products filtered by model", async () => {
    const mockRows = [
      {
        sellingPrice: 1299.99,
        model: "Model456",
        category: "Laptop",
        arrivalDate: "2023-06-02",
        details: "High performance laptop",
        quantity: 5,
      },
    ];
    const allMock = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => 
      callback(null, mockRows));

    const products = await productDAO.getProducts(null, "Model456");
    const product1 = new Product(1299.99, "Model456", Category.LAPTOP, "2023-06-02", "High performance laptop", 5);

    expect(products).toHaveLength(1);
    expect(products[0]).toMatchObject(JSON.parse(JSON.stringify(product1)));

    expect(allMock).toHaveBeenCalledTimes(1);
    expect(allMock).toHaveBeenCalledWith(
      expect.stringContaining("SELECT * FROM products WHERE model = ?"), // More specific query check
      ["Model456"],
      expect.any(Function) // The callback function
    );
  });

  // getProducts d
  test("should retrieve products filtered by category and model", async () => {
    const mockRows = [
      {
        sellingPrice: 1299.99,
        model: "Model456",
        category: "Laptop",
        arrivalDate: "2023-06-02",
        details: "High performance laptop",
        quantity: 5,
      },
    ];
    const allMock = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => 
      callback(null, mockRows));

    const products = await productDAO.getProducts("Laptop", "Model456");
    const product1 = new Product(1299.99, "Model456", Category.LAPTOP, "2023-06-02", "High performance laptop", 5);

    expect(products).toHaveLength(1);
    expect(products[0]).toMatchObject(JSON.parse(JSON.stringify(product1)));

    expect(allMock).toHaveBeenCalledTimes(1);
    expect(allMock).toHaveBeenCalledWith(
      expect.stringContaining(
        "SELECT * FROM products WHERE category = ? AND model = ?"
      ), // More specific query check
      ["Laptop", "Model456"],
      expect.any(Function) // The callback function
    );
  });

  // getProducts f
  test("should throw an error if retrieving products fails", async () => {
    const mockError = new Error("Database error");
    const allMock = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => 
      callback(mockError, null));

    await expect(productDAO.getProducts(null, null)).rejects.toThrow(
      "Database error"
    );

    expect(allMock).toHaveBeenCalledTimes(1);
    expect(allMock).toHaveBeenCalledWith(
      expect.stringContaining("SELECT * FROM products"), // More specific query check
      [],
      expect.any(Function) // The callback function
    );
  });
});

describe("ProductDAO", () => {
  let productDAO: ProductDAO;

  beforeEach(() => {
    productDAO = new ProductDAO();
  });

  afterEach(() => {
    jest.clearAllMocks(); // Clear mock calls and instances after each test
  });

  // getProductByModel a
  test("should retrieve a product by model successfully", async () => {
    const mockRow = {
      sellingPrice: 999.99,
      model: "Model123",
      category: "Smartphone",
      arrivalDate: "2023-06-01",
      details: "Latest smartphone model",
      quantity: 10,
    };
    const getMock = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => 
      callback(null, mockRow));

    const model = "Model123";
    const product = await productDAO.getProductByModel(model);
    const product1 = new Product(999.99, "Model123", Category.SMARTPHONE, "2023-06-01", "Latest smartphone model", 10);

    expect(product).toMatchObject(JSON.parse(JSON.stringify(product1)));

    expect(getMock).toHaveBeenCalledTimes(1);
    expect(getMock).toHaveBeenCalledWith(
      expect.stringContaining("SELECT * FROM products WHERE model = ?"), // More specific query check
      [model],
      expect.any(Function) // The callback function
    );
  });

  // getProductByModel b
  test("should return null if product model does not exist", async () => {
    const getMock = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => 
      callback(null, null));

    const model = "NonExistentModel";
    const product = await productDAO.getProductByModel(model);

    expect(product).toBeNull();

    expect(getMock).toHaveBeenCalledTimes(1);
    expect(getMock).toHaveBeenCalledWith(
      expect.stringContaining("SELECT * FROM products WHERE model = ?"), // More specific query check
      [model],
      expect.any(Function) // The callback function
    );
  });

  // getProductByModel c
  test("should throw an error if retrieving product by model fails", async () => {
    const mockError = new Error("Database error");
    const getMock = jest.spyOn(db, "get").mockImplementation((sql, params, callback) =>
      callback(mockError, null));

    const model = "Model123";

    await expect(productDAO.getProductByModel(model)).rejects.toThrow(
      "Database error"
    );

    expect(getMock).toHaveBeenCalledTimes(1);
    expect(getMock).toHaveBeenCalledWith(
      expect.stringContaining("SELECT * FROM products WHERE model = ?"), // More specific query check
      [model],
      expect.any(Function) // The callback function
    );
  });

  // Additional edge case: empty model string
  test("should return null if empty model string is provided", async () => {
    const getMock = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => 
      callback(null, null));

    const model = "";
    const product = await productDAO.getProductByModel(model);

    expect(product).toBeNull();

    expect(getMock).toHaveBeenCalledTimes(1);
    expect(getMock).toHaveBeenCalledWith(
      expect.stringContaining("SELECT * FROM products WHERE model = ?"), // More specific query check
      [model],
      expect.any(Function) // The callback function
    );
  });

  // Additional edge case: SQL injection attempt
  test("should prevent SQL injection attempts", async () => {
    const mockError = new Error("SQL Injection Attempt");
    const getMock = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => 
      callback(mockError, null));

    const model = "'; DROP TABLE products; --";
    await expect(productDAO.getProductByModel(model)).rejects.toThrow(
      "SQL Injection Attempt"
    );

    expect(getMock).toHaveBeenCalledTimes(1);
    expect(getMock).toHaveBeenCalledWith(
      expect.stringContaining("SELECT * FROM products WHERE model = ?"), // More specific query check
      [model],
      expect.any(Function) // The callback function
    );
  });
});

describe("ProductDAO", () => {
  let productDAO: ProductDAO;

  beforeEach(() => {
    productDAO = new ProductDAO();
  });

  afterEach(() => {
    jest.clearAllMocks(); // Clear mock calls and instances after each test
  });

  // deleteProduct a
  test("deleteProduct should delete a product successfully", async () => {
    const runMock = jest.spyOn(db, "run");

    // Mock deleteProductReviews to resolve
    jest
      .spyOn(productDAO as any, "deleteProductReviews")
      .mockResolvedValue(undefined);

    runMock.mockImplementation((sql, params, callback) => 
      callback.call({ changes: 1 }, null));

    const model = "Model123";
    const result = await productDAO.deleteProduct(model);

    expect(result).toBe(true);
    expect(runMock).toHaveBeenCalledWith(
      `DELETE FROM products WHERE model = ?`,
      [model],
      expect.any(Function) // The callback function
    );
  });

  // deleteProduct b
  test("deleteProduct should throw an error if deletion fails", async () => {
    const runMock = jest.spyOn(db, "run");
    const mockError = new Error("Database error");

    jest
      .spyOn(productDAO as any, "deleteProductReviews")
      .mockResolvedValue(undefined);

    runMock.mockImplementation((sql, params, callback) => 
      callback(mockError));

    const model = "Model123";

    await expect(productDAO.deleteProduct(model)).rejects.toThrow(
      "Database error"
    );
    expect(runMock).toHaveBeenCalledWith(
      `DELETE FROM products WHERE model = ?`,
      [model],
      expect.any(Function) // The callback function
    );
  });

  // deleteProduct c
  test("deleteProduct should return true even if no rows are affected", async () => {
    const runMock = jest.spyOn(db, "run");

    jest
      .spyOn(productDAO as any, "deleteProductReviews")
      .mockResolvedValue(undefined);

    runMock.mockImplementation((sql, params, callback) => 
      callback.call({ changes: 0 }, null));

    const model = "Model123";
    const result = await productDAO.deleteProduct(model);

    expect(result).toBe(true);
    expect(runMock).toHaveBeenCalledWith(
      `DELETE FROM products WHERE model = ?`,
      [model],
      expect.any(Function) // The callback function
    );
  });

  // deleteProductReviews
  test("deleteProductReviews should delete reviews successfully", async () => {
    const runMock = jest.spyOn(db, "run");

    runMock.mockImplementation((sql, params, callback) => 
      callback(null));

    const model = "Model123";
    await expect(
      productDAO["deleteProductReviews"](model)
    ).resolves.not.toThrow();
    expect(runMock).toHaveBeenCalledWith(
      `DELETE FROM reviews WHERE model = ?`,
      [model],
      expect.any(Function) // The callback function
    );
  });

  // deleteAllProducts a
  test("deleteAllProducts should delete all products successfully", async () => {
    const runMock = jest.spyOn(db, "run");

    // Mock deleteAllProductReviews to resolve
    jest
      .spyOn(productDAO as any, "deleteAllProductReviews")
      .mockResolvedValue(undefined);

    runMock.mockImplementation((sql, callback) => 
      callback(null));

    const result = await productDAO.deleteAllProducts();

    expect(result).toBe(true);
    expect(runMock).toHaveBeenCalledWith(
      `DELETE FROM products`,
      expect.any(Function) // The callback function
    );
  });

  // deleteAllProducts b
  test("deleteAllProducts should throw an error if deletion fails", async () => {
    const runMock = jest.spyOn(db, "run");
    const mockError = new Error("Database error");

    jest
      .spyOn(productDAO as any, "deleteAllProductReviews")
      .mockResolvedValue(undefined);

    runMock.mockImplementation((sql, callback) => 
      callback(mockError));

    await expect(productDAO.deleteAllProducts()).rejects.toThrow(
      "Database error"
    );
  });

  // deleteAllProductReviews
  test("deleteAllProductReviews should delete all reviews successfully", async () => {
    const runMock = jest.spyOn(db, "run");

    runMock.mockImplementation((sql, callback) => 
      callback(null));

    await expect(
      productDAO["deleteAllProductReviews"]()
    ).resolves.not.toThrow();
    expect(runMock).toHaveBeenCalledWith(
      `DELETE FROM reviews`,
      expect.any(Function) // The callback function
    );
  });
});
