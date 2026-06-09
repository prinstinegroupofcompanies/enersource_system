import { Router } from 'express';
import path from 'path';
import { uploadDirPath } from '../middleware/upload.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.get('/:filename', authenticate, (req, res, next) => {
  try {
    const filename = path.basename(String(req.params.filename));
    res.sendFile(path.join(uploadDirPath, filename));
  } catch (e) {
    next(e);
  }
});

export default router;
