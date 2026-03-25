import { generateS3PSignature, getAuthorizationHeader } from "./auth";
import {
  COLLECT_URL,
  MTN_PAYITEM_ID,
  MTN_REGEX,
  ORANGE_PAYITEM_ID,
  ORANGE_REGEX,
  PING_URL,
  QUOTE_URL,
  S3P_KEY,
  S3P_SIGNATURE_METHOD,
  VERIFY_URL,
} from "./config";
import { collect, getQuote, ping, verifyTrx } from "./requests";

interface QuoteRequest {
  payItemId: string;
  amount: number;
}

interface PaymentRequest {
  quoteId: string;
  customerPhonenumber: string;
  customerEmailaddress: string;
  customerName: string;
  customerAddress: string;
  serviceNumber: string;
  cdata?: string;
  trid?: string;
}

interface PaymentResponse {
  responseData: Record<string, unknown>;
  statusCode: number;
}

interface MakePaymentParams {
  amount: number;
  serviceNumber: string;
  customerEmailaddress: string;
  customerName: string;
  customerAddress: string;
}

async function checkAvailibitity(): Promise<boolean> {
  const s3pAuth_timestamp = Date.now();
  const s3pAuth_nonce = Date.now();
  const s3pAuthSignature = generateS3PSignature({
    method: "GET",
    url: PING_URL,
    params: {
      s3pAuth_nonce: s3pAuth_nonce,
      s3pAuth_signature_method: S3P_SIGNATURE_METHOD,
      s3pAuth_timestamp: s3pAuth_timestamp,
      s3pAuth_token: S3P_KEY,
    },
  });

  const authorization = getAuthorizationHeader({
    s3pAuth_timestamp: s3pAuth_timestamp,
    s3pAuthSignature: s3pAuthSignature,
    s3pAuth_nonce: s3pAuth_nonce,
  });

  const response = await ping(authorization);

  return response.status == 200;
}

async function initQuote({
  payItemId,
  amount,
}: QuoteRequest): Promise<PaymentResponse> {
  const body = {
    payItemId: payItemId,
    amount: amount,
  };
  const s3pAuth_nonce = Date.now() + (Math.random() * 10000).toFixed(0);
  const s3pAuth_timestamp = Date.now();
  const s3pAuthSignature = generateS3PSignature({
    method: "POST",
    url: QUOTE_URL,
    params: {
      ...body,
      s3pAuth_nonce: s3pAuth_nonce,
      s3pAuth_signature_method: S3P_SIGNATURE_METHOD,
      s3pAuth_timestamp: s3pAuth_timestamp,
      s3pAuth_token: S3P_KEY,
    },
  });

  const authorization = getAuthorizationHeader({
    s3pAuth_timestamp: s3pAuth_timestamp,
    s3pAuthSignature: s3pAuthSignature,
    s3pAuth_nonce: s3pAuth_nonce,
  });
  const response = await getQuote(authorization, JSON.stringify(body));

  const responseData = (await response.json()) as Record<string, unknown>;
  return { responseData, statusCode: response.status };
}

async function initPayment({
  quoteId,
  customerPhonenumber,
  customerEmailaddress,
  customerName,
  customerAddress,
  serviceNumber,
  cdata,
  trid,
}: PaymentRequest): Promise<PaymentResponse> {
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
  const s3pAuth_nonce = Date.now() + (Math.random() * 10000).toFixed(0);
  const s3pAuth_timestamp = Date.now();
  const s3pAuthSignature = generateS3PSignature({
    method: "POST",
    url: COLLECT_URL,
    params: {
      ...body,
      s3pAuth_nonce: s3pAuth_nonce,
      s3pAuth_signature_method: S3P_SIGNATURE_METHOD,
      s3pAuth_timestamp: s3pAuth_timestamp,
      s3pAuth_token: S3P_KEY,
    },
  });

  const authorization = getAuthorizationHeader({
    s3pAuth_timestamp: s3pAuth_timestamp,
    s3pAuthSignature: s3pAuthSignature,
    s3pAuth_nonce: s3pAuth_nonce,
  });
  const response = await collect(authorization, JSON.stringify(body));

  const responseData = (await response.json()) as Record<string, unknown>;
  return { responseData, statusCode: response.status };
}

async function getPaymentInfo(ptn: string): Promise<PaymentResponse> {
  const s3pAuth_timestamp = Date.now();
  const s3pAuth_nonce = Date.now() + (Math.random() * 10000).toFixed(0);
  const s3pAuthSignature = generateS3PSignature({
    method: "GET",
    url: VERIFY_URL,
    params: {
      s3pAuth_nonce: s3pAuth_nonce,
      s3pAuth_signature_method: S3P_SIGNATURE_METHOD,
      s3pAuth_timestamp: s3pAuth_timestamp,
      s3pAuth_token: S3P_KEY,
      ptn: ptn,
    },
  });
  const authorization = getAuthorizationHeader({
    s3pAuth_timestamp: s3pAuth_timestamp,
    s3pAuthSignature: s3pAuthSignature,
    s3pAuth_nonce: s3pAuth_nonce,
  });

  const response = await verifyTrx(authorization, ptn);

  const responseData = (await response.json()) as Record<string, unknown>;
  return { responseData, statusCode: response.status };
}

async function makePayment({
  amount,
  serviceNumber,
  customerEmailaddress,
  customerName,
  customerAddress,
}: MakePaymentParams): Promise<string> {
  const payItemiId = getPaymentItemId(serviceNumber);

  if (!payItemiId) {
    throw new Error("Invalid service number provided.");
  }

  console.log(`Using PayItem ID: ${payItemiId}`);

  const getQuoteResponse = await initQuote({
    payItemId: payItemiId,
    amount: amount,
  });

  const quoteId = (getQuoteResponse.responseData.quoteId as string) || "";
  console.log(`Quote ID: ${quoteId}`);

  const paymentResponse = await initPayment({
    quoteId: quoteId,
    customerPhonenumber: serviceNumber,
    customerEmailaddress: customerEmailaddress,
    customerName: customerName,
    customerAddress: customerAddress,
    serviceNumber: serviceNumber,
  });

  const ptn = (paymentResponse.responseData.ptn as string) || "";
  console.log(`PTN: ${ptn}`);

  return ptn;
}

function getPaymentItemId(
  serviceNumber: string | null | undefined
): string | null {
  if (!serviceNumber) return null;
  const normalized = String(serviceNumber).replace(/[\s\-()]/g, "");
  const mtnRe = new RegExp(MTN_REGEX);
  const orangeRe = new RegExp(ORANGE_REGEX);

  if (mtnRe.test(normalized)) return MTN_PAYITEM_ID;
  if (orangeRe.test(normalized)) return ORANGE_PAYITEM_ID;

  return null;
}

function generateTrid(length: number): string {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result.toUpperCase();
}

function getErrorMessage(errorCode: number): string {
  switch (errorCode) {
    case 703202:
      return "Le paiement a été rejecté";
    case 703108:
      return "Votre balance est insuffisante pour éffectuer ce paiement";
    case 703201:
      return "Le paiement n'a pas été confirmé";
    default:
      return "Le paiement a échoué";
  }
}

export {
  checkAvailibitity,
  getPaymentInfo,
  getPaymentItemId,
  initPayment,
  initQuote,
  makePayment,
  getErrorMessage,
};