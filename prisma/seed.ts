import { PrismaClient } from '@prisma/client';
import "dotenv/config";
const prisma = new PrismaClient();


async function main() {
  await prisma.room.deleteMany(); // Clears any old listings

  await prisma.room.createMany({
    data: [
      {
        name: "Cozy Room",
        price: 3500,
        size: 35,
        bedType: "King bed",
        viewType: "City View",
        imageUrl: "https://unsplash.com",
        airbnbUrl: "https://airbnb.com"
      },
      {
        name: "Deluxe Room",
        price: 6800,
        size: 65,
        bedType: "Living area",
        viewType: "Balcony",
        imageUrl: "https://unsplash.com",
        airbnbUrl: "https://airbnb.com"
      },
      {
        name: "Premium Suite",
        price: 8500,
        size: 65,
        bedType: "Living area",
        viewType: "Balcony",
        imageUrl: "https://unsplash.com",
        airbnbUrl: "https://airbnb.com"
      }
    ]
  });

  console.log("Supabase Database seeded successfully!");
}

main()
  .catch((e) => { 
    console.error(e); 
    // This removes the need for the broken process call entirely
    throw e; 
  })
  .finally(async () => { 
    await prisma.$disconnect(); 
  });
