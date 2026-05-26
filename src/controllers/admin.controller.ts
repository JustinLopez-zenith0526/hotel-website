import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import 'dotenv/config';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

// 1. READ: Display full console rows
export const getAdminDashboard = async (req: Request, res: Response) => {
  try {
    const dbRooms = await prisma.room.findMany({ orderBy: { createdAt: 'desc' } });
    res.render('admin', { rooms: dbRooms });
  } catch (error) {
    console.error("Admin view rendering failed:", error);
    res.status(500).send("PMS Management Error");
  }
};

// 2. CREATE: Save new room parameters to Supabase
export const createRoomListing = async (req: Request, res: Response) => {
  try {
    const { name, price, roomType, bedType, viewType, imageUrl, airbnbUrl, status } = req.body;
    await prisma.room.create({
      data: {
        name,
        price: parseFloat(price) || 0,
        roomType,
        bedType,
        viewType,
        imageUrl,
        airbnbUrl: airbnbUrl || "https://airbnb.com",
        status: status || "Available"
      }
    });
    res.redirect('/admin');
  } catch (error) {
    console.error("Failed to append room listing asset:", error);
    res.status(500).send("Database Insertion Faulted");
  }
};

// 3. UPDATE: Change availability tracking status dropdowns instantly
export const updateRoomStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // TypeScript Fix: Double-check the path variable exists to prevent string mismatch errors
    if (!id) {
      res.status(400).send("Missing target ID parameters.");
      return;
    }

    await prisma.room.update({
      where: { id: String(id) }, // Force conversion to an absolute string primitive
      data: { status }
    });

    res.redirect('/admin');
  } catch (error) {
    console.error("Failed to alter tracking availability status profile:", error);
    res.status(500).send("Status Adjustment Faulted");
  }
};

// 4. DELETE: Purge a listing entry row cleanly matching the parameter ID
export const deleteRoomListing = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).send("Missing target parameter ID inputs.");
      return;
    }

    await prisma.room.delete({
      where: { id: String(id) } // Clear primitive string enforcement
    });

    res.redirect('/admin');
  } catch (error) {
    console.error("Failed to destroy room asset item:", error);
    res.status(500).send("Deletion Operation Faulted");
  }
};

// 5. UPDATE: Full modification path for details forms modal
export const updateRoomDetails = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, price, roomType, bedType, viewType, imageUrl, airbnbUrl } = req.body;

    if (!id) {
      res.status(400).send("Missing target parameter validation key mapping.");
      return;
    }

    await prisma.room.update({
      where: { id: String(id) },
      data: {
        name,
        price: parseFloat(price) || 0,
        roomType,
        bedType,
        viewType,
        imageUrl,
        airbnbUrl: airbnbUrl || "https://airbnb.com"
      }
    });

    res.redirect('/admin');
  } catch (error) {
    console.error("Failed to update custom room details fields:", error);
    res.status(500).send("Database Update Faulted");
  }
};
