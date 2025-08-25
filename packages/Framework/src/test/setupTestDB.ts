import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongo: MongoMemoryServer;

/******************************************************************************************************************
 * Sets up an in-memory MongoDB instance for Jest tests and wires Mongoose lifecycle hooks.
 * - Spins up a temporary in-memory MongoDB instance before all tests
 * - Connects Mongoose to this instance
 * - Cleans all collections after each test
 * - Closes connection and stops MongoDB after all tests
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
