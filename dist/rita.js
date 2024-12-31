"use strict";
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _Rita_instances, _Rita_createUrl, _Rita_createHeaders, _Rita_cleanChannel, _Rita_ensureCan, _Rita_makeError, _Rita_sendPostError, _Rita_sendGetError, _Rita_RitaEventStream;
Object.defineProperty(exports, "__esModule", { value: true });
exports.Rita = void 0;
const querystring = require('querystring');
class Rita {
    constructor(config) {
        _Rita_instances.add(this);
        this.errorMessages = {
            "channelNotValid": "the channel name is not valid",
            "serverNotConfig": "the server url is not setted",
            "apikeyNotConfig": "the apikey is not setted",
            "serverUrlNotValid": "the server url is not valid",
            "notAuthorized": "not authorized",
            "forbidden": "forbidden",
            "unknownError": "unknown error",
            "jsonNotValid": "the object sent is not a json"
        };
        this.URL_EVENT_SEND = '/v1/event/$';
        this.URL_EVENT_SUB = '/v1/event/$';
        this.URL_GET_CURSOR = '/v1/event/$/last';
        this.server = config.url.trim();
        this.apikey = config.apikey.trim();
        this.logInConsole = config.logInConsole;
    }
    /**
     * Return the last event id of the channel passed by parameter
     *
     * @param channel type string, the channel name to get the last event id
     * @returns Promise<EnventIdResponse>
     * @example
     * const resCursor = await rita.GetCursor("test")
     * console.log( resCursor.eventId )
     */
    async GetCursor(channel) {
        try {
            channel = __classPrivateFieldGet(this, _Rita_instances, "m", _Rita_ensureCan).call(this, channel);
            const res = await fetch(__classPrivateFieldGet(this, _Rita_instances, "m", _Rita_createUrl).call(this, channel, this.URL_GET_CURSOR), {
                method: "GET",
                headers: __classPrivateFieldGet(this, _Rita_instances, "m", _Rita_createHeaders).call(this)
            });
            switch (res.status) {
                case 200:
                    const response = (await res.json());
                    return {
                        error: null,
                        eventId: String(response.eventId)
                    };
                case 400:
                    return __classPrivateFieldGet(this, _Rita_instances, "m", _Rita_sendPostError).call(this, this.errorMessages["jsonNotValid"]);
                case 401:
                    return __classPrivateFieldGet(this, _Rita_instances, "m", _Rita_sendPostError).call(this, this.errorMessages["notAuthorized"]);
                case 403:
                case 404:
                    return __classPrivateFieldGet(this, _Rita_instances, "m", _Rita_sendPostError).call(this, this.errorMessages["forbidden"]);
                default:
                    return __classPrivateFieldGet(this, _Rita_instances, "m", _Rita_sendPostError).call(this, this.errorMessages["unknownError"]);
            }
        }
        catch (err) {
            return __classPrivateFieldGet(this, _Rita_instances, "m", _Rita_sendPostError).call(this, err);
        }
    }
    /**
     * Send an event to the channel passed by parameter
     *
     * @param channel type string, the channel name to get the last event id
     * @param messageJson type object, the message to send, this message try to be a json object
     * @returns Promise<EnventIdResponse>
     * @example
     * const resSend = await rita.SendEvent("test", {
     *  hello: "world"
     * })
     */
    async SendEvent(channel, messageJson) {
        try {
            channel = __classPrivateFieldGet(this, _Rita_instances, "m", _Rita_ensureCan).call(this, channel);
            const res = await fetch(__classPrivateFieldGet(this, _Rita_instances, "m", _Rita_createUrl).call(this, channel, this.URL_EVENT_SEND), {
                method: "POST",
                headers: __classPrivateFieldGet(this, _Rita_instances, "m", _Rita_createHeaders).call(this),
                body: JSON.stringify(messageJson),
            });
            switch (res.status) {
                case 200:
                    const response = (await res.json());
                    return {
                        error: null,
                        eventId: String(response.eventId)
                    };
                case 400:
                    return __classPrivateFieldGet(this, _Rita_instances, "m", _Rita_sendPostError).call(this, this.errorMessages["jsonNotValid"]);
                case 401:
                    return __classPrivateFieldGet(this, _Rita_instances, "m", _Rita_sendPostError).call(this, this.errorMessages["notAuthorized"]);
                case 403:
                case 404:
                    return __classPrivateFieldGet(this, _Rita_instances, "m", _Rita_sendPostError).call(this, this.errorMessages["forbidden"]);
                default:
                    return __classPrivateFieldGet(this, _Rita_instances, "m", _Rita_sendPostError).call(this, this.errorMessages["unknownError"]);
            }
        }
        catch (err) {
            return __classPrivateFieldGet(this, _Rita_instances, "m", _Rita_sendPostError).call(this, err);
        }
    }
    /**
     * This method return a stream of events or a event array from the channel passed by parameter.
     * The config object can have the eventId and sub properties, the eventId is the event id to start the stream
     * and the sub property is a boolean to indicate if the stream is a subscription or not.
     *
     * T is the type of the data that the event will have
     *
     * Return a Promise<GetResponse<T>> with the stream and the abort controller to stop the stream
     * ReadableStream<RitaEvent<T>> is the stream of events
     *
     * @param channel type string, the channel name to get the last event id
     * @param config Type GetConfig, the config object to get the stream
     * @returns Promise<GetResponse<T>>
     * @example
     *
     * const resGet = await rita.GetEvent("test", {
     *  sub: true
     * })
     *
     * if( !resGet.error ){
     *  for await (const value of resGet.stream) {
     *      console.log( value )
     *  }
     * }
     */
    async GetEvent(channel, config) {
        try {
            channel = __classPrivateFieldGet(this, _Rita_instances, "m", _Rita_ensureCan).call(this, channel);
            let isSubcribe = false;
            let query = {};
            if (config) {
                if (config.eventId && config.eventId.trim() != '')
                    query.eventId = config.eventId.trim();
                if (typeof config.sub != 'undefined' && config.sub === true) {
                    query.sub = true;
                    isSubcribe = true;
                }
            }
            if (Object.keys(query).length == 0)
                query = undefined;
            const abortController = new AbortController();
            const signalTimeOut = AbortSignal.timeout(60000);
            const signal = AbortSignal.any([
                signalTimeOut,
                abortController.signal
            ]);
            const res = await fetch(__classPrivateFieldGet(this, _Rita_instances, "m", _Rita_createUrl).call(this, channel, this.URL_EVENT_SUB, query), {
                method: "GET",
                headers: __classPrivateFieldGet(this, _Rita_instances, "m", _Rita_createHeaders).call(this, false),
                signal: signal,
                keepalive: true,
            });
            switch (res.status) {
                case 200:
                    if (res.body) {
                        const st = res.body
                            .pipeThrough(new TextDecoderStream())
                            .pipeThrough(__classPrivateFieldGet(this, _Rita_instances, "m", _Rita_RitaEventStream).call(this, isSubcribe));
                        return {
                            error: null,
                            stream: st,
                            abortController: abortController
                        };
                    }
                    else {
                        return __classPrivateFieldGet(this, _Rita_instances, "m", _Rita_sendGetError).call(this, this.errorMessages["unknownError"]);
                    }
                    break;
                case 400:
                    return __classPrivateFieldGet(this, _Rita_instances, "m", _Rita_sendGetError).call(this, this.errorMessages["jsonNotValid"]);
                case 401:
                    return __classPrivateFieldGet(this, _Rita_instances, "m", _Rita_sendGetError).call(this, this.errorMessages["notAuthorized"]);
                case 403:
                case 404:
                    return __classPrivateFieldGet(this, _Rita_instances, "m", _Rita_sendGetError).call(this, this.errorMessages["forbidden"]);
                default:
                    return __classPrivateFieldGet(this, _Rita_instances, "m", _Rita_sendGetError).call(this, this.errorMessages["unknownError"]);
            }
        }
        catch (err) {
            return __classPrivateFieldGet(this, _Rita_instances, "m", _Rita_sendGetError).call(this, err);
        }
    }
}
exports.Rita = Rita;
_Rita_instances = new WeakSet(), _Rita_createUrl = function _Rita_createUrl(channel, url, queryParams) {
    try {
        const _server = new URL(this.server);
        let query = '';
        if (queryParams) {
            query = "?" + querystring.stringify(queryParams);
        }
        return _server.protocol + "//"
            + _server.host
            + _server.pathname.replace(/([^:]\/)\/+/g, "$1").replace(/\/$/, "")
            + url.replace('$', channel) + query;
    }
    catch (err) {
        throw this.errorMessages["serverUrlNotValid"];
    }
}, _Rita_createHeaders = function _Rita_createHeaders(contentJson = true) {
    const h = new Headers();
    if (contentJson)
        h.append("Content-Type", "application/json");
    else
        h.append("Connection", "keep-alive");
    h.append("Authorization", this.apikey);
    return h;
}, _Rita_cleanChannel = function _Rita_cleanChannel(channel) {
    return channel.trim().toLowerCase();
}, _Rita_ensureCan = function _Rita_ensureCan(channel) {
    channel = __classPrivateFieldGet(this, _Rita_instances, "m", _Rita_cleanChannel).call(this, channel);
    if (this.server.trim() == "")
        throw this.errorMessages["serverNotConfig"];
    if (this.apikey.trim() == "")
        throw this.errorMessages["apikeyNotConfig"];
    if (channel.trim() == "")
        throw this.errorMessages["channelNotValid"];
    return channel;
}, _Rita_makeError = function _Rita_makeError(err) {
    let _error;
    if (err instanceof Error)
        _error = err;
    else
        _error = new Error(String(err));
    return _error;
}, _Rita_sendPostError = function _Rita_sendPostError(err) {
    if (this.logInConsole) {
        console.log(err);
    }
    return {
        error: __classPrivateFieldGet(this, _Rita_instances, "m", _Rita_makeError).call(this, err),
        eventId: ""
    };
}, _Rita_sendGetError = function _Rita_sendGetError(err) {
    if (this.logInConsole) {
        console.log(err);
    }
    return {
        error: __classPrivateFieldGet(this, _Rita_instances, "m", _Rita_makeError).call(this, err),
        stream: new ReadableStream(),
        abortController: new AbortController()
    };
}, _Rita_RitaEventStream = function _Rita_RitaEventStream(isStream) {
    return new TransformStream({
        transform(chunk, controller) {
            const createEvent = (str) => {
                const obj = JSON.parse(str);
                obj.createdAt = new Date(obj.createdAt);
                obj.data = JSON.parse((obj.data));
                return obj;
            };
            if (isStream) {
                let chunks = chunk.split("\n\n");
                for (let c of chunks) {
                    const m = c.match(/^data:\s*(.*)$/m);
                    if (m) {
                        const data = m[1];
                        if (data != "" && data != "ping") {
                            controller.enqueue(createEvent(data));
                        }
                    }
                }
            }
            else {
                controller.enqueue(createEvent(chunk));
            }
        }
    });
};
