import * as jwt from 'jsonwebtoken';
import config from '../config/environment';

export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
  dealerId?: string;
}

export class JwtUtil {
  static generateAccessToken(payload: JwtPayload): string {
    return jwt.sign(
      payload,
      config.JWT_SECRET as jwt.Secret,
      { expiresIn: config.JWT_EXPIRES_IN } as jwt.SignOptions
    );
  }

  static generateRefreshToken(payload: JwtPayload): string {
    return jwt.sign(
      payload,
      config.JWT_REFRESH_SECRET as jwt.Secret,
      { expiresIn: config.JWT_REFRESH_EXPIRES_IN } as jwt.SignOptions
    );
  }

  static verifyAccessToken(token: string): JwtPayload {
    return jwt.verify(token, config.JWT_SECRET as jwt.Secret) as JwtPayload;
  }

  static verifyRefreshToken(token: string): JwtPayload {
    return jwt.verify(token, config.JWT_REFRESH_SECRET as jwt.Secret) as JwtPayload;
  }

  static generateTokenPair(payload: JwtPayload) {
    return {
      accessToken: this.generateAccessToken(payload),
      refreshToken: this.generateRefreshToken(payload),
    };
  }
}
