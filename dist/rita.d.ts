import { RitaConfig } from "./config";
import { SendResponse } from "./response";
export declare class Rita {
    #private;
    private errorMessages;
    private URL_EVENT_SEND;
    private URL_EVENT_SUB;
    private readonly server;
    private readonly apikey;
    private readonly writeInConsole;
    constructor(config: RitaConfig);
    SendEvent(channel: string, messageJson: object): Promise<SendResponse>;
}
