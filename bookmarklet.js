/* Product Forge – AliExpress Scraper v6 – Ultra-reliable */
(function(){
try{

if(!/aliexpress/i.test(location.hostname)){
  alert('Product Forge : ouvrez une page produit AliExpress.');return;
}

var R={source:'aliexpress',url:location.href,domain:location.hostname,scrapedAt:new Date().toISOString()};
var html=document.documentElement.innerHTML;

/* ═══════════════════════════════════════════════
   PHASE 1 – Structured JSON extraction
   ═══════════════════════════════════════════════ */
var J=null;

/* A: __NEXT_DATA__ */
var nxt=document.getElementById('__NEXT_DATA__');
if(nxt){try{J=JSON.parse(nxt.textContent)}catch(e){}}

/* B: Parse scripts for product JSON */
if(!J){
  var ss=document.querySelectorAll('script');
  for(var i=0;i<ss.length;i++){
    var t=ss[i].textContent;
    if(!t||t.length<200) continue;
    var m=t.match(/window\.runParams\s*=\s*(\{[\s\S]{50,}?\});/);
    if(m){try{var p=JSON.parse(m[1]);if(p.data||Object.keys(p).length>5)J=p}catch(e){}}
    if(J)break;
    m=t.match(/data:\s*(\{[\s\S]*?"actionModule"[\s\S]*?\})\s*[,;\n]/);
    if(m){try{var p2=JSON.parse(m[1]);if(Object.keys(p2).length>2)J=p2}catch(e){}}
    if(J)break;
    /* Large JSON blob with titleModule/productInfoComponent */
    if(t.indexOf('titleModule')>-1||t.indexOf('productInfoComponent')>-1){
      var m3=t.match(/(\{[\s\S]*?"(?:titleModule|productInfoComponent)"[\s\S]*?\})\s*[;,\n]/);
      if(m3){try{var p3=JSON.parse(m3[1]);if(Object.keys(p3).length>2)J=p3}catch(e){}}
    }
    if(J)break;
  }
}

/* Normalise: some layouts nest under .data */
var D=J;
if(J&&J.props&&J.props.pageProps&&J.props.pageProps.data) D=J.props.pageProps.data;
else if(J&&J.data&&typeof J.data==='object'&&Object.keys(J.data).length>3) D=J.data;

/* helper: deep safe access */
function g(o){for(var i=1;i<arguments.length;i++){if(!o||typeof o!=='object')return '';o=o[arguments[i]]}return o||''}

/* ═══════════════════════════════════════════════
   PHASE 2 – TITLE (7 fallbacks)
   ═══════════════════════════════════════════════ */
R.title='';

/* T1: JSON subject */
if(D){
  R.title=g(D,'productInfoComponent','subject')
    ||g(D,'titleModule','subject')
    ||g(D,'pageModule','title')
    ||g(D,'metadata','title')
    ||'';
}

/* T2: DOM selectors */
if(!R.title){
  var te=document.querySelector('[data-pl="product-title"]')
    ||document.querySelector('h1[class*="title"]')
    ||document.querySelector('[class*="product-title"]')
    ||document.querySelector('[class*="ProductTitle"]')
    ||document.querySelector('[class*="title--wrap"] h1')
    ||document.querySelector('[class*="title--text"]');
  if(!te){var h1s=document.querySelectorAll('h1');for(var i=0;i<h1s.length;i++){if(h1s[i].textContent.trim().length>15){te=h1s[i];break}}}
  if(te) R.title=te.textContent.trim();
}

/* T3: og:title */
if(!R.title){
  var og=document.querySelector('meta[property="og:title"]');
  if(og&&og.content) R.title=og.content.replace(/\s*[-–|].*/,'').trim();
}

/* T4: meta description fallback */
if(!R.title){
  var metas=['og:description','description','twitter:title'];
  for(var mi=0;mi<metas.length;mi++){
    var me=document.querySelector('meta[property="'+metas[mi]+'"],meta[name="'+metas[mi]+'"]');
    if(me&&me.content&&me.content.length>15){R.title=me.content.split(/[-–|]/)[0].trim();break}
  }
}

/* T5: document.title cleanup */
if(!R.title) R.title=document.title.replace(/\s*[-–|].*aliexpress.*/i,'').trim();
if(!R.title) R.title=document.title.replace(/\s*[-–|].*/,'').trim();
if(R.title&&R.title.length<10) R.title='';

/* T6: Regex in full HTML */
if(!R.title){
  var trx=html.match(/"subject"\s*:\s*"([^"]{15,300})"/);
  if(trx) R.title=trx[1];
}

/* ═══════════════════════════════════════════════
   PHASE 3 – PRICE (6 fallbacks)
   ═══════════════════════════════════════════════ */
R.price='';R.originalPrice='';

/* P1: JSON price fields */
if(D){
  var pc=D.priceComponent||D.priceModule||{};
  R.price=pc.formatedActivityPrice||pc.formatedPrice||pc.actPrice||pc.minPrice||'';
  R.originalPrice=pc.formatedPrice||pc.origPrice||pc.oriPrice||'';
  if(!R.price&&pc.minAmount) R.price=(pc.minAmount.currency||'USD')+' '+pc.minAmount.value;
  if(!R.price&&pc.discountPrice){
    R.price=typeof pc.discountPrice==='object'?(pc.discountPrice.formatedAmount||''):String(pc.discountPrice);
  }
}

/* P2: Regex in HTML for price patterns */
if(!R.price){
  var prx=[
    /"formatedActivityPrice"\s*:\s*"([^"]+)"/,
    /"formatedPrice"\s*:\s*"([^"]+)"/,
    /"actPrice"\s*:\s*"([^"]+)"/,
    /"minPrice"\s*:\s*"?(\d+\.?\d*)"?/,
    /"discountPrice"\s*:\s*\{[^}]*"formatedAmount"\s*:\s*"([^"]+)"/
  ];
  for(var i=0;i<prx.length;i++){
    var pm=html.match(prx[i]);
    if(pm){R.price=pm[1];break}
  }
}

/* P3: DOM elements with price classes */
if(!R.price){
  var pe=document.querySelector('[class*="price--current"] span, [class*="price-default--current"], [class*="product-price-current"], [class*="uniform-banner-box-price"], .product-price-value, [class*="snow-price"] [class*="current"], [class*="es--wrap--"] [class*="notranslate"]');
  if(pe&&/\d/.test(pe.textContent)) R.price=pe.textContent.trim();
}

/* P4: Any element with price pattern */
if(!R.price){
  var priceEls=document.querySelectorAll('[class*="Price"],[class*="price"],[data-price]');
  for(var pi=0;pi<priceEls.length&&!R.price;pi++){
    var ptxt=priceEls[pi].textContent.trim();
    var pm2=ptxt.match(/(\d+[.,]\d{2})/);
    if(pm2&&parseFloat(pm2[1].replace(',','.'))>0.01) R.price=ptxt;
  }
}

/* P5: meta price */
if(!R.price){
  var og2=document.querySelector('meta[property="product:price:amount"],meta[property="og:price:amount"]');
  if(og2) R.price=og2.content;
}

/* P6: Body text regex */
if(!R.price){
  var bt=document.body.innerText.substring(0,8000);
  var bpm=bt.match(/(?:EUR|USD|US\s?\$|\$|€)\s?\d+[.,]\d{2}/);
  if(bpm) R.price=bpm[0];
}

/* P-orig: DOM fallback for original price */
if(!R.originalPrice){
  var oSels=['[class*="price--original"] span','[class*="price-default--origin"] bdi','[class*="price-default--del"]','[class*="product-price-original"]','[class*="price--line-through"]'];
  for(var i=0;i<oSels.length;i++){
    var oe=document.querySelector(oSels[i]);
    if(oe){R.originalPrice=oe.textContent.trim();break}
  }
}

/* ═══════════════════════════════════════════════
   PHASE 4 – IMAGES (7 fallbacks)
   ═══════════════════════════════════════════════ */
R.images=[];var seen={};
function addI(u){
  if(!u||typeof u!=='string'||R.images.length>=20) return;
  u=u.replace(/^\/\//,'https://').split('?')[0].trim();
  if(!/^https?:\/\//.test(u)) return;
  if(u.indexOf('alicdn.com')<0&&u.indexOf('aliexpress-media')<0&&u.indexOf('ae01.')<0&&u.indexOf('ae04.')<0) return;
  var c=u.replace(/_\d+x\d+\.\w+$/,'').replace(/_\d+x\d+$/,'');
  if(c.length<30||seen[c]) return;
  if(/\.(jpg|jpeg|png|webp)/i.test(c)){
    if(/(icon|logo|flag|avatar|sprite|banner|pixel|tracking|feedback|captcha)/i.test(c)) return;
    seen[c]=1;R.images.push(c);
  }
}

/* I1: JSON imagePathList */
if(D){
  try{var ipl=(D.imageComponent||D.imageModule||{}).imagePathList;if(ipl&&ipl.forEach)ipl.forEach(function(u){addI(u)})}catch(e){}
}

/* I2: Regex imagePathList in HTML */
if(R.images.length<3){
  var irx=/"imagePathList"\s*:\s*\[([\s\S]*?)\]/g;
  var im;
  while((im=irx.exec(html))!==null){
    var urlRx=/"(https?:\/\/[^"]+)"/g;
    var um;
    while((um=urlRx.exec(im[1]))!==null) addI(um[1]);
  }
}

/* I3: Regex imageUrl fields */
if(R.images.length<3){
  var iuRx=/"imageUrl"\s*:\s*"(https?:\/\/[^"]+)"/g;
  var ium;
  while((ium=iuRx.exec(html))!==null) addI(ium[1]);
}

/* I4: DOM gallery images */
document.querySelectorAll('[class*="slider"] img,[class*="gallery"] img,[class*="image-view"] img,[class*="main-image"] img,[class*="magnifier"] img,[class*="product-image"] img').forEach(function(img){addI(img.getAttribute('data-src')||img.src)});

/* I5: All alicdn DOM images */
if(R.images.length<3){
  document.querySelectorAll('img[src*="alicdn.com"],img[data-src*="alicdn.com"],img[src*="aliexpress-media"],img[data-src*="aliexpress-media"],img[src*="ae01"],img[src*="ae04"]').forEach(function(img){addI(img.getAttribute('data-src')||img.src)});
}

/* I6: og:image */
if(R.images.length<1){
  var ogImg=document.querySelector('meta[property="og:image"]');
  if(ogImg&&ogImg.content) addI(ogImg.content);
}

/* I7: srcset and picture source */
if(R.images.length<3){
  document.querySelectorAll('source[srcset*="alicdn"],img[srcset*="alicdn"]').forEach(function(el){
    var sset=el.getAttribute('srcset')||'';
    var parts=sset.split(',');
    for(var si=0;si<parts.length;si++){var u=parts[si].trim().split(/\s/)[0];addI(u)}
  });
}

/* I8: background-image */
if(R.images.length<3){
  document.querySelectorAll('[style*="alicdn"],[style*="ae01"]').forEach(function(el){
    var bgm=(el.style.backgroundImage||'').match(/url\(["']?(https?[^"')]+)/);
    if(bgm) addI(bgm[1]);
  });
}

/* I9: Brute-force regex for alicdn URLs */
if(R.images.length<3){
  var bfRx=/(https?:\/\/[a-z0-9]+\.alicdn\.com\/[^\s"'<>]+\.(?:jpg|jpeg|png|webp))/gi;
  var bfm;
  while((bfm=bfRx.exec(html))!==null) addI(bfm[1]);
}

/* ═══════════════════════════════════════════════
   PHASE 5 – SPECS
   ═══════════════════════════════════════════════ */
R.specs=[];
if(D){
  try{(D.productPropComponent||D.specsModule||{}).props.forEach(function(a){R.specs.push({name:a.attrName||a.name||'',value:a.attrValue||a.value||''})})}catch(e){}
}
if(!R.specs.length){
  document.querySelectorAll('[class*="specification--prop"],[class*="product-property-item"]').forEach(function(p){
    var tEl=p.querySelector('[class*="specification--title"],[class*="title"],[class*="name"],[class*="label"]');
    var dEl=p.querySelector('[class*="specification--desc"],[class*="desc"],[class*="value"],[class*="detail"]');
    if(tEl&&dEl) R.specs.push({name:tEl.textContent.trim(),value:dEl.textContent.trim()});
  });
}
if(!R.specs.length){
  document.querySelectorAll('[class*="specification"] li,[class*="product-prop"] li,[class*="attr-list"] li,[class*="detail-attr"] li').forEach(function(li){
    var pts=li.textContent.split(':');
    if(pts.length>=2) R.specs.push({name:pts[0].trim(),value:pts.slice(1).join(':').trim()});
  });
}

/* ═══════════════════════════════════════════════
   PHASE 6 – VARIANTS
   ═══════════════════════════════════════════════ */
R.variants=[];
if(D){
  var sk=g(D,'skuComponent','productSKUPropertyList')||g(D,'skuModule','productSKUPropertyList');
  if(sk&&sk.forEach){
    sk.forEach(function(prop){
      var gr={name:prop.skuPropertyName||prop.skuTitle||'',options:[]};
      (prop.skuPropertyValues||[]).forEach(function(v){
        var o={name:v.propertyValueDefinitionName||v.propertyValueDisplayName||''};
        if(v.skuPropertyImagePath) o.image=v.skuPropertyImagePath.replace(/^\/\//,'https://');
        gr.options.push(o);
      });
      if(gr.options.length) R.variants.push(gr);
    });
  }
}
if(!R.variants.length){
  document.querySelectorAll('[class*="sku-item--box"],[class*="sku-property-item"],[class*="sku-prop-module"]').forEach(function(box){
    var tEl=box.querySelector('[class*="sku-item--title"],[class*="sku-title"],[class*="property-title"]');
    var raw=tEl?tEl.textContent.trim():'Option';
    var ci=raw.indexOf(':');
    var gr={name:ci>0?raw.substring(0,ci).trim():raw.replace(/:$/,''),options:[]};
    var so={};
    box.querySelectorAll('[class*="sku-item--image"] img,[class*="sku-item--selected"] img,img[title]').forEach(function(img){
      var n=img.title||img.alt||'';
      if(n&&!so[n]){so[n]=1;var o={name:n};if(img.src)o.image=img.src.replace(/^\/\//,'https://');gr.options.push(o)}
    });
    box.querySelectorAll('[class*="sku-item--text"],[class*="sku-property-text"],[class*="sku-name"]').forEach(function(el){
      var n=el.textContent.trim();if(n&&!so[n]){so[n]=1;gr.options.push({name:n})}
    });
    if(gr.options.length) R.variants.push(gr);
  });
}
if(!R.variants.length){
  document.querySelectorAll('[class*="sku-property-list"],[class*="sku-prop"]').forEach(function(list){
    var ti=list.closest('[class*="sku-property-item"]');
    var gn='';
    if(ti){var tEl=ti.querySelector('[class*="sku-title"],[class*="property-title"]');if(tEl)gn=tEl.textContent.trim().replace(/:$/,'')}
    var gr={name:gn,options:[]};
    list.querySelectorAll('[class*="sku-property-text"],[class*="sku-name"],img[title]').forEach(function(el){gr.options.push({name:el.title||el.textContent.trim()})});
    if(gr.options.length) R.variants.push(gr);
  });
}

/* ═══════════════════════════════════════════════
   PHASE 7 – Product ID
   ═══════════════════════════════════════════════ */
R.productId='';
var idM=location.href.match(/\/(\d{10,})\./)||location.href.match(/\/(\d{10,})\?/)||location.href.match(/\/item\/(\d{10,})/)||location.href.match(/\/(\d{5,})\./);
if(idM) R.productId=idM[1];
if(!R.productId&&D){R.productId=String(g(D,'productInfoComponent','id')||g(D,'actionModule','productId')||g(D,'commonModule','productId')||'')}
if(!R.productId){var idRx=html.match(/"productId"\s*:\s*"?(\d{10,})"?/);if(idRx) R.productId=idRx[1]}

/* ── Stats ── */
R.stats={images:R.images.length,specs:R.specs.length,variants:R.variants.length};

/* ═══════════════════════════════════════════════
   PHASE 8 – SEND TO PRODUCT FORGE (3 methods)
   ═══════════════════════════════════════════════ */
var FORGE='https://louisrivault1-cpu.github.io/product-forge/';
var json=JSON.stringify(R);
var enc;
try{enc=btoa(unescape(encodeURIComponent(json)))}catch(e){enc=''}

/* Also store in localStorage as fallback */
try{localStorage.setItem('pf_bookmarklet_data',json)}catch(e){}

/* Method 1: Base64 in URL hash (< 32KB) */
if(enc&&enc.length<32000){
  window.open(FORGE+'#data='+enc,'_blank');
}
/* Method 2: localStorage bridge + hash signal */
else{
  var fw=window.open(FORGE+'#fromStorage','_blank');
  /* Method 3: postMessage fallback for cross-origin */
  if(fw){
    var att=0;
    var si=setInterval(function(){
      att++;
      if(att>40){clearInterval(si);return}
      try{fw.postMessage({type:'productforge-data',product:R},'*')}catch(e){}
    },400);
    window.addEventListener('message',function hd(e){
      if(e.data&&e.data.type==='productforge-ack'){clearInterval(si);window.removeEventListener('message',hd)}
    });
  }
}

/* ═══════════════════════════════════════════════
   PHASE 9 – TOAST notification
   ═══════════════════════════════════════════════ */
var ok=R.title&&R.images.length>0;
var bg=ok?'linear-gradient(135deg,#059669,#10b981)':'linear-gradient(135deg,#d97706,#f59e0b)';
var ic=ok?'\u2705':'\u26A0\uFE0F';
var tt=ok?'Product Forge \u2014 Donn\u00e9es envoy\u00e9es !':'Product Forge \u2014 Donn\u00e9es partielles';
var td=R.stats.images+' img \u00b7 '+R.stats.specs+' specs \u00b7 '+R.stats.variants+' var';
var n=document.createElement('div');
n.style.cssText='position:fixed;top:20px;right:20px;z-index:999999;background:'+bg+';color:#fff;padding:16px 24px;border-radius:12px;font:600 14px/1.4 -apple-system,system-ui,sans-serif;box-shadow:0 8px 32px rgba(0,0,0,.3);display:flex;align-items:center;gap:10px;max-width:380px;transition:all .3s;';
n.innerHTML='<span style="font-size:22px">'+ic+'</span><div><div>'+tt+'</div><div style="font-size:12px;font-weight:400;opacity:.9;margin-top:2px">'+td+'</div></div>';
document.body.appendChild(n);
setTimeout(function(){n.style.transform='translateX(420px)';n.style.opacity='0';setTimeout(function(){try{n.remove()}catch(e){}},400)},4000);

console.log('[Product Forge v6] Scraped:',R.stats,'| Title:',R.title?R.title.substring(0,50):'EMPTY','| Price:',R.price||'EMPTY');

}catch(err){
  alert('Product Forge Error: '+err.message);
  console.error('[Product Forge v6] Fatal error:',err);
}
})();
