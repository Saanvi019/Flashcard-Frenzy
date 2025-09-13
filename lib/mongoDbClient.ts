import { MongoClient } from "mongodb";

if (!process.env.MONGODB_URI) {
  throw new Error("MONGODB_URI not set in .env.local");
}

const client = new MongoClient(process.env.MONGODB_URI);
const db = client.db("flashcard"); 

export const matchesHistoryCollection = db.collection("matches_history");

export async function connectMongo() {
  
  await client.connect();
  return db;
}