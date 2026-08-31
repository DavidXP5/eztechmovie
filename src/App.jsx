import { useEffect, useState } from 'react'
import list from './data'
import './App.css'

function App() {
  const [cart, setCart] = useState(() => {
  const savedCart = localStorage.getItem('cart')

  return savedCart ? JSON.parse(savedCart) : []
})
  const [warning, setWarning] = useState('')
  const [showCheckout, setShowCheckout] = useState(false)

  const savedCard = JSON.parse(
  localStorage.getItem('savedCard')
) || {}

  const [cardholderName, setCardholderName] = useState(
    savedCard.cardholderName || ''
  )

  const [cardNumber, setCardNumber] = useState(
    savedCard.cardNumber || ''
  )

  const [expiration, setExpiration] = useState(
    savedCard.expiration || ''
  )

  const [cvv, setCvv] = useState('')

  const [cardMessage, setCardMessage] = useState('')

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

function formatCardNumber(value) {
  const numbersOnly = value.replace(/\D/g, '')
  const limitedNumbers = numbersOnly.slice(0, 16)

  return limitedNumbers.replace(/(.{4})/g, '$1 ').trim()
}

function formatExpiration(value) {
  const numbersOnly = value.replace(/\D/g, '').slice(0, 4)

  if (numbersOnly.length <= 2) {
    return numbersOnly
  }

  return `${numbersOnly.slice(0, 2)}/${numbersOnly.slice(2)}`
}

function handleCardSubmit(event) {
  event.preventDefault()

  const cleanCardNumber = cardNumber.replace(/\s/g, '')

  if (cardholderName.trim() === '') {
    setCardMessage('Please enter the cardholder name.')
    return
  }

  if (cleanCardNumber.length !== 16) {
    setCardMessage('Card number must contain 16 digits.')
    return
  }

  if (!/^\d{2}\/\d{2}$/.test(expiration)) {
    setCardMessage('Expiration date must use MM/YY format.')
    return
  }

const expirationMonth = Number(expiration.slice(0, 2))

if (expirationMonth < 1 || expirationMonth > 12) {
  setCardMessage('Please enter a valid expiration month.')
  return
}

  if (cvv.length < 3) {
    setCardMessage('CVV must contain at least 3 digits.')
    return
  }

  const cardData = {
    cardholderName,
    cardNumber,
    expiration,
  }

  localStorage.setItem('savedCard', JSON.stringify(cardData))

  setCvv('')
  setCardMessage('Card information saved successfully.')
}

if (showCheckout) {
  return (
    <div className="app">
      <header>
        <h1>EZTechMovie</h1>
      </header>

      <main>
        <section className="checkout-section">
          <h2>Checkout</h2>

          <p>
            Order Total: ${totalPrice.toFixed(2)}
          </p>

          <form
            className="credit-card-form"
            onSubmit={handleCardSubmit}
          >
            <label>
              Cardholder Name
              <input
                type="text"
                value={cardholderName}
                onChange={(event) =>
                  setCardholderName(event.target.value)
                }
                placeholder="John Smith"
                required
              />
            </label>

            <label>
              Card Number
              <input
                type="text"
                value={cardNumber}
                onChange={(event) =>
                  setCardNumber(
                    formatCardNumber(event.target.value)
                  )
                }
                placeholder="1234 5678 9012 3456"
                maxLength="19"
                required
              />
            </label>

            <label>
              Expiration Date
              <input
                type="text"
                value={expiration}
                onChange={(event) =>
                  setExpiration(
                    formatExpiration(event.target.value)
                  )
                }
                placeholder="MM/YY"
                maxLength="5"
                required
              />
            </label>

            <label>
              CVV
              <input
                type="password"
                value={cvv}
                onChange={(event) =>
                  setCvv(
                    event.target.value
                      .replace(/\D/g, '')
                      .slice(0, 4)
                  )
                }
                placeholder="123"
                maxLength="4"
                required
              />
            </label>

            <button type="submit">
              Save Card
            </button>
          </form>

          {cardMessage && (
            <p className="card-message">
              {cardMessage}
            </p>
          )}

          <button onClick={() => setShowCheckout(false)}>
            Back to Cart
          </button>
        </section>
      </main>
    </div>
  )
}
 
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

                <button
                  className="checkout-button"
                  onClick={() => setShowCheckout(true)}
                >
                  Checkout
                </button>
              </div>
            </>
          )}
        </section>

      </main>
    </div>
  )
}



export default App