"use strict";
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _Rita_instances, _Rita_createUrl, _Rita_createHeaders, _Rita_cleanChannel, _Rita_ensureCanSend, _Rita_sendError;
Object.defineProperty(exports, "__esModule", { value: true });
exports.Rita = void 0;
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
            "unknownError": "unknown error"
        };
        this.URL_EVENT_SEND = 'v1/event/';
        this.URL_EVENT_SUB = 'v1/event/';
        this.server = config.url.trim();
        this.apikey = config.apikey.trim();
        this.writeInConsole = config.writeInConsole;
    }
    async SendEvent(channel, messageJson) {
        try {
            channel = __classPrivateFieldGet(this, _Rita_instances, "m", _Rita_ensureCanSend).call(this, channel);
            const res = await fetch(__classPrivateFieldGet(this, _Rita_instances, "m", _Rita_createUrl).call(this, this.URL_EVENT_SEND + channel), {
                method: "POST",
                headers: __classPrivateFieldGet(this, _Rita_instances, "m", _Rita_createHeaders).call(this),
                body: JSON.stringify(messageJson)
            });
            switch (res.status) {
                case 200:
                    const response = (await res.json());
                    return {
                        error: null,
                        eventId: String(response.eventId)
                    };
                case 401:
                    return __classPrivateFieldGet(this, _Rita_instances, "m", _Rita_sendError).call(this, this.errorMessages["notAuthorized"]);
                case 403:
                case 404:
                    return __classPrivateFieldGet(this, _Rita_instances, "m", _Rita_sendError).call(this, this.errorMessages["forbidden"]);
                default:
                    return __classPrivateFieldGet(this, _Rita_instances, "m", _Rita_sendError).call(this, this.errorMessages["unknownError"]);
            }
        }
        catch (err) {
            return __classPrivateFieldGet(this, _Rita_instances, "m", _Rita_sendError).call(this, err);
        }
    }
}
exports.Rita = Rita;
_Rita_instances = new WeakSet(), _Rita_createUrl = function _Rita_createUrl(url) {
    try {
        const _server = new URL(this.server);
        return _server.protocol + "//"
            + _server.host
            + _server.pathname.replace(/([^:]\/)\/+/g, "$1").replace(/\/$/, "")
            + url;
    }
    catch (err) {
        throw this.errorMessages["serverUrlNotValid"];
    }
}, _Rita_createHeaders = function _Rita_createHeaders() {
    const h = new Headers();
    h.append("Content-Type", "application/json");
    h.append("Authorization", this.apikey);
    return h;
}, _Rita_cleanChannel = function _Rita_cleanChannel(channel) {
    return channel.trim().toLowerCase();
}, _Rita_ensureCanSend = function _Rita_ensureCanSend(channel) {
    channel = __classPrivateFieldGet(this, _Rita_instances, "m", _Rita_cleanChannel).call(this, channel);
    if (this.server.trim() == "")
        throw this.errorMessages["serverNotConfig"];
    if (this.apikey.trim() == "")
        throw this.errorMessages["apikeyNotConfig"];
    if (channel.trim() == "")
        throw this.errorMessages["channelNotValid"];
    return channel;
}, _Rita_sendError = function _Rita_sendError(err) {
    if (this.writeInConsole) {
        console.log(err);
    }
    return {
        error: new Error(String(err)),
        eventId: ""
    };
};
