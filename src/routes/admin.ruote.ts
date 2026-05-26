import { Router, urlencoded } from 'express';
import { 
  getAdminDashboard, 
  createRoomListing, 
  updateRoomStatus, 
  deleteRoomListing, 
  updateRoomDetails,
  getEditPage,
  updateBookingStatus,
  checkoutBookingInstantly,
  deleteBookingLog,
  cleanAndReleaseRoomUnit,
} from '../controllers/admin.controller.js';
import { protectAdmin } from '../middleware/auth.middleware.js';

const router = Router();
router.use(urlencoded({ extended: true }));

router.get('/management-gate', (req, res) => {
  res.render('login');
});

router.post('/management-gate', (req, res) => {
  const { password } = req.body;
  const session = (req as any).session;
  
  if (password === process.env.ADMIN_PASSWORD) {
    if (session) {
      session.isAdmin = true;
    }
    return res.redirect('/admin');
  }
  
  res.render('login', { error: true });
});

router.get('/logout', (req, res) => {
  const session = (req as any).session;
  if (session) {
    session.destroy(() => {
      res.redirect('/');
    });
  } else {
    res.redirect('/');
  }
});


router.use(protectAdmin);

router.get('/', getAdminDashboard);
router.post('/rooms', createRoomListing);
router.post('/rooms/:id/status', updateRoomStatus); 
router.post('/rooms/:id/delete', deleteRoomListing); 
router.post('/rooms/:id/edit', updateRoomDetails);

router.get('/rooms/:id/edit', getEditPage); 
router.post('/rooms/:id/edit', updateRoomDetails);
router.post('/bookings/:id/status', updateBookingStatus);
router.post('/bookings/:id/checkout', checkoutBookingInstantly);
router.post('/bookings/:id/delete', deleteBookingLog);
router.post('/rooms/:id/ready', cleanAndReleaseRoomUnit);


export default router;
