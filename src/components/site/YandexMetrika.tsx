import { useEffect, useState } from "react";
import { db } from "@/integrations/database/client";

export function YandexMetrika() {
  const [id, setId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await db
        .from("app_settings")
        .select("value")
        .eq("key", "analytics")
        .maybeSingle();
      const v = data?.value as { yandex_metrika_id?: string } | null;
      if (v?.yandex_metrika_id) setId(v.yandex_metrika_id);
    })();
  }, []);

  useEffect(() => {
    if (!id) return;
    if (document.getElementById("ym-script")) return;
    const s = document.createElement("script");
    s.id = "ym-script";
    s.innerHTML = `(function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
m[i].l=1*new Date();for(var j=0;j<document.scripts.length;j++){if(document.scripts[j].src===r){return}}
k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})
(window,document,"script","https://mc.yandex.ru/metrika/tag.js","ym");
ym(${Number(id)}, "init", { clickmap:true, trackLinks:true, accurateTrackBounce:true, webvisor:true });
window.__ymCounterId = ${Number(id)};`;
    document.head.appendChild(s);
    const ns = document.createElement("noscript");
    ns.innerHTML = `<div><img src="https://mc.yandex.ru/watch/${Number(id)}" style="position:absolute;left:-9999px" alt="" /></div>`;
    document.body.appendChild(ns);
  }, [id]);

  return null;
}
