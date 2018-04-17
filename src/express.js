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
    listen : (options : { port : number }) => Promise<void>,
    get : (url : string, handler : (req : express$Request, res : express$Response) => Promise<void> | void) => AppServerType
};

export function server() : AppServerType {

    let app = express();

    const appServer : AppServerType = {
        EVENT,
        async close() : Promise<void> {
            await new Promise((resolve, reject) => {
                return server.close(err => {
                    return err ? reject(err) : resolve();
                });
            });
            appServer.emit(EVENT.SHUTDOWN);
        },
        on(event, handler) : Cancelable {
            app.addListener(event, handler);
            return {
                cancel() {
                    app.removeListener(event, handler);
                }
            };
        },
        use(middleware) {
            app.use(middleware);
        },
        emit(event) {
            app.emit(event);
        },
        async listen({ port } : { port : number }) : Promise<void> {
            return await new Promise((resolve, reject) => {
                let expressServer = app.listen(port, err => {
                    if (err) {
                        return reject(err);
                    }
                    if (!expressServer) {
                        return reject(new Error('No server found'));
                    }

                    // $FlowFixMe
                    console.log('[%s] Listening on http://localhost:%d', app.settings.env.toUpperCase(), port); // eslint-disable-line no-console
                    return resolve(expressServer);
                });
            });
        },
        get(url : string, handler : (express$Request, express$Response) => Promise<void> | void) : AppServerType {
            app.get(async (req, res) => {
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
            app.post(async (req, res) => {
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
