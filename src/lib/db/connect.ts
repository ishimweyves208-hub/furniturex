import mongoose from "mongoose";
import { ConfigurationError, env } from "@/lib/env";

type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

declare global {
  var __furniturexMongoose: MongooseCache | undefined;
}

const cache: MongooseCache =
  global.__furniturexMongoose ?? (global.__furniturexMongoose = { conn: null, promise: null });

export async function connectDb(): Promise<typeof mongoose> {
  if (cache.conn) return cache.conn;

  const uri = env().MONGODB_URI;
  if (!uri) {
    throw new ConfigurationError(
      "MONGODB_URI is not configured. Add your MongoDB Atlas connection string to the environment.",
    );
  }

  if (!cache.promise) {
    mongoose.set("strictQuery", true);
    cache.promise = mongoose
      .connect(uri, {
        dbName: env().MONGODB_DB,
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 10_000,
        socketTimeoutMS: 45_000,
      })
      .then((instance) => instance)
      .catch((error: unknown) => {
        cache.promise = null;
        throw error;
      });
  }

  try {
    cache.conn = await cache.promise;
    return cache.conn;
  } catch (error) {
    cache.promise = null;
    throw error;
  }
}

export function isDbConfigured(): boolean {
  return Boolean(env().MONGODB_URI);
}

export async function isTransactionSupported(): Promise<boolean> {
  const db = mongoose.connection.db;
  if (!db) return false;
  try {
    const hello = (await db.admin().command({ hello: 1 })) as {
      setName?: string;
      msg?: string;
    };
    return Boolean(hello.setName) || hello.msg === "isdbgrid";
  } catch {
    return false;
  }
}
