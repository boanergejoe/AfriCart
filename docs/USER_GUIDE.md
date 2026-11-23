# AfriCart User Guide

AfriCart has two user-facing interfaces:

| Interface | Who uses it | Current web address |
| --- | --- | --- |
| **Storefront** (mobile app + web) | Customers | `https://africart-mobile-five.vercel.app/` |
| **Admin console** | Store staff / administrators | `https://afri-cart-cfe2.vercel.app/login` |

The storefront runs on phones (iOS/Android) and in a browser. The admin console is a browser-only
dashboard. Both talk to the same backend API.

For installation, configuration and development details, see the
[Technical Guide](./TECHNICAL_GUIDE.md).

---

## Part 1 — Customer guide

### 1. Create an account and sign in

**On the web:**

1. Open the storefront and choose **Sign in** or **Create account**.
2. Enter an email address and password, or use a configured social provider.
3. If you are registering, verify your email using the code Clerk sends.

**In the native app:**

1. On the welcome screen choose **Sign in with email** or **Create account with email**.
   - **Continue with Google** and **Continue with Apple** are also available when configured.
2. Sign-up requires a valid email and a password of at least **8 characters**.
3. After creating the account, enter the emailed verification code under **Verify email**.
   Use **Resend code** if it does not arrive.
4. Sign-in validates your email format and password, then opens the **Shop** tab.

Your session is stored securely on the device and stays active until you sign out or it expires.
If a login requires extra verification, the app says **Additional verification needed**.

> **Note:** The native app does not currently include a “forgot password” screen. The web sign-in
> component may offer account recovery depending on your Clerk configuration.

### 2. Browse and find products

The **Shop** tab is the home catalog.

- Use the **Search for products** field to search product names, categories, and descriptions.
- Tap a category chip — **All**, **Electronics**, **Fashion**, **Sports**, **Books**, or
  **Accessories** — to filter the grid.
- Open **Sort products** to choose **Featured**, **Price: low to high**, **Price: high to low**, or
  **Top rated**.
- Each product card shows its image, category, rating and review count, price, and a heart button
  for your wishlist. Tap **Add** to place one item in your cart; out-of-stock items cannot be added.
- Product lists are searched, filtered and sorted on the currently loaded catalog; there is no
  infinite scroll or pagination in the storefront.

### 3. View a product

Tap any product card to open its detail screen. Here you can:

- swipe through the product image gallery;
- see the rating, stock level, price and full description;
- choose a quantity with the stepper (minimum 1, maximum available stock — trying to go higher shows
  **Maximum stock reached**);
- add the product to your wishlist with the heart icon;
- tap **Add to cart** with the computed total, unless the item is out of stock.

### 4. Manage your cart

Open the **Cart** tab to review your items.

- Change quantities with the `+` / `−` controls; quantities cannot go below 1.
- Remove an item with its remove action and confirm **Remove \<item\> from your cart?**.
- Your order summary shows **Subtotal**, flat **Shipping $10.00**, **8% Tax**, and **Total**.
- The bottom bar shows the item count and total and the **Pay with PesaPal** button.

There is no “clear cart” button in the app; remove items individually. Increasing a quantity in the
cart is not currently limited to available stock on the client, so the server may reject an order if
stock is insufficient.

### 5. Checkout and pay with PesaPal

1. Have at least one saved delivery address (see [Addresses](#8-addresses)). With no address, the
   app shows **Shipping address required** and opens the address screen.
2. Tap **Pay with PesaPal**, then choose an address in the **Select Address** dialog (your default
   is preselected) and tap **Continue to Payment**.
3. The app creates a pending order using your server-side cart and current prices, then opens the
   PesaPal checkout page.
   - On the web, you are redirected in the same tab.
   - In the app, a secure browser opens and the app checks the payment status periodically.
4. If prices changed between viewing the cart and checkout, the app stops with **Cart total changed**
   and does not open the payment page. Review your cart and try again.
5. Complete the payment on PesaPal. You will return to the **payment callback** screen, which shows
   the payment state with a reference number and offers:
   - **View My Orders**
   - **Return to cart**
   - **Sign in** if your session expired

Possible outcomes include **Payment confirmed**, **Payment is processing…**, **Payment received**
(with an inventory note), and failure/invalid/reversed states. If you see an error or a timeout,
check **My Orders** before paying again — the system confirms payment independently through PesaPal's
IPN even if you close the page.

**Payment status vs. order status:** your order screen shows both. Payment status comes from PesaPal
(e.g. succeeded, pending, failed/reversed); order status is AfriCart's fulfilment state:
`pending` → `shipped` → `delivered`.

### 6. Orders and ratings

Open **Profile → Orders** (“My Orders”) to see past purchases with their order number, date, items,
total, PesaPal label, payment status and order status.

- A **retry** action is available when appropriate.
- Delivered orders that you have not reviewed yet show **Leave Rating**. Rate **every item** from
  1–5 stars; the app shows **Please rate all products** until all items are rated.
- Notes such as inventory review or stock restored after a reversal are displayed on affected
  orders.

The app does not have a separate order-tracking map or detailed shipment timeline.

### 7. Edit your profile

**Profile → Edit Profile** changes your Clerk first and last name. A first name is required. Other
account details are managed by Clerk through the web sign-in experience.

### 8. Addresses

**Profile → Addresses** (“My Addresses”) lists saved delivery addresses. Use the add/edit form to
enter:

- **Label** (for example, Home or Work)
- **Full name**
- **Street address**
- **City**
- **State**
- **ZIP code**
- **Phone number** (7–15 digits, optionally starting with `+`)
- A **default** switch

All fields are required. You can edit or delete an address; deletion asks for confirmation. The
default address is preselected at checkout.

### 9. Wishlist

**Profile → Wishlist** shows saved products. From here you can open a product, add it to the cart, or
remove it with confirmation. Out-of-stock items do not show an add-to-cart action. The wishlist error
state has no retry button, but you can navigate away and return.

### 10. Privacy & Security and sign out

**Profile → Privacy & Security** is currently informational. **Change Password** is shown, but the
switches are disabled and **Account Activity**, **Connected Devices**, **Download Your Data**, and
**Delete Account** display “Not available yet” / support messages. Preferences entered there are not
saved.

Use **Sign Out** on the Profile tab to end your session.

### 11. Known storefront limitations

- Native sign-up requires email verification; there is no native password-reset screen.
- No coupon, gift options, card payments, or custom payment methods — PesaPal is the only provider.
- Prices display with `$`; a flat $10 shipping fee and 8% tax are used in the summary.
- No product review listing screen, order detail/tracking screen, pagination, push notifications,
  biometric login, 2FA, or account deletion.
- Search/filter/sort operate only on the catalog already loaded by the app.

---

## Part 2 — Admin console guide

### 1. Sign in and sign out

1. Open `/login` and enter the configured **admin email** and password. Use the eye icon to show or
   hide the password.
2. Select **Sign in**. A successful login shows a confirmation message and opens the page you
   originally requested (or the dashboard).
3. Sessions expire after **12 hours** and are tied to the browser tab. There is no “remember me”;
   closing the tab signs you out.
4. Use **Sign out** in the top navigation. Five failed attempts for the same email/IP within
   15 minutes will temporarily block login (HTTP 429).

> Admin login is separate from customer accounts. Never use a customer's Clerk credentials here.

### 2. Dashboard

The **Dashboard** page (“Store overview”) shows four headline numbers:

- **Total Revenue** — summed from successful PesaPal payments only
- **Total Orders**
- **Total Customers**
- **Total Products**

A **Recent orders** table lists the five newest orders with order ID, customer, item count, amount,
status and date.

### 3. Products

Open **Products** to manage the catalog.

**Find products**

- Search by product name, category or description (results update after a short pause).
- Use the **All categories** filter to narrow the list.
- The grid shows 9 products per page with **Previous** / **Next** controls.

Each card displays the image, category, name, description, price, **Stock**, and a status badge:
**Out of Stock**, **Low Stock** (fewer than 20), or **In Stock**.

**Add a product**

1. Select **Add product** and complete **Add a new product**:
   - **Product name** (up to 120 characters)
   - **Category** — Electronics, Accessories, Fashion, Sports or Books
   - **Price (USD)** (non-negative, two decimal places)
   - **Stock** (non-negative whole number)
   - **Description** (up to 1000 characters)
   - at least one product image
2. Images must be **JPEG, PNG or WebP**, at most **3 files**, and **5 MB or less each**.
3. Select **Add product** to save, or **Cancel** to discard.

**Edit a product**

Select **Edit** on a card, change the fields in **Edit product**, add or remove images (total must
stay between 1 and 3), then select **Save changes**. Existing images are removed through the image
removal control; replaced and removed images are deleted from storage.

**Delete a product**

Select **Delete** and confirm in the **Delete product?** dialog. The product is removed from the
catalog, its images are deleted, and it is removed from carts and wishlists. Existing order history
keeps its product snapshot.

### 4. Orders

The **Orders** page lists all customer orders with filtering and pagination.

- Search by customer name.
- Filter by **All statuses**, **Pending**, **Shipped**, or **Delivered**.
- 12 orders per page; columns show Order, Customer, Items, Total, Payment, Status and Date.
- The **Payment** column reports **Verified**, **Awaiting payment**, or **Payment reversed**, along
  with the provider and notes such as **Inventory review needed** or **Stock restored after
  reversal**.

**Change an order status**

Use the status dropdown on a paid order to move it from `pending` to `shipped`, then to `delivered`.
Moving to **shipped** or **delivered** requires a verified payment, no inventory issue, and stock
already deducted; otherwise the change is rejected. Selecting delivered asks **Mark order
delivered?** with the warning **This cannot be undone.** — choose **Mark delivered** to confirm.
Delivered orders cannot be reverted.

### 5. Customers

**Customers** is a read-only list (12 per page, searchable by name or email). It shows each
customer's avatar, name, email, number of saved addresses, wishlist count and join date. Customer
account details and passwords are managed in Clerk, not here.

### 6. Access and error pages

- **Access denied / Admin login is not configured** appears when the backend admin variables are
  missing (503); **Cannot reach the server** covers connectivity problems, and **Access denied**
  covers other auth failures. Use **Retry** or **Use another account**.
- **404 — Page not found** offers **Back to admin home** when a URL does not exist.
- If the admin build itself has no API URL configured, a full-page **Admin console is not
  configured** message is shown instead of the login form.

---

## Quick glossary

| Term | Meaning |
| --- | --- |
| **PesaPal** | The payment provider used for checkout. |
| **IPN** | Instant Payment Notification — the server-to-server message that confirms a payment even if the customer closes the browser. |
| **Merchant reference / Order tracking ID** | Identifiers used to look up a PesaPal transaction. |
| **Pending order** | Order created at checkout, not yet confirmed as paid. |
| **Verified payment** | PesaPal confirmed the transaction and AfriCart updated stock and the cart. |
| **Low Stock** | Fewer than 20 units remaining in the admin catalog. |
