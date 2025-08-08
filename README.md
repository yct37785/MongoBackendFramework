# MongoBackendFramework
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

## Project Structure
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

## Getting Started
### Place framework and client Side-by-Side:
	root/
	├── MongoBackendFramework/
	└── MyProject/

### Place framework and client Side-by-Side:
In MongoBackendFramework/, run:
```bash
./build.bat
```

This compiles to ```dist/``` and enables proper exports

### Link the Framework in Your Client
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

### Dev Dependencies (Client)
Install the following dev dependencies in your client project:
```bash
npm install --save-dev @types/cors @types/express @types/jest @types/jsonwebtoken @types/node cross-env jest mongodb-memory-server nodemon supertest ts-jest ts-node typescript
```

### TypeScript Configuration (Client)
In your ```tsconfig.json```:
```javascript
"compilerOptions": {
  "baseUrl": ".",
  "paths": {
    "@yourname/mongo-backend-framework": ["../MongoBackendFramework/dist"]
  }
```

### Basic Usage Example
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

### Environment Variables (.env)
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

## Sample Starter Project
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

## MongoDB Setup
The framework uses Mongoose to interact with MongoDB. You can connect to a remote MongoDB Atlas cluster or a local MongoDB instance.

### Link Your MongoDB Database
Using either MongoDB Atlas or local MongoDB (MongoDB Community Edition), create a cluster and a database under that cluster. Fill in the relevant .env variables.

MONGO_URI (MongoDB connection URI to cluster):
```bash
mongodb+srv://<username>:<password>@cluster0.mongodb.net/
```

MONGO_DB_NAME (Database name):
```bash
myDatabaseDB
```

### Collections Creation
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

### When Is the Database Connected?
The framework automatically connects to the MongoDB URI during createApp(...) when your app launches. You just need to make sure:

- .env is provided

- The required MONGO_URI and MONGO_DB_NAME are present

If the connection fails, an error will be thrown at startup.
