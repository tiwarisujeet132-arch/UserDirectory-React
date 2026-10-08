# User Directory - React Single-Page CRUD + Google Authentication

This project is the **React frontend** for the User Directory application.

It provides:

- Google sign-in using Google Identity Services via `@react-oauth/google`
- A single-page User List
- Add User
- Edit/Update User
- Delete User
- Search users
- Loading, empty and error states
- Protected API calls using `Authorization: Bearer <token>`
- Sign out

The React application expects the .NET 8 API to be running separately.

---

## 1. Application architecture

```text
                    Google
                      |
                Google Sign-In
                      |
                      v
              +----------------+
              |   React SPA    |
              | localhost:5173 |
              +-------+--------+
                      |
             Authorization: Bearer
                      |
                      v
              +----------------+
              |   .NET 8 API   |
              | localhost:7080 |
              +-------+--------+
                      |
                      v
                   SQLite
                 data/app.db
```

### Authentication vs authorization

**Authentication** answers: "Who is the user?"

Google authenticates the user and returns an OpenID Connect ID token (JWT).

**Authorization** answers: "Is this authenticated user allowed to use the application?"

The .NET API validates the token. It can optionally restrict access to an allow-list of Google email addresses using `Authorization:AllowedEmails` in `appsettings.json`.

For this sample, the **User List and all CRUD operations are protected**. The user must sign in before the list is displayed.

> Important: this sample uses the Google OIDC **ID token as the bearer credential for the first-party API**. It is intentionally simple for this demo. If the application grows into a multi-API production system, use a dedicated authorization server/API access-token model rather than treating a Google ID token as a general API access token.

---

# 2. Google Cloud setup - complete step-by-step

You need one Google Cloud project and one OAuth client of type **Web application**.

Google's current web guidance requires an OAuth 2.0 client ID for Sign in with Google. The web client is configured with Authorized JavaScript origins. For local development, `http://localhost:<port>` is supported. citehttps://developers.google.com/identity/gsi/web/guides/get-google-api-clientid

## Step 2.1 - Open Google Cloud Console

Open:

https://console.cloud.google.com/

Sign in with your Google account.

## Step 2.2 - Create a Google Cloud project

1. Click **Select a project** at the top.
2. Click **New Project**.
3. Project name:

```text
User Directory
```

4. Click **Create**.
5. Select the newly created **User Directory** project.

## Step 2.3 - Configure Google Auth Platform

In the Google Cloud menu, open:

**Google Auth Platform**

If it is not configured, click **Get started**.

Configure:

### App Information

```text
App name: User Directory
User support email: your Google account
```

### Audience

For local testing with normal Google accounts, select:

```text
External
```

An External application in testing mode may require you to add the Google accounts that will test the application to the test-user list.

### Contact Information

Enter the email address Google should use for project notifications.

Click **Create**.

## Step 2.4 - Create the OAuth Client

Open:

**Google Auth Platform -> Clients**

Click **Create OAuth client**.

Select:

```text
Application type: Web application
Name: UserDirectory-React
```

Under **Authorized JavaScript origins**, add:

```text
http://localhost:5173
```

This must match the React application's origin exactly.

For the current React implementation, you do **not** need to add a redirect URI because `GoogleLogin` uses the Google Identity Services sign-in callback flow.

Click **Create**.

Google will display a **Client ID**, similar to:

```text
123456789012-xxxxxxxxxxxxxxxx.apps.googleusercontent.com
```

### Keep this value

The **Client ID** is needed in both the React frontend and the .NET API.

### Do not put the Client Secret in React

The React `.env` must contain the Client ID only. Never commit or expose a client secret in browser code.

## Step 2.5 - Test users (External app)

If Google shows the application as being in testing mode, add the Gmail accounts that should be allowed to test it under the Google Auth Platform **Audience/Test users** area.

For a simple local test, add the Google account you will use to sign in.

---

# 3. React configuration

## Step 3.1 - Create `.env`

In the project root, next to `package.json`, create:

```text
.env
```

Example:

```env
VITE_GOOGLE_CLIENT_ID=YOUR_GOOGLE_WEB_CLIENT_ID.apps.googleusercontent.com
VITE_API_URL=https://localhost:7080/api/users
```

Replace `YOUR_GOOGLE_WEB_CLIENT_ID.apps.googleusercontent.com` with the Client ID created in Google Cloud.

Example:

```env
VITE_GOOGLE_CLIENT_ID=123456789012-xxxxxxxxxxxxxxxx.apps.googleusercontent.com
VITE_API_URL=https://localhost:7080/api/users
```

### Why these two values?

`VITE_GOOGLE_CLIENT_ID` comes from Google Cloud.

`VITE_API_URL` is the address of our .NET API. This sample uses:

```text
https://localhost:7080/api/users
```

Do not change `VITE_API_URL` unless you change the API's port/address.

## Step 3.2 - Do not commit `.env`

The `.env` file contains environment-specific configuration. Keep it out of source control.

The project should use `.env.example` as the template.

---

# 4. What was implemented in React

## `src/App.jsx`

The application:

1. Shows the Google login screen when no token exists.
2. Receives the Google credential after successful sign-in.
3. Stores the credential in `sessionStorage`.
4. Loads the user list only after authentication.
5. Shows Add/Edit/Delete controls.
6. Calls the API for CRUD operations.
7. Provides Sign out.

## `src/auth.js`

Contains the small authentication storage helper:

- `getToken()`
- `setToken()`
- `clearToken()`

The token is stored in browser `sessionStorage`, so it is removed when the browser tab/session is closed.

## `src/services/userService.js`

Every API request reads the token and sends:

```http
Authorization: Bearer <google-id-token>
```

The service exposes:

```text
GET     /api/users
GET     /api/users/{id}
POST    /api/users
PUT     /api/users/{id}
DELETE  /api/users/{id}
```

## `@react-oauth/google`

The login screen uses the React Google OAuth component. Google Identity Services is the current Google web identity integration; the older Google Sign-In library is deprecated. citehttps://developers.google.com/identity/sign-in/web/reference

---

# 5. Install and run the React application

Open a terminal in this project folder.

## Install packages

```powershell
npm install
```

## Start development server

```powershell
npm run dev
```

Vite should show:

```text
Local: http://localhost:5173/
```

Open:

```text
http://localhost:5173
```

You should see:

```text
User Directory
Sign in with Google
```

After successful login, the User List is displayed.

---

# 6. Run both services

The React frontend and .NET API are separate projects and must both be running.

### Terminal 1 - .NET API

```powershell
cd UserDirectory.Api
dotnet restore
dotnet run
```

API:

```text
https://localhost:7080
```

Swagger:

```text
https://localhost:7080/swagger
```

### Terminal 2 - React

```powershell
npm install
npm run dev
```

Frontend:

```text
http://localhost:5173
```

---

# 7. End-to-end authentication flow

The complete flow is:

```text
1. User opens http://localhost:5173
                 |
                 v
2. React displays Google Sign-In
                 |
                 v
3. User signs in with Google
                 |
                 v
4. Google returns an OIDC ID token (JWT)
                 |
                 v
5. React stores the token in sessionStorage
                 |
                 v
6. React calls GET /api/users
                 |
                 | Authorization: Bearer <token>
                 v
7. .NET API validates the JWT
                 |
                 +--> issuer = Google
                 +--> audience = configured Web Client ID
                 +--> token lifetime
                 +--> signature/metadata
                 |
                 v
8. Authorization policy checks the authenticated user
                 |
                 v
9. API returns the user list
```

JWT bearer authentication should validate the token signature, issuer, audience and expiration before accepting it. citehttps://learn.microsoft.com/en-us/aspnet/core/security/authentication/configure-jwt-bearer-authentication?view=aspnetcore-10.0

---

# 8. Common problems

## `Failed to fetch`

Check that the .NET API is running on:

```text
https://localhost:7080
```

Also open:

```text
https://localhost:7080/swagger
```

If Swagger does not open, start the API first.

## Port 7080 is already in use

Find the process:

```cmd
netstat -ano | findstr :7080
```

Then stop the old process if appropriate:

```cmd
taskkill /PID <PID> /F
```

## Google `origin_mismatch`

Make sure Google Cloud has:

```text
http://localhost:5173
```

under **Authorized JavaScript origins**.

## Google says the app is not available to the user

If the Google Auth Platform application is External and still in testing, add the account under the application's test users.

## API returns `401 Unauthorized`

Check that:

1. React has successfully signed in.
2. The `Authorization` header is being sent.
3. React and .NET use the **same Google Web Client ID**.
4. The API `appsettings.json` has the correct `Google:ClientId`.
5. The Google token has not expired.

## HTTPS certificate issue

For local .NET HTTPS development:

```powershell
dotnet dev-certs https --trust
```

Restart the API after trusting the certificate.

---

# 9. Production considerations

This sample is intentionally configured for local development.

Before production:

- Use HTTPS everywhere.
- Add the production React origin to Google Cloud.
- Do not use localhost URLs in production.
- Keep secrets out of source control.
- Consider a dedicated authorization server and API access tokens for multiple APIs.
- Use role/permission claims or a server-side authorization store for fine-grained authorization.
- Review token storage and XSS protections for the production threat model.
- Configure a strict CORS allow-list rather than broad origins.

---

# 10. Technology stack

- React 18
- Vite 5
- `@react-oauth/google`
- .NET 8 Web API
- ASP.NET Core JWT Bearer authentication
- Entity Framework Core 8
- SQLite
- Swagger / OpenAPI

---

# 11. Related backend project

The companion project is:

```text
UserDirectory-DotNet-API-Google-Auth
```

Configure the same Google Web Client ID in its `appsettings.json` before running the complete application.
