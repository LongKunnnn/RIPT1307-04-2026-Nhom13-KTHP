import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { RewardsService } from './rewards.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Public } from '../../common/decorators/auth.decorators';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUserPayload } from '../../common/utils/helpers';

@Controller('rewards')
export class RewardsController {
  constructor(private rewardsService: RewardsService) {}

  @Public()
  @Get('catalog')
  getCatalog() {
    return this.rewardsService.getCatalog();
  }

  @UseGuards(JwtAuthGuard)
  @Get('wallet')
  getWallet(@CurrentUser() user: AuthUserPayload) {
    return this.rewardsService.getWallet(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('redeem')
  redeem(@CurrentUser() user: AuthUserPayload, @Body('itemId') itemId: number) {
    return this.rewardsService.redeem(user, Number(itemId));
  }

  @UseGuards(JwtAuthGuard)
  @Get('my-vouchers')
  getMyVouchers(@CurrentUser() user: AuthUserPayload) {
    return this.rewardsService.getMyVouchers(user.id);
  }
}
