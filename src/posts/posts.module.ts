import { BadRequestException, Module } from '@nestjs/common';
import { PostsService } from './posts.service';
import { PostsController } from './posts.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostsModel } from './entities/posts.entity';
import { UsersModel } from 'src/users/entities/users.entity';
import { AuthService } from 'src/auth/auth.service';
import { JwtModule } from '@nestjs/jwt';
import { UsersService } from 'src/users/users.service';
import { CommonModule } from 'src/common/common.module';
import { MulterModule } from '@nestjs/platform-express';
import { extname } from 'path';
import * as multer from 'multer';
import { POST_IMAGE_PATH } from 'src/common/const/path.const';
import { v4 as uuid } from 'uuid';

@Module({
  imports: [
    JwtModule.register({}),
    TypeOrmModule.forFeature([PostsModel, UsersModel]),
    CommonModule,
  ],
  controllers: [PostsController],
  providers: [PostsService, UsersService, AuthService],
})
export class PostsModule {}
