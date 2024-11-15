import sqlite3 from "sqlite3";
import db from "../../src/db/db";
import CartDAO from "../../src/dao/cartDAO";
import { ProductInCart } from "../../src/components/cart";
import { Category } from "../../src/components/product";
import { Cart } from "../../src/components/cart";
import { describe, test, expect, beforeAll, beforeEach, it, afterEach, afterAll, jest} from "@jest/globals";

jest.mock("../../src/db/db.ts");

describe("CartDAO", () => {
  let cartDAO: CartDAO;
  let mockProduct: ProductInCart;

  beforeEach(() => {
    cartDAO = new CartDAO();
    mockProduct = new ProductInCart("Model123", 1, Category.SMARTPHONE, 999.99);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // addToCart a
  test("should add a product to an existing cart where the product already exists", async () => {
    const serializeMock = jest
      .spyOn(db, "serialize")
      .mockImplementation((callback) => {if (callback) {callback()}});
      
    const getMock = jest
      .spyOn(db, "get")
      .mockImplementationOnce((sql, params, callback) =>
        callback(null, { cart_id: 1 })
      )
      .mockImplementationOnce((sql, params, callback) =>
        callback(null, {
          cart_id: 1,
          model: "Model123",
          quantity: 1,
          category: "Smartphone",
          price: 999.99,
        })
      );
    const runMock = jest
      .spyOn(db, "run")
      .mockImplementation((sql, params, callback) => {
        callback(null);
        return db;
      });

    await cartDAO.addToCart("test_customer", mockProduct);

    expect(serializeMock).toHaveBeenCalled();
    expect(getMock).toHaveBeenCalledTimes(2);
    expect(runMock).toHaveBeenCalledTimes(1);
    expect(runMock).toHaveBeenCalledWith(
      "UPDATE products_in_cart SET quantity = quantity + 1 WHERE cart_id = ? AND model = ?",
      [1, "Model123"],
      expect.any(Function)
    );
  });

  // addToCart b
  test("should add a product to an existing cart where the product does not exist", async () => {
    const serializeMock = jest
      .spyOn(db, "serialize")
      .mockImplementation((callback) => {if (callback) {callback()}});
    const getMock = jest
      .spyOn(db, "get")
      .mockImplementationOnce((sql, params, callback) =>
        callback(null, { cart_id: 1 })
      )
      .mockImplementationOnce((sql, params, callback) =>
        callback(null, undefined)
      );
    const runMock = jest
      .spyOn(db, "run")
      .mockImplementation((sql, params, callback) => {
        callback(null);
        return db;
      });

    await cartDAO.addToCart("test_customer", mockProduct);

    expect(serializeMock).toHaveBeenCalled();
    expect(getMock).toHaveBeenCalledTimes(2);
    expect(runMock).toHaveBeenCalledTimes(1);
    expect(runMock).toHaveBeenCalledWith(
      "INSERT INTO products_in_cart (cart_id, model, quantity, category, price) VALUES (?, ?, ?, ?, ?)",
      [1, "Model123", 1, "Smartphone", 999.99],
      expect.any(Function)
    );
  });

  // addToCart c
  test("should create a new cart and add the product when no current cart exists", async () => {
    const serializeMock = jest
      .spyOn(db, "serialize")
      .mockImplementation((callback) => {if (callback) {callback()}});
    const getMock = jest
      .spyOn(db, "get")
      .mockImplementation((sql, params, callback) => callback(null, undefined));
    const runMock = jest
      .spyOn(db, "run")
      .mockImplementationOnce(function (sql, params, callback) {
        callback.call({ lastID: 1 }, null);
        return db;
      })
      .mockImplementationOnce((sql, params, callback) => {
        callback(null);
        return db;
      });

    await cartDAO.addToCart("test_customer", mockProduct);

    expect(serializeMock).toHaveBeenCalled();
    expect(getMock).toHaveBeenCalledTimes(1);
    expect(runMock).toHaveBeenCalledTimes(2);
    expect(runMock).toHaveBeenCalledWith(
      "INSERT INTO carts (customer, paid, paymentDate, total) VALUES (?, ?, ?, ?)",
      ["test_customer", 0, null, 0],
      expect.any(Function)
    );
    expect(runMock).toHaveBeenCalledWith(
      "INSERT INTO products_in_cart (cart_id, model, quantity, category, price) VALUES (?, ?, ?, ?, ?)",
      [1, "Model123", 1, "Smartphone", 999.99],
      expect.any(Function)
    );
  });

  // Additional test for database error handling
  test("should handle database errors gracefully", async () => {
    const serializeMock = jest
      .spyOn(db, "serialize")
      .mockImplementation((callback) => {if (callback) {callback()}});
    const getMock = jest
      .spyOn(db, "get")
      .mockImplementation((sql, params, callback) =>
        callback(new Error("DB error"), null)
      );

    await expect(
      cartDAO.addToCart("test_customer", mockProduct)
    ).rejects.toThrow("DB error");

    expect(serializeMock).toHaveBeenCalled();
    expect(getMock).toHaveBeenCalledTimes(1);
  });

  // Additional test for edge cases
  test("should handle edge case with very long customer name", async () => {
    const longCustomerName = "a".repeat(1000);
    const serializeMock = jest
      .spyOn(db, "serialize")
      .mockImplementation((callback) => {if (callback) {callback()}});
    const getMock = jest
      .spyOn(db, "get")
      .mockImplementation((sql, params, callback) => callback(null, undefined));
    const runMock = jest
      .spyOn(db, "run")
      .mockImplementationOnce(function (sql, params, callback) {
        callback.call({ lastID: 1 }, null);
        return db;
      })
      .mockImplementationOnce((sql, params, callback) => {
        callback(null);
        return db;
      });

    await cartDAO.addToCart(longCustomerName, mockProduct);

    expect(serializeMock).toHaveBeenCalled();
    expect(getMock).toHaveBeenCalledTimes(1);
    expect(runMock).toHaveBeenCalledTimes(2);
    expect(runMock).toHaveBeenCalledWith(
      "INSERT INTO carts (customer, paid, paymentDate, total) VALUES (?, ?, ?, ?)",
      [longCustomerName, 0, null, 0],
      expect.any(Function)
    );
    expect(runMock).toHaveBeenCalledWith(
      "INSERT INTO products_in_cart (cart_id, model, quantity, category, price) VALUES (?, ?, ?, ?, ?)",
      [1, "Model123", 1, "Smartphone", 999.99],
      expect.any(Function)
    );
  });

  //  unit test for getCustomerCarts

  test("should retrieve the history of paid carts of a customer", async () => {
    const expectedCarts: Cart[] = [
      new Cart("test_customer", true, "2024-06-06", 1999.98, [mockProduct]),
    ];

    const serializeMock = jest
      .spyOn(db, "serialize")
      .mockImplementation((callback) => {if (callback) {callback()}});
    const allMock = jest
      .spyOn(db, "all")
      .mockImplementationOnce((sql, params, callback) =>
        callback(null, [
          {
            cart_id: 1,
            customer: "test_customer",
            paid: true,
            paymentDate: "2024-06-06",
            total: 1999.98,
          },
        ])
      )
      .mockImplementationOnce((sql, params, callback) =>
        callback(null, [
          {
            model: "Model123",
            quantity: 1,
            category: "Smartphone",
            price: 999.99,
          },
        ])
      );

    const result = await cartDAO.getCustomerCarts("test_customer");

    expect(serializeMock).toHaveBeenCalled();
    expect(allMock).toHaveBeenCalledTimes(2);
    expect(result).toEqual(expectedCarts);
  });

  // Test for error handling
  test("should handle database errors gracefully", async () => {
    const serializeMock = jest
      .spyOn(db, "serialize")
      .mockImplementation((callback) => {if (callback) {callback()}});
    const allMock = jest
      .spyOn(db, "all")
      .mockImplementation((sql, params, callback) =>
        callback(new Error("DB error"), null)
      );

    await expect(cartDAO.getCustomerCarts("test_customer")).rejects.toThrow(
      "DB error"
    );

    expect(serializeMock).toHaveBeenCalled();
    expect(allMock).toHaveBeenCalledTimes(1);
  });

  // Test for no paid carts
  test("should return an empty array if the customer has no paid carts", async () => {
    const serializeMock = jest
      .spyOn(db, "serialize")
      .mockImplementation((callback) => {if (callback) {callback()}});
    const allMock = jest
      .spyOn(db, "all")
      .mockImplementation((sql, params, callback) => callback(null, []));

    const result = await cartDAO.getCustomerCarts("test_customer");

    expect(serializeMock).toHaveBeenCalled();
    expect(allMock).toHaveBeenCalledTimes(1);
    expect(result).toEqual([]);
  });

  // Test for edge case with very long customer name
  test("should handle edge case with very long customer name", async () => {
    const longCustomerName = "a".repeat(1000);
    const expectedCarts: Cart[] = [
      new Cart(longCustomerName, true, "2024-06-06", 1999.98, [mockProduct]),
    ];

    const serializeMock = jest
      .spyOn(db, "serialize")
      .mockImplementation((callback) => {if (callback) {callback()}});
    const allMock = jest
      .spyOn(db, "all")
      .mockImplementationOnce((sql, params, callback) =>
        callback(null, [
          {
            cart_id: 1,
            customer: longCustomerName,
            paid: true,
            paymentDate: "2024-06-06",
            total: 1999.98,
          },
        ])
      )
      .mockImplementationOnce((sql, params, callback) =>
        callback(null, [
          {
            model: "Model123",
            quantity: 1,
            category: "Smartphone",
            price: 999.99,
          },
        ])
      );

    const result = await cartDAO.getCustomerCarts(longCustomerName);

    expect(serializeMock).toHaveBeenCalled();
    expect(allMock).toHaveBeenCalledTimes(2);
    expect(result).toEqual(expectedCarts);
  });

  // unit test for checkoutCart

  test("should checkout the current cart of a customer", async () => {
    const serializeMock = jest
      .spyOn(db, "serialize")
      .mockImplementation((callback) => {if (callback) {callback()}});
    const getMock = jest
      .spyOn(db, "get")
      .mockImplementationOnce((sql, params, callback) =>
        callback(null, { cart_id: 1 })
      );
    const runMock = jest
      .spyOn(db, "run")
      .mockImplementation((sql, params, callback) => {
        callback(null);
        return db;
      });

    await cartDAO.checkoutCart("test_customer", "2024-06-06", 999.99);

    expect(serializeMock).toHaveBeenCalled();
    expect(getMock).toHaveBeenCalledTimes(1);
    expect(runMock).toHaveBeenCalledTimes(1);
    expect(runMock).toHaveBeenCalledWith(
      "UPDATE carts SET paid = 1, paymentDate = ?, total = ? WHERE cart_id = ?",
      ["2024-06-06", 999.99, 1],
      expect.any(Function)
    );
  });

  // Test for error handling in getting cart
  test("should handle errors when retrieving the current cart", async () => {
    const serializeMock = jest
      .spyOn(db, "serialize")
      .mockImplementation((callback) => {if (callback) {callback()}});
    const getMock = jest
      .spyOn(db, "get")
      .mockImplementationOnce((sql, params, callback) =>
        callback(new Error("DB error"), null)
      );

    await expect(
      cartDAO.checkoutCart("test_customer", "2024-06-06", 999.99)
    ).rejects.toThrow("DB error");

    expect(serializeMock).toHaveBeenCalled();
    expect(getMock).toHaveBeenCalledTimes(1);
  });

  // Test for error handling in updating cart
  test("should handle errors when updating the cart", async () => {
    const serializeMock = jest
      .spyOn(db, "serialize")
      .mockImplementation((callback) => {if (callback) {callback()}});
    const getMock = jest
      .spyOn(db, "get")
      .mockImplementationOnce((sql, params, callback) =>
        callback(null, { cart_id: 1 })
      );
    const runMock = jest
      .spyOn(db, "run")
      .mockImplementation((sql, params, callback) =>
        callback(new Error("DB error"))
      );

    await expect(
      cartDAO.checkoutCart("test_customer", "2024-06-06", 999.99)
    ).rejects.toThrow("DB error");

    expect(serializeMock).toHaveBeenCalled();
    expect(getMock).toHaveBeenCalledTimes(1);
    expect(runMock).toHaveBeenCalledTimes(1);
  });

  // Test for edge case when no current cart exists
  test("should handle the case when no current cart exists", async () => {
    const serializeMock = jest
      .spyOn(db, "serialize")
      .mockImplementation((callback) => {if (callback) {callback()}});
    const getMock = jest
      .spyOn(db, "get")
      .mockImplementationOnce((sql, params, callback) =>
        callback(null, undefined)
      );
    const runMock = jest
      .spyOn(db, "run")
      .mockImplementation((sql, params, callback) => {
        callback(null);
        return db;
      });

    await expect(
      cartDAO.checkoutCart("test_customer", "2024-06-06", 999.99)
    ).rejects.toThrow();

    expect(serializeMock).toHaveBeenCalled();
    expect(getMock).toHaveBeenCalledTimes(1);
    expect(runMock).not.toHaveBeenCalled();
  });

  // Test for edge case with very long customer name
  test("should handle edge case with very long customer name", async () => {
    const longCustomerName = "a".repeat(1000);
    const serializeMock = jest
      .spyOn(db, "serialize")
      .mockImplementation((callback) => {if (callback) {callback()}});
    const getMock = jest
      .spyOn(db, "get")
      .mockImplementationOnce((sql, params, callback) =>
        callback(null, { cart_id: 1 })
      );
    const runMock = jest
      .spyOn(db, "run")
      .mockImplementation((sql, params, callback) => {
        callback(null);
        return db;
      });

    await cartDAO.checkoutCart(longCustomerName, "2024-06-06", 999.99);

    expect(serializeMock).toHaveBeenCalled();
    expect(getMock).toHaveBeenCalledTimes(1);
    expect(runMock).toHaveBeenCalledTimes(1);
    expect(runMock).toHaveBeenCalledWith(
      "UPDATE carts SET paid = 1, paymentDate = ?, total = ? WHERE cart_id = ?",
      ["2024-06-06", 999.99, 1],
      expect.any(Function)
    );
  });

  // Unit tests for getCart

  test("should retrieve the current cart of a customer", async () => {
    const expectedCart = new Cart("test_customer", false, '', 999.99, [
      mockProduct,
    ]);

    const serializeMock = jest
      .spyOn(db, "serialize")
      .mockImplementation((callback) => {if (callback) {callback()}});
    const getMock = jest
      .spyOn(db, "get")
      .mockImplementationOnce((sql, params, callback) =>
        callback(null, {
          cart_id: 1,
          customer: "test_customer",
          paid: false,
          paymentDate: '',
          total: 999.99,
        })
      );
    const allMock = jest
      .spyOn(db, "all")
      .mockImplementationOnce((sql, params, callback) =>
        callback(null, [
          {
            model: "Model123",
            quantity: 1,
            category: "Smartphone",
            price: 999.99,
          },
        ])
      );

    const result = await cartDAO.getCart("test_customer");

    expect(serializeMock).toHaveBeenCalled();
    expect(getMock).toHaveBeenCalledTimes(1);
    expect(allMock).toHaveBeenCalledTimes(1);
    expect(result).toEqual(expectedCart);
  });

  // Test for no current cart
  test("should return null if no current cart exists", async () => {
    const serializeMock = jest
      .spyOn(db, "serialize")
      .mockImplementation((callback) => {if (callback) {callback()}});
    const getMock = jest
      .spyOn(db, "get")
      .mockImplementationOnce((sql, params, callback) => callback(null, null));

    const result = await cartDAO.getCart("test_customer");

    expect(serializeMock).toHaveBeenCalled();
    expect(getMock).toHaveBeenCalledTimes(1);
    expect(result).toBeNull();
  });

  // Test for error handling in getting cart
  test("should handle errors when retrieving the current cart", async () => {
    const serializeMock = jest
      .spyOn(db, "serialize")
      .mockImplementation((callback) => {if (callback) {callback()}});
    const getMock = jest
      .spyOn(db, "get")
      .mockImplementationOnce((sql, params, callback) =>
        callback(new Error("DB error"), null)
      );

    await expect(cartDAO.getCart("test_customer")).rejects.toThrow("DB error");

    expect(serializeMock).toHaveBeenCalled();
    expect(getMock).toHaveBeenCalledTimes(1);
  });

  // Test for error handling in retrieving products
  test("should handle errors when retrieving products in the cart", async () => {
    const serializeMock = jest
      .spyOn(db, "serialize")
      .mockImplementation((callback) => {if (callback) {callback()}});
    const getMock = jest
      .spyOn(db, "get")
      .mockImplementationOnce((sql, params, callback) =>
        callback(null, {
          cart_id: 1,
          customer: "test_customer",
          paid: false,
          paymentDate: '',
          total: 999.99,
        })
      );
    const allMock = jest
      .spyOn(db, "all")
      .mockImplementationOnce((sql, params, callback) =>
        callback(new Error("DB error"), null)
      );

    await expect(cartDAO.getCart("test_customer")).rejects.toThrow("DB error");

    expect(serializeMock).toHaveBeenCalled();
    expect(getMock).toHaveBeenCalledTimes(1);
    expect(allMock).toHaveBeenCalledTimes(1);
  });

  // Test for edge case with very long customer name
  test("should handle edge case with very long customer name", async () => {
    const longCustomerName = "a".repeat(1000);
    const expectedCart = new Cart(longCustomerName, false, '', 999.99, [
      mockProduct,
    ]);

    const serializeMock = jest
      .spyOn(db, "serialize")
      .mockImplementation((callback) => {if (callback) {callback()}});
    const getMock = jest
      .spyOn(db, "get")
      .mockImplementationOnce((sql, params, callback) =>
        callback(null, {
          cart_id: 1,
          customer: longCustomerName,
          paid: false,
          paymentDate: '',
          total: 999.99,
        })
      );
    const allMock = jest
      .spyOn(db, "all")
      .mockImplementationOnce((sql, params, callback) =>
        callback(null, [
          {
            model: "Model123",
            quantity: 1,
            category: "Smartphone",
            price: 999.99,
          },
        ])
      );

    const result = await cartDAO.getCart(longCustomerName);

    expect(serializeMock).toHaveBeenCalled();
    expect(getMock).toHaveBeenCalledTimes(1);
    expect(allMock).toHaveBeenCalledTimes(1);
    expect(result).toEqual(expectedCart);
  });

  // createCart

  // Mocked data
  const mockCustomer = "test_customer";

  test("should create a new cart for a customer", async () => {
    const runMock = jest
      .spyOn(db, "run")
      .mockImplementation((sql, params, callback) => 
        callback(null));

    await cartDAO.createCart(mockCustomer);

    expect(runMock).toHaveBeenCalledTimes(1);
    expect(runMock).toHaveBeenCalledWith(
      "INSERT INTO carts (customer, paid, paymentDate, total) VALUES (?, 0, NULL, 0)",
      [mockCustomer],
      expect.any(Function)
    );
  });

  test("should handle errors when creating a new cart for a customer", async () => {
    const runMock = jest
      .spyOn(db, "run")
      .mockImplementation((sql, params, callback) => 
        callback(new Error("DB error")));

    await expect(cartDAO.createCart(mockCustomer)).rejects.toThrow("DB error");

    expect(runMock).toHaveBeenCalledTimes(1);
    expect(runMock).toHaveBeenCalledWith(
      "INSERT INTO carts (customer, paid, paymentDate, total) VALUES (?, 0, NULL, 0)",
      [mockCustomer],
      expect.any(Function)
    );
  });

  // Test for edge case with very long customer name
  test("should handle edge case with very long customer name", async () => {
    const longCustomerName = "a".repeat(1000);
    const runMock = jest
      .spyOn(db, "run")
      .mockImplementation((sql, params, callback) => 
        callback(null));

    await cartDAO.createCart(longCustomerName);

    expect(runMock).toHaveBeenCalledTimes(1);
    expect(runMock).toHaveBeenCalledWith(
      "INSERT INTO carts (customer, paid, paymentDate, total) VALUES (?, 0, NULL, 0)",
      [longCustomerName],
      expect.any(Function)
    );
  });

  ///////////

  // Test for successfully updating the cart total
  test("should update the cart total successfully", async () => {
    const serializeMock = jest.spyOn(db, "serialize").mockImplementation(callback => {
      if (typeof callback === "function") {
        callback();
      }
    });
    const allMock = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => 
        callback(null, [
          { price: 10.0, quantity: 2 },
          { price: 5.0, quantity: 3 },
        ]));
    const runMock = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => 
        callback(null));

    await cartDAO.updateCartTotal(1);

    expect(serializeMock).toHaveBeenCalled();
    expect(allMock).toHaveBeenCalledTimes(1);
    expect(allMock).toHaveBeenCalledWith(
      "SELECT * FROM products_in_cart WHERE cart_id = ?",
      [1],
      expect.any(Function)
    );

    expect(runMock).toHaveBeenCalledTimes(1);
    expect(runMock).toHaveBeenCalledWith(
      "UPDATE carts SET total = ? WHERE cart_id = ?",
      [35.0, 1],
      expect.any(Function)
    );
  });

  // Test for handling database errors when fetching products
  test("should handle database errors when fetching products", async () => {
    const serializeMock = jest.spyOn(db, "serialize").mockImplementation(callback => {
      if (typeof callback === "function") {
        callback();
      }
    });

    const allMock = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => 
        callback(new Error("DB error"), null));

    await expect(cartDAO.updateCartTotal(1)).rejects.toThrow("DB error");

    expect(serializeMock).toHaveBeenCalled();
    expect(allMock).toHaveBeenCalledTimes(1);
    expect(allMock).toHaveBeenCalledWith(
      "SELECT * FROM products_in_cart WHERE cart_id = ?",
      [1],
      expect.any(Function)
    );
  });

  // Test for handling database errors when updating the cart total
  test("should handle database errors when updating the cart total", async () => {
    const serializeMock = jest.spyOn(db, "serialize").mockImplementation(callback => {
      if (typeof callback === "function") {
        callback();
      }
    });

    const allMock = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => 
        callback(null, [
          { price: 10.0, quantity: 2 },
          { price: 5.0, quantity: 3 },
        ]));

    const runMock = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => 
        callback(new Error("DB error")));

    await expect(cartDAO.updateCartTotal(1)).rejects.toThrow("DB error");

    expect(serializeMock).toHaveBeenCalled();
    expect(allMock).toHaveBeenCalledTimes(1);
    expect(allMock).toHaveBeenCalledWith(
      "SELECT * FROM products_in_cart WHERE cart_id = ?",
      [1],
      expect.any(Function)
    );

    expect(runMock).toHaveBeenCalledTimes(1);
    expect(runMock).toHaveBeenCalledWith(
      "UPDATE carts SET total = ? WHERE cart_id = ?",
      [35.0, 1],
      expect.any(Function)
    );
  });
});

describe("CartDAO-removals", () => {
  let cartDAO: CartDAO;

  beforeEach(() => {
    cartDAO = new CartDAO();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // Test for removeProductFromCart
  test("should decrease the product quantity by 1 if the quantity is greater than 1", async () => {
    const serializeMock = jest
      .spyOn(db, "serialize")
      .mockImplementation((callback) => {
        if (typeof callback === "function") {
          callback();
        }
      });
    const getMock = jest
      .spyOn(db, "get")
      .mockImplementationOnce((sql, params, callback) =>
        callback(null, { cart_id: 1 })
      )
      .mockImplementationOnce((sql, params, callback) =>
        callback(null, { cart_id: 1, model: "Model123", quantity: 2 })
      );
    const runMock = jest
      .spyOn(db, "run")
      .mockImplementation((sql, params, callback) => 
        callback(null));

    await cartDAO.removeProductFromCart("test_customer", "Model123");

    expect(serializeMock).toHaveBeenCalled();
    expect(getMock).toHaveBeenCalledTimes(2);
    expect(runMock).toHaveBeenCalledWith(
      "UPDATE products_in_cart SET quantity = quantity - 1 WHERE cart_id = ? AND model = ?",
      [1, "Model123"],
      expect.any(Function)
    );
  });

  test("should remove the product from the cart if the quantity is 1", async () => {
    const serializeMock = jest
      .spyOn(db, "serialize")
      .mockImplementation((callback) => {
        if (typeof callback === "function") {
          callback();
        }
      });
    const getMock = jest
      .spyOn(db, "get")
      .mockImplementationOnce((sql, params, callback) =>
        callback(null, { cart_id: 1 })
      )
      .mockImplementationOnce((sql, params, callback) =>
        callback(null, { cart_id: 1, model: "Model123", quantity: 1 })
      );
    const runMock = jest
      .spyOn(db, "run")
      .mockImplementation((sql, params, callback) => 
        callback(null));

    await cartDAO.removeProductFromCart("test_customer", "Model123");

    expect(serializeMock).toHaveBeenCalled();
    expect(getMock).toHaveBeenCalledTimes(2);
    expect(runMock).toHaveBeenCalledWith(
      "DELETE FROM products_in_cart WHERE cart_id = ? AND model = ?",
      [1, "Model123"],
      expect.any(Function)
    );
  });

  // Test for clearCart
  test("should clear all products from the current cart of the customer", async () => {
    const serializeMock = jest
      .spyOn(db, "serialize")
      .mockImplementation((callback) => {
        if (typeof callback === "function") {
          callback();
        }
      });
    const getMock = jest
      .spyOn(db, "get")
      .mockImplementation((sql, params, callback) =>
        callback(null, { cart_id: 1 })
      );
    const runMock = jest
      .spyOn(db, "run")
      .mockImplementation((sql, params, callback) => 
        callback(null));

    await cartDAO.clearCart("test_customer");

    expect(serializeMock).toHaveBeenCalled();
    expect(getMock).toHaveBeenCalledTimes(1);
    expect(runMock).toHaveBeenCalledWith(
      "DELETE FROM products_in_cart WHERE cart_id = ?",
      [1],
      expect.any(Function)
    );
  });

  // Test for deleteAllCarts
  test("should delete all carts from the database", async () => {
    const serializeMock = jest
      .spyOn(db, "serialize")
      .mockImplementation((callback) => {
        if (typeof callback === "function") {
          callback();
        }
      });
    const runMock = jest
      .spyOn(db, "run")
      .mockImplementationOnce((sql, callback) => 
        callback(null))
      .mockImplementationOnce((sql, callback) => 
        callback(null));

    await cartDAO.deleteAllCarts();

    expect(serializeMock).toHaveBeenCalled();
    expect(runMock).toHaveBeenCalledWith(
      "DELETE FROM carts",
      expect.any(Function)
    );
    expect(runMock).toHaveBeenCalledWith(
      "DELETE FROM products_in_cart",
      expect.any(Function)
    );
  });
});
