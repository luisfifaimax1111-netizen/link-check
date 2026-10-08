const crypto = require("crypto");

const LINK_DICH = "https://deft-gingersnap-3ff627.netlify.app";
const MIN_GIAY = 20;    // mở nhanh hơn số này thì chặn
const MAX_GIAY = 1800;  // quá 30 phút thì hết hạn

exports.handler = async (event) => {
  const t = (event.queryStringParameters || {}).t || "";
  const parts = t.split(".");

  if (parts.length !== 3 || !process.env.SECRET) {
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
  const dungThoiGian = tuoi >= MIN_GIAY && tuoi <= MAX_GIAY;

  if (!dungChuKy || !dungThoiGian) {
    return chan();
  }

  return {
    statusCode: 302,
    headers: { Location: LINK_DICH, "Cache-Control": "no-store" },
  };
};

function chan() {
  return {
    statusCode: 403,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
    body: "Link không hợp lệ hoặc bạn chưa vượt link đúng cách.",
  };
    }
