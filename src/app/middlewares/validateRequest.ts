import { NextFunction, Request, Response } from "express";
import { ZodObject } from "zod";

const validateRequest =
  (schema: ZodObject) =>
  async (req: Request, res: Response, next: NextFunction) => {
    console.log(req.body);
    try {
      const parserData = await schema.parseAsync(req.body || req.body.data);
      req.body = parserData;
      return next();
    } catch (err) {
      next(err);
    }
  };

export default validateRequest;
