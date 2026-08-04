import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { SearchController } from '../controllers/search.controller';
import { SearchService } from '../services/search.service';
import { SearchRepository } from '../repositories/search.repository';
import { authenticate } from '../../../common/middlewares/auth.middleware';

const router = Router();
const prisma = new PrismaClient();

const searchRepository = new SearchRepository(prisma);
const searchService = new SearchService(searchRepository);
const searchController = new SearchController(searchService);

// All routes require authentication
router.use(authenticate);

// GET /api/search?q=query
router.get('/', searchController.search);

// GET /api/search/recent
router.get('/recent', searchController.getRecentSearches);

export default router;