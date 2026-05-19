# Copilot Instructions

## Project Overview

This is a mock e-commerce site called "Mock Shop" with a React frontend and a .NET backend API. The frontend communicates with the backend via a Vite dev proxy (`/api` → `http://localhost:5063`).

## Tech Stack

### Frontend
- **Framework:** React 19 (`react@^19.2.4`) with TypeScript 6 (`typescript@~6.0.2`)
- **Build Tool:** Vite 8 (`vite@^8.0.4`)
- **Testing:** Vitest 4 (`vitest@^4.1.4`) with globals enabled, jsdom environment, and React Testing Library (`@testing-library/react@^16.3.2`)
- **Linting:** ESLint 9 with typescript-eslint
- **Styling:** Plain CSS with BEM naming convention and CSS custom properties — no CSS modules, no CSS-in-JS
- **Location:** `src/frontend/`

### Backend
- **Framework:** ASP.NET Core with .NET 10 (Minimal APIs)
- **Language:** C# with nullable reference types and implicit usings enabled
- **Testing:** xUnit 2.9.3 with `Microsoft.AspNetCore.Mvc.Testing` (`WebApplicationFactory<Program>`)
- **Location:** `src/backend/MockEcommerce.Api/`
- **Test Location:** `test/backend/MockEcommerce.Api.Tests/`

## Project Structure

```
src/frontend/src/
  components/
    Header/           — Site header with nav and cart icon (Header.tsx, index.ts)
    HeroBanner/       — Promotional hero section (HeroBanner.tsx, index.ts)
    ProductCard/      — Individual product display card (ProductCard.tsx, index.ts)
    ProductList/      — Grid of ProductCards (ProductList.tsx, index.ts)
  hooks/
    useProducts.ts    — Fetches products, returns { products, loading, error }
  api/
    index.ts          — API client (fetchProducts, fetchProductById, addToCart)
  types/
    index.ts          — Product and AddToCartRequest interfaces
  App.tsx             — Main app component, composes Header + HeroBanner + ProductList
  App.css             — ALL component styles in one file using BEM
  index.css           — CSS custom properties (design tokens) with dark mode support
  main.tsx            — React entry point
  test-setup.ts       — Vitest setup file

src/backend/MockEcommerce.Api/
  Program.cs          — App setup (DI, CORS, endpoint mapping). Exposes `public partial class Program` for test access.
  Endpoints/
    ProductEndpoints.cs — GET /api/products, GET /api/products/{id} (FULLY IMPLEMENTED)
    CartEndpoints.cs    — GET/POST/DELETE /api/cart (ALL HANDLERS THROW NotImplementedException — STUBBED ONLY)
  Services/
    IProductService.cs      — Interface: GetAll(), GetById(int id)
    MockProductService.cs   — FULLY IMPLEMENTED with 5 hardcoded products
    ICartService.cs         — Interface: GetAll(), Add(CartItem), GetByProductId(int), Remove(int), Clear()
    InMemoryCartService.cs  — ALL METHODS THROW NotImplementedException — STUBBED ONLY
  Models/
    Product.cs         — Id, Name, Description, Price, Category, Stock, ImageUrl
    CartItem.cs        — ProductId, ProductName, UnitPrice, Quantity, TotalPrice (computed)

test/frontend/         — Mirrors src/frontend/src/ structure
  App.test.tsx
  components/
    Header/Header.test.tsx
    HeroBanner/HeroBanner.test.tsx
    ProductCard/ProductCard.test.tsx
    ProductList/ProductList.test.tsx
  hooks/
    useProducts.test.ts

test/backend/MockEcommerce.Api.Tests/
  Endpoints/
    ProductEndpointTests.cs   — Integration tests for product endpoints
  Services/
    MockProductServiceTests.cs — Unit tests for MockProductService
```

## Implementation Status

### Fully Implemented
- **Product endpoints** (`ProductEndpoints.cs`): GET /api/products and GET /api/products/{id} work correctly
- **MockProductService**: Returns 5 hardcoded products (Wireless Headphones $79.99, Running Shoes $59.99, Stainless Steel Water Bottle $24.99, Mechanical Keyboard $109.99, Yoga Mat $34.99)
- **All frontend components**: Header, HeroBanner, ProductCard, ProductList, App all work
- **Frontend API layer**: fetchProducts, fetchProductById, addToCart functions
- **All frontend tests** and **backend product tests** pass

### Stubbed / Not Implemented (throw NotImplementedException)
- **CartEndpoints.cs**: All 4 handlers (GetCart, AddToCart, RemoveFromCart, ClearCart) throw `NotImplementedException`
- **InMemoryCartService.cs**: All 5 methods (GetAll, GetByProductId, Add, Remove, Clear) throw `NotImplementedException`

## Product Data (Hardcoded in MockProductService)

| ID | Name | Price | Category | Stock |
|----|------|-------|----------|-------|
| 1 | Wireless Headphones | $79.99 | Electronics | 25 |
| 2 | Running Shoes | $59.99 | Footwear | 40 |
| 3 | Stainless Steel Water Bottle | $24.99 | Accessories | 100 |
| 4 | Mechanical Keyboard | $109.99 | Electronics | 15 |
| 5 | Yoga Mat | $34.99 | Sports | 60 |

All product images use `https://placehold.co/300x300?text=...` placeholder URLs.

## Commands

| Task | Command | Working Directory |
|------|---------|-------------------|
| Frontend dev server | `npm run dev` | `src/frontend/` |
| Frontend tests | `npm run test` | repo root |
| Frontend build | `npm run build` | `src/frontend/` |
| Frontend lint | `npm run lint` | `src/frontend/` |
| Backend run | `dotnet run --project src/backend/MockEcommerce.Api` | repo root |
| Backend tests | `dotnet test test/backend/MockEcommerce.Api.Tests` | repo root |

The frontend test command (`npm run test` or `npm run test:frontend`) runs from the **repository root** using a `vitest.config.ts` at the root that includes tests from `test/frontend/**/*.{test,spec}.{ts,tsx}` with setup file at `src/frontend/src/test-setup.ts`.

## API Routes

| Method | Route | Description | Status |
|--------|-------|-------------|--------|
| GET | `/api/products` | List all products | ✅ Implemented |
| GET | `/api/products/{id}` | Get product by ID | ✅ Implemented |
| GET | `/api/cart` | Get cart items | ❌ Stubbed |
| POST | `/api/cart` | Add item to cart (`{ productId, quantity }`) | ❌ Stubbed |
| DELETE | `/api/cart/{productId}` | Remove item from cart | ❌ Stubbed |
| DELETE | `/api/cart` | Clear cart | ❌ Stubbed |

## Design Tokens (CSS Custom Properties in index.css)

Light mode (`:root`):
- `--blue: #0058a3`, `--blue-hover: #004f93`, `--blue-active: #003e75`
- `--yellow: #ffdb00`, `--yellow-hover: #e6c600`
- `--text: #484848`, `--text-h: #111`
- `--bg: #fff`, `--bg-page: #f5f5f5`
- `--border: #dfdfdf`, `--accent: #0058a3`
- `--radius: 8px`, `--radius-lg: 16px`
- `--shadow: 0 1px 4px rgba(0,0,0,0.06)`, `--shadow-hover: 0 2px 8px rgba(0,0,0,0.1)`
- `--sans: 'Noto Sans', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif`

Dark mode overrides via `@media (prefers-color-scheme: dark)`.

## Coding Conventions

### Frontend
- Named exports only (no default exports)
- Props interfaces defined inline above the component
- Barrel `index.ts` in each component folder: `export { ComponentName } from './ComponentName';`
- Hooks return typed result interfaces (e.g., `UseProductsResult`)
- `import type` for type-only imports
- API layer uses plain `fetch`, throws on non-ok responses, base URL `/api`
- BEM CSS in `App.css`, tokens from `index.css`

### Backend
- Static endpoint classes with `MapXxxEndpoints` extension methods on `WebApplication`
- `MapGroup` for route prefixes + `.WithTags()`, `.WithName()`, `.WithSummary()`
- Handler methods are `internal static` with typed results
- Services registered as Singleton
- Models use `{ get; set; }`, strings default to `string.Empty`, computed properties use expression bodies
- DTOs are C# records (e.g., `public record AddToCartRequest(int ProductId, int Quantity)`)
- XML `<summary>` doc comments on all public APIs

### Testing
- Frontend: accessible queries (getByRole, getByText), `vi.fn()`, `userEvent`, relative imports from `../../../../src/frontend/src/...`
- Backend: `IClassFixture<WebApplicationFactory<Program>>`, `ReadFromJsonAsync<T>`, assert status codes
