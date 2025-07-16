import Property from "../models/property.model.js";
import admin from "../firebase/firebaseAdmin.js";

const db = admin.firestore();
const firestoreCollection = db.collection("properties");

const propertyController = {
  async syncToFirestore(req, res) {
    try {
      const properties = await Property.find();
      console.log(`🔍 Found ${properties.length} properties in MongoDB`);

      if (!properties.length) {
        return res.status(200).json({
          success: true,
          message: "No properties found in MongoDB to sync",
        });
      }

      const batch = db.batch();
      let syncedCount = 0;

      for (const property of properties) {
        const propertyId = property._id.toString();
        const docRef = firestoreCollection.doc(propertyId);
        const doc = await docRef.get();

        if (!doc.exists) {
          console.log(`⬆️ Syncing property ${propertyId} to Firestore`);
          batch.set(docRef, {
            ...property.toObject(),
            firestoreSynced: true,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
          syncedCount++;
        } else {
          console.log(`✅ Skipping already existing property ${propertyId}`);
        }
      }

      if (syncedCount > 0) {
        await batch.commit();
        console.log(`🎉 Synced ${syncedCount} new properties to Firestore`);
      }

      res.status(200).json({
        success: true,
        message:
          syncedCount > 0
            ? `${syncedCount} properties synced to Firestore`
            : "All properties already exist in Firestore",
      });
    } catch (error) {
      console.error("❌ Firestore sync error:", error);
      res.status(500).json({
        success: false,
        message: "Error syncing properties",
        error: error.message,
      });
    }
  },

  async saveProperty(req, res) {
    try {
      const propertyData = req.body;

      const existingProperty = await Property.findOne({
        $or: [
          { propertyId: propertyData.propertyId },
          {
            name: propertyData.name,
            location: propertyData.location,
            price: propertyData.price,
          },
        ],
      });

      if (existingProperty) {
        return res.status(400).json({
          success: false,
          message: "Property already exists in MongoDB",
        });
      }

      const newProperty = new Property(propertyData);
      const savedProperty = await newProperty.save();
      const propertyId = savedProperty._id.toString();

      await firestoreCollection.doc(propertyId).set({
        ...savedProperty.toObject(),
        firestoreSynced: true,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      console.log(`✅ Property ${propertyId} saved to MongoDB and Firestore`);

      res.status(201).json({
        success: true,
        message: "Property saved to MongoDB and synced to Firestore",
        data: savedProperty,
      });
    } catch (error) {
      console.error("❌ Save error:", error);
      res.status(500).json({
        success: false,
        message: "Error saving property",
        error: error.message,
      });
    }
  },
  async getProperties(req, res) {
    try {
      const properties = await Property.find();
      res.status(200).json({
        success: true,
        data: properties,
      });
    } catch (error) {
      console.error("❌ Fetch error:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching properties",
        error: error.message,
      });
    }
  },
};

export default propertyController;
