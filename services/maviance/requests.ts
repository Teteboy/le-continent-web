import { COLLECT_URL, PING_URL, QUOTE_URL, VERIFY_URL } from './config';

async function ping(authorization: string): Promise<Response> {
    return await fetch(PING_URL, {
        method: 'GET',
        headers: {
            Authorization: authorization,
        },
    });
}

async function getQuote(authorization: string, body: string): Promise<Response> {
    return await fetch(QUOTE_URL, {
        method: 'POST',
        headers: {
            Authorization: authorization,
            'Content-Type': 'application/json',
        },
        body: body,
    });
}

async function collect(authorization: string, body: string): Promise<Response> {
    return await fetch(COLLECT_URL, {
        method: 'POST',
        headers: {
            Authorization: authorization,
            'Content-Type': 'application/json',
        },
        body: body,
    });
}

async function verifyTrx(authorization: string, ptn: string): Promise<Response> {
    return await fetch(`${VERIFY_URL}?ptn=${ptn}`, {
        method: 'GET',
        headers: {
            Authorization: authorization,
        },
    });
}

export { ping, getQuote, collect, verifyTrx };