import mongoose from 'mongoose';
import { MongoMemoryReplSet } from 'mongodb-memory-server';

let mongoReplset: MongoMemoryReplSet | null = null;

/**
 * Connect to the in-memory database.
 */
export const connect = async (): Promise<void> => {
  if (mongoose.connection.readyState !== 0) {
    return;
  }

  mongoReplset = await MongoMemoryReplSet.create({ replSet: { count: 2 } }); // This will create an ReplSet with 4 members

  const uri = mongoReplset.getUri();
  await mongoose.connect(uri);
};

/**
 * Drop database, close the connection and stop mongod.
 */
export const closeDatabase = async (): Promise<void> => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  }
  if (mongoReplset) {
    await mongoReplset.stop();
    mongoReplset = null;
  }
};

/**
 * Remove all the data for all db collections.
 */
export const clearDatabase = async (): Promise<void> => {
  if (mongoose.connection.readyState === 0) {
    return;
  }

  const collections = mongoose.connection.collections;

  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
};
