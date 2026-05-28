import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import 'dotenv/config';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

// 1. READ: Display full console rows Matrix with separated Booking metrics and calculations
export const getAdminDashboard = async (req: Request, res: Response) => {
  try {
    const dbRooms = await prisma.room.findMany({ orderBy: { createdAt: 'desc' } });
    
    const dbBookings = await (prisma as any).booking.findMany({
      include: { room: true },
      orderBy: { createdAt: 'desc' }
    });

    let totalGrossRevenue = 0;
    let activeOccupancyCount = 0;
    let housekeepingLoadCount = 0;

    dbBookings.forEach((b: any) => {
      if (b.status === "Approved" || b.status === "Completed") {
        totalGrossRevenue += b.totalPrice || 0;
      }
      if (b.status === "Approved") {
        activeOccupancyCount++;
      }
    });

    dbRooms.forEach((r) => {
      if (r.status === "Maintenance") {
        housekeepingLoadCount++;
      }
    });

    res.render('admin', { 
      rooms: dbRooms,
      bookings: dbBookings,
      metrics: {
        revenue: totalGrossRevenue,
        occupancy: activeOccupancyCount,
        cleaning: housekeepingLoadCount
      }
    });
  } catch (error) {
    console.error("Admin view analytics computation faulted:", error);
    res.status(500).send("PMS Management Data Layer Error");
  }
};

// 2. CREATE: Save new room variables to Supabase
export const createRoomListing = async (req: Request, res: Response) => {
  try {
    const { name, price, roomType, bedType, viewType, imageUrl, maxGuests, status } = req.body;
    await prisma.room.create({
      data: {
        name,
        price: parseFloat(price) || 0,
        roomType,
        bedType,
        viewType,
        imageUrl,
        maxGuests: parseInt(maxGuests, 10) || 4,
        status: status || "Available"
      }
    });
    res.redirect('/admin');
  } catch (error) {
    console.error(error);
    res.status(500).send("Database Insertion Mismatch");
  }
};

// 3. UPDATE: Change availability tracking status dropdowns instantly
export const updateRoomStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!id) {
      res.status(400).send("Missing tracking parameter target ID.");
      return;
    }

    await prisma.room.update({
      where: { id: String(id) },
      data: { status }
    });

    res.redirect('/admin');
  } catch (error) {
    console.error(error);
    res.status(500).send("Status Adjustment Faulted");
  }
};

// 4. DELETE: Clean purge a room listing entry row matching the ID parameter
export const deleteRoomListing = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).send("Missing target removal parameter ID.");
      return;
    }

    await prisma.room.delete({
      where: { id: String(id) }
    });

    res.redirect('/admin');
  } catch (error) {
    console.error(error);
    res.status(500).send("Deletion Operation Faulted");
  }
};

// 5. UPDATE: Full modification path for details forms standalone view page
export const updateRoomDetails = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    // 1. Add maxGuests to your destructured parameters list from the form body
    const { name, price, roomType, bedType, viewType, imageUrl, maxGuests } = req.body;

    if (!id) {
      res.status(400).send("Missing update row parameter ID.");
      return;
    }

    // 2. Commit the parsed integer straight into your Supabase database table
    await prisma.room.update({
      where: { id: String(id) },
      data: {
        name,
        price: parseFloat(price) || 0,
        roomType,
        bedType,
        viewType,
        imageUrl,
        maxGuests: parseInt(maxGuests, 10) || 2 // ← UPDATED: Saves the new edited capacity value!
      }
    });

    res.redirect('/admin');
  } catch (error) {
    console.error("Failed to update room details:", error);
    res.status(500).send("Database Update Faulted");
  }
};


// 6. GET: Fetch specific room row details for edit screen interface
export const getEditPage = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const targetRoom = await prisma.room.findUnique({
      where: { id: String(id) }
    });

    if (!targetRoom) {
      res.status(404).send("Target hotel listing asset not found.");
      return;
    }

    res.render('admin-edit', { room: targetRoom });
  } catch (error) {
    console.error(error);
    res.status(500).send("PMS Dashboard Route Error");
  }
};

// 7. UPDATE: Toggle live booking reservation requests status properties
export const updateBookingStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!id) {
      res.status(400).send("Missing target booking identifier ID.");
      return;
    }

    const updatedBooking = await (prisma as any).booking.update({
      where: { id: String(id) },
      data: { status }
    });

    if (status === "Approved" && updatedBooking.roomId) {
      await prisma.room.update({
        where: { id: updatedBooking.roomId },
        data: { status: "Booked" }
      });
    }

    res.redirect('/admin');
  } catch (error) {
    console.error("Failed to alter reservation status:", error);
    res.status(500).send("Booking Pipeline Status Faulted");
  }
};

// 8. UPDATE: Instantly flip a room unit from Maintenance back into Available status
export const cleanAndReleaseRoomUnit = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).send("Missing targeted room operational key parameters ID.");
      return;
    }

    // 1. Find the target booking first to know which room it occupies
    const booking = await (prisma as any).booking.findUnique({
      where: { id: String(id) }
    });

    if (!booking) {
      res.status(404).send("Target reservation record not found.");
      return;
    }

    // 2. Mark the booking as Completed
    await (prisma as any).booking.update({
      where: { id: String(id) },
      data: { status: "Completed" }
    });

    // 3. Automatically transition the occupied room unit to Maintenance status!
    await prisma.room.update({
      where: { id: booking.roomId },
      data: { status: "Maintenance" }
    });

    res.redirect('/admin');
  } catch (error) {
    console.error("Housekeeping release pipeline faulted:", error);
    res.status(500).send("Cleaning Dispatch Operation Faulted");
  }
};


// 9. DELETE: Permanently erase a historic booking/test log from the database
export const deleteBookingLog = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).send("Missing target parameter ID inputs.");
      return;
    }

    await (prisma as any).booking.delete({
      where: { id: String(id) }
    });

    res.redirect('/admin');
  } catch (error) {
    console.error("Failed to wipe historic reservation record:", error);
    res.status(500).send("Deletion Operation Faulted");
  }
};

// 10. UPDATE: Force manual instant check-out for testing/reception desk use
export const checkoutBookingInstantly = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).send("Missing booking tracking parameters ID.");
      return;
    }

    const booking = await (prisma as any).booking.findUnique({
      where: { id: String(id) }
    });

    if (!booking) {
      res.status(404).send("Target reservation record not found.");
      return;
    }

    await (prisma as any).booking.update({
      where: { id: String(id) },
      data: { status: "Completed" }
    });

    await prisma.room.update({
      where: { id: booking.roomId },
      data: { status: "Maintenance" }
    });

    res.redirect('/admin');
  } catch (error) {
    console.error("Instant check-out request failed:", error);
    res.status(500).send("Check-out Pipeline Operation Faulted");
  }
};