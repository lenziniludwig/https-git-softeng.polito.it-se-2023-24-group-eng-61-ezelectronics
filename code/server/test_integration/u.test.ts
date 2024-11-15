import { describe, test, expect, beforeAll, afterAll } from "@jest/globals"
import request from 'supertest'
import { app } from "../index"
import { cleanup } from "../src/db/cleanup"
import { Cart } from "../src/components/cart"

const routePath = "/ezelectronics" //Base route path for the API

//Default user information. We use them to create users and evaluate the returned values
const customer = { username: "customer", name: "customer", surname: "customer", password: "customer", role: "Customer" }
const admin = { username: "admin", name: "admin", surname: "admin", password: "admin", role: "Admin" }
const manager = { username: "manager", name: "manager", surname: "manager", password: "manager", role: "Manager" }
//Cookies for the users. We use them to keep users logged in. Creating them once and saving them in a variables outside of the tests will make cookies reusable
let customerCookie: string
let adminCookie: string
let managerCookie: string

//Helper function that creates a new user in the database.
//Can be used to create a user before the tests or in the tests
//Is an implicit test because it checks if the return code is successful
const postUser = async (userInfo: any) => {
    await request(app)
        .post(`${routePath}/users`)
        .send(userInfo)
        .expect(200)
}

//Helper function that logs in a user and returns the cookie
//Can be used to log in a user before the tests or in the tests
const login = async (userInfo: any) => {
    return new Promise<string>((resolve, reject) => {
        request(app)
            .post(`${routePath}/sessions`)
            .send({ username: userInfo.username, password: userInfo.password })
            .expect(200)
            .end((err, res) => {
                if (err) reject(err)
                resolve(res.header["set-cookie"][0])
            })
    })
}

//Before executing tests, we remove everything from our test database, create an Admin user and log in as Admin, saving the cookie in the corresponding variable
beforeAll(async () => {
    await cleanup()
    //The cleanup function may not finish in time for the next operation, leading to potential issues
    //We wait 15 seconds before writing to the database, ensuring that the test suite contains what we need
    await new Promise(resolve => setTimeout(resolve, 15000))
    
    await postUser(admin)
    adminCookie = await login(admin)
    await postUser(manager)
    managerCookie = await login(manager)
    await postUser(customer)
    customerCookie = await login(customer)
})

//After executing tests, we remove everything from our test database
afterAll(async () => {
    await cleanup()
})

describe("U1: Login", () => {

    // Scenario 1.1: Successful login
    test("Successful login", async () => {
        await request(app)
            .post(`${routePath}/sessions`)
            .send({ username: customer.username, password: customer.password })
            .expect(200)
    })

    // Scenario 1.2: Wrong password
    test("Wrong password", async () => {
        await request(app)
            .post(`${routePath}/sessions`)
            .send({ username: customer.username, password: "wrong" })
            .expect(401)
    })

    // Scenario 1.3: Non-existent user
    test("Non-existent user", async () => {
        await request(app)
            .post(`${routePath}/sessions`)
            .send({ username: "nonexistent", password: "wrong" })
            .expect(401)
    })

    // Scenario 1.4: User already logged in
    test("User already logged in", async () => {
        await request(app)
            .post(`${routePath}/sessions`)
            .set("Cookie", customerCookie)
            .send({ username: customer.username, password: customer.password })
            .expect(401)
    })
});

describe("U2: Logout", () => {

    // Scenario 2.1: Successful logout
    test("Successful logout", async () => {
        await request(app)
            .delete(`${routePath}/sessions/current`)
            .set("Cookie", customerCookie)
            .expect(200)
    })

    // Scenario 2.2: User not logged in
    test("User not logged in", async () => {
        await request(app)
            .delete(`${routePath}/sessions/current`)
            .expect(401)
    })
});

describe("U3: Create Account", () => {

    // Scenario 3.1: Successful account creation
    test("Successful account creation", async () => {
        await request(app)
            .post(`${routePath}/users`)
            .send({ username: "newuser", name: "newuser", surname: "newuser", password: "newuser", role: "Customer" })
            .expect(200)
    })

    // Scenario 3.2: Username already exists
    test("Username already exists", async () => {
        await request(app)
            .post(`${routePath}/users`)
            .send({ username: "newuser", name: "newuser", surname: "newuser", password: "newuser", role: "Customer" })
            .expect(409)
    })

    // Scenario 3.3: Missing fields
    test("Missing fields", async () => {
        await request(app)
            .post(`${routePath}/users`)
            .send({ username: "newuser", name: "newuser", password: "newuser", role: "Customer" })
            .expect(422)
    })

});

describe("U4: View users", () => {

    // Scenario 4.1: View the information of one user
    test("View the information of one user", async () => {
        customerCookie = await login(customer)
        await request(app)
            .get(`${routePath}/users/${customer.username}`)
            .set("Cookie", customerCookie)
            .expect(200)
    })

    // Scenario 4.2: Ask to view the information of a user that does not exist
    test("Ask to view the information of a user that does not exist", async () => {
        await request(app)
            .get(`${routePath}/users/nonexistent`)
            .set("Cookie", adminCookie)
            .expect(404)
    })

    // Scenario 4.3: View the information of all users
    test("View the information of all users", async () => {
        await request(app)
            .get(`${routePath}/users`)
            .set("Cookie", adminCookie)
            .expect(200)
    })

    // Scenario 4.4: View the information of all users with a specific role
    test("View the information of all users with a specific role", async () => {
        await request(app)
            .get(`${routePath}/users/roles/Customer`)
            .set("Cookie", adminCookie)
            .expect(200)
    })

    // Scenario 4.5: Ask to view information of users with a role that does not exist
    test("Ask to view information of users with a role that does not exist", async () => {
        await request(app)
            .get(`${routePath}/users/roles/nonexistent`)
            .set("Cookie", adminCookie)
            .expect(422)
    })
});

//UC5: Delete one user
describe("U5: Delete one user", () => {

    // Scenario 5.1: Delete a user
    test("Delete a user", async () => {
        await request(app)
            .delete(`${routePath}/users/${customer.username}`)
            .set("Cookie", customerCookie)
            .expect(200)
    })

    // Scenario 5.2: Ask to delete a user that does not exist
    test("Ask to delete a user that does not exist", async () => {
        await request(app)
            .delete(`${routePath}/users/nonexistent`)
            .set("Cookie", adminCookie)
            .expect(404)
    })
});

/*UC6: Register products*/
// Precondition: Manager M exist && logged in (Did on teh line 50 and 51)
describe("U6: Register products", () => {

    // Scenario 6.1: Register a new product
    test("It should return a 200 success code and create a new product", async () => {
        const product = {
            model: "Example Model",
            category: "Smartphone",
            quantity: 10,
            details: "This is an example product",
            sellingPrice: 299.99,
        };
        await request(app)
            .post(`${routePath}/products`)
            .set("Cookie", [managerCookie])
            .send(product)
            .expect(200)
    })

    // Scenario 6.2: Try to register a product that already exists
    test("It should return a 409 error code", async () => {
        const product = {
            model: "Example Model",
            category: "Smartphone",
            quantity: 10,
            details: "This is an example product",
            sellingPrice: 299.99,
        };
        await request(app)
            .post(`${routePath}/products`)
            .set("Cookie", [managerCookie])
            .send(product)
            .expect(409)
    })

    // Scenario 6.3: Try to register a product with invalid input parameters
    test("It should return a 422 error code", async () => {
        const product = {
            model: "Example Model",
            category: "Smartphone",
            quantity: 10,
            details: "This is an example product",
            sellingPrice: "invalid",
        };
        await request(app)
            .post(`${routePath}/products`)
            .set("Cookie", [managerCookie])
            .send(product)
            .expect(422)
    })

    // Scenario 6.4: Update the quantity of a product
    test("It should return a 200 success code and update the quantity of the product", async () => {

        const prodNewQuanty = {
            model: "Example Model",
            quantity: 5,
        };
        await request(app)
            .patch(`${routePath}/products/${prodNewQuanty.model}`)
            .set("Cookie", [managerCookie])
            .send(prodNewQuanty)
            .expect(200)
    })

    // Scenario 6.5: Try to increase the quantity of a product that does not exist
    test("It should return a 404 error code", async () => {

        const prodNewQuanty = {
            model: "Nonexistent Model",
            quantity: 5,
        };
        await request(app)
            .patch(`${routePath}/products/${prodNewQuanty.model}`)
            .set("Cookie", [managerCookie])
            .send(prodNewQuanty)
            .expect(404)
    })
});


/*UC7:  Sell a product*/
describe("U7: Sell a product", () => {
    // Scenario 7.1: Sell a product after an in-store purchase
    test("It should return a 200 success code and update the quantity of the product", async () => {
        const product = {
            model: "Example Model",
            quantity: 2,
        };
        await request(app)
            .patch(`${routePath}/products/${product.model}/sell`)
            .set("Cookie", [managerCookie])
            .send(product)
            .expect(200)
    })
    // Scenario 7.2: Try to sell a product that does not exist
    test("It should return a 404 error code", async () => {
        const product = {
            model: "Nonexistent Model",
            quantity: 2,
        };
        await request(app)
            .patch(`${routePath}/products/${product.model}/sell`)
            .set("Cookie", [managerCookie])
            .send(product)
            .expect(404)
    })
    // Scenario 7.3: Try to sell an unavaiable product
    test("It should return a 409 error code", async () => {

        const prodToBeSold = {
            model: "To Be Sold Model",
            category: "Smartphone",
            quantity: 1,
            details: "This is an example product",
            sellingPrice: 500,
        };

        await request(app)
            .post(`${routePath}/products`)
            .set("Cookie", [managerCookie])
            .send(prodToBeSold)
            .expect(200)


        const productSoldOut = {
            model: "To Be Sold Model",
            quantity: 2
        };

        await request(app)
            .patch(`${routePath}/products/${productSoldOut.model}/sell`)
            .set("Cookie", [managerCookie])
            .send(productSoldOut)
            .expect(409)
    })

});

/*UC8: View products */
describe("U8: View products", () => {

    // Scenario 8.1: View information of a single product
    test("It should return a 200 success code and return the product", async () => {

        const product = {
            model: "Example Model",
        };
        await request(app)
            .get(`${routePath}/products?grouping=model&model=${product.model}`)
            .set("Cookie", [managerCookie])
            .expect(200)
    })

    // Scenario 8.2: Try to view information of a product that does not exist
    test("It should return a 404 error code", async () => {
        const product = {
            model: "Nonexistent Model",
        };
        await request(app)
            .get(`${routePath}/products?grouping=model&model=${product.model}`)
            .set("Cookie", [managerCookie])
            .expect(404)
    })

    // Scenario 8.3: View information of all products
    test("It should return a 200 success code and return all products", async () => {
        await request(app)
            .get(`${routePath}/products`)
            .set("Cookie", [managerCookie])
            .expect(200)
    })
    // Scenario 8.4: View information of all products of the same category
    test("It should return a 200 success code and return all products of the same category", async () => {
        const product = {
            category: "Smartphone",
        };
        await request(app)
            .get(`${routePath}/products?grouping=category&category=${product.category}`)
            .set("Cookie", [managerCookie])
            .expect(200)
    });

    // Scenario 8.5: Try to view information of all products with a category that does not exist
    test("It should return a 422 error code", async () => {
        const product = {
            category: "Nonexistent Category",
        };
        await request(app)
            .get(`${routePath}/products?grouping=category&category=${product.category}`)
            .set("Cookie", [managerCookie])
            .expect(422)
    });
    // Scenario 8.6: View information of all products with the same model
    test("It should return a 200 success code and return all products with the same model", async () => {
        const product = {
            model: "Example Model",
        };
        await request(app)
            .get(`${routePath}/products?grouping=model&model=${product.model}`)
            .set("Cookie", [managerCookie])
            .expect(200)
    });
    // Scenario 8.7: View information of all available products
    test("It should return a 200 success code and return all available products", async () => {
        await request(app)
            .get(`${routePath}/products/available`)
            .set("Cookie", [managerCookie])
            .expect(200)
    });
    // Scenario 8.8: View information of all available products of the same category
    test("It should return a 200 success code and return all available products of the same category", async () => {
        const product = {
            category: "Smartphone",
        };
        await request(app)
            .get(`${routePath}/products/available?grouping=category&category=${product.category}`)
            .set("Cookie", [managerCookie])
            .expect(200)
    });
    // Scenario 8.9: View information of all available products with the same model
    test("It should return a 200 success code and return all available products with the same model", async () => {
        const product = {
            model: "Example Model",
        };
        await request(app)
            .get(`${routePath}/products/available?grouping=model&model=${product.model}`)
            .set("Cookie", [managerCookie])
            .expect(200)
    });
});

//UC9: Delete one product
describe("U9: Delete one product (UC9)", () => {

    // Scenario 9.1: Delete one product
    test("Delete one product", async () => {
        const prodToDelete = {
            model: "iPhone 12 Pro Max",
            category: "Smartphone",
            quantity: 1,
            details: "This is an example product",
            sellingPrice: 500
        };

        await request(app)
            .post(`${routePath}/products`)
            .send(prodToDelete)
            .set("Cookie", managerCookie)
            .expect(200)
    });

    // Scenario 9.2: Try to delete a product that does not exist
    test("Try to delete a product that does not exist", async () => {
        await request(app)
            .delete(`${routePath}/products/nonexistent`)
            .set("Cookie", managerCookie)
            .expect(404)
    });
});



// UC 10 - mitra
describe("UC10: Manage carts", () => {

    test("Scenario 10.1 - View the current cart (not paid yet)", async () => {
        await postUser(customer)
        customerCookie = await login(customer)

        const response = await request(app)
            .get(`${routePath}/carts`)
            .set("Cookie", customerCookie)
            .expect(200);

        expect(response.body.customer).toBe("customer");
        expect(response.body.products).toHaveLength(0);
    });

    test("Scenario 10.1 and 10.3 - add a product to cart and view current unpaid cart", async () => {
        const productToAdd = {
            model: "mi-10.3",
            category: "Smartphone",
            quantity: 1,
            details: "This is an example product",
            sellingPrice: 500,
        };

        // add product to the database
        await request(app)
            .post(`${routePath}/products`)
            .send(productToAdd)
            .set("Cookie", managerCookie)
            .expect(200);

        await request(app)
            .post(`${routePath}/carts`)
            .send({ model: productToAdd.model })
            .set("Cookie", customerCookie)
            .expect(200);

        const response = await request(app)
            .get(`${routePath}/carts`)
            .set("Cookie", customerCookie)
            .expect(200);

        expect(response.body.customer).toBe("customer");
        expect(response.body.products).toHaveLength(1);
    });

    test("Scenario 10.2 and 10.6- View the history of already paid carts", async () => {
        const productToAdd = {
            model: "mi-10.2",
            category: "Smartphone",
            quantity: 1,
            details: "This is an example product",
            sellingPrice: 500,
        };

        // Add a product to the database
        await request(app)
            .post(`${routePath}/products`)
            .send(productToAdd)
            .set("Cookie", managerCookie)
            .expect(200);

        // Add the product to the cart
        await request(app)
            .post(`${routePath}/carts`)
            .send({ model: productToAdd.model })
            .set("Cookie", customerCookie)
            .expect(200);

        // Retrieve the cart
        const res = await request(app)
            .get(`${routePath}/carts`)
            .set("Cookie", customerCookie)
            .expect(200);

        // Check if the response contains the expected properties
        expect(res.body).toBeDefined();
        expect(res.body.products).toBeDefined();
        expect(res.body.products.length).toBeGreaterThan(0);

        // Mark the cart as paid
        await request(app)
            .patch(`${routePath}/carts`)
            .set("Cookie", customerCookie)
            .expect(200);

        // Retrieve the cart history
        const response = await request(app)
            .get(`${routePath}/carts/history`)
            .set("Cookie", customerCookie)
            .expect(200);

        // Check if the paid cart appears in the history
        expect(response.body).toBeDefined();
        expect(response.body.length).toBeGreaterThan(0);
        expect(response.body.some((cart: Cart) => cart.paid)).toBe(true);
    });

    test("Scenario 10.4 - Try to add a product that does not exist ", async () => {
        const nonExistentProductModel = "non-existent-model";

        // Attempt to add the non-existent product to the cart
        const response = await request(app)
            .post(`${routePath}/carts`)
            .send({ model: nonExistentProductModel })
            .set("Cookie", customerCookie);

        expect(response.statusCode).toBe(404);
        expect(response.body.error).toBe("Product not found");
    });

    test("Scenario 10.5 - Try to add a product with zero quantity to a new cart", async () => {
        // Create a product with quantity 1 - (quantity will become 0 for final test)
        const productToAdd = {
            model: "product-with-quantity-1",
            category: "Smartphone",
            quantity: 1,
            details: "This is a product with quantity 1",
            sellingPrice: 500,
        };

        // Add the product to the database
        await request(app)
            .post(`${routePath}/products`)
            .send(productToAdd)
            .set("Cookie", managerCookie)
            .expect(200);

        // Add the product to a cart
        await request(app)
            .post(`${routePath}/carts`)
            .send({ model: productToAdd.model })
            .set("Cookie", customerCookie)
            .expect(200);

        // Pay for the cart (to make the quantity 0)
        await request(app)
            .patch(`${routePath}/carts`)
            .set("Cookie", customerCookie)
            .expect(200);

        // Attempt to add the same product (which its quantity is 0 now) to a new cart
        const response = await request(app)
            .post(`${routePath}/carts`)
            .send({ model: productToAdd.model })
            .set("Cookie", customerCookie);

        expect(response.statusCode).toBe(409);
        expect(response.body.error).toBe("Product stock is empty");
    });

    test("Scenario 10.6 - Pay for the current cart", async () => {
        const productToAdd = {
            model: "mi-10.6",
            category: "Smartphone",
            quantity: 1,
            details: "This is an example product",
            sellingPrice: 500,
        };

        // Add a product to the database
        await request(app)
            .post(`${routePath}/products`)
            .send(productToAdd)
            .set("Cookie", managerCookie)
            .expect(200);

        // Add the product to the cart
        await request(app)
            .post(`${routePath}/carts`)
            .send({ model: productToAdd.model })
            .set("Cookie", customerCookie)
            .expect(200);

        // Pay for cart
        await request(app)
            .patch(`${routePath}/carts`)
            .set("Cookie", customerCookie)
            .expect(200);
    });



    test("Scenario 10.7 - Try to pay for an empty cart", async () => {
        const productToAdd = {
            model: "mi-10.7",
            category: "Smartphone",
            quantity: 1,
            details: "This is an example product",
            sellingPrice: 500,
        };

        // Add a product to the database
        await request(app)
            .post(`${routePath}/products`)
            .send(productToAdd)
            .set("Cookie", managerCookie)
            .expect(200);

        // Add the product to the cart
        await request(app)
            .post(`${routePath}/carts`)
            .send({ model: productToAdd.model })
            .set("Cookie", customerCookie)
            .expect(200);

        // Remove the product from cart (to make cart empty)
        await request(app)
            .delete(`${routePath}/carts/products/${productToAdd.model}`)
            .set("Cookie", customerCookie)
            .expect(200);

        // Pay for cart
        const res = await request(app)
            .patch(`${routePath}/carts`)
            .set("Cookie", customerCookie)
            .expect(404);

            expect(res.body.error).toBe("Cart is empty");
    });


    test("Scenario 10.8 - Try to pay for a cart that does not exist", async () => {
        // first, Delete the current cart
        await request(app)
            .delete(`${routePath}/carts`)
            .set("Cookie", managerCookie)
            .expect(200);

        // Pay for cart that does not exist
        const res = await request(app)
            .patch(`${routePath}/carts`)
            .set("Cookie", customerCookie)
            .expect(404);

        expect(res.body.error).toBe("Cart not found");
    });


    test("Scenario 10.9 - Remove one product instance product from the current cart", async () => {
        const productToAdd = {
            model: "mi-10.9",
            category: "Smartphone",
            quantity: 1,
            details: "This is an example product",
            sellingPrice: 500,
        };

        // Add a product to the database
        await request(app)
            .post(`${routePath}/products`)
            .send(productToAdd)
            .set("Cookie", managerCookie)
            .expect(200);

        // Add the product to the cart
        await request(app)
            .post(`${routePath}/carts`)
            .send({ model: productToAdd.model })
            .set("Cookie", customerCookie)
            .expect(200);

        // delete product from cart
        await request(app)
            .delete(`${routePath}/carts/products/${productToAdd.model}`)
            .set("Cookie", customerCookie)
            .expect(200);
    });

    test("Scenario 10.10 - Try to remove a product that does not exist from the current cart", async () => {

        // delete product from cart
        const res = await request(app)
            .delete(`${routePath}/carts/products/${"a-non-existing-model"}`)
            .set("Cookie", customerCookie)
            .expect(404)

        expect(res.body.error).toBe("Product not found");
    });

    test("Scenario 10.11 - Try to remove a product from a cart that does not exist", async () => {
        const productToAdd = {
            model: "mi-10.11",
            category: "Smartphone",
            quantity: 1,
            details: "This is an example product",
            sellingPrice: 500,
        };

        // Add a product to the database
        await request(app)
            .post(`${routePath}/products`)
            .send(productToAdd)
            .set("Cookie", managerCookie)
            .expect(200);

        // Add the product to the cart
        await request(app)
        .post(`${routePath}/carts`)
        .send({ model: productToAdd.model })
        .set("Cookie", customerCookie)
        .expect(200);

        // Pay for cart - we want user not to have unpaid cart
        await request(app)
        .patch(`${routePath}/carts`)
        .set("Cookie", customerCookie)
        .expect(200);

        // delete product from cart while there is no unpaid cart
        const res = await request(app)
            .delete(`${routePath}/carts/products/${"mi-10.11"}`)
            .set("Cookie", customerCookie)
            .expect(404);

        expect(res.body.error).toBe("Cart not found");
    });

    test("Scenario 10.12 -  Try to remove a product that is not in the current cart", async () => {
        const productNotInCart = {
            model: "productNotInCart",
            category: "Smartphone",
            quantity: 1,
            details: "This is an example product",
            sellingPrice: 500,
        };

        // Add a product to the database
        await request(app)
            .post(`${routePath}/products`)
            .send(productNotInCart)
            .set("Cookie", managerCookie)
            .expect(200);

            const productInCart = {
                model: "productInCart",
                category: "Smartphone",
                quantity: 1,
                details: "This is an example product",
                sellingPrice: 500,
            };
    
            // Add a product to the database
            await request(app)
                .post(`${routePath}/products`)
                .send(productInCart)
                .set("Cookie", managerCookie)
                .expect(200);

            // add 2nd product to cart
        await request(app)
        .post(`${routePath}/carts`)
        .send({ model: productInCart.model })
        .set("Cookie", customerCookie)
        .expect(200);


        // delete product from cart
        const res = await request(app)
            .delete(`${routePath}/carts/products/${"productNotInCart"}`)
            .set("Cookie", customerCookie)
            .expect(404)

        expect(res.body.error).toBe("Product not in cart");
    });

});

// UC 11 - mitra

describe("UC11: Delete the current cart", () => {

    test("Scenario 11.1 - Delete the current cart ", async () => {
        const productToAdd = {
            model: "mi-11.1",
            category: "Smartphone",
            quantity: 1,
            details: "This is an example product",
            sellingPrice: 500,
        };

        // Add a product to the database
        await request(app)
            .post(`${routePath}/products`)
            .send(productToAdd)
            .set("Cookie", managerCookie)
            .expect(200);

        // Add the product to the cart
        await request(app)
            .post(`${routePath}/carts`)
            .send({ model: productToAdd.model })
            .set("Cookie", customerCookie)
            .expect(200);

        // Delete the current cart
        await request(app)
            .delete(`${routePath}/carts/current`)
            .set("Cookie", customerCookie)
            .expect(200);

        // Retrieve the cart and Check if the response contains the expected properties
        const response = await request(app)
            .get(`${routePath}/carts`)
            .set("Cookie", customerCookie)
            .expect(200);

        expect(response.body.customer).toBe("customer");
        expect(response.body.products).toHaveLength(0);

        // there is no route by which customer can delete the current cart
        // this route just makes the current cart empty

    });

    test("Scenario 11.2 - Try to delete the current cart when there is none", async () => {
        // first, Delete the current cart
        await request(app)
            .delete(`${routePath}/carts`)
            .set("Cookie", managerCookie)
            .expect(200);
            
        // Delete the current cart
        const res = await request(app)
            .delete(`${routePath}/carts/current`)
            .set("Cookie", customerCookie)
            .expect(404);

        expect(res.body.error).toBe("Cart not found");

    });

});





//UC12: Edit user information
describe("U12: Edit user information", () => {

    // Scenario 12.1: Edit user information
    test("Edit user information", async () => {
        await request(app)
            .patch(`${routePath}/users/${customer.username}`)
            .set("Cookie", customerCookie)
            .send({ name: "newname", surname: "newsurname", address: "newaddress", birthdate: "2021-01-01" })
            .expect(200)
    })
});

//UC13: Delete all non-Admin users
describe("U13: Delete all non-Admin users", () => {

    // Scenario 13.1: Delete all users
    test("Delete all non-Admin users", async () => {
        await request(app)
            .delete(`${routePath}/users`)
            .set("Cookie", adminCookie)
            .expect(200)
    })
});

//UC14: Delete all products
describe("U14: Delete all products (UC14)", () => {

    // Scenario 14.1: Delete all products
    test("Scenario 14.1 - Delete all products", async () => {
        await postUser(customer)
        customerCookie = await login(customer)
        await postUser(manager)
        managerCookie = await login(manager)
        const product1 = {
            model: "product1",
            category: "Smartphone",
            quantity: 1,
            details: "This is an example product",
            sellingPrice: 500
        };

        const product2 = {
            model: "product2",
            category: "Smartphone",
            quantity: 1,
            details: "This is an example product",
            sellingPrice: 200
        };

        await request(app)
            .post(`${routePath}/products`)
            .send(product1)
            .set("Cookie", managerCookie)
            .expect(200)

        await request(app)
            .post(`${routePath}/products`)
            .send(product2)
            .set("Cookie", managerCookie)
            .expect(200)

        await request(app)
            .delete(`${routePath}/products`)
            .set("Cookie", adminCookie)
            .expect(200)
    });
});

//UC15: View all carts
describe("U15: View all carts", () => {

    // Scenario 15.1: View all carts
    test("Scenario 15.1 - View all carts", async () => {
        const productToAdd = {
            model: "productToAdd",
            category: "Smartphone",
            quantity: 1,
            details: "This is an example product",
            sellingPrice: 500
        };

        await request(app)
            .post(`${routePath}/products`)
            .send(productToAdd)
            .set("Cookie", managerCookie)
            .expect(200)

        await request(app)
            .post(`${routePath}/carts`)
            .send({ model: productToAdd.model })
            .set("Cookie", customerCookie)
            .expect(200)

        const response = await request(app)
            .get(`${routePath}/carts`)
            .set("Cookie", customerCookie)
            .expect(200)

        expect(response.body.customer).toBe("customer")
        expect(response.body.products).toHaveLength(1)
    });
});

//UC16: Delete all carts
describe("U16: Delete all carts", () => {

    // Scenario 16.1: Delete all carts
    test("Scenario 16.1 - Delete all carts", async () => {

        const productToDeleteCart = {
            model: "productToDeleteCart",
            category: "Smartphone",
            quantity: 1,
            details: "This is an example product",
            sellingPrice: 500
        };

        await request(app)
            .post(`${routePath}/products`)
            .send(productToDeleteCart)
            .set("Cookie", managerCookie)
            .expect(200)

        await request(app)
            .post(`${routePath}/carts`)
            .send({ model: productToDeleteCart.model })
            .set("Cookie", customerCookie)
            .expect(200)

        await request(app)
            .delete(`${routePath}/carts`)
            .set("Cookie", adminCookie)
            .expect(200)
    });
});

describe("U17: Manage reviews", () => {

    // Scenario 17.1: Add a review to a product
    test("Scenario 17.1 - Add a review to a product", async () => {
        const productToReview = {
            model: "productToReview",
            category: "Smartphone",
            quantity: 1,
            details: "This is an example product",
            sellingPrice: 500
        };

        await request(app)
            .post(`${routePath}/products`)
            .send(productToReview)
            .set("Cookie", managerCookie)
            .expect(200)

        await request(app)
            .post(`${routePath}/reviews/${productToReview.model}`)
            .send({ score: 5, comment: "A very cool smartphone!" })
            .set("Cookie", customerCookie)
            .expect(200)
    });

    // Scenario 17.2: Delete review given to a product
    test("Scenario 17.2 - Delete review given to a product", async () => {
        const productToReview = {
            model: "productToReview",
            category: "Smartphone",
            quantity: 1,
            details: "This is an example product",
            sellingPrice: 500
        };
        await request(app)
            .delete(`${routePath}/reviews/${productToReview.model}`)
            .set("Cookie", customerCookie)
            .expect(200)
    });
});

//UC18: View reviews
describe("U18: View reviews", () => {

    // Scenario 18.1: View the reviews of a product
    test("Scenario 18.1 - View the reviews of a product", async () => {
        const productToReview1 = {
            model: "productToReview1",
            category: "Smartphone",
            quantity: 1,
            details: "This is an example product",
            sellingPrice: 500
        };

        await request(app)
            .post(`${routePath}/products`)
            .send(productToReview1)
            .set("Cookie", managerCookie)
            .expect(200)

        await request(app)
            .post(`${routePath}/reviews/${productToReview1.model}`)
            .send({ score: 5, comment: "A very cool smartphone!" })
            .set("Cookie", customerCookie)
            .expect(200)

        const response = await request(app)
            .get(`${routePath}/reviews/${productToReview1.model}`)
            .set("Cookie", customerCookie)
            .expect(200)

        expect(response.body).toHaveLength(1)
        expect(response.body[0].score).toBe(5)
        expect(response.body[0].comment).toBe("A very cool smartphone!")
    });
});

//UC19: Delete reviews
describe("U19: Delete reviews", () => {

    // Scenario 19.1: Delete all reviews of one product
    test("Scenario 19.1 - Delete all reviews of one product", async () => {
        const productToReview = {
            model: "productToReview",
            category: "Smartphone",
            quantity: 1,
            details: "This is an example product",
            sellingPrice: 500
        };

        await request(app)
            .delete(`${routePath}/reviews/${productToReview.model}/all`)
            .set("Cookie", adminCookie)
            .expect(200)
    });

    test("Scenario 19.2 - Delete all reviews", async () => {
        await request(app)
            .delete(`${routePath}/reviews`)
            .set("Cookie", adminCookie)
            .expect(200)
    });
});


