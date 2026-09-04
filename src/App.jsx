import { useEffect, useState } from 'react'
import list from './data'
import './App.css'

function App() {
  // Google authenticated user
  const [user, setUser] = useState(() => {
    const savedUser = sessionStorage.getItem('eztechmovieUser')
    return savedUser ? JSON.parse(savedUser) : null
  })

  // Shopping cart
  const [cart, setCart] = useState(() => {
    const savedCart = localStorage.getItem('cart')
    return savedCart ? JSON.parse(savedCart) : []
  })

  const [warning, setWarning] = useState('')
  const [showCheckout, setShowCheckout] = useState(false)

  const savedCard =
    JSON.parse(localStorage.getItem('savedCard')) || {}

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

  // Save cart whenever it changes
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart))
  }, [cart])

  // Decode the Google ID token so basic profile
  // information can be displayed in the application
  function decodeJwt(token) {
    try {
      const base64Url = token.split('.')[1]

      const base64 = base64Url
        .replace(/-/g, '+')
        .replace(/_/g, '/')

      const jsonPayload = decodeURIComponent(
        window
          .atob(base64)
          .split('')
          .map((character) => {
            return (
              '%' +
              ('00' + character.charCodeAt(0).toString(16)).slice(-2)
            )
          })
          .join('')
      )

      return JSON.parse(jsonPayload)
    } catch (error) {
      console.error(
        'Unable to decode Google credential:',
        error
      )

      return null
    }
  }

  // Called after Google successfully authenticates a user
  function handleGoogleLogin(response) {
    console.log('Google authentication successful.')

    const profile = decodeJwt(response.credential)

    if (!profile) {
      console.error('Unable to read Google user profile.')
      return
    }

    const loggedInUser = {
      id: profile.sub,
      name: profile.name,
      email: profile.email,
      picture: profile.picture,
    }

    setUser(loggedInUser)

    sessionStorage.setItem(
      'eztechmovieUser',
      JSON.stringify(loggedInUser)
    )
  }

  // --------------------------------------------------
  // GOOGLE IDENTITY SERVICES
  // --------------------------------------------------

  useEffect(() => {
    // Do not render the login button when already signed in
    if (user) {
      return
    }

    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID

    // Verify that Vite loaded the Google Client ID
    if (!clientId) {
      console.error(
        'Google Client ID is missing. Check the .env file.'
      )
      return
    }

    console.log('Google Client ID detected.')

    let interval

    const initializeGoogleLogin = () => {
      // Wait until Google's JavaScript library has loaded
      if (!window.google?.accounts?.id) {
        console.log(
          'Waiting for Google Identity Services...'
        )
        return false
      }

      // Find the login button container
      const buttonContainer =
        document.getElementById('google-signin-button')

      if (!buttonContainer) {
        console.log(
          'Waiting for Google Sign-In button container...'
        )
        return false
      }

      try {
        console.log('Initializing Google Sign-In...')

        // Initialize Google Identity Services
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleGoogleLogin,
        })

        // Clear anything that may already exist
        buttonContainer.innerHTML = ''

        // Render Google's official Sign-In button
        window.google.accounts.id.renderButton(
          buttonContainer,
          {
            type: 'standard',
            theme: 'outline',
            size: 'large',
            text: 'signin_with',
            shape: 'rectangular',
            logo_alignment: 'left',
            width: 280,
          }
        )

        console.log('Google Sign-In button rendered.')

        return true
      } catch (error) {
        console.error(
          'Google Sign-In initialization failed:',
          error
        )

        return false
      }
    }

    // Try immediately
    if (!initializeGoogleLogin()) {
      // If Google has not loaded yet, retry every 250 ms
      interval = setInterval(() => {
        if (initializeGoogleLogin()) {
          clearInterval(interval)
        }
      }, 250)
    }

    return () => {
      if (interval) {
        clearInterval(interval)
      }
    }
  }, [user])

  // --------------------------------------------------
  // LOGOUT
  // --------------------------------------------------

  function handleLogout() {
    sessionStorage.removeItem('eztechmovieUser')

    if (window.google?.accounts?.id) {
      window.google.accounts.id.disableAutoSelect()
    }

    setShowCheckout(false)
    setUser(null)
  }

  // --------------------------------------------------
  // SHOPPING CART
  // --------------------------------------------------

  function addToCart(item) {
    const isSubscription = item.id <= 4

    // Handle subscriptions
    if (isSubscription) {
      const existingSubscription = cart.find(
        (cartItem) => cartItem.id <= 4
      )

      // Same subscription already exists
      if (
        existingSubscription &&
        existingSubscription.id === item.id
      ) {
        setWarning(
          `${item.service} is already in your cart.`
        )

        return
      }

      // Replace existing subscription with new subscription
      if (existingSubscription) {
        setCart([
          ...cart.filter(
            (cartItem) => cartItem.id > 4
          ),
          {
            ...item,
            quantity: 1,
          },
        ])

        setWarning(
          `${existingSubscription.service} was replaced with ${item.service}.`
        )

        return
      }

      // Add first subscription
      setCart([
        ...cart,
        {
          ...item,
          quantity: 1,
        },
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
            ? {
                ...cartItem,
                quantity: cartItem.quantity + 1,
              }
            : cartItem
        )
      )
    } else {
      setCart([
        ...cart,
        {
          ...item,
          quantity: 1,
        },
      ])
    }

    setWarning('')
  }

  function removeFromCart(id) {
    setCart(
      cart.filter((item) => item.id !== id)
    )
  }

  function increaseQuantity(id) {
    setCart(
      cart.map((item) => {
        const isSubscription = item.id <= 4

        if (
          item.id === id &&
          !isSubscription
        ) {
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
            ? {
                ...item,
                quantity: item.quantity - 1,
              }
            : item
        )
        .filter((item) => item.quantity > 0)
    )
  }

  const totalPrice = cart.reduce(
    (total, item) =>
      total + item.price * item.quantity,
    0
  )

  // --------------------------------------------------
  // CREDIT CARD FORMATTING
  // --------------------------------------------------

  function formatCardNumber(value) {
    const numbersOnly =
      value.replace(/\D/g, '')

    const limitedNumbers =
      numbersOnly.slice(0, 16)

    return limitedNumbers
      .replace(/(.{4})/g, '$1 ')
      .trim()
  }

  function formatExpiration(value) {
    const numbersOnly = value
      .replace(/\D/g, '')
      .slice(0, 4)

    if (numbersOnly.length <= 2) {
      return numbersOnly
    }

    return `${numbersOnly.slice(
      0,
      2
    )}/${numbersOnly.slice(2)}`
  }

  // --------------------------------------------------
  // CREDIT CARD SUBMISSION
  // --------------------------------------------------

  function handleCardSubmit(event) {
    event.preventDefault()

    const cleanCardNumber =
      cardNumber.replace(/\s/g, '')

    if (cardholderName.trim() === '') {
      setCardMessage(
        'Please enter the cardholder name.'
      )

      return
    }

    if (cleanCardNumber.length !== 16) {
      setCardMessage(
        'Card number must contain 16 digits.'
      )

      return
    }

    if (!/^\d{2}\/\d{2}$/.test(expiration)) {
      setCardMessage(
        'Expiration date must use MM/YY format.'
      )

      return
    }

    const expirationMonth = Number(
      expiration.slice(0, 2)
    )

    if (
      expirationMonth < 1 ||
      expirationMonth > 12
    ) {
      setCardMessage(
        'Please enter a valid expiration month.'
      )

      return
    }

    if (cvv.length < 3) {
      setCardMessage(
        'CVV must contain at least 3 digits.'
      )

      return
    }

    const cardData = {
      cardholderName,
      cardNumber,
      expiration,
    }

    localStorage.setItem(
      'savedCard',
      JSON.stringify(cardData)
    )

    // CVV is intentionally not stored
    setCvv('')

    setCardMessage(
      'Card information saved successfully.'
    )
  }

  // --------------------------------------------------
  // PROTECTED LOGIN SCREEN
  // --------------------------------------------------

  // Users who have not authenticated can only see
  // the Google login page.
  if (!user) {
    return (
      <div className="login-page">
        <div className="login-card">
          <h1>EZTechMovie</h1>

          <h2>Welcome</h2>

          <p>
            Sign in with your Google account to
            access EZTechMovie.
          </p>

          <div id="google-signin-button"></div>

          <p className="login-security-message">
            Secure authentication powered by Google.
          </p>
        </div>
      </div>
    )
  }

  // --------------------------------------------------
  // CHECKOUT PAGE
  // --------------------------------------------------

  if (showCheckout) {
    return (
      <div className="app">
        <header>
          <h1>EZTechMovie</h1>

          <nav>
            <span className="user-name">
              Signed in as {user.name}
            </span>

            <button
              className="logout-button"
              onClick={handleLogout}
            >
              Sign Out
            </button>
          </nav>
        </header>

        <main>
          <section className="checkout-section">
            <h2>Checkout</h2>

            <p>
              Order Total: $
              {totalPrice.toFixed(2)}
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
                    setCardholderName(
                      event.target.value
                    )
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
                      formatCardNumber(
                        event.target.value
                      )
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
                      formatExpiration(
                        event.target.value
                      )
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

            <button
              onClick={() =>
                setShowCheckout(false)
              }
            >
              Back to Cart
            </button>
          </section>
        </main>
      </div>
    )
  }

  // --------------------------------------------------
  // MAIN EZTECHMOVIE APPLICATION
  // --------------------------------------------------

  return (
    <div className="app">
      <header>
        <h1>EZTechMovie</h1>

        <nav>
          <a href="#subscriptions">
            Subscriptions
          </a>

          <a href="#cart">
            Cart (
            {cart.reduce(
              (total, item) =>
                total + item.quantity,
              0
            )}
            )
          </a>

          <span className="user-name">
            {user.name}
          </span>

          <button
            className="logout-button"
            onClick={handleLogout}
          >
            Sign Out
          </button>
        </nav>
      </header>

      <main>
        <h2 id="subscriptions">
          Subscriptions & Accessories
        </h2>

        {warning && (
          <p className="warning">
            {warning}
          </p>
        )}

        <div className="product-grid">
          {list.map((item) => (
            <div
              className="product-card"
              key={item.id}
            >
              <img
                src={item.img}
                alt={item.service}
              />

              <h3>{item.service}</h3>

              <p>
                {item.serviceInfo}
              </p>

              <p>
                ${item.price.toFixed(2)}
              </p>

              <button
                onClick={() =>
                  addToCart(item)
                }
              >
                Add to Cart
              </button>
            </div>
          ))}
        </div>

        <section
          id="cart"
          className="cart-section"
        >
          <h2>Shopping Cart</h2>

          {cart.length === 0 ? (
            <p>
              Your cart is empty.
            </p>
          ) : (
            <>
              {cart.map((item) => (
                <div
                  className="cart-item"
                  key={item.id}
                >
                  <div>
                    <h3>
                      {item.service}
                    </h3>

                    <p>
                      $
                      {item.price.toFixed(2)} each
                    </p>
                  </div>

                  <div className="quantity-controls">
                    <button
                      onClick={() =>
                        decreaseQuantity(
                          item.id
                        )
                      }
                    >
                      -
                    </button>

                    <span>
                      {item.quantity}
                    </span>

                    <button
                      onClick={() =>
                        increaseQuantity(
                          item.id
                        )
                      }
                    >
                      +
                    </button>
                  </div>

                  <p>
                    $
                    {(
                      item.price *
                      item.quantity
                    ).toFixed(2)}
                  </p>

                  <button
                    onClick={() =>
                      removeFromCart(
                        item.id
                      )
                    }
                  >
                    Remove
                  </button>
                </div>
              ))}

              <div className="cart-total">
                <h3>
                  Total: $
                  {totalPrice.toFixed(2)}
                </h3>

                <button
                  className="checkout-button"
                  onClick={() =>
                    setShowCheckout(true)
                  }
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