import { Router } from 'express';
import { 
  getHomePage, 
  getRoomsPage, 
  getAboutPage, 
  getContactPage 
} from '../controllers/hotel.controller.js'; // Uses '../' to step back and find controllers

const router = Router();

router.get('/', getHomePage);
router.get('/rooms', getRoomsPage);
router.get('/about', getAboutPage);
router.get('/contact', getContactPage);

export default router;