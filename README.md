# Mongo Backend Framework
This project is a monorepo for backend applications.

Core functionalities such as authentication, database access, error handling, middleware, and utilities (henceforth referred to as the framework) are shared across all backend app projects.

Dependencies for the common framework are managed centrally, following the monorepo philosophy.

In this repo:
- **packages/Framework** holds the reusable backend framework.
- **apps/TemplateBackend** demonstrates how to build an app on top of that framework.

*What is a monorepo: A monorepo is a single repository containing multiple distinct projects, with well-defined relationships.*

## Features
⚙️ Framework package: Express app builder, error handling, sanitizers.

🔐 Authentication: JWT access tokens + opaque refresh tokens.

🧼 Utilities: input sanitization, MongoDB helpers.

💥 Error handling: reusable error classes + middleware.

🧪 Testing: Jest + mongodb-memory-server for isolated DB testing.

📁 Monorepo structure: Apps and packages separated but linked via workspaces.

📦 Typed: Full TypeScript support with generated .d.ts declarations.

## Project structure
	root/
	├── apps/
	│   └── TemplateBackend/   		# example backend app consuming the framework
	│       ├── src/           		# app-specific controllers, services, routes
	│       ├── .env           		
	│       ├── index.ts		
	│       ├── jest.config.js		
	│       ├── jest.setup.ts		# override env vars here for testing
	│       ├── ...
	│       ├── package.json
	│       └── tsconfig.json
	├── packages/
	│   └── Framework/         		# core framework
	│       ├── src/				# framework source
	│       ├── types/         		# Express.Request.user augmentation, etc.
	│       └── ...
	├── templates/             		# shared configs (Jest/TS config templates etc)
	├── install.bat            		# run npm install
	└── package.json           		# Monorepo root (workspaces defined here)

The root ```package.json``` defines workspaces for apps and packages.

## Getting started

### 1. Project setup:
At **root/apps/**, clone **TemplateBackend** in the same directory, renaming it to the project name of your choice:

	root/apps
	├── TemplateBackend/
	└── MyBackend/

Search and replace all instances of the template name ```template-backend``` with the actual name of your backend project.

### 2. Install dependencies:
At **root/**:
```bash
./install.bat
```
This installs all dependencies for both apps and packages thanks to workspaces.

### 3. Environment setup:
Each app manages its own env variables.

Create a ```.env``` file at the root of your backend project with the following required values:

| Variable  | Description |
| ------------- | ------------- |
| PORT  | Port to run the backend server (e.g. 4000)  |
| FRONTEND_ORIGIN  | Allowed CORS origin (e.g. http://localhost:3001)  |
| MONGO_URI  | MongoDB connection URI to cluster  |
| MONGO_DB_NAME  | Database name  |
| MAX_SESSIONS  | Max allowed refresh token sessions per user (e.g. 3)  |
| SALT_ROUNDS  | Bcrypt salt rounds (e.g. 12)  |
| ACCESS_TOKEN_EXPIRES_IN_S  | Access token expiry in seconds (e.g. 900s = 5 min)  |
| REFRESH_TOKEN_EXPIRES_IN_S  | Refresh token expiry in seconds (e.g. 604800s = 7 days)  |
| ACCESS_TOKEN_SECRET  | Strong random secret for signing access tokens  |
| REFRESH_TOKEN_SECRET  | Strong random secret for signing refresh tokens  |

*Tip: you can generate a 64-byte (512-bit) secret as a hex string using OpenSSL. Run the following within PowerShell:*

```bash
openssl rand -hex 64
```

Use different values for access and refresh token secrets.

### 4. Launching:
At **root/apps/MyBackend/**, run the bat files as required:


	root/apps/MyBackend
	├── run-tests.bat			# run jest tests
	└── start-dev.bat			# launch the backend locally

### 5. Continuing:
You can now start building off of the starting code provided.

Included in the TemplateBackend codebase is a simple guestbook entry application that demonstrates all layers of a backend project based on this framework.

## MongoDB setup
The framework uses Mongoose to interact with MongoDB. You can connect to a remote MongoDB Atlas cluster or a local MongoDB instance.

### Link your MongoDB database
Using either MongoDB Atlas or local MongoDB (MongoDB Community Edition), create a cluster and a database under that cluster. Fill in the relevant ```.env``` variables.

```MONGO_URI``` (MongoDB connection URI to cluster):
```bash
mongodb+srv://<username>:<password>@cluster0.mongodb.net/
```

```MONGO_DB_NAME``` (Database name):
```bash
myDatabaseDB
```

### Collections creation
You do not need to create collections manually. When you use one of the provided models, Mongoose will:
- Automatically create the corresponding collection (e.g. users)
- Apply the defined schema fields and types
- Ensure indexes (like unique constraints) are enforced

The framework would have defined the model ```userModel``` for auth.

This will be saved to a ```users``` collection under your defined ```MONGO_DB_NAME```.

### When is the database connected?
The framework automatically connects to the MongoDB URI during createApp(...) when your app launches. You just need to make sure:

- ```.env``` is provided

- The required ```MONGO_URI``` and ```MONGO_DB_NAME``` are present

If the connection fails, an error will be thrown at startup.

## Authentication
The framework ships with a complete auth flow using JWT access tokens (short-lived) and opaque refresh tokens (rotatable). Device/user-agent/IP are stored alongside sessions for reference, but not currently used for enforcement.

### How it works
- **Register** → create user with bcrypt-hashed password.

- **Login** → issues access token (JWT) + refresh token (opaque); refresh token is HMAC-hashed (never stored in plaintext) and saved on the user with timestamps + optional UA/IP.

- **Refresh** → validates the refresh token by hash, rotates it (new token/hash) and issues a new access token. The refresh expiry does not extend.

- **Logout** → invalidates just that one refresh session.

- **Session limits** → sessions are pruned to env var ```MAX_SESSIONS``` (newest kept).

### Setup
No extra wiring needed, the ```/auth``` routes are mounted internally in the framework. From your client app, just do the normal setup and env:

- Use ```createApp``` from the framework.

- Ensure your ```.env``` is filled out fully (see your main env section for details).

To protect your own routes, add them to the **protectedRoutes** param of ```createApp``` (the framework applies **verifyAccessTokenMiddleware** before protected routes).

### API
**POST /auth/register**
Body
```json
{ "email": "user@example.com", "password": "ValidP@ssw0rd" }
```

200
```json
{
  "accessToken": "<jwt>",
  "refreshToken": "<opaque>",
  "atExpiresAt": "2025-08-11T13:37:00.000Z",
  "rtExpiresAt": "2025-08-18T13:37:00.000Z"
}
```

Errors
- 400: invalid input shape
- 409: email already in use

**POST /auth/login**
Body
```json
{ "email": "user@example.com", "password": "ValidP@ssw0rd" }
```

200
```json
{
  "accessToken": "<jwt>",
  "refreshToken": "<opaque>",
  "atExpiresAt": "2025-08-11T13:37:00.000Z",
  "rtExpiresAt": "2025-08-18T13:37:00.000Z"
}
```

Errors
- 400: invalid input shape
- 401: wrong email/password

**POST /auth/refresh**
Body
```json
{ "refreshToken": "<opaque>" }
```

200
```json
{
  "accessToken": "<new-jwt>",
  "refreshToken": "<new-opaque>",
  "atExpiresAt": "2025-08-11T14:37:00.000Z",
  "rtExpiresAt": "2025-08-18T13:37:00.000Z"
}
```

Errors
- 400: missing/invalid refresh token
- 401: invalid/reused/expired token
- 404: session not found

**POST /auth/logout**
Body
```json
{ "refreshToken": "<opaque>" }
```

200
```json
{ "msg": "Logged out of session" }
```

Errors
- 400: missing/invalid token
- 401: token not associated with any user
- 404: session not found

### Using protected routes in your app

Users must send the access token in:
```json
Authorization: Bearer <accessToken>
```

Refresh tokens should be stored securely on the client and only sent to **/auth/refresh** and **/auth/logout**.


## Contributions
### Function comment block guidelines
All functions will include a standardized JSDoc comment block for clarity, maintainability, and automated documentation support.

Use the following format:
```javascript
/**
 * <brief description of the function's purpose and behavior>
 *
 * @param <typedParamName> - <description of the parameter with a defined TypeScript type>
 * @param <anyParamName> - <description of the loose/any-typed object parameter>:
 *   - `<fieldName1>`: <type> - <description of this field>
 *   - `<fieldName2_optional?>`: <type> - <description of this optional field>
 *
 * @returns <typed> - <description of the returned primitive or named type>
 * @returns any:
 *   - `<fieldName1>`: <type> - <description of this field in the returned loose/any-typed object>
 *
 * @throws {<ErrorType>} <condition under which the error is thrown>
 */
```
