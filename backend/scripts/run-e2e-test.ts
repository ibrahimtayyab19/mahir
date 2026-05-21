import "dotenv/config";
import mongoose from "mongoose";
import Provider from "../src/models/Provider.model";
import User from "../src/models/User.model";
import JobPost from "../src/models/JobPost.model";
import { orchestrator } from "../src/agents/orchestrator";

/**
 * 🚀 MAHIR E2E TEST SCRIPT
 * Bypasses HTTP to directly test the Agentic Pipeline.
 */

async function runE2E() {
  console.log("\n🧪 Starting Mahir Strict E2E Automation...");
  const MONGODB_URI = process.env["MONGODB_URI"];

  if (!MONGODB_URI) {
    console.error("❌ MONGODB_URI missing from .env");
    process.exit(1);
  }

  try {
    // 1. Connect to Database
    console.log("🔗 Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected.");

    // 2. Setup Mock Data
    console.log("\n🛠  Preparing guaranteed test match...");
    
    // Clean existing test data
    const testEmail = "ali.expert@mahir.test";
    const clientEmail = "client.tester@mahir.test";
    
    await User.deleteMany({ email: { $in: [testEmail, clientEmail] } });
    await Provider.deleteMany({}); // Warning: Clears all providers for a clean test
    await JobPost.deleteMany({ rawInput: /AC bilkul kaam nahi kar raha/ });

    // Create Mock Client
    const mockClient = await User.create({
      name: "Test Client",
      email: clientEmail,
      passwordHash: "dummy",
      role: "client",
      isVerified: true
    });

    // Create Mock Provider User
    const providerUser = await User.create({
      name: "Ali AC Services",
      email: testEmail,
      passwordHash: "dummy",
      role: "provider",
      isVerified: true
    });

    // Create Mock Provider Profile
    const mockProvider = await Provider.create({
      userId: providerUser._id,
      serviceCategory: "AC Technician",
      isActive: true,
      location: { 
        type: "Point", 
        coordinates: [72.9774, 33.6844] // G-13 Islamabad
      },
      rating: 4.8,
      onTimeScore: 98,
      pricePerHour: 1000,
      verifiedBadge: true,
      experienceYears: 5,
      skills: ["AC Repair", "Maintenance", "Gas Charging"]
    });

    console.log(`✅ Mock Provider Created: ${providerUser.name} (${mockProvider._id})`);

    // 3. Invoke Orchestrator
    console.log("\n🧠 Invoking Orchestrator...");
    const testMessage = "AC bilkul kaam nahi kar raha, G-13 mein kal subah chahiye, budget tight hai";
    const testLocation: [number, number] = [72.9774, 33.6844];

    console.log(`💬 Message: "${testMessage}"`);
    console.log(`📍 Location: [${testLocation.join(", ")}]`);

    const startTime = Date.now();
    const result = await orchestrator.processClientRequest(
      testMessage,
      mockClient._id.toString(),
      testLocation
    );
    const duration = Date.now() - startTime;

    // 4. Print Beautiful Results
    console.log("\n==================================================");
    console.log("🏆 E2E PIPELINE RESULT");
    console.log("==================================================");
    console.log(`⏱  Duration      : ${duration}ms`);
    console.log(`🔑 Session ID    : ${result.sessionId}`);
    console.log(`📝 Job Post ID   : ${result.jobPostId}`);
    
    console.log("\n--- BILINGUAL JOB POST ---");
    console.log(`🇬🇧 English    : ${result.parserOutput.jobPost.english}`);
    console.log(`🇵🇰 Urdu       : ${result.parserOutput.jobPost.urdu}`);
    console.log(`🏛  Roman Urdu : ${result.parserOutput.jobPost.romanUrdu}`);

    console.log("\n--- MATCHED PROVIDERS ---");
    if (result.matchmakerOutput.matches.length > 0) {
      result.matchmakerOutput.matches.forEach((m: any, i: number) => {
        console.log(`${i + 1}. ${m.name} | Score: ${m.score.toFixed(1)}% | Dist: ${m.distanceKm.toFixed(2)}km`);
        console.log(`   💡 Reasoning: ${m.reasoning}`);
      });
    } else {
      console.log("⚠️  No matches found. Fallback triggered.");
      console.log(`   Fallback Reason: ${result.matchmakerOutput.fallback?.reason}`);
    }

    console.log("\n--- AGENT LOG AUDIT ---");
    result.agentTraces.forEach((t: any) => {
      console.log(`🤖 [${t.name}] | Latency: ${t.latencyMs}ms`);
    });

    console.log("==================================================\n");

    if (result.isFallback) {
      console.log("🚨 WARNING: Pipeline returned a fallback response.");
    } else {
      console.log("✅ SUCCESS: Full sequential pipeline verified.");
    }

  } catch (error) {
    console.error("\n💥 CRITICAL E2E FAILURE:");
    console.error(error);
  } finally {
    console.log("\n🧹 Cleaning up connection...");
    await mongoose.disconnect();
    console.log("👋 Done.\n");
    process.exit(0);
  }
}

// Start the test
runE2E();
