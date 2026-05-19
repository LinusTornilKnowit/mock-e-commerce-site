# SPEC: Shopping Cart Feature

## Overview

Implement a fully functional shopping cart that allows users to view, add, update, and remove items. The cart is accessible from the existing cart icon in the header. A new PUT endpoint enables quantity updates. A maximum quantity of 5 per product is enforced across all operations.

---

## Ambiguity Resolutions

| Ambiguity | Decision |
|-----------|----------|
| Max quantity on updates (PUT) | PUT sets the quantity to the value provided. If the value exceeds 5, return 400. The max applies to the absolute quantity, not an increment. |
| Increment via POST when item already exists | POST increments existing quantity. If current (2) + requested (4) > 5, return 400 — do NOT silently cap. |
| PUT semantics | PUT replaces the quantity for an existing cart item. It does NOT create a new item — if the product is not in the cart, return 404. |
| PUT with quantity 0 | Treated as invalid input — return 400 (use DELETE to remove). |
| Error response format | All 400 errors return a JSON object: `{ "error": "<message>" }`. 404 returns empty body. |
| UI approach for cart view | A cart panel rendered conditionally when the user clicks the header cart icon. Shows line items, quantities (editable), per-item totals, and a grand total. Uses state-based toggle (no router library). |
| PUT on non-existent product (valid product ID but not in cart) | Return 404. |
| PUT/POST with a productId that doesn't exist in product catalog | Return 404 with body `{ "error": "Product not found" }`. |

---

## API Endpoints

### GET /api/cart
- **Response 200:** `CartItem[]` (may be empty array `[]`)
- **Response shape per item:** `{ productId, productName, unitPrice, quantity, totalPrice }`

### POST /api/cart
- **Request body:** `{ "productId": int, "quantity": int }`
- **Validation:**
  - `productId` must refer to an existing product → 404 `{ "error": "Product not found" }` if not
  - `quantity` must be >= 1 → 400 `{ "error": "Quantity must be at least 1" }`
  - Resulting quantity (existing + new) must be <= 5 → 400 `{ "error": "Maximum quantity of 5 exceeded" }`
- **If item not in cart:** Add new CartItem, return **201** with the created CartItem
- **If item already in cart:** Increment quantity, return **200** with the updated CartItem

### PUT /api/cart/{productId}
- **Request body:** `{ "quantity": int }`
- **Validation:**
  - `productId` must be an item currently in the cart → 404 if not
  - `quantity` must be >= 1 → 400 `{ "error": "Quantity must be at least 1" }`
  - `quantity` must be <= 5 → 400 `{ "error": "Maximum quantity of 5 exceeded" }`
- **Success:** Return **200** with the updated CartItem

### DELETE /api/cart/{productId}
- **If item in cart:** Remove it, return **204 No Content**
- **If item not in cart:** Return **404**

### DELETE /api/cart
- **Clears all items.** Always returns **204 No Content** (even if already empty).

---

## Data Model

### CartItem (existing model — no changes needed)
```
ProductId: int
ProductName: string
UnitPrice: decimal
Quantity: int
TotalPrice: decimal (computed = UnitPrice × Quantity)
```

### New DTO
```csharp
public record UpdateCartItemRequest(int Quantity);
```

---

## Frontend Behavior

### Cart View
- Clicking the header cart icon toggles a cart panel/page.
- Displays each item: product name, unit price, quantity selector (1–5), line total.
- Shows grand total (sum of all line totals).
- Empty state: message "Your cart is empty."
- Each item has a remove button (calls DELETE /api/cart/{productId}).
- A "Clear cart" button calls DELETE /api/cart.
- Quantity selector (dropdown or +/- buttons, range 1–5) calls PUT /api/cart/{productId} on change.

### Cart Icon Badge
- Already exists in Header component — shows `cartItemCount`.
- Update count by summing quantities from GET /api/cart response.

### Error Handling
- Display inline error messages when API returns 400 (e.g., "Maximum quantity of 5 exceeded").
- On 404 for add/update, show "Product not found".

---

## Edge Cases

| Scenario | Expected Behavior |
|----------|-------------------|
| POST with quantity 6 (new item) | 400: "Maximum quantity of 5 exceeded" |
| POST with quantity 3 when item already has quantity 3 | 400: "Maximum quantity of 5 exceeded" (3+3=6 > 5) |
| POST with quantity 2 when item already has quantity 3 | 200: quantity becomes 5 (3+2=5, exactly at max) |
| PUT with quantity 0 | 400: "Quantity must be at least 1" |
| PUT with quantity 5 | 200: quantity set to 5 |
| PUT on product not in cart | 404 |
| POST/PUT with non-existent productId (e.g., 999) | 404: "Product not found" |
| DELETE on product not in cart | 404 |
| DELETE /api/cart when cart is empty | 204 |
| GET /api/cart when empty | 200: `[]` |
| POST with quantity -1 | 400: "Quantity must be at least 1" |
| POST with quantity 0 | 400: "Quantity must be at least 1" |

