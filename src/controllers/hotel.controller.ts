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
    // 1. Fetch individual physical room units that are NOT in maintenance
    // Safe object type casting bypasses local compilation schema caching glitches
    const activeUnits = await (prisma as any).room.findMany({
      where: {
        status: { not: "Maintenance" } // Hides dirty rooms from public completely
      },
      include: {
        bookings: {
          where: { status: "Approved" } // Fetch active approved reservations for date comparison
        }
      },
      orderBy: { price: 'asc' }
    });

    // 2. Intelligently group units into their distinct package tiers
    const packagesMap = new Map();

    activeUnits.forEach((unit: any) => {
      const key = unit.name.trim();
      
      if (!packagesMap.has(key)) {
        packagesMap.set(key, {
          name: unit.name,
          price: unit.price,
          bedType: unit.bedType,
          viewType: unit.viewType,
          imageUrl: unit.imageUrl,
          airbnbUrl: unit.airbnbUrl,
          units: [] 
        });
      }
      
      // Explicitly define the sub-bookings array safely to avoid 'never' errors on loop paths
      const unitBookings = unit.bookings || [];
      
      // Map out individual units and pack their approved date arrays to verify live overlaps
      packagesMap.get(key).units.push({
        id: unit.id,
        roomNumber: unit.roomType,
        status: unit.status,
        // Pass existing booked calendars down to frontend data attributes for safe checks
        blockedDates: unitBookings.map((b: any) => ({
          start: b.checkIn instanceof Date ? b.checkIn.toISOString().split('T')[0] : new Date(b.checkIn).toISOString().split('T')[0],
          end: b.checkOut instanceof Date ? b.checkOut.toISOString().split('T')[0] : new Date(b.checkOut).toISOString().split('T')[0]
        }))
      });
    });

    const packagedRooms = Array.from(packagesMap.values());

    // Check query string parameters to trigger floating success alerts if an inquiry drops cleanly
    const showSuccessAlert = req.query.success === 'true';

    res.render('rooms', { 
      airbnbUrl: "https://airbnb.com",
      rooms: packagedRooms,
      success: showSuccessAlert
    });
  } catch (error) {
    console.error("PMS Catalog fetch faulted:", error);
    res.status(500).send("Internal Catalog Engine Error");
  }
};


export const createBookingInquiry = async (req: any, res: any) => {
  try {
    const { id } = req.params;
    // 1. Add 'numberOfGuests' to your request body destructuring list
    const { guestName, guestEmail, guestPhone, numberOfGuests, checkIn, checkOut } = req.body;

    const room = await prisma.room.findUnique({ where: { id } });
    if (!room) return res.status(404).send("Room not found");

    const dateIn = new Date(checkIn);
    const dateOut = new Date(checkOut);
    const timeDiff = dateOut.getTime() - dateIn.getTime();
    const totalNights = Math.ceil(timeDiff / (1000 * 3600 * 24));

    if (totalNights <= 0) return res.status(400).send("Invalid dates");
    const totalCalculatedPrice = room.price * totalNights;

    // 2. This is where the JavaScript calculation belongs! Inside your .ts file:
    await (prisma as any).booking.create({
      data: {
        roomId: id,
        guestName,
        guestEmail,
        guestPhone,
        numberOfGuests: parseInt(numberOfGuests, 10) || 1, // ← Maps cleanly to the Int column
        checkIn: dateIn,
        checkOut: dateOut,
        totalPrice: totalCalculatedPrice,
        status: "Pending"
      }
    });

    res.redirect('/rooms?success=true');
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};

