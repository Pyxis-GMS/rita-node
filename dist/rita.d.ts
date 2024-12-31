import { GetConfig, RitaConfig } from "./config";
import { EnventIdResponse, GetResponse } from "./response";
export declare class Rita {
    #private;
    private errorMessages;
    private URL_EVENT_SEND;
    private URL_EVENT_SUB;
    private URL_GET_CURSOR;
    private readonly server;
    private readonly apikey;
    private readonly logInConsole;
    constructor(config: RitaConfig);
    /**
     * Return the last event id of the channel passed by parameter
     *
     * @param channel type string, the channel name to get the last event id
     * @returns Promise<EnventIdResponse>
     * @example
     * const resCursor = await rita.GetCursor("test")
     * console.log( resCursor.eventId )
     */
    GetCursor(channel: string): Promise<EnventIdResponse>;
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
    SendEvent(channel: string, messageJson: object): Promise<EnventIdResponse>;
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
    GetEvent<T>(channel: string, config?: GetConfig): Promise<GetResponse<T>>;
}
