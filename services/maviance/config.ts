const URL = "https://s3pv2cm.smobilpay.com/v2";
const PING_URL = `${URL}/ping`;
const QUOTE_URL = `${URL}/quotestd`;
const COLLECT_URL = `${URL}/collectstd`;
const VERIFY_URL = `${URL}/verifytx`;
const MTN_PAYITEM_ID = "S-113-949-CMMTNMOMOCC-20056-900323-1";
const ORANGE_PAYITEM_ID = "S-113-949-CMORANGEOMCC-30056-900341-1";
const MTN_REGEX =
  "^(237|00237|\\+237)?((650|651|652|653|654|680|681|682|683)\\d{6}$|(67\\d{7}$|(4\\d{10})))$";
const ORANGE_REGEX =
  "^(237)?((655|656|657|658|659|686|687|688|689|640)[0-9]{6}$|(69[0-9]{7})$)";
const S3P_SECRET = "4ce5e52b-ce90-407c-8f68-366b94dc1a18";
const S3P_SIGNATURE_METHOD = "HMAC-SHA1";
const S3P_KEY = "ceb96ead-4e12-4567-b53b-c6a565918238";

export {
  COLLECT_URL,
  MTN_PAYITEM_ID,
  MTN_REGEX,
  ORANGE_PAYITEM_ID,
  ORANGE_REGEX,
  PING_URL,
  QUOTE_URL,
  S3P_KEY,
  S3P_SECRET,
  S3P_SIGNATURE_METHOD,
  VERIFY_URL,
};