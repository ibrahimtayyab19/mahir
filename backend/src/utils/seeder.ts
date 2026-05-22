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

// Pakistani context data
const FIRST_NAMES = ["Ali", "Usman", "Hassan", "Tariq", "Bilal", "Kamran", "Zeeshan", "Imran", "Naveed", "Farhan", "Rizwan", "Sajid", "Waqas", "Asif", "Adnan", "Shoaib", "Kashif", "Hamza", "Zain"];
const LAST_NAMES = ["Khan", "Ahmed", "Ali", "Hussain", "Shah", "Malik", "Rehman", "Iqbal", "Zafar", "Javed", "Tariq", "Qureshi"];

const JOBS_DATA: Record<string, { en: string, ru: string }[]> = {
  "AC Technician": [
    { en: "AC is not cooling properly, needs gas refill", ru: "AC ki gas leak ho gayi hai, cooling nahi kar raha" },
    { en: "AC needs general servicing and cleaning", ru: "AC ki general service karni hai, filter saaf karne hain" },
    { en: "AC is making a loud noise when turned on", ru: "AC on karne par bohat awaz kar raha hai" }
  ],
  "Plumber": [
    { en: "Water motor is burnt and needs replacement", ru: "Paani ki motor jal gayi hai, theek karni hai" },
    { en: "Kitchen sink is clogged and leaking", ru: "Kitchen ka sink block ho gaya hai aur leak kar raha hai" },
    { en: "Bathroom tap needs to be fixed", ru: "Washroom ki tooti toot gayi hai, nayi lagani hai" }
  ],
  "Electrician": [
    { en: "Main circuit breaker keeps tripping", ru: "Main breaker bar bar trip ho raha hai" },
    { en: "Need to install a new ceiling fan", ru: "Naya chhat wala pankha lagana hai" },
    { en: "Wiring short circuit in the drawing room", ru: "Drawing room ki wiring mein short circuit ho gaya hai" }
  ],
  "Carpenter": [
    { en: "Bedroom door lock is broken", ru: "Kamre ke darwaze ka lock kharab ho gaya hai" },
    { en: "Need a custom wooden shelf for kitchen", ru: "Kitchen ke liye lakri ka shelf banwana hai" },
    { en: "Sofa leg is broken, needs repair", ru: "Sofa ka paya toot gaya hai, repair karna hai" }
  ],
  "Painter": [
    { en: "Need to paint one bedroom, white color", ru: "Ek kamre ko safaid paint karna hai" },
    { en: "Exterior wall paint is peeling off", ru: "Baher wali deewar ka paint kharab ho raha hai" },
    { en: "Polish required for wooden doors", ru: "Lakri ke darwazon par polish karni hai" }
  ],
  "Cleaner": [
    { en: "Deep cleaning required for empty house", ru: "Khali ghar ki deep cleaning karni hai shift hone se pehle" },
    { en: "Sofa and carpet dry cleaning needed", ru: "Sofa aur carpet wash karwane hain" },
    { en: "Water tank cleaning required", ru: "Chatt wali paani ki tanki saaf karni hai" }
  ],
  "Driver": [
    { en: "Need a driver for pick and drop to school", ru: "Bachon ko school chornay aur laney ke liye driver chahiye" },
    { en: "Experienced driver required for family outing", ru: "Family ke sath Murree jane ke liye driver chahiye" }
  ],
  "Cook": [
    { en: "Need a part-time cook for dinner, 5 persons", ru: "Raat ke khane ke liye part-time cook chahiye" },
    { en: "Looking for someone who can cook Daal and Sabzi well", ru: "Ghar ka khana (daal sabzi) bananey wala chahiye" }
  ],
  "Security Guard": [
    { en: "Night shift security guard needed for home", ru: "Ghar ke liye night shift ka guard chahiye" }
  ],
  "IT Support": [
    { en: "Laptop is very slow, needs windows installation", ru: "Laptop bohat slow hai, nayi window karni hai" },
    { en: "WiFi router setup and range extension", ru: "Naya WiFi router lagana hai aur range barhani hai" }
  ],
  "Other": [
    { en: "Need someone to run errands and buy groceries", ru: "Bazaar se sauda salaf laney ke liye koi chahiye" }
  ]
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

  // ── 2. Create Specific Hardcoded Providers ──────────────────────────────
  const hardcodedProviders = [
    { email: "ali@example.com", name: "Ali", cat: "AC Technician" },
    { email: "usman@example.com", name: "Usman", cat: "AC Technician" },
    { email: "hassan@example.com", name: "Hassan", cat: "Electrician" },
    { email: "tariq@example.com", name: "Tariq", cat: "Plumber" },
    { email: "bilal@example.com", name: "Bilal", cat: "Cleaner" },
  ];

  for (const p of hardcodedProviders) {
    const providerUser = await User.create({
      name: p.name,
      email: p.email,
      passwordHash,
      phone: `+92300${Math.floor(1000000 + Math.random() * 9000000)}`,
      role: "provider",
      isVerified: true,
      isActive: true,
    });

    await Provider.create({
      userId: providerUser._id,
      serviceCategory: p.cat,
      skills: [`General ${p.cat}`, "Expert Service"],
      bio: `Professional ${p.cat} serving the twin cities. 10 saal ka tajurba.`,
      location: { type: "Point", coordinates: LOCATIONS["G13"] }, // Keep close to G-13 for demo
      isActive: true,
      rating: 4.8 + (Math.random() * 0.2),
      totalReviews: 80 + Math.floor(Math.random() * 50),
      pricePerHour: 1000 + Math.floor(Math.random() * 1000),
      experienceYears: 5 + Math.floor(Math.random() * 5),
      onTimeScore: 95,
      completionRate: 98,
      responseTimeMinutes: 10,
      cancellationRate: 1,
      reviewSentiment: 0.9,
      cnicVerified: true,
      backgroundCheckPassed: true,
      verifiedBadge: true,
    });
  }
  console.log(`🔧  5 Hardcoded specific providers created!`);

  // ── 3. Create Additional Random Providers ────────────────────────────────
  const categories = Object.keys(JOBS_DATA);
  const areas = Object.keys(LOCATIONS);
  
  for (let i = 0; i < 195; i++) {
    const category = categories[Math.floor(Math.random() * categories.length)];
    const area = areas[Math.floor(Math.random() * areas.length)];
    const location = LOCATIONS[area];
    
    const lat = location[1] + (Math.random() - 0.5) * 0.05;
    const lng = location[0] + (Math.random() - 0.5) * 0.05;

    const firstName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
    const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];

    const providerUser = await User.create({
      name: `${firstName} ${lastName}`,
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
      bio: `Experienced ${category} in Islamabad and Rawalpindi.`,
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
  console.log(`🔧  195 Additional authentic providers generated!`);

  // ── 4. Generate Random Jobs ───────────────────────────────────────────────
  for (let i = 0; i < 200; i++) {
    const category = categories[Math.floor(Math.random() * categories.length)];
    const area = areas[Math.floor(Math.random() * areas.length)];
    const location = LOCATIONS[area];
    
    const lat = location[1] + (Math.random() - 0.5) * 0.05;
    const lng = location[0] + (Math.random() - 0.5) * 0.05;

    const categoryJobs = JOBS_DATA[category] || [{ en: `Need ${category}`, ru: `Mujhe ek accha ${category} chahiye.` }];
    const randomJob = categoryJobs[Math.floor(Math.random() * categoryJobs.length)];

    await JobPost.create({
      clientId: demoClient._id,
      title: `${category} required in ${area}`,
      category: category,
      serviceType: category,
      rawInput: randomJob.ru || randomJob.en,
      descriptionEN: randomJob.en,
      descriptionUR: "",
      descriptionRU: randomJob.ru || "Zaruri kaam hai.",
      urgency: Math.random() > 0.5 ? "high" : "medium",
      preferredTime: "As soon as possible",
      description: randomJob.en,
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
  console.log(`📋  200 Authentic Jobs generated in Roman Urdu/English!`);

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
