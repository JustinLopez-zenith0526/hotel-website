import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import 'dotenv/config';

// 1. Create a persistent database connection pool directly matching Supabase specs
const pool = new pg.Pool({ 
  connectionString: process.env.DATABASE_URL 
});

// 2. Initialize the Prisma Client explicitly feeding the Postgres driver adapter factory
const prisma = new PrismaClient({
  adapter: new PrismaPg(pool)
});

const AIRBNB_FALLBACK = "https://airbnb.com";

export const getHomePage = (req: Request, res: Response) => {
  res.render('index', { airbnbUrl: AIRBNB_FALLBACK });
};

export const getAboutPage = (req: Request, res: Response) => {
  res.render('about', { airbnbUrl: AIRBNB_FALLBACK });
};

export const getContactPage = (req: Request, res: Response) => {
  res.render('contact', { airbnbUrl: AIRBNB_FALLBACK });
};

export const getRoomsPage = async (req: Request, res: Response) => {
  try {
    const dbRooms = await prisma.room.findMany({
      orderBy: { price: 'asc' }
    });

    res.render('rooms', { 
      airbnbUrl: AIRBNB_FALLBACK,
      rooms: dbRooms 
    });
  } catch (error) {
    console.error("Database fetch failed:", error);
    res.status(500).send("Internal Server Error");
  }
};
