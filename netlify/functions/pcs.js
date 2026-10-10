const crypto = require("crypto");

const MAX_GIAY = 1800; // link hết hạn sau 30 phút

// Địa chỉ API từng loại nhiệm vụ của Phiên Chợ Số
const API = {
  tukhoa: "https://api.phienchoso.com/tukhoa.php",
  review: "https://api.phienchoso.com/review.php",
};

function chan(msg) {
  return {
    statusCode: 403,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
    body: msg,
  };
}

exports.handler = async (event) => {
  const q = event.queryStringParameters || {};
  const t = q.t || "";
  const loai = q.loai || "tukhoa";
  const parts = t.split(".");

  if (parts.length !== 3 || !process.env.SECRET || !process.env.PCS_TOKEN) {
    return chan("Link không hợp lệ hoặc đã hết hạn.");
  }
  if (!API[loai]) {
    return chan("Loại nhiệm vụ này chưa được cấu hình.");
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
    return chan("Link không hợp lệ hoặc đã hết hạn.");
  }

  const host = (event.headers || {}).host;
  const dich = `https://${host}/.netlify/functions/check?t=${t}`;
  const loc =
    API[loai] +
    "?token=" +
    encodeURIComponent(process.env.PCS_TOKEN) +
    "&url=" +
    encodeURIComponent(dich);

  return {
    statusCode: 302,
    headers: { Location: loc, "Cache-Control": "no-store" },
  };
};
