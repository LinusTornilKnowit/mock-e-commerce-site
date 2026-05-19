# PLAN: Shopping Cart Implementation

## Step 1: Implement InMemoryCartService (Backend Service Layer)

**File:** `src/backend/MockEcommerce.Api/Services/InMemoryCartService.cs`

Replace all `NotImplementedException` throws with working implementations:
- `GetAll()` — return copy of `_cart` list under lock
- `GetByProductId(int productId)` — find by ProductId under lock
- `Add(CartItem item)` — if exists, increment quantity; if new, add to list. Return the item. Use lock for thread safety.
- `Remove(int productId)` — find and remove, return bool. Use lock.
- `Clear()` — clear list under lock.

**Note:** The service layer does NOT enforce the max-quantity rule — that is the endpoint's responsibility (service stays generic).

---

## Step 2: Add Update Method to ICartService and InMemoryCartService

**File:** `src/backend/MockEcommerce.Api/Services/ICartService.cs`

Add: `CartItem? Update(int productId, int quantity);`

**File:** `src/backend/MockEcommerce.Api/Services/InMemoryCartService.cs`

Implement `Update` — find item by productId, set its Quantity, return updated item (or null if not found).

---

## Step 3: Add UpdateCartItemRequest DTO

**File:** `src/backend/MockEcommerce.Api/Endpoints/CartEndpoints.cs`

Add record at bottom of file:
```csharp
public record UpdateCartItemRequest(int Quantity);
```

---

## Step 4: Implement Cart Endpoints

**File:** `src/backend/MockEcommerce.Api/Endpoints/CartEndpoints.cs`

Implement all handlers with validation:

1. **GetCart** — call `cartService.GetAll()`, return `Ok(items)`
2. **AddToCart** — validate quantity >= 1, look up product (404 if not found), check existing quantity + new <= 5 (400 if exceeded), call service Add, return 201 (new) or 200 (existing)
3. **RemoveFromCart** — call `cartService.Remove(productId)`, return 204 or 404
4. **ClearCart** — call `cartService.Clear()`, return 204

Add new PUT endpoint in `MapCartEndpoints`:
```csharp
group.MapPut("/{productId:int}", UpdateCartItem)
    .WithName("UpdateCartItem")
    .WithSummary("Updates the quantity of an item in the cart.");
```

5. **UpdateCartItem** — validate quantity >= 1 and <= 5 (400), call `cartService.Update(productId, quantity)`, return 200 or 404

All 400 responses use `Results.Json(new { error = "..." }, statusCode: 400)`.

---

## Step 5: Add Frontend API Functions

**File:** `src/frontend/src/api/index.ts`

Add functions:
- `fetchCart(): Promise<CartItem[]>` — GET /api/cart
- `updateCartItem(productId: number, quantity: number): Promise<CartItem>` — PUT /api/cart/{productId}
- `removeFromCart(productId: number): Promise<void>` — DELETE /api/cart/{productId}
- `clearCart(): Promise<void>` — DELETE /api/cart

**File:** `src/frontend/src/types/index.ts`

Add `CartItem` interface and `UpdateCartItemRequest` interface.

---

## Step 6: Create useCart Hook

**File:** `src/frontend/src/hooks/useCart.ts`

Returns `{ cart, loading, error, refresh, updateItem, removeItem, clearAll }`.
- Fetch cart on mount and expose `refresh` for re-fetching.
- `updateItem` calls PUT, then refreshes.
- `removeItem` calls DELETE, then refreshes.
- `clearAll` calls DELETE /api/cart, then refreshes.

---

## Step 7: Create CartPanel Component

**File:** `src/frontend/src/components/CartPanel/CartPanel.tsx`
**File:** `src/frontend/src/components/CartPanel/index.ts`

- Receives `onClose` prop and uses `useCart` hook internally.
- Renders list of cart items with: product name, unit price, quantity dropdown (1–5), line total, remove button.
- Shows grand total at bottom.
- Empty state: "Your cart is empty."
- "Clear cart" button.
- Inline error display for failed operations.

Add styles to `src/frontend/src/App.css` using BEM (`.cart-panel`, `.cart-panel__item`, etc.).

---

## Step 8: Integrate CartPanel into App

**File:** `src/frontend/src/App.tsx`

- Add `cartVisible` state toggled by header cart icon click.
- Pass `onCartClick` callback to Header.
- Conditionally render `<CartPanel>` when `cartVisible` is true.
- Update `cartItemCount` from cart data (sum of quantities).

**File:** `src/frontend/src/components/Header/Header.tsx`

- Add `onCartClick` prop to `HeaderProps`.
- Attach to cart button's `onClick`.

---

## Step 9: Backend Tests

**File:** `test/backend/MockEcommerce.Api.Tests/Services/InMemoryCartServiceTests.cs`

Unit tests for InMemoryCartService:
- GetAll returns empty initially
- Add creates new item
- Add increments existing item
- GetByProductId returns correct item / null
- Update sets quantity / returns null for missing
- Remove returns true/false
- Clear empties cart

**File:** `test/backend/MockEcommerce.Api.Tests/Endpoints/CartEndpointTests.cs`

Integration tests:
- GET /api/cart returns 200 with empty array
- POST /api/cart with valid data returns 201
- POST /api/cart with quantity > 5 returns 400
- POST /api/cart incrementing past 5 returns 400
- POST /api/cart with invalid productId returns 404
- PUT /api/cart/{id} with valid quantity returns 200
- PUT /api/cart/{id} with quantity 0 returns 400
- PUT /api/cart/{id} with quantity 6 returns 400
- PUT /api/cart/{id} for item not in cart returns 404
- DELETE /api/cart/{id} returns 204
- DELETE /api/cart/{id} for missing item returns 404
- DELETE /api/cart returns 204

---

## Step 10: Frontend Tests

**File:** `test/frontend/components/CartPanel/CartPanel.test.tsx`

- Renders empty state
- Renders cart items with correct data
- Calls PUT on quantity change
- Calls DELETE on remove click
- Displays error messages on API failure

**File:** `test/frontend/hooks/useCart.test.ts`

- Returns cart data after fetch
- Handles loading/error states
- refresh re-fetches data

