javascript:void(function(){
  /* AliExpress Product Scraper → Product Forge v4 */
  try {
    /* --- 0. Verify we're on an AliExpress product page --- */
    var host = location.hostname.toLowerCase();
    var isAliExpress = /(^|\.)aliexpress\.(com|us|ru)$/.test(host) || /(^|\.)ali\.(com|us|ru)$/.test(host);
    if (!isAliExpress) {
      alert('Product Forge: Ce bookmarklet fonctionne uniquement sur AliExpress.\nDomaines supportés : aliexpress.com, fr.aliexpress.com, aliexpress.us, aliexpress.ru');
      return;
    }

    var result = {source:'aliexpress',url:location.href,scrapedAt:new Date().toISOString(),domain:host};

    /* --- 1. Try embedded JSON data first (most reliable) --- */
    var jsonData = null;
    var scripts = document.querySelectorAll('script');
    for (var i = 0; i < scripts.length; i++) {
      var txt = scripts[i].textContent;
      /* __NEXT_DATA__ (newer AliExpress) */
      if (scripts[i].id === '__NEXT_DATA__') {
        try { jsonData = JSON.parse(txt); } catch(e){}
        if (jsonData && Object.keys(jsonData).length > 0) break;
        jsonData = null;
      }
      /* runParams with data containing actionModule */
      var m = txt.match(/data:\s*(\{.*?"actionModule".*?\})\s*[,;}\n]/s);
      if (m) { try { var parsed = JSON.parse(m[1]); if (Object.keys(parsed).length > 2) jsonData = parsed; } catch(e){} }
      if (jsonData) break;
      /* window.runParams with nested data */
      m = txt.match(/window\.runParams\s*=\s*(\{.*?\});/s);
      if (m) {
        try {
          var parsed = JSON.parse(m[1]);
          if (parsed.data && Object.keys(parsed.data).length > 2) jsonData = parsed;
          else if (Object.keys(parsed).length > 5) jsonData = parsed;
        } catch(e){}
      }
      if (jsonData) break;
    }

    /* --- 2. Extract Title --- */
    result.title = '';
    if (jsonData) {
      try { result.title = jsonData.props.pageProps.data.productInfoComponent.subject; } catch(e){}
      if (!result.title) try { result.title = jsonData.data.productInfoComponent.subject; } catch(e){}
      if (!result.title) try { result.title = jsonData.titleModule.subject; } catch(e){}
      if (!result.title) try { result.title = jsonData.pageModule.title; } catch(e){}
    }
    if (!result.title) {
      /* Use data-pl attribute first (most specific), then class-based, then generic h1 (skip site header) */
      var titleEl = document.querySelector('[data-pl="product-title"]')
        || document.querySelector('h1.product-title-text')
        || document.querySelector('[class*="product-title--text"]');
      if (!titleEl) {
        /* Fallback: find h1 that is NOT the site header */
        var h1s = document.querySelectorAll('h1');
        for (var j = 0; j < h1s.length; j++) {
          var h1text = h1s[j].textContent.trim();
          if (h1text.length > 10 && h1text.toLowerCase() !== 'aliexpress') {
            titleEl = h1s[j]; break;
          }
        }
      }
      if (titleEl) result.title = titleEl.textContent.trim();
    }

    /* --- 3. Extract Price --- */
    result.price = '';
    result.originalPrice = '';
    if (jsonData) {
      try {
        var p = jsonData.props.pageProps.data.priceComponent;
        result.price = p.formatedActivityPrice || p.formatedPrice || p.minPrice || '';
        result.originalPrice = p.formatedPrice || p.origPrice || '';
      } catch(e){}
      if (!result.price) try {
        var pm = jsonData.priceModule;
        result.price = pm.formatedActivityPrice || pm.formatedPrice || (pm.minAmount && (pm.minAmount.currency+' '+pm.minAmount.value)) || '';
        result.originalPrice = pm.formatedPrice || '';
      } catch(e){}
    }
    if (!result.price) {
      /* New AliExpress (2024+) class patterns */
      var priceEl = document.querySelector('[class*="price-default--current"]')
        || document.querySelector('[class*="product-price-current"]')
        || document.querySelector('[class*="uniform-banner-box-price"]')
        || document.querySelector('.product-price-value');
      if (priceEl) result.price = priceEl.textContent.trim();
    }
    if (!result.originalPrice) {
      var origEl = document.querySelector('[class*="price-default--origin"] bdi')
        || document.querySelector('[class*="price-default--del"]')
        || document.querySelector('[class*="product-price-original"]');
      if (origEl) result.originalPrice = origEl.textContent.trim();
    }

    /* --- 4. Extract Images (alicdn.com + aliexpress-media.com CDN URLs, max 20) --- */
    result.images = [];
    var seen = {};
    function addImg(url) {
      if (!url || result.images.length >= 20) return;
      url = url.replace(/^\/\//, 'https://');
      if (url.startsWith('http') && (url.indexOf('alicdn.com') !== -1 || url.indexOf('aliexpress-media.com') !== -1)) {
        var clean = url.replace(/_\d+x\d+\.\w+$/, '').split('?')[0];
        if (!seen[clean]) { seen[clean] = 1; result.images.push(clean); }
      }
    }
    if (jsonData) {
      try { jsonData.props.pageProps.data.imageComponent.imagePathList.forEach(function(u){ addImg(u); }); } catch(e){}
      try { jsonData.imageModule.imagePathList.forEach(function(u){ addImg(u); }); } catch(e){}
    }
    document.querySelectorAll('img[src*="alicdn.com"], img[data-src*="alicdn.com"], img[src*="aliexpress-media.com"], img[data-src*="aliexpress-media.com"]').forEach(function(img){
      addImg(img.getAttribute('data-src') || img.src);
    });
    document.querySelectorAll('[class*="slider"] img, [class*="gallery"] img, [class*="image-view"] img').forEach(function(img){
      addImg(img.getAttribute('data-src') || img.src);
    });

    /* --- 5. Extract Specs --- */
    result.specs = [];
    if (jsonData) {
      try { jsonData.props.pageProps.data.productPropComponent.props.forEach(function(a){ result.specs.push({name:a.attrName,value:a.attrValue}); }); } catch(e){}
      if (!result.specs.length) try { jsonData.specsModule.props.forEach(function(a){ result.specs.push({name:a.attrName,value:a.attrValue}); }); } catch(e){}
    }
    if (!result.specs.length) {
      /* New AliExpress (2024+): specification--prop / specification--title / specification--desc */
      document.querySelectorAll('[class*="specification--prop"]').forEach(function(prop){
        var title = prop.querySelector('[class*="specification--title"]');
        var desc = prop.querySelector('[class*="specification--desc"]');
        if (title && desc) result.specs.push({name:title.textContent.trim(), value:desc.textContent.trim()});
      });
    }
    if (!result.specs.length) {
      /* Old patterns */
      document.querySelectorAll('[class*="specification"] li, [class*="product-prop"] li, [class*="attr-list"] li').forEach(function(li){
        var parts = li.textContent.split(':');
        if (parts.length >= 2) result.specs.push({name:parts[0].trim(),value:parts.slice(1).join(':').trim()});
      });
    }

    /* --- 6. Extract Variants --- */
    result.variants = [];
    if (jsonData) {
      try {
        var skuInfo = jsonData.props.pageProps.data.skuComponent;
        if (skuInfo && skuInfo.productSKUPropertyList) {
          skuInfo.productSKUPropertyList.forEach(function(prop){
            var group = {name: prop.skuPropertyName || prop.skuTitle || '', options: []};
            if (prop.skuPropertyValues) {
              prop.skuPropertyValues.forEach(function(v){
                var opt = {name: v.propertyValueDefinitionName || v.propertyValueDisplayName || v.skuPropertyValueShowOrder || ''};
                if (v.skuPropertyImagePath) opt.image = v.skuPropertyImagePath.replace(/^\/\//, 'https://');
                if (v.skuPropertyImageSummPath) opt.thumb = v.skuPropertyImageSummPath.replace(/^\/\//, 'https://');
                group.options.push(opt);
              });
            }
            result.variants.push(group);
          });
        }
      } catch(e){}
      if (!result.variants.length) try {
        var skuMod = jsonData.skuModule;
        if (skuMod && skuMod.productSKUPropertyList) {
          skuMod.productSKUPropertyList.forEach(function(prop){
            var group = {name: prop.skuPropertyName || '', options: []};
            (prop.skuPropertyValues||[]).forEach(function(v){
              var opt = {name: v.propertyValueDefinitionName || v.propertyValueDisplayName || ''};
              if (v.skuPropertyImagePath) opt.image = v.skuPropertyImagePath.replace(/^\/\//, 'https://');
              group.options.push(opt);
            });
            result.variants.push(group);
          });
        }
      } catch(e){}
    }
    if (!result.variants.length) {
      /* New AliExpress (2024+): sku-item--box contains title + image list */
      document.querySelectorAll('[class*="sku-item--box"]').forEach(function(box){
        var titleEl = box.querySelector('[class*="sku-item--title"]');
        var rawTitle = titleEl ? titleEl.textContent.trim() : 'Option';
        /* Extract group name: "Color: Global Black" → "Color" */
        var colonIdx = rawTitle.indexOf(':');
        var groupName = colonIdx > 0 ? rawTitle.substring(0, colonIdx).trim() : rawTitle;
        var group = {name: groupName, options: []};
        var seenOpts = {};
        /* Get variant options from images (title or alt attribute) */
        box.querySelectorAll('[class*="sku-item--image"] img, [class*="sku-item--selected"] img').forEach(function(img){
          var name = img.title || img.alt || '';
          if (name && !seenOpts[name]) {
            seenOpts[name] = 1;
            var opt = {name: name};
            if (img.src) opt.image = img.src.replace(/^\/\//, 'https://');
            group.options.push(opt);
          }
        });
        /* Also check text-based SKU values */
        box.querySelectorAll('[class*="sku-item--text"]').forEach(function(el){
          var name = el.textContent.trim();
          if (name && !seenOpts[name]) { seenOpts[name] = 1; group.options.push({name: name}); }
        });
        if (group.options.length) result.variants.push(group);
      });
    }
    if (!result.variants.length) {
      /* Legacy patterns */
      document.querySelectorAll('[class*="sku-property-list"], [class*="sku-prop"]').forEach(function(list){
        var titleEl = list.closest('[class*="sku-property-item"]');
        var groupName = '';
        if (titleEl) {
          var t = titleEl.querySelector('[class*="sku-title"], [class*="property-title"]');
          if (t) groupName = t.textContent.trim().replace(/:$/, '');
        }
        var group = {name: groupName, options: []};
        list.querySelectorAll('[class*="sku-property-text"], [class*="sku-name"], img[title]').forEach(function(el){
          group.options.push({name: el.title || el.textContent.trim()});
        });
        if (group.options.length) result.variants.push(group);
      });
    }

    /* --- 7. Extract product ID --- */
    result.productId = '';
    var idMatch = location.href.match(/\/(\d{5,})\./);
    if (idMatch) result.productId = idMatch[1];
    if (!result.productId && jsonData) {
      try { result.productId = String(jsonData.props.pageProps.data.productInfoComponent.id); } catch(e){}
      if (!result.productId) try { result.productId = String(jsonData.actionModule.productId); } catch(e){}
    }

    /* --- 8. Stats --- */
    result.stats = {images: result.images.length, specs: result.specs.length, variants: result.variants.length};

    /* --- 9. Send to Product Forge --- */
    var FORGE_URL = 'https://louisrivault1-cpu.github.io/product-forge/';
    var jsonStr = JSON.stringify(result);
    var encoded = btoa(unescape(encodeURIComponent(jsonStr)));

    /* Check if data fits in URL (max ~2MB for most browsers, but be safe at 32KB) */
    if (encoded.length < 32000) {
      /* Method A: Open Product Forge with data in URL hash */
      window.open(FORGE_URL + '#data=' + encoded, '_blank');
    } else {
      /* Method B: For large data, open first then postMessage */
      var forgeWindow = window.open(FORGE_URL, '_blank');
      var attempts = 0;
      var sendInterval = setInterval(function(){
        attempts++;
        if (attempts > 30) { clearInterval(sendInterval); return; }
        try {
          forgeWindow.postMessage({type:'productforge-data', product: result}, '*');
        } catch(e){}
      }, 500);
      /* Stop sending after successful handshake or timeout */
      window.addEventListener('message', function handler(e){
        if (e.data && e.data.type === 'productforge-ack') {
          clearInterval(sendInterval);
          window.removeEventListener('message', handler);
        }
      });
    }

    /* Quick confirmation toast on the AliExpress page */
    var hasData = result.title && result.images.length > 0;
    var toastBg = hasData ? 'linear-gradient(135deg,#059669,#10b981)' : 'linear-gradient(135deg,#d97706,#f59e0b)';
    var toastIcon = hasData ? '✅' : '⚠️';
    var toastTitle = hasData ? 'Product Forge — Données envoyées !' : 'Product Forge — Données partielles';
    var toastDetail = result.stats.images+' images · '+result.stats.specs+' specs · '+result.stats.variants+' variantes';
    var notif = document.createElement('div');
    notif.style.cssText = 'position:fixed;top:20px;right:20px;z-index:999999;background:'+toastBg+';color:#fff;padding:16px 24px;border-radius:12px;font-family:-apple-system,sans-serif;font-size:14px;font-weight:600;box-shadow:0 8px 32px rgba(0,0,0,0.3);display:flex;align-items:center;gap:10px;animation:pfSlideIn 0.3s ease-out;max-width:360px;';
    notif.innerHTML = '<span style="font-size:22px;">'+toastIcon+'</span><div><div>'+toastTitle+'</div><div style="font-size:12px;font-weight:400;opacity:0.9;margin-top:2px;">'+toastDetail+'</div></div>';
    var style = document.createElement('style');
    style.textContent = '@keyframes pfSlideIn{from{transform:translateX(100px);opacity:0}to{transform:translateX(0);opacity:1}}';
    document.head.appendChild(style);
    document.body.appendChild(notif);
    setTimeout(function(){ notif.style.transition='all 0.3s'; notif.style.transform='translateX(100px)'; notif.style.opacity='0'; setTimeout(function(){ notif.remove(); style.remove(); }, 300); }, 4000);

    console.log('[Product Forge] Scraped & sent:', result.stats);

  } catch(err) {
    alert('Product Forge Scraper Error: ' + err.message);
    console.error(err);
  }
}());
