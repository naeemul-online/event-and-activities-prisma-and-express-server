import { NextFunction, Request, Response } from "express";

const parseMultipartData = (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  if (req.body?.data) {
    try {
      req.body = JSON.parse(req.body.data);
    } catch {
      throw new Error("Invalid JSON format in data field");
    }
  }
  next();
};

export default parseMultipartData;
