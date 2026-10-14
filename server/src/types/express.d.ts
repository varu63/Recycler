import type { IUser } from '../models/User';

export interface ParsedFile {
  filename: string;
  mimeType: string;
  buffer: Buffer;
  size: number;
}

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
      uploadedFiles?: ParsedFile[];
    }
  }
}

export {};
