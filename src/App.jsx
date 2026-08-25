import { useEffect, useState } from 'react'
import list from './data'
import './App.css'

function App() {
  const [cart, setCart] = useState(() => {
  const savedCart = localStorage.getItem('cart')

  return savedCart ? JSON.parse(savedCart) : []
})
  const [warning, setWarning] = useState('')

  useEffect(() => {
  localStorage.setItem('cart', JSON.stringify(cart))
}, [cart])

  function addToCart(item) {
  const isSubscription = item.id <= 4

  // Handle subscriptions
  if (isSubscription) {
    const existingSubscription = cart.find(
      (cartItem) => cartItem.id <= 4
    )

    // The exact same subscription is already in the cart
    if (existingSubscription && existingSubscription.id === item.id) {
      setWarning(`${item.service} is already in your cart.`)
      return
    }

    // A different subscription is already in the cart
    if (existingSubscription) {
      setCart([
        ...cart.filter((cartItem) => cartItem.id > 4),
        { ...item, quantity: 1 }
      ])

      setWarning(
        `${existingSubscription.service} was replaced with ${item.service}.`
      )

      return
    }

    // No subscription is currently in the cart
    setCart([
      ...cart,
      {
        ...item,
        quantity: 1
      }
    ])

    setWarning('')
    return
  }

  // Handle accessories
  const existingItem = cart.find(
    (cartItem) => cartItem.id === item.id
  )

  if (existingItem) {
    setCart(
      cart.map((cartItem) =>
        cartItem.id === item.id
          ? { ...cartItem, quantity: cartItem.quantity + 1 }
          : cartItem
      )
    )
  } else {
    setCart([
      ...cart,
      {
        ...item,
        quantity: 1
      }
    ])
  }

  setWarning('')
}

function removeFromCart(id) {
  setCart(cart.filter((item) => item.id !== id))
}

function increaseQuantity(id) {
  setCart(
    cart.map((item) => {
      const isSubscription = item.id <= 4

      if (item.id === id && !isSubscription) {
        return {
          ...item,
          quantity: item.quantity + 1,
        }
      }

      return item
    })
  )
}

function decreaseQuantity(id) {
  setCart(
    cart
      .map((item) =>
        item.id === id
          ? { ...item, quantity: item.quantity - 1 }
          : item
      )
      .filter((item) => item.quantity > 0)
  )
}



const totalPrice = cart.reduce(
  (total, item) => total + item.price * item.quantity,
  0
)
 
  return (
    <div className="app">
      <header>
        <h1>EZTechMovie</h1>
        <nav>
          <a href="#subscriptions">Subscriptions</a>

          <a href="#cart">
            Cart ({cart.reduce((total, item) => total + item.quantity, 0)})
          </a>
        </nav>
      </header>

      <main>
        <h2 id="subscriptions">Subscriptions & Accessories</h2>

        {warning && (
          <p className="warning">
           {warning}
          </p>
        )}

        <div className="product-grid">
          {list.map((item) => (
            <div className="product-card" key={item.id}>
              <img src={item.img} alt={item.service} />

              <h3>{item.service}</h3>

              <p>{item.serviceInfo}</p>

              <p>${item.price.toFixed(2)}</p>

              <button onClick={() => addToCart(item)}>
                 Add to Cart
              </button>

            </div>
          ))}
        </div>

        <section id="cart" className="cart-section">
          <h2>Shopping Cart</h2>

          {cart.length === 0 ? (
            <p>Your cart is empty.</p>
          ) : (
            <>
              {cart.map((item) => (
                <div className="cart-item" key={item.id}>
                  <div>
                    <h3>{item.service}</h3>
                    <p>${item.price.toFixed(2)} each</p>
                  </div>

                  <div className="quantity-controls">
                    <button onClick={() => decreaseQuantity(item.id)}>
                      -
                    </button>

                    <span>{item.quantity}</span>

                    <button onClick={() => increaseQuantity(item.id)}>
                      +
                    </button>
                  </div>

                  <p>
                    ${(item.price * item.quantity).toFixed(2)}
                  </p>

                  <button onClick={() => removeFromCart(item.id)}>
                    Remove
                  </button>
                </div>
              ))}

              <div className="cart-total">
                <h3>Total: ${totalPrice.toFixed(2)}</h3>
              </div>
            </>
          )}
        </section>

      </main>
    </div>
  )
}



export default App