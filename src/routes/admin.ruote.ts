import { Router, urlencoded } from 'express';
import { 
  getAdminDashboard, 
  createRoomListing, 
  updateRoomStatus, 
  deleteRoomListing, 
  updateRoomDetails,
} from '../controllers/admin.controller.js';

const router = Router();
router.use(urlencoded({ extended: true }));

router.get('/', getAdminDashboard);
router.post('/rooms', createRoomListing);
router.post('/rooms/:id/status', updateRoomStatus); // ← NEW: Status tracking update mapping
router.post('/rooms/:id/delete', deleteRoomListing); // ← NEW: Destruction path mapping
router.post('/rooms/:id/edit', updateRoomDetails);
export default router;
