// Maviance Payment Integration for Le Continent
// CommonJS version for Node.js backend

const crypto = require('crypto-js');

// Configuration
const URL = "https://s3pv2cm.smobilpay.com/v2";
const PING_URL = `${URL}/ping`;
const QUOTE_URL = `${URL}/quotestd`;
const COLLECT_URL = `${URL}/collectstd`;
const VERIFY_URL = `${URL}/verifytx`;
const MTN_PAYITEM_ID = "S-113-949-CMMTNMOMOCC-20056-900323-1";
const ORANGE_PAYITEM_ID = "S-113-949-CMORANGEOMCC-30056-900341-1";
const MTN_REGEX = "^(237|00237|\\+237)?((650|651|652|653|654|680|681|682|683)\\d{6}$|(67\\d{7}$|(4\\d{10})))$";
const ORANGE_REGEX = "^(237|00237|\\+237)?((655|656|657|658|659|686|687|688|689|640)\\d{5,6}$|(69\\d{7})$|(6\\d{8}))$";
const S3P_SECRET = "4ce5e52b-ce90-407c-8f68-366b94dc1a18";
const S3P_SIGNATURE_METHOD = "HMAC-SHA1";
const S3P_KEY = "ceb96ead-4e12-4567-b53b-c6a565918238";

// Helper functions for signature
function percentEncode(str) {
    return encodeURIComponent(str).replace(/\+/g, "%20");
}

function buildBaseString(method, url, params) {
    const sortedKeys = Object.keys(params).sort();
    const paramString = sortedKeys.map((k) => `${k}=${params[k]}`).join("&");
    return [
        method.toUpperCase(),
        percentEncode(url),
        percentEncode(paramString),
    ].join("&");
}

function generateS3PSignature(method, url, params) {
    const baseString = buildBaseString(method, url, params);
    const hmac = crypto.HmacSHA1(baseString, S3P_SECRET);
    return crypto.enc.Base64.stringify(hmac);
}

function getAuthorizationHeader(s3pAuth_timestamp, s3pAuthSignature, s3pAuth_nonce) {
    return `s3pAuth s3pAuth_timestamp="${s3pAuth_timestamp}", s3pAuth_signature="${s3pAuthSignature}", s3pAuth_nonce="${s3pAuth_nonce}", s3pAuth_signature_method="${S3P_SIGNATURE_METHOD}", s3pAuth_token="${S3P_KEY}"`;
}

// API Request functions
async function ping(authorization) {
    return await fetch(PING_URL, {
        method: 'GET',
        headers: {
            Authorization: authorization,
        },
    });
}

async function getQuote(authorization, body) {
    return await fetch(QUOTE_URL, {
        method: 'POST',
        headers: {
            Authorization: authorization,
            'Content-Type': 'application/json',
        },
        body: body,
    });
}

async function collect(authorization, body) {
    return await fetch(COLLECT_URL, {
        method: 'POST',
        headers: {
            Authorization: authorization,
            'Content-Type': 'application/json',
        },
        body: body,
    });
}

async function verifyTrx(authorization, ptn) {
    return await fetch(`${VERIFY_URL}?ptn=${ptn}`, {
        method: 'GET',
        headers: {
            Authorization: authorization,
        },
    });
}

// Main functions
async function checkAvailability() {
    const s3pAuth_timestamp = Date.now();
    const s3pAuth_nonce = Date.now();
    const s3pAuthSignature = generateS3PSignature("GET", PING_URL, {
        s3pAuth_nonce: s3pAuth_nonce,
        s3pAuth_signature_method: S3P_SIGNATURE_METHOD,
        s3pAuth_timestamp: s3pAuth_timestamp,
        s3pAuth_token: S3P_KEY,
    });

    const authorization = getAuthorizationHeader(s3pAuth_timestamp, s3pAuthSignature, s3pAuth_nonce);
    const response = await ping(authorization);
    return response.status == 200;
}

async function initQuote(payItemId, amount) {
    const body = {
        payItemId: payItemId,
        amount: amount,
    };
    const s3pAuth_nonce = Date.now() + Math.floor(Math.random() * 10000);
    const s3pAuth_timestamp = Date.now();
    const s3pAuthSignature = generateS3PSignature("POST", QUOTE_URL, {
        ...body,
        s3pAuth_nonce: s3pAuth_nonce,
        s3pAuth_signature_method: S3P_SIGNATURE_METHOD,
        s3pAuth_timestamp: s3pAuth_timestamp,
        s3pAuth_token: S3P_KEY,
    });

    const authorization = getAuthorizationHeader(s3pAuth_timestamp, s3pAuthSignature, s3pAuth_nonce);
    const response = await getQuote(authorization, JSON.stringify(body));
    const responseData = await response.json();
    return { responseData, statusCode: response.status };
}

async function initPayment(quoteId, customerPhonenumber, customerEmailaddress, customerName, customerAddress, serviceNumber, cdata, trid) {
    const body = {
        quoteId: quoteId,
        customerPhonenumber: customerPhonenumber,
        customerEmailaddress: customerEmailaddress,
        customerName: customerName,
        customerAddress: customerAddress,
        serviceNumber: serviceNumber,
        trid: trid || Date.now() + generateTrid(12),
        cdata: cdata || "",
    };
    const s3pAuth_nonce = Date.now() + Math.floor(Math.random() * 10000);
    const s3pAuth_timestamp = Date.now();
    const s3pAuthSignature = generateS3PSignature("POST", COLLECT_URL, {
        ...body,
        s3pAuth_nonce: s3pAuth_nonce,
        s3pAuth_signature_method: S3P_SIGNATURE_METHOD,
        s3pAuth_timestamp: s3pAuth_timestamp,
        s3pAuth_token: S3P_KEY,
    });

    const authorization = getAuthorizationHeader(s3pAuth_timestamp, s3pAuthSignature, s3pAuth_nonce);
    const response = await collect(authorization, JSON.stringify(body));
    const responseData = await response.json();
    return { responseData, statusCode: response.status };
}

async function getPaymentInfo(ptn) {
    const s3pAuth_timestamp = Date.now();
    const s3pAuth_nonce = Date.now() + Math.floor(Math.random() * 10000);
    const s3pAuthSignature = generateS3PSignature("GET", VERIFY_URL, {
        s3pAuth_nonce: s3pAuth_nonce,
        s3pAuth_signature_method: S3P_SIGNATURE_METHOD,
        s3pAuth_timestamp: s3pAuth_timestamp,
        s3pAuth_token: S3P_KEY,
        ptn: ptn,
    });
    const authorization = getAuthorizationHeader(s3pAuth_timestamp, s3pAuthSignature, s3pAuth_nonce);
    const response = await verifyTrx(authorization, ptn);
    const responseData = await response.json();
    return { responseData, statusCode: response.status };
}

async function makePayment({ amount, serviceNumber, customerEmailaddress, customerName, customerAddress }) {
    const payItemiId = getPaymentItemId(serviceNumber);

    if (!payItemiId) {
        throw new Error("Invalid service number provided.");
    }

    console.log(`Using PayItem ID: ${payItemiId}`);

    const getQuoteResponse = await initQuote(payItemiId, amount);
    console.log('Quote response:', getQuoteResponse);

    const quoteId = getQuoteResponse.responseData.quoteId || "";
    console.log(`Quote ID: ${quoteId}`);

    if (!quoteId) {
        throw new Error(getQuoteResponse.responseData.message || "Failed to get quote");
    }

    const paymentResponse = await initPayment(
        quoteId,
        serviceNumber,
        customerEmailaddress,
        customerName,
        customerAddress,
        serviceNumber
    );

    console.log('Payment response:', paymentResponse);

    const ptn = paymentResponse.responseData.ptn || "";
    console.log(`PTN: ${ptn}`);

    if (!ptn) {
        // Check for error in response
        const errorCode = paymentResponse.responseData.errorCode || paymentResponse.responseData.error_code;
        if (errorCode) {
            throw new Error(errorCode.toString());
        }
        throw new Error("Failed to initiate payment");
    }

    return ptn;
}

function getPaymentItemId(serviceNumber) {
    if (!serviceNumber) return null;
    const normalized = String(serviceNumber).replace(/[\s\-()]/g, "");
    
    console.log('Getting PayItemId for:', serviceNumber, '-> normalized:', normalized);
    
    const mtnRe = new RegExp(MTN_REGEX);
    const orangeRe = new RegExp(ORANGE_REGEX);
    
    const mtnMatch = mtnRe.test(normalized);
    const orangeMatch = orangeRe.test(normalized);
    
    console.log('MTN regex match:', mtnMatch, '| Orange regex match:', orangeMatch);

    if (mtnMatch) {
        console.log('Using MTN PayItem:', MTN_PAYITEM_ID);
        return MTN_PAYITEM_ID;
    }
    if (orangeMatch) {
        console.log('Using Orange PayItem:', ORANGE_PAYITEM_ID);
        return ORANGE_PAYITEM_ID;
    }

    console.log('No match found for phone number');
    return null;
}

function generateTrid(length) {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result.toUpperCase();
}

function getErrorMessage(errorCode) {
    switch (errorCode) {
        case 703202:
            return "Le paiement a été rejecté. Veuillez vérifier votre compte et réessayer.";
        case 703108:
            return "Solde insuffisant. Veuillez recharger votre compte MTN ou Orange Money et réessayer.";
        case 703201:
            return "Le paiement n'a pas été confirmé";
        case 703000:
            return "Paiement annulé ou expiré. Veuillez réessayer.";
        case 700100:
            return "Service temporairement indisponible. Veuillez réessayer plus tard.";
        case 700200:
            return "Paramètres de paiement invalides";
        case 700300:
            return "Paiement超时. Veuillez réessayer.";
        default:
            return "Le paiement a échoué. Veuillez réessayer.";
    }
}

module.exports = {
    checkAvailability,
    getPaymentInfo,
    getPaymentItemId,
    initPayment,
    initQuote,
    makePayment,
    getErrorMessage,
};
