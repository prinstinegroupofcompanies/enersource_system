import { Router } from 'express';
import { z } from 'zod';
import path from 'path';
import { authenticate, requirePermission } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import * as documentsService from '../services/documents/documents.service.js';

const router = Router();
router.use(authenticate);

router.get('/summary', requirePermission('documents', 'view'), async (_req, res, next) => {
  try {
    res.json(await documentsService.getDocumentsSummary());
  } catch (e) {
    next(e);
  }
});

router.get('/', requirePermission('documents', 'view'), async (req, res, next) => {
  try {
    res.json(
      await documentsService.listDocuments({
        category: req.query.category as string | undefined,
        search: req.query.search as string | undefined,
      })
    );
  } catch (e) {
    next(e);
  }
});

router.get('/:id', requirePermission('documents', 'view'), async (req, res, next) => {
  try {
    const doc = await documentsService.getDocument(String(req.params.id));
    res.json({
      ...doc,
      versions: doc.versions.map((v) => ({
        ...v,
        downloadUrl: documentsService.publicFileUrl(v.storedPath),
      })),
    });
  } catch (e) {
    next(e);
  }
});

router.post('/', requirePermission('documents', 'create'), upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'File required' });
      return;
    }
    const body = z
      .object({
        title: z.string().min(1),
        description: z.string().optional(),
        category: z.string().optional(),
        changeNotes: z.string().optional(),
      })
      .parse(req.body);

    const doc = await documentsService.createDocument(
      {
        title: body.title,
        description: body.description,
        category: body.category,
        fileName: req.file.originalname,
        storedPath: req.file.path,
        mimeType: req.file.mimetype,
        fileSize: req.file.size,
        changeNotes: body.changeNotes,
      },
      req.user!.id
    );

    res.status(201).json(doc);
  } catch (e) {
    next(e);
  }
});

router.post('/:id/versions', requirePermission('documents', 'edit'), upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'File required' });
      return;
    }
    const body = z.object({ changeNotes: z.string().optional() }).parse(req.body);

    const version = await documentsService.addDocumentVersion(
      String(req.params.id),
      {
        fileName: req.file.originalname,
        storedPath: req.file.path,
        mimeType: req.file.mimetype,
        fileSize: req.file.size,
        changeNotes: body.changeNotes,
      },
      req.user!.id
    );

    res.status(201).json({
      ...version,
      downloadUrl: documentsService.publicFileUrl(version.storedPath),
    });
  } catch (e) {
    next(e);
  }
});

export default router;
