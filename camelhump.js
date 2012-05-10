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
    if (this.isSafari())
      this.runSafari();
    else
      return(null);
    camel_url = "http://localhost:8081/?ean=" + this.asin
    return(camel_url);
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
    this.asin = this.extractSafariAsin(this.content_url);
    console.log("ASIN is " + this.asin);
  };
  
};
