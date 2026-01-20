// /assets/scripts/global.js
(() => {
  const isLocal =
    location.hostname === "localhost" ||
    location.hostname === "127.0.0.1";

  const GA4_ID = "G-NBQHSPW9GH";
  const ADSENSE_CLIENT = "ca-pub-7899890641544647";

  const loadScriptOnce = (src, attrs = {}) => {
    try {
      if (document.querySelector(`script[src="${src}"]`)) return;
      const s = document.createElement("script");
      s.src = src;
      Object.entries(attrs).forEach(([k, v]) => {
        if (k === "crossorigin") s.crossOrigin = v;
        else s.setAttribute(k, v);
      });
      document.head.appendChild(s);
    } catch (e) {
      console.warn("Global loader: script injection blocked", e);
    }
  };

  if (!isLocal) {
    try {
      loadScriptOnce(`https://www.googletagmanager.com/gtag/js?id=${GA4_ID}`, { async: "" });
      window.dataLayer = window.dataLayer || [];
      if (!window.gtag) {
        window.gtag = function gtag(){ window.dataLayer.push(arguments); };
        window.gtag("js", new Date());
        window.gtag("config", GA4_ID, { anonymize_ip: true });
      }
    } catch (e) {
      console.warn("Global loader: GA4 init blocked", e);
    }
  }

  if (!isLocal) {
    try {
      loadScriptOnce(
        `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`,
        { async: "", crossorigin: "anonymous" }
      );
    } catch (e) {
      console.warn("Global loader: AdSense init blocked", e);
    }
  }
})();
