var camelHump = function(url, document)
{
  //this.document = document;
  this.content_data = "";
  ctx = this;
  
  chrome.tabs.getSelected(null, function(tab) {
    chrome.tabs.sendRequest(tab.id, {c3_action: "get_doc", c3_ctx: ctx}, function(response) {
      ctx = response.c3_ctx;
      ctx.content_data = response.c3_data;
      ctx.tab = tab;
      camelizer.finishContextFromDocument();
    });
  });
  
  this.content_url = url;
  this.retailer = null;
  this.asin = null;
  this.domain = null;
  this.locale = null;
  this.request_url = null;
  this.product_data = null;
  this.chart_image = null;
  this.tab = null;
  
  this.isValid = function() {
    return(this.request_url);
  };
  
  this.hasImage = function() {
    return(this.chart_image != null);
  };
  
  this.consumeProductLookupResult = function(json_text) {
    this.product_data = JSON.parse(json_text);
  };
  
  this.changeImageDimensions = function(width, height) {
    url = this.product_data.chart_url.replace(/h=[0-9]*/, "h=" + String(height));
    url = url.replace(/w=[0-9]*/, "w=" + String(width));
    should_load = this.chart_image.src != url;
    
    if (should_load)
    {
      this.chart_image.src = url;
      this.product_data.chart_url = url;
    }
    
    return(should_load);
  };
  
  this.detectRetailer = function()
  {
    if (this.isAmazon())
      this.runAmazon();
    else if (this.isSafari())
      this.runSafari();
    else if (this.isBestbuy())
      this.runBestbuy();
    else if (this.isNewegg())
      this.runNewegg();
    else if (this.isBackcountry())
      this.runBackcountry();
    else if (this.isOverstock())
      this.runOverstock();
    else if (this.isZzounds())
      this.runZzounds();
    else
      return(null);
    
    var camel_url = "http://" + this.domain + "/chromelizer";
    
    if (this.asin)
      camel_url += "/" + this.asin;
    
    camel_url += "?locale=" + this.locale + "&ver=" + String(camelizer.version) + "&url=" + escape(this.content_url);
    camel_url += "&h=" + String(camelizer.getDesiredChartHeight());
    camel_url += "&w=" + String(camelizer.getDesiredChartWidth());

    camel_url = "http://localhost:8081/?ean=" + this.asin
    
    return(camel_url);
  };
  
  this.isAmazon = function()
  {
    url = this.content_url;
    return(/http:\/\/.*amazon\.com\/.*/.test(url) || /http:\/\/.*amazon\.co\.uk\/.*/.test(url) || /http:\/\/.*amazon\.fr\/.*/.test(url) || /http:\/\/.*amazon\.de\/.*/.test(url) || /http:\/\/.*amazon\.ca\/.*/.test(url) || /http:\/\/.*amazon\.co\.jp\/.*/.test(url) || /http:\/\/.*amazon\.cn\/.*/.test(url) || /http:\/\/.*amazon\.es\/.*/.test(url) || /http:\/\/.*amazon\.it\/.*/.test(url));
  };
  
  this.extractAmazonAsin = function(str)
  {
    var regex = /\/([A-Z0-9]{10})(\/|$|\?|\%|\#)/;
    var asin = str.getMatches(regex);
    
    if (!asin)
      return(null);
    
    return(asin[1]);
  };
  
  this.runAmazon = function()
  {
    subdomain = this.content_url.tld();
    
    if (subdomain == "com")
      subdomain = "US";
    else
    {
      subdomain = subdomain.split(".");
      subdomain = subdomain[subdomain.length - 1].toUpperCase();
    }
    
    this.domain = subdomain.toLowerCase() + ".camelcamelcamel.com";
    this.locale = subdomain;
    this.asin = this.extractAmazonAsin(this.content_url);
  };

  this.isSafari = function()
  {
    url = this.content_url;
    return(/http:\/\/.*safaribooksonline.com\/book\/.*/.test(url) );
  };
  
  this.extractSafariAsin = function(str)
  {
    var regex = /\/([A-Z0-9]+)/;
    var asin = str.getMatches(regex);
    
    if (!asin)
      return(null);
    
    return(asin[1]);
  };
  
  this.runSafari = function()
  {
    subdomain = this.content_url.tld();
    
    if (subdomain == "com")
      subdomain = "US";
    else
    {
      subdomain = subdomain.split(".");
      subdomain = subdomain[subdomain.length - 1].toUpperCase();
    }
    
    this.domain = subdomain.toLowerCase() + ".camelcamelcamel.com";
    this.locale = subdomain;
    this.asin = this.extractSafariAsin(this.content_url);
    console.log("ASIN is " + this.asin);
    console.log("domain is " + this.domain);

  };
  
  this.isBestbuy = function()
  {
    return(/http:\/\/.*bestbuy\.com\/.*/.test(this.content_url));
  };
  
  this.extractBestbuyAsin = function(str)
  {
    var regex = /skuId=([0-9]*)/;
    var asin = str.getMatches(regex);
    
    if (!asin)
      return(null);
    
    return(asin[1]);
  };
  
  this.runBestbuy = function()
  {
    this.domain = "camelbuy.com";
    this.locale = "US";
    this.asin = this.extractBestbuyAsin(this.content_url);
  };
  
  this.isNewegg = function()
  {
    return(/http:\/\/.*newegg\.com\/.*/.test(this.content_url));
  };
  
  this.extractNeweggAsin = function(str)
  {
    var regex = /(N[A-Z0-9]{3,})/;
    var asin = str.getMatches(regex);
    
    if (!asin)
      return(null);
    
    return(asin[1]);
  };
  
  this.runNewegg = function()
  {
    this.domain = "camelegg.com";
    this.locale = "US";
    this.asin = this.extractNeweggAsin(this.content_url);
  };
  
  this.isBackcountry = function()
  {
    in_url = this.extractBackcountryAsin(this.content_url);
    in_page = /Item \#([A-Z0-9]{5,})/i.test(this.content_data);
    
    return(in_url || in_page);
  };
  
  this.runBackcountry = function()
  {
    this.domain = "camelcamper.com";
    this.locale = "US";
    this.asin = this.extractBackcountryAsin(this.content_url);
    
    if (!this.asin)
      this.asin = this.extractBackcountryAsin(this.content_data);
  };
  
  this.extractBackcountryAsin = function(str)
  {
    var regex = /\/([A-Z0-9]{5,})M\.html/;
    var asin = str.getMatches(regex);
    
    if (!asin)
    {
      asin = str.getMatches(/Item \#([A-Z0-9]{5,})/i);
      
      if (!asin)
        return(null);
    }
    
    return(asin[1]);
  };
  
  this.isOverstock = function()
  {
    in_url = this.extractOverstockAsin(this.content_data);
    
    return(in_url);
  };
  
  this.runOverstock = function()
  {
    this.domain = "camelstock.com";
    this.locale = "US";
    this.asin = this.extractOverstockAsin(this.content_data);
  };
  
  this.extractOverstockAsin = function(str)
  {
    var regex = /Item\#\: ([0-9]{4,})/i;
    var asin = str.getMatches(regex);
    
    if (!asin)
      return(null);
    
    return(asin[1]);
  };
  
  this.isZzounds = function()
  {
    in_url = this.extractZzoundsAsin(this.content_url);
    
    return(in_url);
  };
  
  this.runZzounds = function()
  {
    this.domain = "camelsounds.com";
    this.locale = "US";
    this.asin = this.extractZzoundsAsin(this.content_url);
  };
  
  this.extractZzoundsAsin = function(str)
  {
    var regex = /item\-\-([A-Z0-9]{1,})/i;
    var asin = str.getMatches(regex);
    
    if (!asin)
      return(null);
    
    return(asin[1]);
  };
};
