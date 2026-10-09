const crypto = require("crypto");

const MAX_GIAY = 1800; // link hết hạn sau 30 phút

function chan() {
  return {
    statusCode: 403,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
    body: "Link không hợp lệ hoặc đã hết hạn.",
  };
}

exports.handler = async (event) => {
  const t = (event.queryStringParameters || {}).t || "";
  const parts = t.split(".");

  if (parts.length !== 3 || !process.env.SECRET || !process.env.PCS_TOKEN) {
    return chan();
  }

  const [uid, ts, sig] = parts;
  const expect = crypto
    .createHmac("sha256", process.env.SECRET)
    .update(`${uid}.${ts}`)
    .digest("hex")
    .slice(0, 16);

  const a = Buffer.from(sig);
  const b = Buffer.from(expect);
  const dungChuKy = a.length === b.length && crypto.timingSafeEqual(a, b);
  const tuoi = Date.now() / 1000 - Number(ts);

  if (!dungChuKy || tuoi < 0 || tuoi > MAX_GIAY) {
    return chan();
  }

  const host = (event.headers || {}).host;
  const dich = `https://${host}/.netlify/functions/check?t=${t}`;
  const loc =
    "https://api.phienchoso.com/tukhoa.php?token=" +
    encodeURIComponent(process.env.PCS_TOKEN) +
    "&url=" +
    encodeURIComponent(dich);

  return {
    statusCode: 302,
    headers: { Location: loc, "Cache-Control": "no-store" },
  };
};
