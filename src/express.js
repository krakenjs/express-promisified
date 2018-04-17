/* @flow */

import express from 'express';

const EVENT = {
    SHUTDOWN: 'shutdown'
};

type Cancelable = {
    cancel : () => void
};

export type AppServerType = {
    EVENT : typeof EVENT,
    close : () => Promise<void>,
    on : (event : string, handler : () => void) => Cancelable,
    emit : (event : string) => void,
    listen : (options : { port : number }) => Promise<AppServerType>,
    get : (url : string, handler : (req : express$Request, res : express$Response) => Promise<void> | void) => AppServerType
};

export function server() : AppServerType {

    let expressApp = express();
    let expressServer;

    const appServer : AppServerType = {
        EVENT,
        async close() : Promise<void> {
            if (!expressServer) {
                throw new Error(`Server not started`);
            }
            await new Promise((resolve, reject) => {
                return expressServer.close(err => {
                    return err ? reject(err) : resolve();
                });
            });
            appServer.emit(EVENT.SHUTDOWN);
        },
        on(event, handler) : Cancelable {
            expressApp.addListener(event, handler);
            return {
                cancel() {
                    expressApp.removeListener(event, handler);
                }
            };
        },
        use(middleware) : AppServerType {
            expressApp.use(async (req, res, next) => {
                try {
                    await middleware(req, res);
                } catch (err) {
                    return next(err);
                }
                return next();
            });
            return appServer;
        },
        useCallback(middleware) : AppServerType {
            expressApp.use(middleware);
            return appServer;
        },
        emit(event) {
            expressApp.emit(event);
        },
        async listen({ port } : { port : number }) : Promise<AppServerType> {
            await new Promise((resolve, reject) => {
                expressServer = expressApp.listen(port, err => {
                    if (err) {
                        return reject(err);
                    }
                    if (!expressServer) {
                        return reject(new Error('No server found'));
                    }

                    // $FlowFixMe
                    console.log(`Listening on http://localhost:${ port }`); // eslint-disable-line no-console
                    return resolve();
                });
            });

            return appServer;
        },
        get(url : string, handler : (express$Request, express$Response) => Promise<void> | void) : AppServerType {
            expressApp.get(url, async (req, res) => {
                try {
                    await handler(req, res);
                } catch (err) {
                    console.error(err); // eslint-disable-line no-console
                    res.status(500).send(`Internal server error`);
                }
            });
            return appServer;
        },
        post(url : string, handler : (express$Request, express$Response) => Promise<void> | void) : AppServerType {
            expressApp.post(url, async (req, res) => {
                try {
                    await handler(req, res);
                } catch (err) {
                    console.error(err); // eslint-disable-line no-console
                    res.status(500).send(`Internal server error`);
                }
            });
            return appServer;
        }
    };

    return appServer;
}
