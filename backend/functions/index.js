const functions = require("firebase-functions");
const admin = require("firebase-admin");
const express = require("express");
const cors = require("cors");

admin.initializeApp();
const db = admin.firestore();

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

// ----------------------------------------------------
// JWT AUTH MIDDLEWARE
// ----------------------------------------------------
const authenticateJWT = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: "Unauthorized: Missing Bearer Token" });
  }

  const idToken = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.user = decodedToken;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Unauthorized: Invalid or expired token" });
  }
};

// ----------------------------------------------------
// CHARGING ENGINE LOGIC
// ----------------------------------------------------
const calculateChargingEngine = (fare, tenantConfig, driverConfig = null) => {
  let originatorCharge = 0;
  let fulfilmentCharge = 0;
  let netDriverPayout = 0;
  let appliedLogic = '';

  // 1. If the driver has a custom agreement, it overrides the standard tenant logic
  if (driverConfig) {
    if (driverConfig.type === 'PERCENTAGE') {
      netDriverPayout = fare * (driverConfig.percentage || 0.80);
      fulfilmentCharge = fare - netDriverPayout;
      appliedLogic = `Custom Driver Override: ${(driverConfig.percentage * 100).toFixed(0)}% payout`;
    } else if (driverConfig.type === 'FIXED') {
      netDriverPayout = fare - (driverConfig.baseFee || 0);
      fulfilmentCharge = driverConfig.baseFee || 0;
      appliedLogic = `Custom Driver Override: £${driverConfig.baseFee.toFixed(2)} Platform Fee`;
    }
  } else {
    // 2. Standard Tenant Logic
    if (tenantConfig.type === 'HYBRID') {
      originatorCharge = 0.00;
      const baseFee = tenantConfig.baseFee || 1.00;
      const percentageFee = fare * (tenantConfig.percentage || 0.05);
      fulfilmentCharge = baseFee + percentageFee;
      appliedLogic = `Tenant Hybrid: ${(tenantConfig.percentage * 100).toFixed(0)}% + £${baseFee.toFixed(2)} Fixed`;
    } else if (tenantConfig.type === 'FIXED') {
      fulfilmentCharge = tenantConfig.baseFee || 0;
      appliedLogic = `Tenant Fixed: £${fulfilmentCharge.toFixed(2)}`;
    } else if (tenantConfig.type === 'PERCENTAGE') {
      fulfilmentCharge = fare * (tenantConfig.percentage || 0);
      appliedLogic = `Tenant Percentage: ${(tenantConfig.percentage * 100).toFixed(0)}%`;
    }
    netDriverPayout = fare - fulfilmentCharge;
  }

  const vatLiability = fulfilmentCharge * 0.20;

  return {
    grossFare: fare,
    originatorCharge,
    fulfilmentCharge,
    netDriverPayout,
    vatLiability,
    appliedLogic
  };
};

// ----------------------------------------------------
// API ROUTES
// ----------------------------------------------------

// Apply auth middleware to all API routes
app.use(authenticateJWT);

app.post("/api/v1/quotes", async (req, res) => {
  try {
    const { tenantId, pickup, dropoff } = req.body;
    if (!pickup || !dropoff || !tenantId) return res.status(400).json({ error: "Missing itinerary or tenant ID" });

    // Generate simulated Gross Fare
    const quotePrice = Math.floor(Math.random() * (120 - 45 + 1) + 45);
    
    // Pull Tenant config to ensure mathematical consistency with Bookings/Ledger
    const tenantDoc = await db.collection("Tenants").doc(tenantId).get();
    let config = { type: 'HYBRID', baseFee: 1.00, percentage: 0.05 };
    if (tenantDoc.exists && tenantDoc.data().chargingConfig) {
      config = tenantDoc.data().chargingConfig;
    }

    const grossNetBreakdown = calculateChargingEngine(quotePrice, config);

    return res.status(200).json({ quotePrice, grossNetBreakdown });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.post("/api/v1/bookings", async (req, res) => {
  try {
    const { tenantId, passengerId, fare, itinerary, role } = req.body;
    
    // Use strictly the authenticated user's ID to prevent identity spoofing
    const bookerId = req.user.uid;
    const authRole = req.user.User_Role || 'customer_personal'; // Default if unset
    
    const tenantDoc = await db.collection("Tenants").doc(tenantId).get();
    let config = { type: 'HYBRID', baseFee: 1.00, percentage: 0.05 };
    if (tenantDoc.exists) {
      config = tenantDoc.data().chargingConfig;
    }

    const grossNetBreakdown = calculateChargingEngine(fare, config);

    const batch = db.batch();
    const bookingRef = db.collection("Bookings").doc();
    batch.set(bookingRef, {
      tenantId,
      bookerId,
      passengerId: passengerId || bookerId,
      status: "PAID_PENDING_DISPATCH",
      itinerary,
      role: authRole,
      grossNetBreakdown,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    const ledgerRef = db.collection("Ledger").doc();
    batch.set(ledgerRef, {
      bookingId: bookingRef.id,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      ...grossNetBreakdown
    });

    await batch.commit();

    return res.status(200).json({ 
      success: true, 
      bookingId: bookingRef.id, 
      status: "PAID_PENDING_DISPATCH" 
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.get("/api/v1/provider/statement/:tenantId", async (req, res) => {
  try {
    const { tenantId } = req.params;
    
    // RBAC check: only admins or providers can view statements
    if (req.user.User_Role !== 'admin_controller' && req.user.User_Role !== 'provider') {
       return res.status(403).json({ error: "Forbidden: Controller access required." });
    }
    
    const bookingsSnapshot = await db.collection("Bookings").where("tenantId", "==", tenantId).where("status", "==", "ACCEPTED").get();
    
    let totalGross = 0;
    let totalProviderFee = 0;
    let totalDriverPayout = 0;
    
    const statement = [];
    bookingsSnapshot.forEach(doc => {
      const data = doc.data();
      const bdown = data.grossNetBreakdown;
      if (bdown) {
        totalGross += bdown.grossFare;
        totalProviderFee += bdown.fulfilmentCharge;
        totalDriverPayout += bdown.netDriverPayout;
        statement.push({
          bookingId: doc.id,
          driverId: data.driverId,
          grossFare: bdown.grossFare,
          providerFee: bdown.fulfilmentCharge,
          netPayout: bdown.netDriverPayout,
          logic: bdown.appliedLogic
        });
      }
    });

    return res.status(200).json({ 
      aggregate: { totalGross, totalProviderFee, totalDriverPayout },
      statement 
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// ----------------------------------------------------
// DRIVER COMPLIANCE TUNNEL
// ----------------------------------------------------

app.post("/api/v1/driver/compliance", async (req, res) => {
  try {
    if (req.user.User_Role !== 'driver') {
      return res.status(403).json({ error: "Forbidden: Driver access required." });
    }

    const { exteriorPassed, cabinPassed, tyresPassed } = req.body;
    
    if (!exteriorPassed || !cabinPassed || !tyresPassed) {
      return res.status(400).json({ error: "Compliance failed: All checks must be passed." });
    }

    const complianceRef = db.collection("Compliance_Logs").doc();
    await complianceRef.set({
      driverId: req.user.uid,
      status: 'VERIFIED',
      checks: { exteriorPassed, cabinPassed, tyresPassed },
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    return res.status(200).json({ success: true, message: "Compliance logged successfully." });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.post("/api/v1/driver/status", async (req, res) => {
  try {
    if (req.user.User_Role !== 'driver') {
      return res.status(403).json({ error: "Forbidden: Driver access required." });
    }

    const { targetStatus } = req.body; // e.g., 'AVAILABLE'
    const driverId = req.user.uid;

    if (targetStatus === 'AVAILABLE') {
      // Guard: Check if compliance was submitted in the last 12 hours
      const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);
      const complianceQuery = await db.collection("Compliance_Logs")
        .where("driverId", "==", driverId)
        .where("status", "==", "VERIFIED")
        .where("timestamp", ">", admin.firestore.Timestamp.fromDate(twelveHoursAgo))
        .orderBy("timestamp", "desc")
        .limit(1)
        .get();

      if (complianceQuery.empty) {
        return res.status(403).json({ error: "Compliance Required: You must complete the pre-shift checklist before going online." });
      }
    }

    // Use a transaction to safely update status
    const driverDocRef = db.collection("Drivers").doc(driverId);
    await db.runTransaction(async (transaction) => {
      // Using set with merge since document might not exist for mock
      transaction.set(driverDocRef, { driver_status: targetStatus, updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
    });

    return res.status(200).json({ success: true, status: targetStatus });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.post("/api/v1/driver/accept", async (req, res) => {
  try {
    if (req.user.User_Role !== 'driver') {
      return res.status(403).json({ error: "Forbidden: Driver access required." });
    }

    const { bookingId } = req.body;
    const driverId = req.user.uid;

    const bookingRef = db.collection("Bookings").doc(bookingId);
    const bookingDoc = await bookingRef.get();
    if (!bookingDoc.exists) return res.status(404).json({ error: "Booking not found." });

    const bookingData = bookingDoc.data();

    // 1. Fetch Driver Pay Model Configuration
    const driverDoc = await db.collection("Drivers").doc(driverId).get();
    let driverConfig = null;
    if (driverDoc.exists && driverDoc.data().Pay_Model) {
      driverConfig = driverDoc.data().Pay_Model;
    } else {
      // Create a mock pay model if none exists (e.g., driver keeps 85% of Gross)
      driverConfig = { type: 'PERCENTAGE', percentage: 0.85 };
      await db.collection("Drivers").doc(driverId).set({ Pay_Model: driverConfig }, { merge: true });
    }

    // 2. Recalculate Final Logic with Driver Override
    const finalBreakdown = calculateChargingEngine(bookingData.grossNetBreakdown.grossFare, null, driverConfig);

    // 3. Commit Final Transaction
    const batch = db.batch();
    
    // Update Booking
    batch.update(bookingRef, {
      status: "ACCEPTED",
      driverId: driverId,
      grossNetBreakdown: finalBreakdown,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Update Ledger (Query existing ledger entry by bookingId)
    const ledgerQuery = await db.collection("Ledger").where("bookingId", "==", bookingId).get();
    if (!ledgerQuery.empty) {
      const ledgerRef = ledgerQuery.docs[0].ref;
      batch.update(ledgerRef, {
        driverId: driverId,
        ...finalBreakdown
      });
    }

    await batch.commit();

    return res.status(200).json({ success: true, finalBreakdown });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

exports.api = functions.https.onRequest(app);

// ----------------------------------------------------
// ON_CREATE TRIGGER: Assign Custom Claims
// ----------------------------------------------------
exports.processSignUp = functions.auth.user().onCreate(async (user) => {
  const customClaims = {
    User_Role: 'customer_personal' // Default fallback
  };

  if (user.email && user.email.includes('admin')) {
    customClaims.User_Role = 'admin_controller';
  } else if (user.email && user.email.includes('corporate')) {
    customClaims.User_Role = 'customer_corporate';
  } else if (user.email && user.email.includes('driver')) {
    customClaims.User_Role = 'driver';
  }

  try {
    await admin.auth().setCustomUserClaims(user.uid, customClaims);
    console.log(`Custom claims set for ${user.uid}: ${customClaims.User_Role}`);
  } catch (error) {
    console.error("Failed to assign claims", error);
  }
});

// ----------------------------------------------------
// B2B ONBOARDING: PROVISION TENANT
// ----------------------------------------------------
exports.provisionTenant = functions.https.onCall(async (data, context) => {
  const { companyName, businessEmail, vatNumber, chargingModel, password } = data;
  
  if (!businessEmail || !password || !companyName) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing required fields for tenant provisioning.');
  }

  try {
    const tenantId = `TENANT_${Date.now()}`;
    
    // 1. Provision Firebase Auth User
    const userRecord = await admin.auth().createUser({
      email: businessEmail,
      password: password,
      displayName: companyName
    });

    // 2. Attach Custom Claims (Admin Role + Multi-Tenancy Context)
    await admin.auth().setCustomUserClaims(userRecord.uid, {
      User_Role: 'admin_controller',
      tenant_id: tenantId
    });

    // 3. Provision Firestore Schema with Neutral Branding Template
    await db.collection("Tenants").doc(tenantId).set({
      companyName,
      vatNumber,
      chargingConfig: { 
        type: chargingModel || 'HYBRID', 
        baseFee: 1.00, 
        percentage: 0.05 
      },
      branding: {
        primary: '#CCCCCC',
        accent: '#8A8A8E',
        slogan: 'NEUTRAL TEMPLATE',
        logoUrl: ''
      },
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return { success: true, tenantId };
  } catch (error) {
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// ----------------------------------------------------
// B2B ONBOARDING: APP STORE BUILD ORCHESTRATOR
// ----------------------------------------------------
exports.initiateTenantBuild = functions.https.onCall(async (data, context) => {
  const { tenantId, submitToStore } = data;
  
  if (!tenantId) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing Tenant ID.');
  }

  // Guard: Only admins can trigger builds
  if (!context.auth || context.auth.token.User_Role !== 'admin_controller') {
    throw new functions.https.HttpsError('permission-denied', 'Only Admin Controllers can initiate App Store builds.');
  }

  try {
    const buildRef = db.collection("Build_Status").doc(tenantId);
    
    // 1. Initialize Build State
    await buildRef.set({
      tenantId,
      status: 'PENDING',
      progress: 10,
      message: 'Initializing EAS Build Environment...',
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    // 2. Simulate the CI/CD Pipeline delay chain
    // (In production, this would be an actual spawn('eas', ['build']) process
    // reporting back via webhooks, but we mock the state transitions here.)
    
    setTimeout(async () => {
      await buildRef.update({
        status: 'BUILDING',
        progress: 45,
        message: 'Compiling React Native binaries (iOS/Android)...'
      });
      
      setTimeout(async () => {
        if (submitToStore) {
          await buildRef.update({
            status: 'SUBMITTED_TO_STORE',
            progress: 85,
            message: 'Binary uploaded to App Store Connect / Google Play...'
          });
          
          setTimeout(async () => {
            await buildRef.update({
              status: 'LIVE',
              progress: 100,
              message: 'App is Live!'
            });
          }, 3000);
        } else {
          await buildRef.update({
            status: 'LIVE',
            progress: 100,
            message: 'Build completed successfully.'
          });
        }
      }, 4000);
    }, 2000);

    return { success: true, message: 'Build pipeline initiated.' };
  } catch (error) {
    throw new functions.https.HttpsError('internal', error.message);
  }
});


