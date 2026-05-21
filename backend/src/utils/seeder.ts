import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

import User from "../models/User.model";
import Provider from "../models/Provider.model";
import JobPost from "../models/JobPost.model";
import Booking from "../models/Booking.model";
import AgentLog from "../models/AgentLog.model";

// ─── Islamabad Locations (lng, lat) ──────────────────────────────────────────

const LOCATIONS: Record<string, [number, number]> = {
  G13:  [72.9774, 33.6844],  // G-13 Islamabad
  G11:  [72.9700, 33.6900],  // G-11 (nearby)
  G9:   [72.9650, 33.6950],  // G-9  (nearby)
  F8:   [72.9950, 33.7100],  // F-8
  I8:   [72.9500, 33.6600],  // I-8
};

async function seed(): Promise<void> {
  const uri = process.env["MONGODB_URI"];
  if (!uri) {
    console.error("❌  MONGODB_URI is not set in .env");
    process.exit(1);
  }

  console.log("⏳  Connecting to MongoDB...");
  await mongoose.connect(uri);
  console.log(`✅  Connected: ${mongoose.connection.host}`);

  // ── Wipe all collections ──────────────────────────────────────────────────
  console.log("\n🗑️   Clearing all data...");
  await Promise.all([
    User.deleteMany({}),
    Provider.deleteMany({}),
    JobPost.deleteMany({}),
    Booking.deleteMany({}),
    AgentLog.deleteMany({}),
  ]);
  console.log("    ✓ Database cleared");

  const passwordHash = await bcrypt.hash("123456", 10);

  // ── 1. Create Client Users ────────────────────────────────────────────────

  const clientUser = await User.create({
    name: "Admin Client",
    email: "admin@example.com",
    passwordHash,
    phone: "+923000000001",
    role: "client",
    location: { type: "Point", coordinates: LOCATIONS["G13"] },
    isVerified: true,
    isActive: true,
  });
  console.log(`👤  Client created: ${clientUser.email}`);

  // Demo client for /api/agent/simulate endpoint (§14)
  const demoClient = await User.create({
    name: "Mahir Demo Client",
    email: "client@mahir.demo",
    passwordHash,
    phone: "+923001234567",
    role: "client",
    location: { type: "Point", coordinates: LOCATIONS["G13"] },
    isVerified: true,
    isActive: true,
  });
  console.log(`👤  Demo client created: ${demoClient.email}`);

  // ── 2. Create Provider Users + Provider Profiles ──────────────────────────

  

  // Generate 200 random providers
  const categories = ["AC Technician", "Plumber", "Electrician", "Carpenter", "Painter", "Cleaner", "Driver", "Cook", "Security Guard", "IT Support", "Other"];
  const areas = Object.keys(LOCATIONS);
  
  for (let i = 0; i < 200; i++) {
    const category = categories[Math.floor(Math.random() * categories.length)];
    const area = areas[Math.floor(Math.random() * areas.length)];
    const location = LOCATIONS[area];
    
    // Add random jitter to location so they aren't all exactly on the same point
    const lat = location[1] + (Math.random() - 0.5) * 0.05;
    const lng = location[0] + (Math.random() - 0.5) * 0.05;

    const providerUser = await User.create({
      name: `Demo Provider ${i+1}`,
      email: `provider${i+1}@example.com`,
      passwordHash,
      phone: `+92300${String(1000000 + i).padStart(7, '0')}`,
      role: "provider",
      isVerified: true,
      isActive: true,
    });

    await Provider.create({
      userId: providerUser._id,
      serviceCategory: category,
      skills: [`General ${category}`, "Expert Service"],
      bio: `Professional ${category} serving the twin cities.`,
      location: { type: "Point", coordinates: [lng, lat] },
      isActive: true,
      rating: 4.0 + (Math.random() * 1.0),
      totalReviews: Math.floor(Math.random() * 100),
      pricePerHour: 500 + Math.floor(Math.random() * 2000),
      experienceYears: 1 + Math.floor(Math.random() * 10),
      onTimeScore: 80 + Math.floor(Math.random() * 20),
      completionRate: 85 + Math.floor(Math.random() * 15),
      responseTimeMinutes: 5 + Math.floor(Math.random() * 30),
      cancellationRate: Math.floor(Math.random() * 10),
      reviewSentiment: 0.7 + (Math.random() * 0.3),
      cnicVerified: Math.random() > 0.2,
      backgroundCheckPassed: Math.random() > 0.3,
      verifiedBadge: Math.random() > 0.5,
    });
  }
  console.log(`🔧  200 Providers generated!`);

  // Generate 200 random jobs
  for (let i = 0; i < 200; i++) {
    const category = categories[Math.floor(Math.random() * categories.length)];
    const area = areas[Math.floor(Math.random() * areas.length)];
    const location = LOCATIONS[area];
    
    const lat = location[1] + (Math.random() - 0.5) * 0.05;
    const lng = location[0] + (Math.random() - 0.5) * 0.05;

    await JobPost.create({
      clientId: demoClient._id,
      title: `Need ${category} urgently in ${area}`,
      category: category,
      serviceType: category,
      rawInput: "Mock data generated",
      descriptionEN: `I am looking for a reliable ${category}.`,
      descriptionUR: "",
      descriptionRU: `Mujhe ek accha ${category} chahiye.`,
      urgency: Math.random() > 0.5 ? "high" : "medium",
      preferredTime: "As soon as possible",
      description: `Mock job for ${category}`,
      budgetMinPKR: 500,
      budgetMaxPKR: 5000,
      location: {
        type: "Point",
        coordinates: [lng, lat],
      },
      address: area,
      area: area,
      city: "Islamabad",
      status: "open",
      aiGeneratedAt: new Date(),
    });
  }
  console.log(`📋  200 Jobs generated!`);

  console.log("\n─────────────────────────────────────────────────────────────");
  console.log("✅  Seeding complete!");
  console.log("🔑  Credentials (Password: 123456 for all accounts):");
  console.log("    - Client   : admin@example.com");
  console.log("    - Demo     : client@mahir.demo");
  console.log("    - Provider : ali@example.com (AC Technician)");
  console.log("    - Provider : usman@example.com (AC Technician)");
  console.log("    - Provider : hassan@example.com (Electrician)");
  console.log("    - Provider : tariq@example.com (Plumber)");
  console.log("    - Provider : bilal@example.com (Cleaner)");
  console.log("─────────────────────────────────────────────────────────────\n");

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err: unknown) => {
  console.error(`\n💥  Seeder failed: ${err}`);
  process.exit(1);
});

