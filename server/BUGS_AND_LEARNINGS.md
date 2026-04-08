# Express.js Bugs & Learnings — GreenCart Server

This document records real bugs found in this project, explains why they happen at a fundamental level, and provides the correct fixes. Intended to be a reference for this project and for anyone learning Express.js.

---

## How `req.body` Works (Foundation)

Before the bugs: understand what `req.body` actually is.

An HTTP request has two parts:
- **Headers** — metadata (content type, auth tokens, cookies, etc.)
- **Body** — the payload (JSON data, form fields, etc.)

Express does **not** parse the request body automatically. `req.body` is `undefined` by default unless you register a body-parsing middleware. When you call:

```js
app.use(express.json())
```

Express registers a middleware that:
1. Reads the raw bytes from the incoming request stream
2. Checks if the `Content-Type` header is `application/json`
3. If yes: parses the bytes as JSON and assigns the result to `req.body`
4. If no: skips parsing and leaves `req.body` as `{}` (in Express v5) or `undefined` (in Express v4)

This one line is the gateway to all body data. Everything else flows from it.

---

## Bug 1 — CORS Middleware Registered Too Late

### File
`server/server.js`

### The Buggy Code
```js
app.use(express.json())
app.use(cookieParser())
app.use(cors({ origin: allowedOrigins, credentials: true }))  // ← too late
```

### Why This Breaks Things

When a browser makes a cross-origin request (your React frontend on port 5173 calling your API on port 4000), it does not send the real request immediately. First it sends a **preflight OPTIONS request** — a "permission check" asking the server: "Will you accept requests from this origin?"

Express processes middleware in the exact order `app.use()` is called. With the buggy order:

1. Browser sends OPTIONS preflight
2. `express.json()` runs — does nothing useful for OPTIONS
3. `cookieParser()` runs — does nothing useful for OPTIONS
4. `cors()` runs — attaches `Access-Control-Allow-Origin` header to the response

But there's a problem: by this point Express may have already sent the response, or the preflight has timed out. The browser never sees the CORS header, concludes the server rejected the request, and **blocks the actual POST/GET request from ever being sent**.

The result from the developer's perspective: the request never reaches the server, `req.body` is never populated, and it looks like a body-parsing bug. This is why fixing `express.json()` alone had no effect — the request wasn't reaching body parsing at all.

### The Fix
```js
// CORRECT ORDER — cors must be first
app.use(cors({ origin: allowedOrigins, credentials: true }))
app.use(express.json())
app.use(cookieParser())
```

### The Rule
**CORS must always be the first `app.use()` call.** Every request — including preflight OPTIONS — must get CORS headers before any other processing happens.

### How to Verify
Open browser DevTools → Network tab → find the OPTIONS preflight request to your API → check the response headers. You should see:
```
Access-Control-Allow-Origin: http://localhost:5173
Access-Control-Allow-Credentials: true
```
If those headers are missing, CORS is still misconfigured.

---

## Bug 2 — `req.body` Injection Anti-Pattern in Auth Middleware

### File
`server/middlewares/authUser.js` and `server/controllers/userController.js`

### The Buggy Code

`authUser.js`:
```js
if (tokenDecode.id) {
    req.body.userId = tokenDecode.id   // ← injecting into req.body
}
```

`userController.js` (isAuth function):
```js
const { userId } = req.body   // ← reading from req.body
```

This is used on these routes:
```js
userRouter.get('/is-auth', authUser, isAuth)
userRouter.get('/logout', authUser, logout)
```

### Why This Is a Problem

GET requests have **no request body** by HTTP specification. The HTTP standard reserves the body for methods that send data to the server (POST, PUT, PATCH). GET requests are for retrieving data — they pass parameters via the URL query string, not the body.

The reason this code works at all in this project is a chain of accidents:

1. `express.json()` is registered globally and runs on every request, including GET
2. In Express v5, when `express.json()` encounters a request with no body, it initializes `req.body = {}` instead of leaving it as `undefined`
3. So `req.body.userId = tokenDecode.id` writes to that empty object successfully
4. Later, `const { userId } = req.body` finds the value there

**This is fragile for three reasons:**

1. If the middleware order ever changes and `express.json()` doesn't run first, `req.body` is `undefined` and `req.body.userId = ...` throws a `TypeError: Cannot set properties of undefined`
2. In Express v4 (and some configurations), `req.body` on a GET request without `express.json()` would be `undefined`, crashing the middleware
3. It mixes two different concerns — auth identity and request payload — into the same object, making the code misleading to anyone reading it later

### The Fix

The correct approach is to use `req.user`, which is the established convention across the entire Node.js/Express ecosystem (Passport.js, express-jwt, and every major auth library use it):

**`authUser.js` — fixed:**
```js
if (tokenDecode.id) {
    req.user = { id: tokenDecode.id }   // attach to req.user, not req.body
} else {
    return res.json({ success: false, message: "not authorized" })
}
```

**`userController.js` (isAuth) — fixed:**
```js
const isAuth = async (req, res) => {
    try {
        const userId = req.user.id    // read from req.user
        const user = await User.findById(userId).select('-password')
        return res.json({ success: true, user })
    } catch (error) {
        console.log(error.message)
        res.json({ success: false, message: error.message })
    }
}
```

### The Rule
**Middleware-injected identity data goes on `req.user`. Request payload data comes from `req.body`. Never mix the two.**

`req` is a plain JavaScript object. You can attach any property to it. `req.user`, `req.seller`, `req.permissions` are all valid patterns for middleware to pass data to the next handler.

### How to Verify
Add temporary logs to `authUser.js` before calling `next()`:
```js
console.log('req.user:', req.user)
console.log('req.body:', req.body)
next()
```
Call `GET /api/user/is-auth` with a valid cookie. Server logs should show:
```
req.user: { id: '64abc...' }
req.body: {}
```
`req.body` should remain empty. Remove the logs after confirming.

---

## Bug 3 — `login` Controller Never Sets the JWT Cookie

### File
`server/controllers/userController.js`

### The Buggy Code

The `register` function correctly sets the cookie:
```js
res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
    maxAge: timeInMilliSeconds(...)
})
return res.json({ success: true, user: { email: user.email, name: user.name } })
```

But the `login` function only returns JSON — it never sets the cookie:
```js
if (isMatch) {
    return res.json({ success: true, user: { email: user.email } })  // ← no cookie!
}
```

### Why This Breaks Things

Authentication in this project works via an HTTP-only cookie named `token`. The `authUser` middleware reads that cookie:
```js
const { token } = req.cookies
if (!token) {
    return res.json({ success: false, message: "not Authorized" })
}
```

When a user registers, the cookie is set → authenticated routes work.
When a user logs in, the cookie is **never set** → every subsequent request to `GET /is-auth` or `GET /logout` immediately fails with `"not Authorized"`. The user appears logged in on the frontend (because the login response returned `{ success: true }`) but every protected action fails.

This is one of the most common bugs in cookie-based auth: the login endpoint is implemented but the cookie-setting step is forgotten.

### The Fix

The `login` function needs to generate a token and set the cookie, exactly like `register` does:

```js
const login = async (req, res) => {
    try {
        const { email, password } = req.body
        if (!email || !password) {
            return res.json({ success: false, message: 'Email and password are required' })
        }
        const user = await User.findOne({ email })
        if (!user) {
            return res.json({ success: false, message: "Invalid email or password" })
        }
        const isMatch = await bcrypt.compare(password, user.password)
        if (!isMatch) {
            return res.json({ success: false, message: "Invalid email or password" })
        }

        // Generate token and set cookie — same as register
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' })
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
            maxAge: timeInMilliSeconds(daysOfWeek, hoursInADay, minutesInAHour, secondsInAMinute, thousand)
        })
        return res.json({ success: true, user: { email: user.email, name: user.name } })
    } catch (error) {
        console.log(error.message)
        res.json({ success: false, message: error.message })
    }
}
```

Note the fix also cleans up the duplicate `if (isMatch)` / `if (!isMatch)` logic — the second `if` was unreachable code.

### The Rule
**Every endpoint that authenticates a user must set the session token.** Both `register` (new user) and `login` (returning user) create a session — both must set the cookie.

### How to Verify
1. Call `POST /api/user/login` with valid credentials via Postman or the browser
2. Open DevTools → Application → Cookies → `localhost:4000`
3. A `token` cookie should appear with `HttpOnly` flagged
4. Now call `GET /api/user/is-auth` — it should return `{ success: true, user: {...} }`

---

## Bug 4 — Wrong Error Message for Existing User

### File
`server/controllers/userController.js` — `register` function

### The Buggy Code
```js
const existingUser = await User.findOne({ email })
if (existingUser)
    return res.json({ success: false, message: "Missign Detials" })  // ← wrong + typo
```

### Why This Matters
When a user tries to register with an email that already exists, the error returned is `"Missign Detials"` — both a typo and a misleading message. The user has no idea their email is already registered; they think they submitted invalid form data. This causes unnecessary confusion and support requests.

### The Fix
```js
if (existingUser)
    return res.json({ success: false, message: "User already exists with this email" })
```

### The Rule
Error messages should describe what actually went wrong, not a generic fallback. The user needs actionable information.

---

## Bug 5 — `express.json()` and the Content-Type Header

### File
Client-side code (any file making POST/PUT/PATCH requests)

### What Happens

`express.json()` has a built-in content type check. When a request arrives, the middleware looks at the `Content-Type` header. If it is not `application/json`, the middleware skips parsing entirely and moves on.

```
Client sends: POST /api/user/login
Headers: (no Content-Type)
Body: {"email":"x@x.com","password":"123"}

→ express.json() sees no Content-Type: application/json
→ skips parsing
→ req.body = {}
→ const { email, password } = req.body  →  both are undefined
→ returns: { success: false, message: "Email and password are required" }
```

The error looks like a validation failure but the real cause is a missing request header. This is a very common debugging trap because the body data looks correct in Postman or browser but the server ignores it.

### The Fix — Client Side

Always send `Content-Type: application/json` with requests that have a JSON body.

**Fetch API (manual — easy to forget):**
```js
fetch('/api/user/login', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'   // ← required
    },
    body: JSON.stringify({ email, password })
})
```

**Axios (automatic — sets header automatically when data is a plain object):**
```js
axios.post('/api/user/login', { email, password })
// Content-Type: application/json is set automatically by axios
```

### The Rule
**When using the native Fetch API, always set `Content-Type: application/json` manually for POST/PUT/PATCH requests.** Axios handles this automatically; Fetch does not.

### Optional Server-Side Guard
For POST routes that must have a body, you can add an early check:
```js
if (!req.body || Object.keys(req.body).length === 0) {
    return res.status(400).json({
        success: false,
        message: "Request body is missing or Content-Type is not application/json"
    })
}
```

---

## Bug 6 — `express.json()` Must Come Before Route Mounting

### File
`server/server.js`

### The Rule (No Bug Currently — Preventive Documentation)

The current `server.js` has this correct, but it is worth documenting because it is a common mistake when adding new routes:

```js
// CORRECT
app.use(express.json())           // middleware registered first
app.use('/api/user', userRouter)  // routes registered after

// BROKEN — easy mistake when adding new route groups
app.use('/api/products', productRouter)  // ← if added BEFORE express.json()
app.use(express.json())                  // ← too late for productRouter
app.use('/api/user', userRouter)
```

If a router is mounted before `express.json()` is registered, requests to that router will never have their body parsed. `req.body` will be `{}` for all those routes.

### The Rule
**Body-parsing middleware must be registered before any route or router that depends on `req.body`.** As you add seller routes, product routes, order routes, and cart routes — always mount them after `app.use(express.json())`.

---

## Canonical Correct `server.js`

For reference, this is the correct middleware order with comments explaining why each line is where it is:

```js
import 'dotenv/config'
import express from "express"
import cors from 'cors'
import cookieParser from "cookie-parser"
import connectDB from "./configs/db.js"
import userRouter from "./routes/userRoute.js"

const app = express()
const port = process.env.PORT || 4000

await connectDB()

const allowedOrigins = ['http://localhost:5173']

// Middleware order is intentional — do not reorder these lines.
//
// 1. CORS first: every request (including preflight OPTIONS) must get
//    CORS headers before any other processing. If CORS runs late,
//    preflight requests fail and the real request is never sent.
app.use(cors({ origin: allowedOrigins, credentials: true }))

// 2. Body parsing second: must run before any route handler that reads
//    req.body. Parses JSON payloads when Content-Type: application/json.
app.use(express.json())

// 3. Cookie parsing third: must run before any route handler or middleware
//    that reads req.cookies (e.g., authUser reads req.cookies.token).
app.use(cookieParser())

// Routes last — all middleware above will have run by the time any
// route handler executes.
app.get('/', (req, res) => res.send("Api is working"))
app.use('/api/user', userRouter)

app.listen(port, () => { console.log("server is working :)") })
```

---

## End-to-End Verification Checklist

After applying all fixes, test the full auth flow:

- [ ] `POST /api/user/register` with `{ name, email, password }` and `Content-Type: application/json` → returns `{ success: true }` and sets `token` cookie
- [ ] `POST /api/user/login` with `{ email, password }` → returns `{ success: true }` and sets `token` cookie
- [ ] `GET /api/user/is-auth` (with cookie present) → returns `{ success: true, user: {...} }`
- [ ] `GET /api/user/logout` (with cookie present) → returns `{ success: true }` and clears cookie
- [ ] `GET /api/user/is-auth` (after logout, no cookie) → returns `{ success: false, message: "not Authorized" }`
- [ ] Network tab preflight OPTIONS → response has `Access-Control-Allow-Origin: http://localhost:5173`
- [ ] `POST /api/user/register` with an already-registered email → returns `"User already exists with this email"`
