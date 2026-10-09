const crypto = require("crypto");

function tra(code, obj) {
  return {
    statusCode: code,
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify(obj),
  };
}

function dungBot(h) {
  const nhan = Buffer.from(String(h["x-bot-secret"] || ""));
  const that = Buffer.from(String(process.env.BOT_SECRET || ""));
  return that.length > 0 && nhan.length === that.length && crypto.timingSafeEqual(nhan, that);
}

exports.handler = async (event) => {
  if (!dungBot(event.headers || {})) {
    return tra(403, { ok: false, msg: "Không có quyền." });
  }

  const q = event.queryStringParameters || {};
  const key = (q.key || "").trim().toUpperCase();
  const uid = String(q.uid || "");

  if (!/^KEY-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}$/.test(key)) {
    return tra(200, { ok: false, msg: "Key sai định dạng." });
  }

  try {
    const { getStore, connectLambda } = await import("@netlify/blobs");
    connectLambda(event);
    const store = getStore({ name: "keys", consistency: "strong" });
    const rec = await store.get("key-" + key, { type: "json" });

    if (!rec) return tra(200, { ok: false, msg: "Key không tồn tại." });
    if (rec.uid !== uid) return tra(200, { ok: false, msg: "Key này không thuộc về bạn." });
    if (rec.used) return tra(200, { ok: false, msg: "Key này đã được dùng." });

    rec.used = true;
    rec.usedAt = Date.now();
    await store.setJSON("key-" + key, rec);
    return tra(200, { ok: true });
  } catch (e) {
    console.error("Lỗi đổi key:", e);
    return tra(500, { ok: false, msg: "Lỗi hệ thống, thử lại sau." });
  }
};
