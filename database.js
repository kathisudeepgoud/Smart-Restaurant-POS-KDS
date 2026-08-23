const { MongoClient } = require('mongodb');

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/";
const DB_NAME = "smart_restaurant_kds";

const client = new MongoClient(MONGO_URI);
let db = null;

async function connectDb() {
  await client.connect();
  db = client.db(DB_NAME);
  console.log("Connected to MongoDB database:", DB_NAME);
  await seedMenuIfEmpty();
}

function getCollection(name) {
  if (!db) {
    throw new Error("Database not connected. Call connectDb() first.");
  }
  return db.collection(name);
}

function toDict(doc) {
  if (!doc) return null;
  const newDoc = { ...doc };
  if (newDoc._id) {
    newDoc.id = newDoc._id.toString();
    delete newDoc._id;
  }
  return newDoc;
}

function toDictList(arr) {
  if (!arr) return [];
  return arr.map(toDict);
}

async function seedMenuIfEmpty() {
  const menuCollection = db.collection("menu");
  const count = await menuCollection.countDocuments({});
  if (count === 0) {
    const sampleMenu = [
      // Gobi
      { name: "Gobi", category: "Gobi", prep_time_minutes: 10, price: 120 },
      { name: "Gobi Chilli", category: "Gobi", prep_time_minutes: 12, price: 140 },
      { name: "Gobi 65", category: "Gobi", prep_time_minutes: 12, price: 140 },
      { name: "Mushroom", category: "Gobi", prep_time_minutes: 10, price: 150 },
      { name: "Mushroom Chilli", category: "Gobi", prep_time_minutes: 12, price: 150 },
      { name: "Mushroom 65", category: "Gobi", prep_time_minutes: 12, price: 150 },
      { name: "Egg Gobi", category: "Gobi", prep_time_minutes: 12, price: 140 },

      // Rice items
      { name: "Fried Rice", category: "Rice items", prep_time_minutes: 10, price: 100 },
      { name: "Gobi Rice", category: "Rice items", prep_time_minutes: 12, price: 120 },
      { name: "Zeera Rice", category: "Rice items", prep_time_minutes: 8, price: 100 },
      { name: "Mushroom Rice", category: "Rice items", prep_time_minutes: 12, price: 150 },
      { name: "Kaju Rice", category: "Rice items", prep_time_minutes: 14, price: 170 },
      { name: "Noodles", category: "Rice items", prep_time_minutes: 10, price: 100 },
      { name: "Gobi Noodles", category: "Rice items", prep_time_minutes: 12, price: 120 },
      { name: "Egg Noodles", category: "Rice items", prep_time_minutes: 12, price: 120 },
      { name: "Egg Rice", category: "Rice items", prep_time_minutes: 10, price: 120 },
      { name: "Egg Gobi Rice", category: "Rice items", prep_time_minutes: 14, price: 140 },
      { name: "Egg Gobi Noodles", category: "Rice items", prep_time_minutes: 14, price: 140 },
      { name: "Mushroom Noodles", category: "Rice items", prep_time_minutes: 12, price: 150 },

      // Milkshakes
      { name: "Priya Milkshake", category: "Milkshakes", prep_time_minutes: 5, price: 90 },
      { name: "Mango Milkshake", category: "Milkshakes", prep_time_minutes: 5, price: 80 },
      { name: "Pista Milkshake", category: "Milkshakes", prep_time_minutes: 5, price: 80 },
      { name: "Vanilla Milkshake", category: "Milkshakes", prep_time_minutes: 5, price: 80 },
      { name: "Strawberry Milkshake", category: "Milkshakes", prep_time_minutes: 5, price: 80 },
      { name: "Chocolate Milkshake", category: "Milkshakes", prep_time_minutes: 5, price: 80 },
      { name: "Badam Milkshake", category: "Milkshakes", prep_time_minutes: 5, price: 80 },
      { name: "Butterscotch Milkshake", category: "Milkshakes", prep_time_minutes: 5, price: 80 },
      { name: "Pineapple Milkshake", category: "Milkshakes", prep_time_minutes: 5, price: 80 },
      { name: "Badam Milk", category: "Milkshakes", prep_time_minutes: 3, price: 50 },
      { name: "Lassi", category: "Milkshakes", prep_time_minutes: 4, price: 50 },
      { name: "Special Lassi", category: "Milkshakes", prep_time_minutes: 5, price: 60 },
      { name: "Water bottle - 1 Liter", category: "Milkshakes", prep_time_minutes: 1, price: 20 },
      { name: "Water bottle - 500ml", category: "Milkshakes", prep_time_minutes: 1, price: 10 },

      // Ice creams
      { name: "Vanilla", category: "Ice creams", prep_time_minutes: 2, price: 100 },
      { name: "Strawberry", category: "Ice creams", prep_time_minutes: 2, price: 100 },
      { name: "Pineapple", category: "Ice creams", prep_time_minutes: 2, price: 100 },
      { name: "Pista", category: "Ice creams", prep_time_minutes: 2, price: 110 },
      { name: "Chocolate", category: "Ice creams", prep_time_minutes: 2, price: 110 },
      { name: "Mango", category: "Ice creams", prep_time_minutes: 2, price: 110 },
      { name: "Badam Ice", category: "Ice creams", prep_time_minutes: 3, price: 110 },
      { name: "Butter Scotch", category: "Ice creams", prep_time_minutes: 2, price: 110 },
      { name: "3 In 1", category: "Ice creams", prep_time_minutes: 3, price: 110 },

      // Spl.Ice creams
      { name: "4 in 1", category: "Spl.Ice creams", prep_time_minutes: 4, price: 130 },
      { name: "Priya Special", category: "Spl.Ice creams", prep_time_minutes: 5, price: 140 },
      { name: "Basanthi", category: "Spl.Ice creams", prep_time_minutes: 3, price: 100 },
      { name: "Basanthi Ice", category: "Spl.Ice creams", prep_time_minutes: 4, price: 130 },
      { name: "Fruit Salad", category: "Spl.Ice creams", prep_time_minutes: 4, price: 130 },
      { name: "Kaju Kismiss", category: "Spl.Ice creams", prep_time_minutes: 3, price: 120 },
      { name: "Rainbow Deluxe", category: "Spl.Ice creams", prep_time_minutes: 5, price: 130 },
      { name: "American Coconuts", category: "Spl.Ice creams", prep_time_minutes: 4, price: 130 },
      { name: "Badam Pista", category: "Spl.Ice creams", prep_time_minutes: 3, price: 120 },

      // Ice cream parcel
      { name: "Vanilla 500ml", category: "Ice cream parcel", prep_time_minutes: 2, price: 120 },
      { name: "Strawberry 500ml", category: "Ice cream parcel", prep_time_minutes: 2, price: 120 },
      { name: "Mango 500ml", category: "Ice cream parcel", prep_time_minutes: 2, price: 140 },
      { name: "Chocolate 500ml", category: "Ice cream parcel", prep_time_minutes: 2, price: 140 },
      { name: "Pista 500ml", category: "Ice cream parcel", prep_time_minutes: 2, price: 140 },
      { name: "Badam Ice 500ml", category: "Ice cream parcel", prep_time_minutes: 2, price: 140 },
      { name: "Butter Scotch 500ml", category: "Ice cream parcel", prep_time_minutes: 2, price: 140 },
      { name: "All Mix 500ml", category: "Ice cream parcel", prep_time_minutes: 3, price: 160 },
      { name: "All Mix 250ml", category: "Ice cream parcel", prep_time_minutes: 3, price: 90 },

      // Basanthi parcel
      { name: "Basanthi", category: "Basanthi parcel", prep_time_minutes: 2, price: 90 },
      { name: "Basanthi 250ml", category: "Basanthi parcel", prep_time_minutes: 2, price: 150 },
      { name: "Basanthi 500ml", category: "Basanthi parcel", prep_time_minutes: 2, price: 300 }
    ];
    await menuCollection.insertMany(sampleMenu);
    console.log("Menu seeded successfully!");
  }
}

module.exports = {
  connectDb,
  getCollection,
  toDict,
  toDictList
};
