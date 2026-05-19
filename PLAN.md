# PLAN: Shopping Cart Implementation

## Step 1: Implement InMemoryCartService (Backend Service Layer)

**File:** `src/backend/MockEcommerce.Api/Services/InMemoryCartService.cs`

Replace all `NotImplementedException` throws with working implementations:
- `GetAll()` - return copy of `_cart` list under lock
- `GetByProductId(int productId)` - find by ProductId under lock, return null if not found
- `Add(CartItem item)` - under lock: if item with same ProductId exists, increment its Quantity by `item.Quantity`; if new, add to list. Return the cart item.
- `Remove(int productId)` - find and remove under lock, return bool
- `Clear()` - clear list under lock

**Note:** The service layer does NOT enforce the max-quantity rule - that is the endpoint's responsibility. The service is a simple CRUD store.

---

## Step 2: Add Update Method to ICartService and InMemoryCartService

**File:** `src/backend/MockEcommerce.Api/Services/ICartService.cs`

Add method to interface:
```csharp
/// <summary>
/// Updates the quantity of an existing cart item.
/// </summary>
/// <param name="productId">The product ID to update.</param>
/// <param name="quantity">The new absolute quantity.</param>
/// <returns>The updated cart item, or null if the product is not in the cart.</returns>
CartItem? Update(int productId, int quantity);
```

**File:** `src/backend/MockEcommerce.Api/Services/InMemoryCartService.cs`

Implement `Update` - under lock: find item by productId, set its `Quantity` to the provided value, return updated item (or null if not found).

---

## Step 3: Add UpdateCartItemRequest DTO and Refactor Handler Signatures

**File:** `src/backend/MockEcommerce.Api/Endpoints/CartEndpoints.cs`

Add record alongside existing `AddToCartRequest`:
```csharp
public record UpdateCartItemRequest(int Quantity);
```

**Important:** The existing handler signatures use typed results like `Results<Created<CartItem>, Ok<CartItem>, NotFound<string>, ValidationProblem>`. Since the spec requires custom JSON error bodies (`{ "error": "..." }`), change all cart handler return types to `IResult`. This allows using `Results.Json(new { error = "..." }, statusCode: 400)`.

---

## Step 4: Implement Cart Endpoints

**File:** `src/backend/MockEcommerce.Api/Endpoints/CartEndpoints.cs`

### 4a: Register PUT route in `MapCartEndpoints`
```csharp
group.MapPut("/{productId:int}", UpdateCartItem)
    .WithName("UpdateCartItem")
    .WithSummary("Updates the quantity of an item in the cart.");
```

### 4b: Implement all handlers (all return `IResult`)

1. **GetCart** - `return Results.Ok(cartService.GetAll());`

2. **AddToCart(AddToCartRequest request, IProductService productService, ICartService cartService)**
   - If `request.Quantity < 1` then return `Results.Json(new { error = "Quantity must be at least 1" }, statusCode: 400)`
   - If `request.Quantity > 5` then return `Results.Json(new { error = "Maximum quantity of 5 exceeded" }, statusCode: 400)`
   - Look up product: `productService.GetById(request.ProductId)` - if null then return `Results.Json(new { error = "Product not found" }, statusCode: 404)`
   - Check existing: `var existing = cartService.GetByProductId(request.ProductId)`
   - If existing != null and `existing.Quantity + request.Quantity > 5` then return `Results.Json(new { error = "Maximum quantity of 5 exceeded" }, statusCode: 400)`
   - Build CartItem: `new CartItem { ProductId = request.ProductId, ProductName = product.Name, UnitPrice = product.Price, Quantity = request.Quantity }`
   - Call `var result = cartService.Add(item)`
   - If existing was null then return `Results.Created($"/api/cart/{result.ProductId}", result)` (201)
   - If existing was present then return `Results.Ok(result)` (200)

3. **UpdateCartItem(int productId, UpdateCartItemRequest request, ICartService cartService)**
   - If `request.Quantity < 1` then return 400 `{ "error": "Quantity must be at least 1" }`
   - If `request.Quantity > 5` then return 400 `{ "error": "Maximum quantity of 5 exceeded" }`
   - Call `var updated = cartService.Update(productId, request.Quantity)` - if null then return `Results.NotFound()` (404, empty body)
   - Otherwise return `Results.Ok(updated)` (200)

4. **RemoveFromCart(int productId, ICartService cartService)**
   - `var removed = cartService.Remove(productId)` - if true: `Results.NoContent()`, if false: `Results.NotFound()`

5. **ClearCart(ICartService cartService)**
   - `cartService.Clear()` then return `Results.NoContent()`

**Critical boundary rule: Use `> 5` checks (not `>= 5`). Exactly 5 is valid and must be accepted.**

---

## Step 5: Add Frontend Types and API Functions

**File:** `src/frontend/src/types/index.ts`

Add:
```typescript
export interface CartItem {
  productId: number;
  productName: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
}

export interface UpdateCartItemRequest {
  quantity: number;
}
```

**File:** `src/frontend/src/api/index.ts`

Add functions (following existing pattern of plain `fetch`, throw on non-ok):
- `fetchCart(): Promise<CartItem[]>` - GET /api/cart
- `updateCartItem(productId: number, quantity: number): Promise<CartItem>` - PUT /api/cart/{productId} with body `{ quantity }`
- `removeFromCart(productId: number): Promise<void>` - DELETE /api/cart/{productId}
- `clearCart(): Promise<void>` - DELETE /api/cart

For 400 responses, parse the JSON body and throw an Error with the `error` field message so the UI can display it.

---

## Step 6: Create useCart Hook

**File:** `src/frontend/src/hooks/useCart.ts`

```typescript
interface UseCartResult {
  cart: CartItem[];
  loading: boolean;
  error: string | null;
  totalItems: number;
  totalPrice: number;
  refresh: () => void;
  updateItem: (productId: number, quantity: number) => Promise<void>;
  removeItem: (productId: number) => Promise<void>;
  clearAll: () => Promise<void>;
}
```

- Fetch cart on mount via `fetchCart()`.
- `totalItems` = sum of all `item.quantity`.
- `totalPrice` = sum of all `item.totalPrice`.
- Action methods call API, then refresh. On failure, set error state with parsed message.

---

## Step 7: Create CartPanel Component

**File:** `src/frontend/src/components/CartPanel/CartPanel.tsx`
**File:** `src/frontend/src/components/CartPanel/index.ts` (barrel export)

Props: `{ onClose: () => void }` - uses `useCart` internally.

UI structure:
- Header row with "Shopping Cart" title and close button
- Error banner (if error is non-null)
- Empty state: "Your cart is empty."
- Item list: each row has product name, unit price, `<select>` with options 1-5 for quantity, line total, remove button
- Footer: grand total and "Clear cart" button

Quantity `<select>` onChange calls `updateItem(productId, parseInt(newValue))`.
Remove button calls `removeItem(productId)`.
Clear cart button calls `clearAll()`.

**File:** `src/frontend/src/App.css`

Add BEM styles: `.cart-panel`, `.cart-panel__header`, `.cart-panel__close`, `.cart-panel__error`, `.cart-panel__empty`, `.cart-panel__items`, `.cart-panel__item`, `.cart-panel__item-name`, `.cart-panel__item-price`, `.cart-panel__quantity`, `.cart-panel__item-total`, `.cart-panel__item-remove`, `.cart-panel__footer`, `.cart-panel__total`, `.cart-panel__clear-btn`.

---

## Step 8: Integrate CartPanel into App and Header

**File:** `src/frontend/src/components/Header/Header.tsx`

- Add `onCartClick?: () => void` to `HeaderProps`.
- Attach `onClick={onCartClick}` to the existing `<button className="header__cart-button">`.

**File:** `src/frontend/src/App.tsx`

- Add `const [cartVisible, setCartVisible] = useState(false)`.
- Pass `onCartClick={() => setCartVisible(true)}` to `<Header>`.
- Render `{cartVisible && <CartPanel onClose={() => setCartVisible(false)} />}`.
- For the header badge `cartItemCount`: after `handleAddToCart` succeeds, increment local count (existing behavior). When CartPanel modifies the cart, the badge syncs on next panel open/close cycle.

---

## Step 9: Backend Tests

**File:** `test/backend/MockEcommerce.Api.Tests/Services/InMemoryCartServiceTests.cs`

Unit tests:
- `GetAll_ReturnsEmptyListInitially`
- `Add_NewItem_AddsToCart`
- `Add_ExistingItem_IncrementsQuantity`
- `GetByProductId_ReturnsItem_WhenExists`
- `GetByProductId_ReturnsNull_WhenNotExists`
- `Update_SetsQuantity_WhenItemExists`
- `Update_ReturnsNull_WhenItemNotInCart`
- `Remove_ReturnsTrue_WhenItemExists`
- `Remove_ReturnsFalse_WhenItemNotExists`
- `Clear_RemovesAllItems`

**File:** `test/backend/MockEcommerce.Api.Tests/Endpoints/CartEndpointTests.cs`

Integration tests (boundary tests for max quantity of 5 marked with *):
- `GetCart_ReturnsOk_WithEmptyArray`
- `AddToCart_ValidNewItem_Returns201`
- `AddToCart_ExistingItem_Returns200_WithIncrementedQuantity`
- * `AddToCart_Quantity5_NewItem_Returns201` (exactly 5 allowed)
- * `AddToCart_Quantity6_Returns400` (above 5 rejected)
- * `AddToCart_IncrementToExactly5_Returns200` (existing 3 + new 2 = 5)
- * `AddToCart_IncrementPast5_Returns400` (existing 3 + new 3 = 6)
- `AddToCart_InvalidProductId_Returns404`
- `AddToCart_Quantity0_Returns400`
- `AddToCart_NegativeQuantity_Returns400`
- * `UpdateCartItem_Quantity5_Returns200` (exactly 5 allowed)
- * `UpdateCartItem_Quantity6_Returns400` (above 5 rejected)
- `UpdateCartItem_Quantity0_Returns400`
- `UpdateCartItem_ValidQuantity3_Returns200`
- `UpdateCartItem_ItemNotInCart_Returns404`
- `RemoveFromCart_ExistingItem_Returns204`
- `RemoveFromCart_NonExistentItem_Returns404`
- `ClearCart_Returns204`
- `ClearCart_WhenEmpty_Returns204`

---

## Step 10: Frontend Tests

**File:** `test/frontend/components/CartPanel/CartPanel.test.tsx`

- Renders "Your cart is empty." when cart has no items
- Renders cart items with product name, unit price, quantity, and line total
- Quantity select shows options 1 through 5
- Changing quantity calls updateItem with correct args
- Remove button calls removeItem with correct productId
- "Clear cart" button calls clearAll
- Error message displays when API fails
- Grand total displays sum of line totals

**File:** `test/frontend/hooks/useCart.test.ts`

- Returns empty cart and loading=true initially
- Returns fetched cart data after mount
- Sets error on fetch failure
- `refresh` re-fetches
- `totalItems` sums quantities
- `totalPrice` sums line totals
- `updateItem` calls API then refreshes
- `removeItem` calls API then refreshes
- `clearAll` calls API then refreshes

