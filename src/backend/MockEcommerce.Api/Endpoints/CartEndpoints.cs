using MockEcommerce.Api.Models;
using MockEcommerce.Api.Services;

namespace MockEcommerce.Api.Endpoints;

/// <summary>
/// Maps shopping cart endpoints under <c>/api/cart</c>.
/// </summary>
public static class CartEndpoints
{
    /// <summary>Registers cart-related routes on the given endpoint route builder.</summary>
    public static void MapCartEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("api/cart")
            .WithTags("Cart");

        group.MapGet("/", GetCart)
            .WithName("GetCart")
            .WithSummary("Returns all items currently in the cart.");

        group.MapPost("/", AddToCart)
            .WithName("AddToCart")
            .WithSummary("Adds a product to the cart or increments quantity if already present.");

        group.MapPut("/{productId:int}", UpdateCartItem)
            .WithName("UpdateCartItem")
            .WithSummary("Updates the quantity of an item in the cart.");

        group.MapDelete("/{productId:int}", RemoveFromCart)
            .WithName("RemoveFromCart")
            .WithSummary("Removes a single product from the cart by its product ID.");

        group.MapDelete("/", ClearCart)
            .WithName("ClearCart")
            .WithSummary("Removes all items from the cart.");
    }

    /// <summary>Returns all items currently in the cart.</summary>
    internal static IResult GetCart(ICartService cartService)
    {
        return Results.Ok(cartService.GetAll());
    }

    /// <summary>Adds a product to the cart or increments quantity if already present.</summary>
    internal static IResult AddToCart(
        AddToCartRequest request,
        IProductService productService,
        ICartService cartService)
    {
        if (request.Quantity < 1)
            return Results.Json(new { error = "Quantity must be at least 1" }, statusCode: 400);

        if (request.Quantity > 5)
            return Results.Json(new { error = "Maximum quantity of 5 exceeded" }, statusCode: 400);

        var product = productService.GetById(request.ProductId);
        if (product is null)
            return Results.Json(new { error = "Product not found" }, statusCode: 404);

        var existing = cartService.GetByProductId(request.ProductId);
        if (existing is not null && existing.Quantity + request.Quantity > 5)
            return Results.Json(new { error = "Maximum quantity of 5 exceeded" }, statusCode: 400);

        var item = new CartItem
        {
            ProductId = request.ProductId,
            ProductName = product.Name,
            UnitPrice = product.Price,
            Quantity = request.Quantity
        };

        var result = cartService.Add(item);

        if (existing is null)
            return Results.Created($"/api/cart/{result.ProductId}", result);

        return Results.Ok(result);
    }

    /// <summary>Updates the quantity of an item in the cart.</summary>
    internal static IResult UpdateCartItem(
        int productId,
        UpdateCartItemRequest request,
        ICartService cartService)
    {
        if (request.Quantity < 1)
            return Results.Json(new { error = "Quantity must be at least 1" }, statusCode: 400);

        if (request.Quantity > 5)
            return Results.Json(new { error = "Maximum quantity of 5 exceeded" }, statusCode: 400);

        var updated = cartService.Update(productId, request.Quantity);
        if (updated is null)
            return Results.NotFound();

        return Results.Ok(updated);
    }

    /// <summary>Removes a single product from the cart by its product ID.</summary>
    internal static IResult RemoveFromCart(int productId, ICartService cartService)
    {
        var removed = cartService.Remove(productId);
        if (!removed)
            return Results.NotFound();

        return Results.NoContent();
    }

    /// <summary>Removes all items from the cart.</summary>
    internal static IResult ClearCart(ICartService cartService)
    {
        cartService.Clear();
        return Results.NoContent();
    }
}

/// <summary>Request body for adding a product to the cart.</summary>
public record AddToCartRequest(int ProductId, int Quantity);

/// <summary>Request body for updating cart item quantity.</summary>
public record UpdateCartItemRequest(int Quantity);
