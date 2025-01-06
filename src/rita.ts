import { GetConfig, RitaConfig } from "./config";
import { EnventIdResponse, GetResponse, RitaEvent } from "./response";
import {ReadableStream} from "node:stream/web"

const querystring = require('querystring');

type errorNames = 
    "channelNotValid" | "serverNotConfig" | "apikeyNotConfig" 
    | "jsonNotValid"
    | "serverUrlNotValid" 
    | "notAuthorized" | "forbidden" 
    | "unknownError"

export class Rita {

    public static readonly LAST_EVENT : string = "$"

    private errorMessages : Record<errorNames, string> = {
        "channelNotValid": "the channel name is not valid",
        "serverNotConfig" : "the server url is not setted",
        "apikeyNotConfig" : "the apikey is not setted",
        "serverUrlNotValid": "the server url is not valid",
        "notAuthorized": "not authorized",
        "forbidden": "forbidden",
        "unknownError": "unknown error",
        "jsonNotValid": "the object sent is not a json"
    }

    private URL_EVENT_SEND = '/v1/event/$';
    private URL_EVENT_SUB = '/v1/event/$';
    private URL_GET_CURSOR = '/v1/event/$/last';
    
    private readonly server : string
    private readonly apikey : string

    private readonly logInConsole : boolean

    constructor(config : RitaConfig){        
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
    async GetCursor(channel: string) : Promise<EnventIdResponse> {
        try{
            channel = this.#ensureCan(channel)
            
            const res = await fetch(
                this.#createUrl(channel, this.URL_GET_CURSOR ),
                {
                     method: "GET",
                     headers: this.#createHeaders()
                }
             )
 
             switch(res.status){
                case 200:
                    const response = ( await res.json() )                   
                    
                    return {
                        error: null,
                        eventId: String( response.eventId )
                    }
                case 400:
                    return this.#sendPostError( this.errorMessages["jsonNotValid"] )
                case 401:
                    return this.#sendPostError( this.errorMessages["notAuthorized"] )
                case 403:
                case 404:
                    return this.#sendPostError( this.errorMessages["forbidden"] )
                default:
                    return this.#sendPostError( this.errorMessages["unknownError"] )
             }
        }catch(err : unknown){
            return this.#sendPostError( err )
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
    async SendEvent(channel: string, messageJson : object) : Promise<EnventIdResponse> {
        try{
            channel = this.#ensureCan(channel)

            const res = await fetch(
               this.#createUrl(channel, this.URL_EVENT_SEND ),
               {
                    method: "POST",
                    headers: this.#createHeaders(),
                    body: JSON.stringify(messageJson),
               }
            )

            switch(res.status){
                case 200:
                    const response = ( await res.json() )

                    return {
                        error: null,
                        eventId: String( response.eventId )
                    }
                case 400:
                    return this.#sendPostError( this.errorMessages["jsonNotValid"] )
                case 401:
                    return this.#sendPostError( this.errorMessages["notAuthorized"] )
                case 403:
                case 404:
                    return this.#sendPostError( this.errorMessages["forbidden"] )
                default:
                    return this.#sendPostError( this.errorMessages["unknownError"] )
            }

        }catch(err : unknown) {
            return this.#sendPostError( err )
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
    async GetEvents<T>(channel : string, config?: GetConfig ) : Promise<GetResponse<T>> {         
        try{
            channel = this.#ensureCan(channel)

            let isSubcribe : boolean = false;

            let query : any = {}
            if( config ){                
                if( config.eventId && config.eventId.trim() != '' )
                    query.eventId = config.eventId.trim()

                if( typeof config.sub != 'undefined' && config.sub === true ){
                    query.sub = true
                    isSubcribe = true;
                }
                    
            }

            if( Object.keys(query).length == 0 )
                query = undefined

            const abortController = new AbortController()    
            const signalTimeOut = AbortSignal.timeout(60000)       

            const signal = AbortSignal.any([
                signalTimeOut,
                abortController.signal
            ])

            const res = await fetch(
               this.#createUrl(channel, this.URL_EVENT_SUB, query ),
               {
                    method: "GET",
                    headers: this.#createHeaders(false),
                    signal: signal,
                    keepalive: true,
               }
            )
            
            switch(res.status){
                case 200:              
                    if( res.body ){
                        const st = res.body
                            .pipeThrough( new TextDecoderStream() )
                            .pipeThrough( this.#RitaEventStream<T>(isSubcribe) ) 

                                               

                        return {
                            error: null,
                            stream: st as ReadableStream<RitaEvent<T>>,
                            abortController: abortController
                        }                  
                    }else{
                        return this.#sendGetError( this.errorMessages["unknownError"] )
                    }                                        
                    break;
                case 400:
                    return this.#sendGetError( this.errorMessages["jsonNotValid"] )
                case 401:
                    return this.#sendGetError( this.errorMessages["notAuthorized"] )
                case 403:
                case 404:
                    return this.#sendGetError( this.errorMessages["forbidden"] )
                default:
                    return this.#sendGetError( this.errorMessages["unknownError"] )
            }
        }catch(err : unknown) {  
            
            return this.#sendGetError( err )
        }
    }

    #createUrl(channel : string, url : string, queryParams? : object) : string {
        try{
            const _server = new URL( this.server )

            let query : string = ''
            if( queryParams ){
                query = "?" + querystring.stringify( queryParams )
            }

            return _server.protocol + "//"
                + _server.host
                + _server.pathname.replace( /([^:]\/)\/+/g, "$1").replace(/\/$/, "")
                + url.replace('$', channel) + query

        }catch(err : unknown){
            throw this.errorMessages["serverUrlNotValid"]
        }
    }

    #createHeaders(contentJson : boolean = true) : Headers{
        const h = new Headers()

        if( contentJson )
            h.append("Content-Type", "application/json")
        else 
            h.append("Connection", "keep-alive")

        h.append("Authorization", this.apikey)

        return h
    }

    #cleanChannel(channel: string) : string {
        return channel.trim().toLowerCase();
    }

    #ensureCan(channel: string) : string {
        channel = this.#cleanChannel( channel )

        if( this.server.trim() == "" )
            throw this.errorMessages["serverNotConfig"]

        if( this.apikey.trim() == "" )
            throw this.errorMessages["apikeyNotConfig"]

        if( channel.trim() == "" )
            throw this.errorMessages["channelNotValid"]

        return channel;
    }

    #makeError(err : unknown) : Error {
        let _error : Error
        if( err instanceof Error )
            _error = err 
        else
            _error = new Error( String( err ) )

        return _error
    }

    #sendPostError(err: unknown) : EnventIdResponse {
        if( this.logInConsole ){
            console.log( err )
        }

        return {
            error: this.#makeError(err),
            eventId: ""
        }
    }

    #sendGetError<T>(err: unknown) : GetResponse<T> {
        if( this.logInConsole ){
            console.log( err )
        }

        return {
            error:  this.#makeError(err),
            stream: new ReadableStream<RitaEvent<T>>(),
            abortController: new AbortController()
        }
    }

    #RitaEventStream<T>(isStream: boolean) {
        return new TransformStream<string, RitaEvent<T>>({
            transform(chunk, controller) {   
                
                const createEvent = <T>(str : string) : RitaEvent<T> => {
                    const obj : RitaEvent<T> = JSON.parse( str )
                    obj.createdAt = new Date( obj.createdAt )
                    obj.data = JSON.parse( (obj.data) as string )

                    return obj
                }

                if( isStream ){
                    let chunks = chunk.split("\n\n")                
                    for( let c of chunks ){
                        const m = c.match(/^data:\s*(.*)$/m);
                        if (m) {
                            const data = m[1];                    
                            if( data != "" && data != "ping" ){  
                                controller.enqueue( createEvent(data) )
                            }
                        }
                    }                
                }else{
                    controller.enqueue( createEvent(chunk) )         
                }
            }
        })
    }

}