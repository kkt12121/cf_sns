import { BadRequestException, Module } from '@nestjs/common';
import { CommonService } from './common.service';
import { CommonController } from './common.controller';
import { MulterModule } from '@nestjs/platform-express';
import { extname } from 'path';
import * as multer from 'multer';
import { TEMP_FOLDER_PATH } from 'src/common/const/path.const';
import { v4 as uuid } from 'uuid';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from 'src/auth/auth.service';
import { UsersService } from 'src/users/users.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModel } from 'src/users/entities/users.entity';

@Module({
  imports: [
    JwtModule.register({}),
    TypeOrmModule.forFeature([UsersModel]),
    MulterModule.register({
      limits: {
        fileSize: 1000000,
      },
      fileFilter: (req, file, cb) => {
        /**
         * cb(에러, boolean)
         * 첫번째 파라미터에는 에러가 있을경우 에러 정보를 넣어준다.
         * 두번째 파라미터는 파일을 받을지 말지 boolean을 넣어준다.
         */

        const ext = extname(file.originalname); // xxx.jpg -> .jpg

        if (ext !== '.jpg' && ext !== '.jpeg' && ext !== '.png') {
          return cb(
            new BadRequestException('jpg/jpeg/png 파일만 업로드 가능합니다!'),
            false,
          );
        }

        return cb(null, true);
      },
      storage: multer.diskStorage({
        destination: function (req, res, cb) {
          cb(null, TEMP_FOLDER_PATH);
        },
        filename: function (req, file, cb) {
          // 123123-123-123123-123.png
          cb(null, `${uuid()}${extname(file.originalname)}`);
        },
      }),
    }),
  ],
  controllers: [CommonController],
  providers: [CommonService, AuthService, UsersService],
  exports: [CommonService],
})
export class CommonModule {}
