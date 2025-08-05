# MongoBackendFramework
Modular, extensible plug-and-play Node.js backend framework built with TypeScript, Express, Mongoose, and JWT authentication.

## Features
⚙️ Plug-and-play Express app builder (createApp)

🧼 Built-in input sanitization utilities

🔐 JWT authentication with middleware support

🧪 Jest testing support and setup exports

🧱 Reusable error classes and async handler wrappers

🗂️ Fully typed using TypeScript with declaration outputs

🧪 Support for in-memory testing with mongodb-memory-server

📁 Strict project layout for clarity and modular reuse

## Project Structure
	MongoBackendFramework/
	├── dist/          # compiled output
	├── exports/       # deps and src module exports
	├── src/           # src modules (controllers, services, utils, etc.)
	├── templates/     # shared template files (Jest etc.)
	├── types/         # custom type extensions
	├── build.bat      # compile output with tsc
	├── start-dev.bat  # run standalone mode
	├── indexSample.ts # local dev runner (createApp demo)
	└── package.json   # exports and deps config

## Getting Started
Place your client project directory adjacent to MongoBackendFramework:

	root/
	├── MongoBackendFramework/
	└── MyProject/

In MongoBackendFramework, run ```build.bat``` to build ```dist```.

Back to MyProject, include MongoBackendFramework as a local dependency in package.json then run ```npm i```:
```javascript
"dependencies": {
  "@yourname/mongo-backend-framework": "file:../MongoBackendFramework"
},
```

Install the following dev dependencies:
```
npm install --save-dev @types/cors @types/express @types/jest @types/jsonwebtoken @types/node cross-env jest mongodb-memory-server nodemon supertest ts-jest ts-node typescript
```

Include the following to your tsconfig.json:
```javascript
"paths": {
  "@yourname/mongo-backend-framework": ["../MongoBackendFramework/dist"]
}
```

This is to resolve ```@yourname/mongo-backend-framework``` imports to ```../MongoBackendFramework/dist```.

Basic index.ts:
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

Configure the .env file, required vars below:

| Variable  | Description |
| ------------- | ------------- |
| PORT  | Port the backend server will run on (eg. 4000)  |
| FRONTEND_ORIGIN  | Allowed CORS origin for frontend requests (eg. http://localhost:3001)  |
| MONGO_URI  | MongoDB Atlas or local URI connection string (mongodb+srv://<username>:<password>@cluster.mongodb.net/)  |
| MONGO_DB_NAME  | Name of the database used by this app  |
| MAX_SESSIONS  | Max number of active refresh tokens per user (eg. 3)  |
| SALT_ROUNDS  | Number of bcrypt salt rounds for password hashing (eg. 12)  |
| ACCESS_TOKEN_EXPIRES_IN_S  | Expiry duration for access tokens in seconds (e.g., 900 = 15 min)  |
| REFRESH_TOKEN_EXPIRES_IN_S  | Expiry duration for refresh tokens in seconds (e.g., 604800 = 7 days)  |
| ACCESS_TOKEN_SECRET  | Secret key for signing access tokens (use a long, random string)  |
| REFRESH_TOKEN_SECRET  | Secret key for signing refresh tokens (must be different from access token)  |

Tip: you can generate a 64-byte (512-bit) secret as a hex string using OpenSSL. Open up PowerShell and run the following:

```
openssl rand -hex 64
```

Run your project and test GET ```/test-unprotected``` returns 200.

## Sample Starter Project
Alternatively start your backend app with the [sample starter project](https://github.com/yct37785/MongoBackendFrameworkSample).

Place it in a directory adjacent to MongoBackendFramework:

	root/
	├── MongoBackendFramework/
	└── MyProject/

Search and replace all instances of the sample name ```mongo-backend-framework-sample``` with your project name.

Run ```build.bat``` in MongoBackendFramework (if not already).

Back to MyProject, install dependencies:
```
npm i
```

Setup ```.env```, refer to and copy from ```sample.env``` (you can delete it afterwards)

Simply run it by launching ```start-dev.bat```

You can now start building off of the start code provided.
