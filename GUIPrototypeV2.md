# Graphical User Interface Prototype - FUTURE

Authors: Group 61

Date: 01-05-2024

Version: 2.0

| Version | Changes | 
| ----------------- |:-----------|
| 1.0 | Added GUI Images |


## Use Case 1: Login
![](PNGfiles/GUIV2/LoginV2_1.png)
Whether the user inputs wrong credential an error message is displayed.
![](PNGfiles/GUIV2/LoginV2_2.png)
When the user correctly inserts the username/email and password, he/she is logged in and is able to see the homepage.

## Use Case 2: Register (Sign up)
![](PNGfiles/GUIV2/SignupV2_1.png)
Whether the user inputs a username or email already existing an error message is displayed.
![](PNGfiles/GUIV2/SignupV2_2.png)
Then, he/she is logged in and is able to see the homepage.

## Use Case 3 and 16: Tech Admin Actions (defining roles, edit database)
From the Tach page it is possible to view/edit/delete user data, shopping carts and orders, also it is possible to create a new user and change role by selecting it with username
![](PNGfiles/GUIV2/TechAdminPageV2.png)
When you want to edit an order, cart or user, the appropriate dialog box opens.
![](PNGfiles/GUIV2/TechAdminEditMsgV2.png)
Each action is followed by a confirmation or cancellation message.
![](PNGfiles/GUIV2/TechAdminPageEditConfirmV2.png)
![](PNGfiles/GUIV2/TechAdminPageDeletingConfirmV2.png)

## Use Case 5 and 6: Account Management (Edit info or Delete Account)
In the account page it is possible to change the password, view the history of carts including the current one including status, change the password and delete the account
![](PNGfiles/GUIV2/AccountPageV2.png)
When the password is changed or the account deleted, system messages appear asking for confirmation to proceed and completed action messages.
![](PNGfiles/GUIV2/AccountPageMsgV2.png)

## Use Case 7 and 9: Cart Management
Customer can visualize his current cart and the products associated. He's able to edit the quantities of the products inside the cart and proceed to pay.
![](PNGfiles/GUIV2/CartV2.png)

## Use Case 8: Payment
After the user confirmed the cart using the "Pay Now" button in the cart page, he's able to insert the payment information into dedicated form.
![](PNGfiles/GUIV2/Payment.png)
An error message can occur when the payment is rejected.
![](PNGfiles/GUIV2/Payment_error.png)

## Use Case 10: Product Management
A user who has manager privileges can manage products:
* register the arrival of a set of products, get listings by model, category or even the whole dataset of products, create a new product
![](PNGfiles/GUIV2/ManagerV2.png)
possibly generating an error message associated with the arrival date inserted or an "already existing product" error message
![](PNGfiles/GUIV2/ManagerV2_errordatenew.png)
![](PNGfiles/GUIV2/ManagerV2_errorproductexists.png)
* get info/delete about a specific product, possibly generating two distinct error massages
![](PNGfiles/GUIV2/ManagerV2_errorsold.png)
![](PNGfiles/GUIV2/ManagerV2_wrongcode.png)

## Use Case 11, 4: Search Item, Logout
User can navigate through the site and search for items, using the search bar or directly clicking on a product in order to open its own product page. He can also logout using the proper button (UC#4).
![](PNGfiles/GUIV2/HomePageV2_logged.png)
![](PNGfiles/GUIV2/productPageV2.png)

## Use Case 12: Order Processing Team
Order Processing Team is responsible for processing products. From their interface they can update the status of an order and visualize every orders classified as "to-be processed".
![](PNGfiles/GUIV2/OrderProcessingTeam.png)

## Use Case 13-14: Shipment Team
Shipment Team is responsible for delivery orders. From their interface they can update the status of an order and visualize every orders classified as "to-be delivered".
![](PNGfiles/GUIV2/ShipmentTeam.png)

## Use Case 15 and 18: Checking Order Status and Customer Rating
On the account page, it is possible to check the order status for every orders made by the customer. Moreover, the customer can rate a product with specific stars from zero to five, if and only if that specific order has been already delivered.
![](PNGfiles/GUIV2/ratePageV2.png)

## Use Case 16: Customer Service (read-only database)
Customer Service Team is responsible for customer support. From their interface they can retrieve information about customers, orders and carts, in order to being able to provide useful information to the customer.
![](PNGfiles/GUIV2/CustomerService.png)

## Use Case 17: Business administration
An authorized user, through the Business page, can analyze the performance for the entire year and figure out which category sold the most and how many units were sold.
![](PNGfiles/GUIV2/BusinessPageV2.png)

