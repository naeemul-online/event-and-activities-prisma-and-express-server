import { NextFunction, Request, Response } from "express";
import config from "../../config";
import { jwtHelper } from "../helper/jwtHelper";

const optionalAuth = () => {
  return async (
    req: Request & { user?: any },
    _res: Response,
    next: NextFunction
  ) => {
    try {
      const token = req.cookies?.accessToken;

      // 🔓 No token → public access
      if (!token) {
        return next();
      }

      const verifiedUser = jwtHelper.verifyToken(
        token,
        config.jwt_access_token_secret!
      );

      req.user = verifiedUser;
      next();
    } catch (error) {
      // 🔓 Invalid token → still allow public access
      next();
    }
  };
};

export default optionalAuth;
