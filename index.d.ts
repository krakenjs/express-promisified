import express from 'express';

export interface AppServerType {
  EVENT: { SHUTDOWN: 'shutdown' };
  close: () => Promise<void>;
  on: (event: string, handler: () => void) => { cancel: () => void; } ;
  listen: (options: {port: number}) => Promise<AppServerType>;
  get: (url: string, handler: (req: express.Request, res: express.Response) => Promise<void> | void) => AppServerType;
}

export function server(): AppServerType;