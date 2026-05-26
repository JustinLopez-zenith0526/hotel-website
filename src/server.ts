import express from 'express';
import dotenv from 'dotenv';
import path from 'path';



import hotelRoutes from './routes/hotel.routes.js';
import adminRoutes from './routes/admin.ruote.js';



dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// View Engine Setup
app.set('view engine', 'ejs');
app.set('views', path.join(process.cwd(), 'src/views'));   // ← Best fix

// Static Files
app.use(express.static(path.join(process.cwd(), 'src/public')));

// Routes
app.use('/', hotelRoutes);
app.use('/admin', adminRoutes);
// 404 Handler
app.use((req, res) => {
  res.status(404).send(`Cannot GET ${req.url}`);
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});