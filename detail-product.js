const { MongoClient, ObjectId } = require('mongodb');

async function retrieveProductById(productId) {
  try {
    const client = await MongoClient.connect(process.env.MONGODB_URI);
    const db = client.db("sibarkasid");

    const product = await db.collection("products").findOne({ _id: new ObjectId(productId) });

    

    client.close();
    return product;
  } catch (error) {
    throw new Error(`Error retrieving products: ${error}`);
  }
}

module.exports = { retrieveProductById };
