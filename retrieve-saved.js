const MongoClient = require('mongodb').MongoClient;

async function retrieveProductsByUsername(username) {
  try {
    const client = await MongoClient.connect(process.env.MONGODB_URI);
    const db = client.db("sibarkasid");

    const user = await db.collection("users").findOne({ username: username });
    const savedProducts = user.saved || [];

    const productIds = savedProducts.map(function(product) {
      return product.productId;
    });
      
    const products = await db.collection("products").find({ _id: { $in: productIds }}).toArray();

    client.close();
    return products;
  } catch (error) {
    throw new Error(`Error retrieving saved products: ${error}`);
  }
}

module.exports = retrieveProductsByUsername;
