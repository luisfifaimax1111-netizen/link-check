const crypto = require("crypto");

const MIN_GIAY = 20;    // mở nhanh hơn số này thì chặn
const MAX_GIAY = 1800;  // quá 30 phút thì hết hạn

function taoKey() {
  const h = crypto.randomBytes(8).toString("hex").toUpperCase();
  return `KEY-${h.slice(0, 4)}-${h.slice(4, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}`;
}

function trang(key) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>Lấy Key</title>
  <style>
    body { font-family: sans-serif; background: #111; color: #fff; text-align: center; padding: 40px 16px; }
    .box { background: #222; border-radius: 12px; padding: 20px; margin: 20px auto; max-width: 420px; word-break: break-all; font-size: 20px; }
    button { background: #4f46e5; color: #fff; border: 0; border-radius: 8px; padding: 12px 24px; font-size: 16px; }
  </style>
</head>
<body>
  <h1>🔑 Lấy Key</h1>
  <p>🎉 Bạn đã vượt xong! Key của bạn:</p>
  <div class="box" id="key">${key}</div>
  <button onclick="navigator.clipboard.writeText(document.getElementById('key').innerText);this.innerText='Đã sao chép!'">Sao chép key</button>
  <p><small>Vào Discord, dùng lệnh /redeem để nhập key nhận điểm.</small></p>
</body>
</html>`;
}

exports.handler = async (event) => {
  const t = (event.queryStringParameters || {}).t || "";
  const parts = t.split(".");

  if (parts.length !== 3 || !process.env.SECRET) {
    return chan("Link không hợp lệ hoặc bạn chưa vượt link đúng cách.");
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
    return chan("Link không hợp lệ hoặc bạn chưa vượt link đúng cách.");
  }

  let key;
  try {
    const { getStore, connectLambda } = await import("@netlify/blobs");
    connectLambda(event);
    const store = getStore({ name: "keys", consistency: "strong" });
    const cu = await store.get("link-" + sig);
    if (cu) {
      key = cu;
    } else {
      key = taoKey();
      await store.set("link-" + sig, key);
      await store.setJSON("key-" + key, { uid, used: false, ts: Date.now() });
    }
  } catch (e) {
    console.error("Lỗi lưu key:", e);
    return chan("Lỗi hệ thống, vui lòng thử lại sau.");
  }

  return {
    statusCode: 200,
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
    body: trang(k
