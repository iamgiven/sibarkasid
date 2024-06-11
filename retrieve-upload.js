const MongoClient = require('mongodb').MongoClient;

async function retrieveUploadByUsername(username) {
  try {
    const client = await MongoClient.connect(process.env.MONGODB_URI);
    const db = client.db("sibarkasid");

    const user = await db.collection("users").findOne({ username: username });
    const uploadedProducts = user.uploaded || [];

    let products = [];
    if (uploadedProducts.length > 0) {
      const productIds = uploadedProducts.map(function(product) {
        return product.productId;
      });
    
      products = await db.collection("products").find({ _id: { $in: productIds }}).toArray();
    }

    client.close();
    return products;
  } catch (error) {
    throw new Error(`Error retrieving uploaded products: ${error}`);
  }
}

module.exports = retrieveUploadByUsername;
