import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import session from 'express-session';
import { PrismaClient as prismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg'; // ← Added for background job support
import pg from 'pg'; // ← Added for background job connection pool

import hotelRoutes from './routes/hotel.routes.js';
import adminRoutes from './routes/admin.ruote.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// View Engine Setup
app.set('view engine', 'ejs');
app.set('views', path.join(process.cwd(), 'src/views'));

// Session Security Configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'fallback-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    maxAge: 1000 * 60 * 60 * 2, 
    httpOnly: true, 
    sameSite: 'lax', 
    secure: process.env.NODE_ENV === 'production' 
  }
}));

// Static Files
app.use(express.static(path.join(process.cwd(), 'src/public')));

// Routes
app.use('/', hotelRoutes);
app.use('/admin', adminRoutes);

// 🤖 AUTOMATED PMS CRON WORKER: Runs background checkout sweeps every 15 minutes
const startCheckoutAutomationSweeper = () => {
  // 1. Create an isolated connection pool explicitly pointing to your database string
  const cronPool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  
  // 2. Instantiate client using the proper Prisma 7 adapter pattern
  const cronPrisma = new (prismaClient as any)({
    adapter: new PrismaPg(cronPool)
  });

  setInterval(async () => {
    try {
      const now = new Date();
      console.log(`[PMS Automation Daemon] Running structural checkout verification sweep at: ${now.toLocaleTimeString()}`);

      // Fetch all active approved bookings that have passed their check-out deadline timestamp
      const expiredBookings = await cronPrisma.booking.findMany({
        where: {
          status: "Approved",
          checkOut: { lt: now } 
        }
      });

      for (const booking of expiredBookings) {
        // Safely flip the related room asset state to Maintenance status
        await cronPrisma.room.update({
          where: { id: booking.roomId },
          data: { status: "Maintenance" }
        });

        // Mark the booking record as Completed so it doesn't get processed again
        await cronPrisma.booking.update({
          where: { id: booking.id },
          data: { status: "Completed" } 
        });

        console.log(`[PMS Automated Cleanup] Room unit tracking asset linked to booking: ${booking.id} transitioned into Maintenance mode.`);
      }
    } catch (automationError) {
      console.error("[PMS Daemon Error] Background checking interval sweep encountered a fault:", automationError);
    }
  }, 1000 * 60 * 15); // Executes sweep transaction cycle every 15 minutes
};

// Fire the automation process right before loading 404 handlers
startCheckoutAutomationSweeper();

// 404 Handler
app.use((req, res) => {
  res.status(404).send(`Cannot GET ${req.url}`);
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
