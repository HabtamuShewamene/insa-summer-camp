import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { SearchService } from './search.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('search')
@UseGuards(JwtAuthGuard)
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  async search(
    @Query('q') query: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Req() req?: any,
  ) {
    const userId = req.user.id;

    if (!query) {
      return {
        success: false,
        message: 'Search query is required',
      };
    }

    const searchQuery = {
      query,
      limit: limit ? parseInt(limit) : 20,
      offset: offset ? parseInt(offset) : 0,
    };

    const results = await this.searchService.search(userId, searchQuery);

    return {
      success: true,
      data: results,
    };
  }

  @Get('recent')
  async getRecentSearches(@Req() req: any) {
    const userId = req.user.id;
    const recent = await this.searchService.getRecentSearches(userId);

    return {
      success: true,
      data: recent,
    };
  }
}