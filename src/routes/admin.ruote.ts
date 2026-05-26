import { Router, urlencoded } from 'express';
import { 
  getAdminDashboard, 
  createRoomListing, 
  updateRoomStatus, 
  deleteRoomListing, 
  updateRoomDetails,
  getEditPage,
} from '../controllers/admin.controller.js';

const router = Router();
router.use(urlencoded({ extended: true }));

router.get('/', getAdminDashboard);
router.post('/rooms', createRoomListing);
router.post('/rooms/:id/status', updateRoomStatus); 
router.post('/rooms/:id/delete', deleteRoomListing); 
router.post('/rooms/:id/edit', updateRoomDetails);

router.get('/rooms/:id/edit', getEditPage); 
router.post('/rooms/:id/edit', updateRoomDetails);

export default router;
