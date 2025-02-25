import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersModel } from 'src/users/entities/users.entity';
import { UsersService } from 'src/users/users.service';
import * as bcrypt from 'bcrypt';
import { RegisterUserDto } from './dto/register-user.dto';
import { ConfigService } from '@nestjs/config';
import {
  ENV_HASH_ROUNDS_KEY,
  ENV_JWT_SECRET_KEY,
} from 'src/common/const/env-keys.const';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
  ) {}

  extractTokenFromHeader(header: string, isBearer: boolean) {
    const spiltToken = header.split(' ');

    const prefix = isBearer ? 'Bearer' : 'Basic';

    if (spiltToken.length !== 2 || spiltToken[0] !== prefix) {
      throw new UnauthorizedException('잘못된 토큰입니다!');
    }

    const token = spiltToken[1];

    return token;
  }

  decodeBasicToken(base64String: string) {
    const decoded = Buffer.from(base64String, 'base64').toString('utf8');

    const split = decoded.split(':');

    if (split.length !== 2) {
      throw new UnauthorizedException('잘못된 유형의 토큰입니다.');
    }

    const email = split[0];
    const password = split[1];

    return { email, password };
  }

  // 토큰 검증
  verifyToken(token: string) {
    try {
      return this.jwtService.verify(token, {
        secret: this.configService.get<string>(ENV_JWT_SECRET_KEY),
      });
    } catch (e) {
      throw new UnauthorizedException(' 토큰이 만료됐거나 잘못된 토큰입니다.');
    }
  }

  // 토큰 재발급
  rotateToken(token: string, isRefreshToken: boolean) {
    const decoded = this.jwtService.verify(token, {
      secret: this.configService.get<string>(ENV_JWT_SECRET_KEY),
    });

    if (decoded.type !== 'refresh') {
      throw new UnauthorizedException(
        '토큰 재발급은 Refresh 토큰으 로만 가능합니다!',
      );
    }

    return this.signToken({ ...decoded }, isRefreshToken);
  }

  signToken(user: Pick<UsersModel, 'email' | 'id'>, isRefreshToken: boolean) {
    const payLoad = {
      email: user.email,
      id: user.id,
      type: isRefreshToken ? 'refresh' : 'access',
    };

    return this.jwtService.sign(payLoad, {
      secret: this.configService.get<string>(ENV_JWT_SECRET_KEY),
      expiresIn: isRefreshToken ? 3600 : 300,
    });
  }

  loginUser(user: Pick<UsersModel, 'email' | 'id'>) {
    return {
      accessToken: this.signToken(user, false),
      refreshToken: this.signToken(user, true),
    };
  }

  async authenticateWithEmailAndPassword(
    user: Pick<UsersModel, 'email' | 'password'>,
  ) {
    const existingUser = await this.usersService.getUserByEmail(user.email);

    if (!existingUser) {
      throw new UnauthorizedException('존재하지 않는 사용자입니다.');
    }

    const passOk = await bcrypt.compare(user.password, existingUser.password);

    if (!passOk) {
      throw new UnauthorizedException('비밀번호가 틀렸습니다.');
    }

    return existingUser;
  }

  async loginWithEmail(user: Pick<UsersModel, 'email' | 'password'>) {
    const existingUser = await this.authenticateWithEmailAndPassword(user);

    return this.loginUser(existingUser);
  }

  async registerWithEmail(user: RegisterUserDto) {
    const hash = await bcrypt.hash(
      user.password,
      parseInt(this.configService.get<string>(ENV_HASH_ROUNDS_KEY)),
    );

    const newUser = await this.usersService.createUser({
      ...user,
      password: hash,
    });

    return this.loginUser(newUser);
  }
}
