import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const team = await prisma.team.upsert({
    where: { id: "default-team" },
    update: {},
    create: {
      id: "default-team",
      name: "My Team",
      slug: "my-team",
      sport: "softball",
    },
  });

  const hashedPassword = await bcrypt.hash("Megan1311!", 10);
  const user = await prisma.user.upsert({
    where: { email: "arutkowski1311@gmail.com" },
    update: {},
    create: {
      id: "head-coach",
      email: "arutkowski1311@gmail.com",
      name: "Coach Rutkowski",
      password: hashedPassword,
    },
  });

  await prisma.teamMembership.upsert({
    where: { id: "coach-membership" },
    update: {},
    create: {
      id: "coach-membership",
      teamId: team.id,
      userId: user.id,
      role: "head_coach",
      status: "active",
    },
  });

  console.log("Done! Sign in with arutkowski1311@gmail.com");
}

main()
  .then(async () => { await prisma.$disconnect(); })
  .catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
