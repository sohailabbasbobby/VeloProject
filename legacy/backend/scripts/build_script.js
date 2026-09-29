const fs = require('fs');
const path = require('path');

// ----------------------------------------------------
// VELO TENANT DYNAMIC BUILD ORCHESTRATOR
// ----------------------------------------------------
// This script simulates the pre-build hook that would run
// inside the EAS CI/CD pipeline to rewrite app.json / app.config.js
// based on the specific Tenant ID being compiled.

const TARGET_TENANT_ID = process.env.TENANT_ID;
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

async function injectDynamicConfig() {
  console.log(`[VELO BUILDER] Initializing White-Label Build for ${TARGET_TENANT_ID}...`);
  
  // 1. In a real environment, this fetches from Firestore
  // const tenantDoc = await firestore.collection('Tenants').doc(TARGET_TENANT_ID).get();
  // const branding = tenantDoc.data().branding;
  
  // Simulated API response
  const mockTenantBranding = {
    companyName: 'Elite Rides Corp',
    primary: '#E91E63',
    logoUrl: 'https://storage.googleapis.com/.../elite_logo.png'
  };

  const appConfigPath = path.join(__dirname, '../../customer-mobile-app/app.json');
  
  console.log(`[VELO BUILDER] Intercepting Expo Configuration at ${appConfigPath}...`);
  
  // 2. Read existing Expo config
  // const rawConfig = fs.readFileSync(appConfigPath, 'utf8');
  // const config = JSON.parse(rawConfig);
  
  const config = {
    expo: {
      name: "VeloCustomerApp",
      slug: "velo-customer-app",
      ios: { bundleIdentifier: "com.velo.customer" },
      android: { package: "com.velo.customer" }
    }
  };

  // 3. Inject Dynamic White-Label Constants
  config.expo.name = mockTenantBranding.companyName;
  config.expo.slug = mockTenantBranding.companyName.toLowerCase().replace(/\s+/g, '-');
  
  const uniqueBundleId = `com.velo.tenant.${TARGET_TENANT_ID.toLowerCase()}`;
  config.expo.ios.bundleIdentifier = uniqueBundleId;
  config.expo.android.package = uniqueBundleId;

  // 4. Overwrite app.json (or return modified config in app.config.js)
  // fs.writeFileSync(appConfigPath, JSON.stringify(config, null, 2));
  
  console.log(`[VELO BUILDER] Configuration Injected Successfully!`);
  console.log(JSON.stringify(config, null, 2));
  
  console.log(`[VELO BUILDER] Ready to trigger: 'eas build --platform all --non-interactive'`);
}

if (require.main === module) {
  injectDynamicConfig();
}

module.exports = injectDynamicConfig;
