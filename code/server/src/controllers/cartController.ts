import { User } from "../components/user";
import { Cart, ProductInCart } from "../components/cart";
import CartDAO from "../dao/cartDAO";
import ProductDAO from "../dao/productDAO";
import { CartNotFoundError, EmptyCartError, ProductNotInCartError } from "../errors/cartError";
import { ProductNotFoundError, EmptyProductStockError, LowProductStockError } from "../errors/productError";

/**
 * Controller class for managing shopping cart operations.
 */
class CartController {
    private dao: CartDAO;
    private productdao: ProductDAO;

    constructor() {
        this.dao = new CartDAO();
        this.productdao = new ProductDAO();
    }

    /**
     * Adds a product to the user's cart.
     * @param user The user who wants to add the product to the cart.
     * @param productId The ID of the product to add.
     * @throws Will throw an error if the product is not found or if the product is out of stock.
     */
    async addToCart(user: User, productId: string): Promise<void> {
        const product = await this.productdao.getProductByModel(productId);
        if (!product) {
            throw new ProductNotFoundError();
        }
        else if (product.quantity <= 0) {
            throw new EmptyProductStockError();
        }

        const productInCart = new ProductInCart(product.model, 1, product.category, product.sellingPrice);
        await this.dao.addToCart(user.username, productInCart);
    }

    /**
     * Retrieves the current cart of the user.
     * @param user The user whose cart is to be retrieved.
     * @returns A promise that resolves to the user's cart.
     */
    async getCart(user: User): Promise<Cart> {
        const cart = await this.dao.getCart(user.username);
        if (!cart || cart.products.length === 0) {
            return new Cart(user.username, false, '', 0, []);
        }
        return cart;
    }

    /**
     * Checks out the user's current cart.
     * @param user The user who wants to check out their cart.
     * @throws Will throw an error if the cart is not found, if the cart is empty, or if any product in the cart is out of stock.
     */
    async checkoutCart(user: User): Promise<void> {
        const cart = await this.dao.getCart(user.username);
        if (!cart) {
            throw new CartNotFoundError();
        }
        if (cart.products.length === 0) {
            throw new EmptyCartError();
        }

        for (const productInCart of cart.products) {
            const product = await this.productdao.getProductByModel(productInCart.model);
            if (product.quantity == 0) {
                throw new EmptyProductStockError();
            }
            else if (product.quantity < productInCart.quantity) {
                throw new LowProductStockError();
            }
        }

        const paymentDate = new Date().toISOString().split('T')[0];
        const total = cart.products.reduce((sum, p) => sum + p.price * p.quantity, 0);

        await this.dao.checkoutCart(user.username, paymentDate, total);
        for (const product of cart.products) {
            await this.productdao.updateProductQuantity(product.model, -product.quantity);
        }
    }

    /**
     * Retrieves the history of paid carts for the user.
     * @param user The user whose cart history is to be retrieved.
     * @returns A promise that resolves to an array of carts.
     */
    async getCustomerCarts(user: User): Promise<Cart[]> {
        return await this.dao.getCustomerCarts(user.username);
    }

    /**
     * Removes a product from the user's cart.
     * @param user The user who wants to remove a product from their cart.
     * @param productModel The model of the product to remove.
     * @throws Will throw an error if the product is not found or if the product is not in the cart.
     */
    async removeProductFromCart(user: User, productModel: string): Promise<void> {
        const product = await this.productdao.getProductByModel(productModel);
        if (!product) {
            throw new ProductNotFoundError();
        }

        const cart = await this.dao.getCart(user.username);
        if (!cart) {
            throw new CartNotFoundError();
        }
        if (cart === undefined || cart.products.length === 0) {
            throw new EmptyCartError();
        }

        const productInCart = cart.products.find(p => p.model === productModel);
        if (!productInCart) {
            throw new ProductNotInCartError();
        }

        await this.dao.removeProductFromCart(user.username, productModel);
    }

    /**
     * Clears the user's current cart.
     * @param user The user who wants to clear their cart.
     * @throws Will throw an error if the cart is not found.
     */
    async clearCart(user: User): Promise<void> {
        const cart = await this.dao.getCart(user.username);
        if (!cart) {
            throw new CartNotFoundError();
        }

        await this.dao.clearCart(user.username);
    }

    /**
     * Deletes all carts from the database.
     */
    async deleteAllCarts(): Promise<void> {
        await this.dao.deleteAllCarts();
    }

    /**
     * Retrieves all carts from the database.
     * @returns A promise that resolves to an array of all carts.
     */
    async getAllCarts(): Promise<Cart[]> {
        return await this.dao.getAllCarts();
    }
}

export default CartController;
