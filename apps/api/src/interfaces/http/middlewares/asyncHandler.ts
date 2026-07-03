import type { NextFunction, Request, RequestHandler, Response } from 'express';

type ParamsDictionary = Record<string, string>;

type AsyncControllerHandler<
  Params = ParamsDictionary,
  ResBody = unknown,
  ReqBody = unknown,
  ReqQuery = unknown,
> = (
  req: Request<Params, ResBody, ReqBody, ReqQuery>,
  res: Response<ResBody>,
  next: NextFunction,
) => Promise<unknown>;

export function asyncHandler<
  Params = ParamsDictionary,
  ResBody = unknown,
  ReqBody = unknown,
  ReqQuery = unknown,
>(
  fn: AsyncControllerHandler<Params, ResBody, ReqBody, ReqQuery>,
): RequestHandler<Params, ResBody, ReqBody, ReqQuery> {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
