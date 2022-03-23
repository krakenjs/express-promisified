/* @flow */

import https from 'https';

import express from 'express'; // eslint-disable-line import/no-unresolved

type ExpressRequest = express$Request; // eslint-disable-line no-undef
type ExpressResponse = express$Response; // eslint-disable-line no-undef

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
    get : (url : string, handler : (req : ExpressRequest, res : ExpressResponse) => Promise<void> | void) => AppServerType
};

export function server() : AppServerType {

    let expressApp = express();
    let expressServer;

    let getExpressServer = () => {
        if (!expressServer) {
            throw new Error(`Server not started`);
        }
        return expressServer;
    };

    let shutdownListeners = [];

    const appServer : AppServerType = {
        EVENT,
        async close() : Promise<void> {
            await new Promise((resolve, reject) => {
                return getExpressServer().close(err => {
                    return err ? reject(err) : resolve();
                });
            });
            for (let handler of shutdownListeners) {
                await handler();
            }
        },
        on(event, handler) : Cancelable {
            expressApp.addListener(event, handler);
            return {
                cancel() {
                    expressApp.removeListener(event, handler);
                }
            };
        },
        onShutdown(handler) : Cancelable {
            shutdownListeners.push(handler);
            return {
                cancel() {
                    shutdownListeners.splice(shutdownListeners.indexOf(handler), 1);
                }
            };
        },
        use(middleware) : AppServerType {
            // $FlowFixMe
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
        useCallback() : AppServerType {
            expressApp.use.apply(expressApp, arguments);
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
        async listenHTTPS({ port, privateKey, certificate } : { port : number, privateKey : string, certificate : string }) : Promise<AppServerType> {
            await new Promise((resolve, reject) => {
                expressServer = https.createServer(
                    {
                        key:  privateKey,
                        cert: certificate
                    },
                    expressApp
                ).listen(port, err => {
                    if (err) {
                        return reject(err);
                    }
                    if (!expressServer) {
                        return reject(new Error('No server found'));
                    }

                    // $FlowFixMe
                    console.log(`Listening on https://localhost:${ port }`); // eslint-disable-line no-console
                    return resolve();
                });
            });

            return appServer;
        },
        get(url : string, handler : (ExpressRequest, ExpressResponse) => Promise<void> | void) : AppServerType {
            // $FlowFixMe
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
        post(url : string, handler : (ExpressRequest, ExpressResponse) => Promise<void> | void) : AppServerType {
            // $FlowFixMe
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
