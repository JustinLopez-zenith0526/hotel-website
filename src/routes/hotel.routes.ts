import { Router } from 'express';

const router = Router();

router.get('/', (req, res) => {
  res.render('index', {
    airbnbUrl: "https://www.airbnb.com/rooms/your-listing-id"
  });
});

router.get('/rooms', (req, res) => {
  res.render('rooms', {
    airbnbUrl: "https://www.airbnb.com/rooms/your-listing-id"
  });
});

export default router;