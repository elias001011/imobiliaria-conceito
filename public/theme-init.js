(function () {
  try {
    var t = localStorage.getItem("imobiliaria-theme");
    var q = new URLSearchParams(location.search);
    if (q.has("scene") && /^(dark|light)$/.test(q.get("theme") || "")) t = q.get("theme");
    if (t === "dark" || t === "light") document.documentElement.setAttribute("data-theme", t);
  } catch (e) {}
})();
