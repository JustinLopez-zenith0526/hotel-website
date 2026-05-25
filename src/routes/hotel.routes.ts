import { Router } from 'express';

const router = Router();

router.get('/', (req, res) => {
  res.render('index', {
    hotelName: "The Grand Haven",
    city: "Angeles City",
    airbnbUrl: "https://www.airbnb.com/rooms/your-listing-id"   // Change this later
  });
});

export default router;