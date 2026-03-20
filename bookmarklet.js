javascript:void(function(){
  /* AliExpress Product Scraper Bookmarklet for Product Forge */
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
      /* Try multiple JSON paths */
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
      /* Clean URL */
      url = url.replace(/^\/\//, 'https://');
      if (url.startsWith('http') && url.indexOf('alicdn.com') !== -1) {
        /* Remove size suffix to get original */
        var clean = url.replace(/_\d+x\d+\.\w+$/, '').split('?')[0];
        if (!seen[clean]) { seen[clean] = 1; result.images.push(clean); }
      }
    }
    /* From JSON */
    if (jsonData) {
      try {
        var imgs = jsonData.props.pageProps.data.imageComponent.imagePathList;
        imgs.forEach(function(u){ addImg(u); });
      } catch(e){}
      try {
        var imgs2 = jsonData.imageModule.imagePathList;
        imgs2.forEach(function(u){ addImg(u); });
      } catch(e){}
    }
    /* From DOM */
    document.querySelectorAll('img[src*="alicdn.com"], img[data-src*="alicdn.com"]').forEach(function(img){
      addImg(img.getAttribute('data-src') || img.src);
    });
    /* From gallery thumbnails */
    document.querySelectorAll('[class*="slider"] img, [class*="gallery"] img, [class*="image-view"] img').forEach(function(img){
      addImg(img.getAttribute('data-src') || img.src);
    });

    /* --- 5. Extract Specs (attrName / attrValue) --- */
    result.specs = [];
    if (jsonData) {
      try {
        var attrs = jsonData.props.pageProps.data.productPropComponent.props;
        attrs.forEach(function(a){ result.specs.push({name:a.attrName,value:a.attrValue}); });
      } catch(e){}
      if (!result.specs.length) try {
        var attrs2 = jsonData.specsModule.props;
        attrs2.forEach(function(a){ result.specs.push({name:a.attrName,value:a.attrValue}); });
      } catch(e){}
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
    /* DOM fallback for variants */
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

    /* --- 9. Build popup UI --- */
    var jsonStr = JSON.stringify(result, null, 2);
    var overlay = document.createElement('div');
    overlay.id = 'pf-scraper-overlay';
    overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;z-index:999999;background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;';

    var modal = document.createElement('div');
    modal.style.cssText = 'background:#fff;border-radius:16px;max-width:700px;width:90%;max-height:85vh;display:flex;flex-direction:column;box-shadow:0 25px 60px rgba(0,0,0,0.3);';

    /* Header */
    var header = document.createElement('div');
    header.style.cssText = 'padding:20px 24px;border-bottom:1px solid #e5e7eb;display:flex;align-items:center;justify-content:space-between;';
    header.innerHTML = '<div style="display:flex;align-items:center;gap:10px;"><span style="font-size:24px;">📦</span><div><div style="font-weight:700;font-size:16px;color:#111;">Product Forge Scraper</div><div style="font-size:13px;color:#6b7280;">'+result.stats.images+' images · '+result.stats.specs+' specs · '+result.stats.variants+' variant groups</div></div></div>';

    var closeBtn = document.createElement('button');
    closeBtn.textContent = '✕';
    closeBtn.style.cssText = 'background:none;border:none;font-size:20px;cursor:pointer;color:#9ca3af;padding:4px 8px;';
    closeBtn.onclick = function(){ overlay.remove(); };
    header.appendChild(closeBtn);
    modal.appendChild(header);

    /* Title preview */
    var preview = document.createElement('div');
    preview.style.cssText = 'padding:12px 24px;background:#f9fafb;border-bottom:1px solid #e5e7eb;';
    preview.innerHTML = '<div style="font-size:13px;color:#6b7280;margin-bottom:4px;">Product</div><div style="font-size:14px;font-weight:600;color:#111;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">'+((result.title||'No title found').replace(/</g,'&lt;'))+'</div><div style="font-size:14px;color:#ef4444;font-weight:700;margin-top:4px;">'+(result.price||'Price not found')+'</div>';
    modal.appendChild(preview);

    /* JSON area */
    var body = document.createElement('div');
    body.style.cssText = 'flex:1;overflow:auto;padding:16px 24px;';
    var pre = document.createElement('pre');
    pre.style.cssText = 'margin:0;font-size:12px;line-height:1.5;color:#374151;white-space:pre-wrap;word-break:break-all;background:#f3f4f6;padding:16px;border-radius:8px;max-height:300px;overflow:auto;';
    pre.textContent = jsonStr;
    body.appendChild(pre);
    modal.appendChild(body);

    /* Footer with buttons */
    var footer = document.createElement('div');
    footer.style.cssText = 'padding:16px 24px;border-top:1px solid #e5e7eb;display:flex;gap:10px;flex-wrap:wrap;';

    function makeBtn(text, color, onClick) {
      var b = document.createElement('button');
      b.textContent = text;
      b.style.cssText = 'padding:10px 20px;border:none;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;color:#fff;background:'+color+';flex:1;min-width:140px;';
      b.onmouseover = function(){ b.style.opacity='0.9'; };
      b.onmouseout = function(){ b.style.opacity='1'; };
      b.onclick = onClick;
      return b;
    }

    /* Copy button */
    footer.appendChild(makeBtn('📋 Copy JSON', '#2563eb', function(){
      navigator.clipboard.writeText(jsonStr).then(function(){
        this.textContent = '✅ Copied!';
        var btn = this;
        setTimeout(function(){ btn.textContent = '📋 Copy JSON'; }, 2000);
      }.bind(this)).catch(function(){ prompt('Copy JSON:', jsonStr); });
    }));

    /* Send to Apify button */
    footer.appendChild(makeBtn('🚀 Send to Apify', '#7c3aed', function(){
      var btn = this;
      btn.textContent = '⏳ Sending...';
      btn.style.opacity = '0.7';
      var apiToken = prompt('Enter your Apify API token (find it at console.apify.com/account#/integrations):');
      if (!apiToken) { btn.textContent = '🚀 Send to Apify'; btn.style.opacity = '1'; return; }
      fetch('https://api.apify.com/v2/actor-tasks/painless_rachis~product-forge-scraper/runs?token=' + apiToken, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({productData: result})
      }).then(function(r){ return r.json(); }).then(function(d){
        btn.textContent = '✅ Sent!';
        btn.style.background = '#059669';
        setTimeout(function(){ btn.textContent = '🚀 Send to Apify'; btn.style.background = '#7c3aed'; }, 3000);
      }).catch(function(e){
        btn.textContent = '❌ Error';
        btn.style.background = '#dc2626';
        setTimeout(function(){ btn.textContent = '🚀 Send to Apify'; btn.style.background = '#7c3aed'; }, 3000);
        console.error('Apify send error:', e);
      });
    }));

    /* Download JSON */
    footer.appendChild(makeBtn('💾 Download', '#059669', function(){
      var blob = new Blob([jsonStr], {type:'application/json'});
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'product-'+(result.productId||'data')+'.json';
      a.click();
    }));

    modal.appendChild(footer);
    overlay.appendChild(modal);

    /* Close on overlay click */
    overlay.addEventListener('click', function(e){ if(e.target===overlay) overlay.remove(); });

    /* Remove previous instance */
    var old = document.getElementById('pf-scraper-overlay');
    if (old) old.remove();

    document.body.appendChild(overlay);

    /* Auto-copy */
    navigator.clipboard.writeText(jsonStr).catch(function(){});

    console.log('[Product Forge Scraper]', result);

  } catch(err) {
    alert('Product Forge Scraper Error: ' + err.message);
    console.error(err);
  }
}());