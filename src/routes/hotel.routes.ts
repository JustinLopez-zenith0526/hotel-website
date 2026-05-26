import { Router, urlencoded } from 'express';
import { 
  getHomePage, 
  getRoomsPage, 
  createBookingInquiry,
  getAboutPage, 
  getContactPage
} from '../controllers/hotel.controller.js'; // Uses '../' to step back and find controllers

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


router.get('/', getHomePage);
router.get('/rooms', getRoomsPage);
router.get('/about', getAboutPage);
router.get('/contact', getContactPage);
router.post('/rooms/:id/book', createBookingInquiry);

export default router;