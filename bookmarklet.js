javascript:void(function(){
  /* AliExpress Product Scraper → Product Forge v2 */
  try {
    var result = {source:'aliexpress',url:location.href,scrapedAt:new Date().toISOString()};

    /* --- 1. Try embedded JSON data first (most reliable) --- */
    var jsonData = null;
    var scripts = document.querySelectorAll('script');
    for (var i = 0; i < scripts.length; i++) {
      var txt = scripts[i].textContent;
      /* runParams pattern */
      var m = txt.match(/data:\s*(\{.*?"actionModule".*?\})\s*[,;}\n]/s);
      if (m) { try { jsonData = JSON.parse(m[1]); } catch(e){} }
      if (jsonData) break;
      /* window.runParams */
      m = txt.match(/window\.runParams\s*=\s*(\{.*?\});/s);
      if (m) { try { jsonData = JSON.parse(m[1]); } catch(e){} }
      if (jsonData) break;
      /* __NEXT_DATA__ (newer AliExpress) */
      if (scripts[i].id === '__NEXT_DATA__') {
        try { jsonData = JSON.parse(txt); } catch(e){}
        if (jsonData) break;
      }
    }

    /* --- 2. Extract Title --- */
    result.title = '';
    if (jsonData) {
      try { result.title = jsonData.props.pageProps.data.productInfoComponent.subject; } catch(e){}
      if (!result.title) try { result.title = jsonData.titleModule.subject; } catch(e){}
      if (!result.title) try { result.title = jsonData.pageModule.title; } catch(e){}
    }
    if (!result.title) {
      var titleEl = document.querySelector('h1[data-pl="product-title"], h1.product-title-text, h1');
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
        result.price = pm.formatedActivityPrice || pm.formatedPrice || pm.minAmount && (pm.minAmount.currency+' '+pm.minAmount.value) || '';
        result.originalPrice = pm.formatedPrice || '';
      } catch(e){}
    }
    if (!result.price) {
      var priceEl = document.querySelector('[class*="product-price-current"], [class*="uniform-banner-box-price"], .product-price-value');
      if (priceEl) result.price = priceEl.textContent.trim();
    }

    /* --- 4. Extract Images (alicdn.com CDN URLs, max 20) --- */
    result.images = [];
    var seen = {};
    function addImg(url) {
      if (!url || result.images.length >= 20) return;
      url = url.replace(/^\/\//, 'https://');
      if (url.startsWith('http') && url.indexOf('alicdn.com') !== -1) {
        var clean = url.replace(/_\d+x\d+\.\w+$/, '').split('?')[0];
        if (!seen[clean]) { seen[clean] = 1; result.images.push(clean); }
      }
    }
    if (jsonData) {
      try { jsonData.props.pageProps.data.imageComponent.imagePathList.forEach(function(u){ addImg(u); }); } catch(e){}
      try { jsonData.imageModule.imagePathList.forEach(function(u){ addImg(u); }); } catch(e){}
    }
    document.querySelectorAll('img[src*="alicdn.com"], img[data-src*="alicdn.com"]').forEach(function(img){
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
    var encoded = btoa(encodeURIComponent(jsonStr));

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
    var notif = document.createElement('div');
    notif.style.cssText = 'position:fixed;top:20px;right:20px;z-index:999999;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;padding:16px 24px;border-radius:12px;font-family:-apple-system,sans-serif;font-size:14px;font-weight:600;box-shadow:0 8px 32px rgba(99,102,241,0.4);display:flex;align-items:center;gap:10px;animation:pfSlideIn 0.3s ease-out;';
    notif.innerHTML = '<span style="font-size:20px;">📦</span><div><div>Product Forge</div><div style="font-size:12px;font-weight:400;opacity:0.9;">'+result.stats.images+' images · '+result.stats.specs+' specs · Envoyé !</div></div>';
    var style = document.createElement('style');
    style.textContent = '@keyframes pfSlideIn{from{transform:translateX(100px);opacity:0}to{transform:translateX(0);opacity:1}}';
    document.head.appendChild(style);
    document.body.appendChild(notif);
    setTimeout(function(){ notif.style.transition='all 0.3s'; notif.style.transform='translateX(100px)'; notif.style.opacity='0'; setTimeout(function(){ notif.remove(); style.remove(); }, 300); }, 3000);

    console.log('[Product Forge] Scraped & sent:', result.stats);

  } catch(err) {
    alert('Product Forge Scraper Error: ' + err.message);
    console.error(err);
  }
}());