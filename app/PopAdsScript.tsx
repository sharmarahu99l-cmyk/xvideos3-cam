'use client';

import { useEffect } from 'react';

const POPADS_INLINE_CODE = `/*<![CDATA[/* */
(function(){var i=window,f="f885b844f797fe522b609d35822b7559",q=[["siteId",564+704-684+5327315],["minBid",0],["popundersPerIP","0"],["delayBetween",0],["default",false],["defaultPerDay",0],["topmostLayer","auto"]],o=["d3d3LmRpc3BsYXl2ZXJ0aXNpbmcuY29tL2NzaWR5LmNzcw==","ZDNtem9rdHk5NTFjNXcuY2xvdWRmcm9udC5uZXQvaC9zanNubG9nLm1pbi5qcw=="],h=-1,s,j,k=function(){clearTimeout(j);h++;if(o[h]&&!(1821391076000<(new Date).getTime()&&1<h)){s=i.document.createElement("script");s.type="text/javascript";s.async=!0;var u=i.document.getElementsByTagName("script")[0];s.src="https://"+atob(o[h]);s.crossOrigin="anonymous";s.onerror=k;s.onload=function(){clearTimeout(j);i[f.slice(0,16)+f.slice(0,16)]||k()};j=setTimeout(k,5E3);u.parentNode.insertBefore(s,u)}};if(!i[f]){try{Object.freeze(i[f]=q)}catch(e){}k()}})();
/*]]>/* */`;

export default function PopAdsScript() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const ua = navigator.userAgent.toLowerCase();
    const isBot =
      /bot|crawl|spider|slurp|yandex|bingpreview|mediapartners|adsbot|google|duckduckgo|baidu/i.test(
        ua
      ) || Boolean((navigator as Navigator & { webdriver?: boolean }).webdriver);

    if (isBot) return;
    if (document.getElementById('hubtube-popads-direct')) return;

    const script = document.createElement('script');
    script.id = 'hubtube-popads-direct';
    script.type = 'text/javascript';
    script.setAttribute('data-cfasync', 'false');
    script.text = POPADS_INLINE_CODE;
    document.head.appendChild(script);
  }, []);

  return null;
}