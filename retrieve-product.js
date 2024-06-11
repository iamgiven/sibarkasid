const MongoClient = require('mongodb').MongoClient;

async function retrieveProducts(keyword = '') {
  try {
    const client = await MongoClient.connect(process.env.MONGODB_URI);
    const db = client.db("sibarkasid");
    let products;
    if (keyword) {
      products = await db.collection("products").find({
        $or: [
          { nama_barang: { $regex: keyword, $options: 'i' } },
          { deskripsi_barang: { $regex: keyword, $options: 'i' } },
          { kata_kunci: { $regex: keyword, $options: 'i' } }
        ]
      }).toArray();
    } else {
      products = await db.collection("products").find().toArray();
    }
    client.close();
    return products;
  } catch (error) {
    throw new Error(`Error retrieving products: ${error}`);
  }
}

module.exports = retrieveProducts;
