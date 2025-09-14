import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongo: MongoMemoryServer;

/******************************************************************************************************************
 * Initializes an isolated in-memory database for the test process and registers lifecycle hooks.
 * - Spins up a temporary in-memory MongoDB instance before all tests
 * - Connects Mongoose to this instance
 * - Cleans all collections after each test
 * - Closes connection and stops MongoDB after all tests
 *
 * @usage
 * ```ts
 * // in your .test.ts file
 * import { setUpInMemDB } from "./SetupTestDB";
 * setUpInMemDB();
 * ```
 ******************************************************************************************************************/
export function setUpInMemDB() {
  beforeAll(async () => {
    // start a new in-memory MongoDB server
    mongo = await MongoMemoryServer.create();
    const uri = mongo.getUri();
    await mongoose.connect(uri);
  });

  afterEach(async () => {
    // reset all collections between tests to ensure clean state
    const collections = await mongoose.connection.db!.collections(); // <- non-null assertion
    for (const collection of collections) {
      await collection.deleteMany({});
    }
  });

  afterAll(async () => {
    await mongoose.connection.close();
    await mongo.stop();
  });
}
