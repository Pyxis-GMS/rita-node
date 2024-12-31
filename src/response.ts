import {ReadableStream} from "node:stream/web"

export type EnventIdResponse = {
    error: Error | null;
    eventId: string;    
}

export type GetResponse<T> = {
    error: Error | null;
    stream: ReadableStream<RitaEvent<T>>;
    abortController : AbortController;
}

export type RitaEvent<T> = {
    id: string;
    createdAt: Date;
    data: T
}