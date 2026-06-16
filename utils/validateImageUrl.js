const IMAGE_URL_RE = /^https?:\/\/.+/i;

async function isImageUrlReachable(url, { timeoutMs = 4000 } = {}) {
  if (!url || !IMAGE_URL_RE.test(url)) return false;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
      signal: controller.signal,
    });
    if (res.status >= 200 && res.status < 400) return true;
    if (res.status === 405 || res.status === 501) {
      const getRes = await fetch(url, {
        method: "GET",
        redirect: "follow",
        signal: controller.signal,
        headers: { Range: "bytes=0-0" },
      });
      return getRes.status >= 200 && getRes.status < 400;
    }
    return false;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

module.exports = { isImageUrlReachable, IMAGE_URL_RE };
