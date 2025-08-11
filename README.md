# Mongo Backend Framework
Modular, extensible plug-and-play Node.js backend framework built with TypeScript, Express, Mongoose, and JWT authentication.

## Features
⚙️ Plug-and-play Express app builder (createApp)

🔐 JWT authentication middleware & utilities

🧼 Input sanitization helpers

💥 Centralized error handling and reusable error classes

🧪 Jest testing support (setup templates and mocks included)

🧱 Fully typed with TypeScript and exports .d.ts declarations

🧪 In-memory DB testing via mongodb-memory-server

📁 Strict project structure for clarity and modularity

## Project structure
	MongoBackendFramework/
	├── dist/          # compiled output
	├── exports/       # dependency exports
	├── src/           # core modules (controllers, services, utils, etc.)
	├── templates/     # shared templates (Jest etc.)
	├── types/         # type augmentations (e.g. express `Request.user`)
	├── index.ts       # main entry for build exports
	├── indexSample.ts # example usage and standalone runner (for development)
	├── build.bat      # build script
	├── start-dev.bat  # run standalone mode
	└── package.json   # package metadata and exports

## Getting started
### Place framework and client side-by-side:
	root/
	├── MongoBackendFramework/
	└── MyProject/

### Build
In MongoBackendFramework/, run:
```bash
./build.bat
```

This compiles to ```dist/``` and enables proper exports

### Link the framework in your client
In your client (```MyProject/```), reference the framework as a local dependency:
```javascript
"dependencies": {
  "@yourname/mongo-backend-framework": "file:../MongoBackendFramework"
},
```

Install:
```bash
npm i
```

### Dev dependencies (client)
Install the following dev dependencies in your client project:
```bash
npm install --save-dev @types/cors @types/express @types/jest @types/jsonwebtoken @types/node cross-env jest mongodb-memory-server nodemon supertest ts-jest ts-node typescript
```

### TypeScript configuration (client)
In your ```tsconfig.json```:
```javascript
"compilerOptions": {
  "baseUrl": ".",
  "paths": {
    "@yourname/mongo-backend-framework": ["../MongoBackendFramework/dist"]
  }
```

### Basic usage example
index.ts:
```javascript
import {} from '@yourname/mongo-backend-framework/types'; // type argumentation
import { express } from '@yourname/mongo-backend-framework/express';
import { loadEnv } from '@yourname/mongo-backend-framework/miscUtils';
import { createApp } from '@yourname/mongo-backend-framework/createApp';
// import myRoutes from './src/routes/myRoutes';

loadEnv();

// test rexport express works on client
const unprotectedRouter: express.Router = express.Router();
unprotectedRouter.get('/test-unprotected', async (req, res) => {
  return res.status(200).json('yes works');
});

// initialize app with optional unprotected/protected routes
const app = createApp(
  unprotectedRouter, // optional unprotected routes (if any)
  express
    .Router()
    // .use('/myRoutes', myRoutes)
);

// start server
const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`🚀 Client App running on port ${PORT}`);
});
```

### Environment variables (.env)
Create a .env file in your client project with the following required values:

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

Tip: you can generate a 64-byte (512-bit) secret as a hex string using OpenSSL. Run the following within PowerShell:

```bash
openssl rand -hex 64
```

Use different values for access and refresh token secrets.

## Sample starter project
Alternatively start your backend app with the [sample starter project](https://github.com/yct37785/MongoBackendFrameworkSample).

### Usage
Clone it next to the framework:

	root/
	├── MongoBackendFramework/
	└── MyProject/

Search and replace all instances of the placeholder name ```mongo-backend-framework-sample``` with the actual name of your app.

Build framework if not already:
```bash
cd MongoBackendFramework
./build.bat
```

Back to your project, install dependencies:
```bash
npm i
```

Setup ```.env```, refer to sample ```sample.env``` (you can delete it afterwards)

Launch the app by running ```start-dev.bat```

Run your project and test GET ```/test-unprotected``` returns 200.

You can now start building off of the start code provided.

## MongoDB setup
The framework uses Mongoose to interact with MongoDB. You can connect to a remote MongoDB Atlas cluster or a local MongoDB instance.

### Link your MongoDB database
Using either MongoDB Atlas or local MongoDB (MongoDB Community Edition), create a cluster and a database under that cluster. Fill in the relevant .env variables.

MONGO_URI (MongoDB connection URI to cluster):
```bash
mongodb+srv://<username>:<password>@cluster0.mongodb.net/
```

MONGO_DB_NAME (Database name):
```bash
myDatabaseDB
```

### Collections creation
You do not need to create collections manually. When you use one of the provided models, Mongoose will:
- Automatically create the corresponding collection (e.g. users)
- Apply the defined schema fields and types
- Ensure indexes (like unique constraints) are enforced

The framework would have defined the following model ```userModel``` for auth:
```javascript
{
  email:        { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  refreshTokens: [
    {
      tokenHash:  String,
      createdAt:  Date,
      lastUsedAt: Date,
      expiresAt:  Date,
      userAgent:  String,
      ip:         String
    }
  ]
}
```

This will be saved to a ```users``` collection under your defined MONGO_DB_NAME.

### When is the database connected?
The framework automatically connects to the MongoDB URI during createApp(...) when your app launches. You just need to make sure:

- .env is provided

- The required MONGO_URI and MONGO_DB_NAME are present

If the connection fails, an error will be thrown at startup.

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

## Authentication
The framework ships with a complete auth flow using JWT access tokens (short-lived) and opaque refresh tokens (rotatable). Device/user-agent/IP are stored alongside sessions for reference, but not currently used for enforcement.

### How it works
- **Register** → create user with bcrypt-hashed password.

- **Login** → issues access token (JWT) + refresh token (opaque); refresh token is HMAC-hashed (never stored in plaintext) and saved on the user with timestamps + optional UA/IP.

- **Refresh** → validates the refresh token by hash, rotates it (new token/hash) and issues a new access token. The refresh expiry does not extend.

- **Logout** → invalidates just that one refresh session.

- **Session limits** → sessions are pruned to env var MAX_SESSIONS (newest kept).

### Setup
No extra wiring needed, the /auth routes are mounted internally in the framework. From your client app, just do the normal setup and env:

- Use createApp from the framework.

- Ensure your .env is filled out fully (see your main env section for details).

To protect your own routes, add them to the **protectedRoutes** param of createApp (the framework applies **verifyAccessTokenMiddleware** before protected routes).

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
In your client app:
```javascript
import { express } from '@yourname/mongo-backend-framework/express';
import { createApp } from '@yourname/mongo-backend-framework/createApp';

const publicRoutes = express.Router();
publicRoutes.get('/ping', (_req, res) => res.send('pong'));

const protectedRoutes = express.Router();
protectedRoutes.get('/me', (req, res) => {
  // req.user is set by the framework's verifyAccessTokenMiddleware
  res.json({ user: req.user });
});

const app = createApp(publicRoutes, protectedRoutes);
```

Users must send the access token in:
```json
Authorization: Bearer <accessToken>
```

Refresh tokens should be stored securely on the client and only sent to **/auth/refresh** and **/auth/logout**.
