import * as jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

export const authentication = (
  req: { headers: { authorization?: string } },
  res: { sendStatus: (statusCode: number) => void },
  next: () => void,
) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (token == null) return res.sendStatus(401);

  jwt.verify(
    token,
    `${process.env.JWT_SECRET}`,
    (err: jwt.VerifyErrors | null) => {
      if (err) return res.sendStatus(403);
      next();
    },
  );
};
