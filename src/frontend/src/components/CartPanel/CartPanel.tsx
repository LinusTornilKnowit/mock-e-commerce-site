import { useCart } from '../../hooks/useCart';

interface CartPanelProps {
  onClose: () => void;
}

export function CartPanel({ onClose }: CartPanelProps) {
  const { cart, loading, error, totalPrice, updateItem, removeItem, clearAll } = useCart();

  return (
    <aside className="cart-panel" aria-label="Shopping cart">
      <div className="cart-panel__header">
        <h2 className="cart-panel__title">Shopping Cart</h2>
        <button
          className="cart-panel__close"
          onClick={onClose}
          aria-label="Close cart"
        >
          &times;
        </button>
      </div>

      {error && (
        <div className="cart-panel__error" role="alert">
          {error}
        </div>
      )}

      {loading && <p className="cart-panel__loading">Loading cart...</p>}

      {!loading && cart.length === 0 && (
        <p className="cart-panel__empty">Your cart is empty.</p>
      )}

      {!loading && cart.length > 0 && (
        <>
          <ul className="cart-panel__items">
            {cart.map((item) => (
              <li key={item.productId} className="cart-panel__item">
                <span className="cart-panel__item-name">{item.productName}</span>
                <span className="cart-panel__item-price">${item.unitPrice.toFixed(2)}</span>
                <select
                  className="cart-panel__quantity"
                  value={item.quantity}
                  onChange={(e) => updateItem(item.productId, parseInt(e.target.value))}
                  aria-label={`Quantity for ${item.productName}`}
                >
                  {[1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
                <span className="cart-panel__item-total">${item.totalPrice.toFixed(2)}</span>
                <button
                  className="cart-panel__item-remove"
                  onClick={() => removeItem(item.productId)}
                  aria-label={`Remove ${item.productName} from cart`}
                >
                  &times;
                </button>
              </li>
            ))}
          </ul>

          <div className="cart-panel__footer">
            <span className="cart-panel__total">Total: ${totalPrice.toFixed(2)}</span>
            <button className="cart-panel__clear-btn" onClick={clearAll}>
              Clear cart
            </button>
          </div>
        </>
      )}
    </aside>
  );
}

