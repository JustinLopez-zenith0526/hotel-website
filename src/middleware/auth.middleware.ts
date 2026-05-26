import { Request, Response, NextFunction } from 'express';

export const protectAdmin = (req: Request, res: Response, next: NextFunction) => {
  // Safe inline type casting completely avoids local type resolution glitches
  const session = (req as any).session;

  // If the user has a valid login session active, let them through
  if (session && session.isAdmin) {
    return next();
  }
  
  // If not logged in, respond with a clean 404 instead of a redirect. 
  // This makes attackers believe the page doesn't exist at all.
  res.status(404).send(`Cannot GET ${req.url}`);
};
