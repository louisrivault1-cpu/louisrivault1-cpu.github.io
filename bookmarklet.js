/* Product Forge – AliExpress Scraper v5 */
(function(){
try{
var h=location.hostname.toLowerCase();
if(!/aliexpress/i.test(h)){alert('Product Forge : ouvrez une page produit AliExpress.');return}

var R={source:'aliexpress',url:location.href,domain:h,scrapedAt:new Date().toISOString()};

/* ── Embedded JSON (most reliable) ── */
var J=null;
var el=document.getElementById('__NEXT_DATA__');
if(el){try{J=JSON.parse(el.textContent)}catch(e){}}
if(!J){
  var ss=document.querySelectorAll('script');
  for(var i=0;i<ss.length;i++){
    var t=ss[i].textContent;
    if(!t||t.length<200) continue;
    var m=t.match(/window\.runParams\s*=\s*(\{[\s\S]{50,}?\});/);
    if(m){try{var p=JSON.parse(m[1]);if(p.data||Object.keys(p).length>5)J=p}catch(e){}}
    if(J)break;
    m=t.match(/data:\s*(\{[\s\S]*?"actionModule"[\s\S]*?\})\s*[,;\n]/);
    if(m){try{var p=JSON.parse(m[1]);if(Object.keys(p).length>2)J=p}catch(e){}}
    if(J)break;
  }
}
/* Normalise: some layouts nest under .data */
var D=J;
if(J&&J.props&&J.props.pageProps&&J.props.pageProps.data) D=J.props.pageProps.data;
else if(J&&J.data&&typeof J.data==='object'&&Object.keys(J.data).length>3) D=J.data;

/* helper: deep safe access */
function g(o){for(var i=1;i<arguments.length;i++){if(!o)return '';o=o[arguments[i]]}return o||''}

/* ── Title ── */
R.title='';
if(D){
  R.title=g(D,'productInfoComponent','subject')||g(D,'titleModule','subject')||g(D,'pageModule','title')||'';
}
if(!R.title){
  var te=document.querySelector('[data-pl="product-title"]')||document.querySelector('h1[class*="title"]')||document.querySelector('[class*="product-title"]');
  if(!te){var h1s=document.querySelectorAll('h1');for(var i=0;i<h1s.length;i++){if(h1s[i].textContent.trim().length>10){te=h1s[i];break}}}
  if(te) R.title=te.textContent.trim();
}
if(!R.title){
  var og=document.querySelector('meta[property="og:title"]');
  if(og) R.title=og.content||'';
}
if(!R.title){
  var metas=['og:description','description','twitter:title'];
  for(var mi=0;mi<metas.length;mi++){
    var me=document.querySelector('meta[property="'+metas[mi]+'"],meta[name="'+metas[mi]+'"]');
    if(me&&me.content&&me.content.length>15){R.title=me.content.split(/[-–|]/)[0].trim();break}
  }
}
if(!R.title) R.title=document.title.replace(/\s*[-–|].*aliexpress.*/i,'').trim();
if(!R.title) R.title=document.title.replace(/\s*[-–|].*/,'').trim();

/* ── Price ── */
R.price='';R.originalPrice='';
if(D){
  var pc=D.priceComponent||D.priceModule||{};
  R.price=pc.formatedActivityPrice||pc.formatedPrice||pc.minPrice||'';
  R.originalPrice=pc.formatedPrice||pc.origPrice||'';
  if(pc.minAmount) R.price=R.price||(pc.minAmount.currency+' '+pc.minAmount.value);
}
if(!R.price){
  var pe=document.querySelector('[class*="price--current"] span, [class*="price-default--current"], [class*="product-price-current"], [class*="uniform-banner-box-price"], .product-price-value');
  if(pe) R.price=pe.textContent.trim();
}
if(!R.originalPrice){
  var oe=document.querySelector('[class*="price--original"] span, [class*="price-default--origin"] bdi, [class*="price-default--del"], [class*="product-price-original"]');
  if(oe) R.originalPrice=oe.textContent.trim();
}
/* Regex fallback for price */
if(!R.price){
  var body=document.body.innerText.substring(0,8000);
  var pm=body.match(/(?:EUR|USD|US\s?\$|\$|€)\s*\d+[.,]\d{2}/);
  if(pm) R.price=pm[0];
}
/* Additional price fallbacks */
if(!R.price){
  var priceEls=document.querySelectorAll('[class*="Price"],[class*="price"],[data-price]');
  for(var pi=0;pi<priceEls.length&&!R.price;pi++){
    var ptxt=priceEls[pi].textContent.trim();
    var pm2=ptxt.match(/(\d+[.,]\d{2})/);
    if(pm2&&parseFloat(pm2[1].replace(',','.'))>0.01) R.price=ptxt;
  }
}
if(!R.price){
  var og2=document.querySelector('meta[property="product:price:amount"],meta[property="og:price:amount"]');
  if(og2) R.price=og2.content;
}

/* ── Images ── */
R.images=[];var seen={};
function addI(u){
  if(!u||R.images.length>=20)return;
  u=u.replace(/^\/\//,'https://');
  if(!/^https?/.test(u))return;
  if(u.indexOf('alicdn.com')<0&&u.indexOf('aliexpress-media.com')<0&&u.indexOf('ae01.')<0&&u.indexOf('ae04.')<0)return;
  var c=u.replace(/_\d+x\d+\.\w+$/,'').split('?')[0];
  if(c.length<30||seen[c])return;
  seen[c]=1;R.images.push(c);
}
if(D){
  try{(D.imageComponent||D.imageModule||{}).imagePathList.forEach(function(u){addI(u)})}catch(e){}
}
document.querySelectorAll('[class*="slider"] img,[class*="gallery"] img,[class*="image-view"] img,[class*="main-image"] img').forEach(function(img){addI(img.getAttribute('data-src')||img.src)});
if(R.images.length<3){
  document.querySelectorAll('img[src*="alicdn.com"],img[data-src*="alicdn.com"],img[src*="aliexpress-media"],img[data-src*="aliexpress-media"],img[src*="ae01"],img[src*="ae04"]').forEach(function(img){addI(img.getAttribute('data-src')||img.src)});
}
/* Fallback: og:image */
if(R.images.length===0){
  var ogImg=document.querySelector('meta[property="og:image"]');
  if(ogImg&&ogImg.content) addI(ogImg.content);
}
/* Fallback: srcset and picture source */
if(R.images.length<3){
  document.querySelectorAll('source[srcset*="alicdn"],img[srcset*="alicdn"]').forEach(function(el){
    var ss=el.getAttribute('srcset')||'';
    var parts=ss.split(',');
    for(var si=0;si<parts.length;si++){var u=parts[si].trim().split(/\s/)[0];addI(u)}
  });
}
/* Fallback: background-image */
if(R.images.length<3){
  document.querySelectorAll('[style*="alicdn"],[style*="ae01"]').forEach(function(el){
    var bgm=(el.style.backgroundImage||'').match(/url\(["']?(https?[^"')]+)/);
    if(bgm) addI(bgm[1]);
  });
}

/* ── Specs ── */
R.specs=[];
if(D){
  try{(D.productPropComponent||D.specsModule||{}).props.forEach(function(a){R.specs.push({name:a.attrName,value:a.attrValue})})}catch(e){}
}
if(!R.specs.length){
  document.querySelectorAll('[class*="specification--prop"]').forEach(function(p){
    var t=p.querySelector('[class*="specification--title"]'),d=p.querySelector('[class*="specification--desc"]');
    if(t&&d) R.specs.push({name:t.textContent.trim(),value:d.textContent.trim()});
  });
}
if(!R.specs.length){
  document.querySelectorAll('[class*="specification"] li,[class*="product-prop"] li,[class*="attr-list"] li').forEach(function(li){
    var pts=li.textContent.split(':');
    if(pts.length>=2)R.specs.push({name:pts[0].trim(),value:pts.slice(1).join(':').trim()});
  });
}

/* ── Variants ── */
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
  document.querySelectorAll('[class*="sku-item--box"]').forEach(function(box){
    var te=box.querySelector('[class*="sku-item--title"]');
    var raw=te?te.textContent.trim():'Option';
    var ci=raw.indexOf(':');
    var gr={name:ci>0?raw.substring(0,ci).trim():raw,options:[]};
    var so={};
    box.querySelectorAll('[class*="sku-item--image"] img,[class*="sku-item--selected"] img').forEach(function(img){
      var n=img.title||img.alt||'';
      if(n&&!so[n]){so[n]=1;var o={name:n};if(img.src)o.image=img.src.replace(/^\/\//,'https://');gr.options.push(o)}
    });
    box.querySelectorAll('[class*="sku-item--text"]').forEach(function(el){
      var n=el.textContent.trim();if(n&&!so[n]){so[n]=1;gr.options.push({name:n})}
    });
    if(gr.options.length) R.variants.push(gr);
  });
}
if(!R.variants.length){
  document.querySelectorAll('[class*="sku-property-list"],[class*="sku-prop"]').forEach(function(list){
    var ti=list.closest('[class*="sku-property-item"]');
    var gn='';
    if(ti){var t=ti.querySelector('[class*="sku-title"],[class*="property-title"]');if(t)gn=t.textContent.trim().replace(/:$/,'')}
    var gr={name:gn,options:[]};
    list.querySelectorAll('[class*="sku-property-text"],[class*="sku-name"],img[title]').forEach(function(el){gr.options.push({name:el.title||el.textContent.trim()})});
    if(gr.options.length) R.variants.push(gr);
  });
}

/* ── Product ID ── */
R.productId='';
var idM=location.href.match(/\/(\d{5,})\./);
if(idM) R.productId=idM[1];
if(!R.productId&&D){R.productId=String(g(D,'productInfoComponent','id')||g(D,'actionModule','productId')||'')}

/* ── Stats ── */
R.stats={images:R.images.length,specs:R.specs.length,variants:R.variants.length};

/* ── Send to Product Forge ── */
var FORGE='https://louisrivault1-cpu.github.io/product-forge/';
var json=JSON.stringify(R);
var enc=btoa(unescape(encodeURIComponent(json)));

/* Also store in localStorage as fallback (same origin can read it) */
try{localStorage.setItem('pf_incoming_data',json)}catch(e){}

if(enc.length<32000){
  window.open(FORGE+'#data='+enc,'_blank');
}else{
  /* Data too big for hash — use postMessage + localStorage fallback */
  var fw=window.open(FORGE,'_blank');
  var att=0;
  var si=setInterval(function(){att++;if(att>30){clearInterval(si);return}try{fw.postMessage({type:'productforge-data',product:R},'*')}catch(e){}},500);
  window.addEventListener('message',function hd(e){if(e.data&&e.data.type==='productforge-ack'){clearInterval(si);window.removeEventListener('message',hd)}});
}

/* ── Toast ── */
var ok=R.title&&R.images.length>0;
var bg=ok?'linear-gradient(135deg,#059669,#10b981)':'linear-gradient(135deg,#d97706,#f59e0b)';
var ic=ok?'\u2705':'\u26A0\uFE0F';
var tt=ok?'Product Forge \u2014 Donn\u00e9es envoy\u00e9es !':'Product Forge \u2014 Donn\u00e9es partielles';
var td=R.stats.images+' img \u00b7 '+R.stats.specs+' specs \u00b7 '+R.stats.variants+' var';
var n=document.createElement('div');
n.style.cssText='position:fixed;top:20px;right:20px;z-index:999999;background:'+bg+';color:#fff;padding:16px 24px;border-radius:12px;font:600 14px -apple-system,sans-serif;box-shadow:0 8px 32px rgba(0,0,0,.3);display:flex;align-items:center;gap:10px;max-width:360px;transition:all .3s;';
n.innerHTML='<span style="font-size:22px">'+ic+'</span><div><div>'+tt+'</div><div style="font-size:12px;font-weight:400;opacity:.9;margin-top:2px">'+td+'</div></div>';
document.body.appendChild(n);
setTimeout(function(){n.style.transform='translateX(120px)';n.style.opacity='0';setTimeout(function(){n.remove()},400)},4000);

console.log('[Product Forge v5] Scraped:',R.stats);

}catch(err){alert('Product Forge Error: '+err.message);console.error(err)}
})();
