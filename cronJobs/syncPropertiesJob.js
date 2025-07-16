import cron from "node-cron";
import Property from "../models/property.model.js";
import admin from "../firebase/firebaseAdmin.js";

const db = admin.firestore();
const firestoreCollection = db.collection("properties");

export async function syncPropertiesToFirestore() {
  try {

    const properties = await Property.find().lean();
    const batch = db.batch();
    let syncedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    const syncPromises = properties.map(async (property) => {
      try {
        const propertyId = property.propertyId.toString();
        const docRef = firestoreCollection.doc(propertyId);
        const doc = await docRef.get();

        if (!doc.exists) {
          console.log(`⬆️ Syncing property ${propertyId}`);

          batch.set(docRef, {
            ...property,
            _id: propertyId,
            firestoreSynced: true,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });

          syncedCount++;
        } else {
          skippedCount++;
          console.log(`✅ Property ${propertyId} already exists`);
        }
      } catch (error) {
        errorCount++;
        console.error(
          `❌ Error processing property ${property.propertyId}:`,
          error
        );
      }
    });

    await Promise.all(syncPromises);

    if (syncedCount > 0) {
      await batch.commit();
      console.log(
        `🎉 Successfully synced ${syncedCount} properties to Firestore`
      );
    }

    console.log(`ℹ️ Sync summary: 
      - New properties synced: ${syncedCount}
      - Existing properties skipped: ${skippedCount}
      - Errors encountered: ${errorCount}`);

    return { success: true, syncedCount, skippedCount, errorCount };
  } catch (error) {
    console.error("❌ CRON Firestore sync error:", error);
    throw error;
  }
}

const startPropertySyncCron = () => {
  const job = cron.schedule("35 12 * * *", async () => {
    console.log("⏰ CRON: Triggering scheduled property sync");
    await syncPropertiesToFirestore();
  });

  console.log(
    "⏱️ Property sync job scheduled to run every day at 12:00 AM UTC"
  );

  if (process.env.NODE_ENV === "development") {
    console.log("🔧 Development mode: Enabling manual sync trigger");
    return {
      start: job.start,
      stop: job.stop,
      manualSync: syncPropertiesToFirestore,
    };
  }

  return job;
};

export default startPropertySyncCron;
