import crypto from "crypto-js";
import { S3P_KEY, S3P_SECRET, S3P_SIGNATURE_METHOD } from "./config";

interface SignatureParams {
  method: string;
  url: string;
  params: Record<string, unknown>;
}

interface AuthHeaderParams {
  s3pAuth_timestamp: number;
  s3pAuthSignature: string;
  s3pAuth_nonce: number | string;
}

function percentEncode(str: string): string {
  return encodeURIComponent(str).replace(/\+/g, "%20");
}

function buildBaseString(
  method: string,
  url: string,
  params: Record<string, unknown>
): string {
  const sortedKeys = Object.keys(params).sort();
  const paramString = sortedKeys.map((k) => `${k}=${params[k]}`).join("&");

  return [
    method.toUpperCase(),
    percentEncode(url),
    percentEncode(paramString),
  ].join("&");
}

function generateS3PSignature({
  method,
  url,
  params,
}: SignatureParams): string {
  const baseString = buildBaseString(method, url, params);
  const hmac = crypto.HmacSHA1(baseString, S3P_SECRET);
  return crypto.enc.Base64.stringify(hmac);
}

function getAuthorizationHeader({
  s3pAuth_timestamp,
  s3pAuthSignature,
  s3pAuth_nonce,
}: AuthHeaderParams): string {
  return `s3pAuth s3pAuth_timestamp="${s3pAuth_timestamp}", s3pAuth_signature="${s3pAuthSignature}", s3pAuth_nonce="${s3pAuth_nonce}", s3pAuth_signature_method="${S3P_SIGNATURE_METHOD}", s3pAuth_token="${S3P_KEY}"`;
}

export { generateS3PSignature, getAuthorizationHeader };