var camelizer;
var camelizer_urls = {};
var camelizer_data = {};

const R_PRODUCT_LOADED = 0;
const R_ERROR = 1;
const R_NOT_SUPPORTED = 2;
const R_PRODUCT_NOT_FOUND = 3;

var camelizer = {
  // utility functions
  
  // ensures we skip iframes and other bs
  isValidLoadEvent: function(e)
  {
    return(true);
  },
  
  isActiveContext: function(ctx)
  {
    return(true);
  },
  
  createNewContext: function(doc)
  {
    url = doc.url;
    ctx = camelizer_urls[url];
    
    if (ctx)
      return(ctx);
    
    camelizer_urls[url] = null;
    context = new camelHump(url, doc);
    camelizer_urls[url] = context;
    
    return(context);
  },
  
  deleteContext: function(doc)
  {
    url = doc.url;
    context = camelizer_urls[url];
    delete context.chart_image;
    delete context;
    camelizer_urls[url] = null;
  },
  
  contextFromDocument: function(doc)
  {
    context = camelizer.createNewContext(doc);
    camelizer.context = context;
  },
  
  finishContextFromDocument: function()
  {
    context = camelizer.context;
    context.request_url = context.detectRetailer();
    
    if (context.request_url)
    {
      camelizer.displayLoading(context);
      camelizer.initiateProductLookup(context);
      // initiate camelizer lookup
      // append stats iframe
    }
    else
    {
      context.product_data = {"result_code": R_NOT_SUPPORTED};
      camelizer.updateDisplay(context);
    }
  },
  
  getActiveContextUrl: function()
  {
    url = null;
    
    chrome.tabs.getSelected(null, function(tab) {
      url = tab.url;
    });
    
    return(url);
  },
  
  getActiveContextDocument: function()
  {
    return(gBrowser.selectedBrowser.contentDocument);
  },
  
  getDesiredChartHeight: function() {
    content_box = document.getElementById("camelizerContentBox");
    url_box = document.getElementById("camelizerUrlParent");
    height = content_box.clientHeight - url_box.clientHeight - 2 - 30;
    
    if (height <= 0)
      height = camelizer.last_height;
    else
      camelizer.last_height = height;
    
    return(height);
  },
  
  getDesiredChartWidth: function() {
    content_box = document.getElementById("camelizerContentBox");
    width = content_box.clientWidth - 2 - 30;
    
    if (width <= 0)
      width = camelizer.last_width;
    else
      camelizer.last_width = width;
    
    return(width);
  },
  
  setChartSize: function()
  {
    height = camelizer.getDesiredChartHeight();
    width = camelizer.getDesiredChartWidth();
    chart = document.getElementById("camelizerChart");
    chart.style.height = String(height) + "px";
    chart.style.width = String(width) + "px";
    
    return(camelizer.context.changeImageDimensions(width, height));
  },
  
  // event handlers
  
  onLoad: function(e) {
    // initialization code
    camelizer.initialized = true;
    camelizer.popped = false;
    camelizer.version = "5";
    camelizer.last_height = 300;
    camelizer.last_width = 500;
    camelizer.context = null;
    camelizer.resize_timeout = null;

    camelizer.onPageLoad(e);
  },
  
  onPageLoad: function(e)
  {
    chrome.tabs.getSelected(null, function(tab) {
      context = camelizer.contextFromDocument(tab);
    });
  },
  
  onPageUnload: function(e)
  {
    doc = e.originalTarget;
    
    if (!camelizer.isValidLoadEvent(e))
      return;
    
    camelizer.deleteContext(doc);
  },
  
  onTabChange: function(e)
  {
    doc = camelizer.getActiveContextDocument();
    url = camelizer.getActiveContextUrl();
    
    if ((camelizer.context = camelizer_urls[url]))
      camelizer.updateDisplay(camelizer.context);
    else
      camelizer.context = camelizer.contextFromDocument(doc);
  },

  onMenuItemCommand: function(e) {
    camelizer.toggleChartPopout(e);
  },

  onToolbarButtonCommand: function(e) {
    camelizer.toggleChartPopout(e);
  },
  
  onClickStatusIcon: function(e)
  {
    camelizer.toggleChartPopout(e);
  },
  
  // timeouts ensure we only process one resize event per resizing
  onResize: function(e)
  {
    if (!camelizer.popped)
      return;
    
    if (camelizer.resize_timeout)
    {
      clearTimeout(camelizer.resize_timeout);
      camelizer.resize_timeout = null;
    }
    
    camelizer.resize_timeout = setTimeout(function() { camelizer.finishResize(); }, 100);
  },
  
  finishResize: function()
  {
    if (!camelizer.popped)
      return;
    
    if (!camelizer.context.hasImage())
    {
      camelizer.updateDisplay(camelizer.context);
      return;
    }
    
    if (camelizer.setChartSize())
      camelizer.displayLoading(camelizer.context);
  },
  
  onChartLoaded: function(e)
  {
    img = this;
    ctx = img.context;
    chart = document.getElementById("camelizerChart");
    camelizer.displayChart(ctx);
  },
  
  toggleChartPopout: function(e) {
    obj = document.getElementById("camelizerContentBox");
    camelizer.popped = !!obj.collapsed;
    obj.collapsed = !camelizer.popped;
    obj = document.getElementById("camelizerContentSplitter");
    obj.collapsed = !camelizer.popped;
    
    if (camelizer.popped)
      camelizer.updateDisplay(null);
  },
  
  initiateProductLookup: function(ctx) {
    var xhr = new XMLHttpRequest();
    var ctx = ctx;
    xhr.open("GET", ctx.request_url, true);
    xhr.send();
    xhr.onreadystatechange = function() {
      if (xhr.readyState == 4)
      {
        try
        {
          ctx.consumeProductLookupResult(xhr.responseText);
        }
        catch (e)
        {
          ctx.product_data = {"result_code":1}
        }
        
        if (xhr.status != 200){
          ctx.product_data = {"result_code": R_ERROR};
           console.log("REsponse was not good")
        }
        
        console.log("REsponse was good")
        console.log(xhr.responseText)
        console.log(ctx.product_data.ItemLookupResponse.Items.Item.CustomerReviews.IFrameURL)
        console.log(ctx.product_data.ItemLookupResponse.Items.Item.ASIN)
        camelizer.updateDisplay(ctx);
      }
    };
  },
  
  hideAllDisplays: function() {
    document.getElementById("camelizerDisplayLoading").style.display = "none";
    document.getElementById("camelizerDisplayError").style.display = "none";
    document.getElementById("camelizerDisplayChart").style.visibility = "hidden";
    document.getElementById("camelizerDisplayNotSupported").style.display = "none";
    document.getElementById("camelizerDisplayProductNotFound").style.display = "none";
  },
  
  showDisplay: function(id)
  {
    if (id == "camelizerDisplayChart")
      document.getElementById(id).style.visibility = "visible";
    else
      document.getElementById(id).style.display = "";
  },
  
  updateDisplay: function(ctx) {
    var frame = document.createElement('iframe');

    frame.setAttribute('width', '100%');
    frame.setAttribute('height', '100%');
    frame.setAttribute('frameborder', '0');
    frame.setAttribute('id', 'rtmframe');
    frame.setAttribute('src', ctx.product_data.ItemLookupResponse.Items.Item.CustomerReviews.IFrameURL);
    var link = document.createElement('a');
    link.setAttribute('href', ctx.product_data.ItemLookupResponse.Items.Item.DetailPageURL);
    link.innerHTML= ctx.product_data.ItemLookupResponse.Items.Item.ItemAttributes.Title;
    var image= document.createElement('img');
    image.setAttribute('src', ctx.product_data.ItemLookupResponse.Items.Item.ImageSets.ImageSet.TinyImage.URL);
    document.body.appendChild(image);
    document.body.appendChild(link);
    document.body.appendChild(frame);
    camelizer.hideAllDisplays();
    return


    if (!ctx && !(ctx = camelizer_urls[camelizer.getActiveContextUrl()]))
      return;
    
    if (!camelizer.isActiveContext(ctx))
      return;
    
    switch (ctx.product_data.result_code)
    {
    case R_PRODUCT_LOADED:
      if (!ctx.chart_image)
      {
        ctx.chart_image = new Image();
        ctx.chart_image.context = ctx;
        ctx.chart_image.onload = camelizer.onChartLoaded;
      }
      
      if (ctx.chart_image.src != ctx.product_data.chart_url)
      {
        camelizer.displayLoading(ctx, "Product data downloaded, loading chart image...");
        ctx.chart_image.src = ctx.product_data.chart_url;
      }
      else
        camelizer.displayChart(ctx);
      
    break;
    
    case R_ERROR:
      camelizer.displayError(ctx);
    break;
    
    case R_NOT_SUPPORTED:
      camelizer.displayNotSupported(ctx);
    break;
    
    case R_PRODUCT_NOT_FOUND:
      camelizer.displayProductNotFound(ctx);
    break;
    }
  },
  
  displayChart: function(ctx) {
    if (!camelizer.isActiveContext(ctx))
      return;
    
    camelizer.hideAllDisplays();
    chart = document.getElementById("camelizerChart");
    
    if (ctx.chart_image.src != chart.src)
    {
      chart.src = ctx.chart_image.src;
      url_elm = document.getElementById("camelizerUrl");
      url_elm.href = ctx.product_data.product_url;
      url_elm.innerHTML = ctx.product_data.link_phrase;
      url_elm = document.getElementById("camelizerFeedbackUrl");
      url_elm.href = ctx.product_data.feedback_url;
    }
    
    camelizer.setChartSize();
    camelizer.showDisplay("camelizerDisplayChart");
  },
  
  displayError: function(ctx) {
    if (!camelizer.isActiveContext(ctx))
      return;
    
    camelizer.hideAllDisplays();
    camelizer.showDisplay("camelizerDisplayError");
  },
  
  displayLoading: function(ctx, msg) {
    if (!camelizer.isActiveContext(ctx))
      return;
    
    camelizer.hideAllDisplays();
    camelizer.showDisplay("camelizerDisplayLoading");
    camelizer.setLoadingText(msg ? msg : "Loading...");
  },
  
  displayNotSupported: function(ctx) {
    if (!camelizer.isActiveContext(ctx))
      return;
    
    camelizer.hideAllDisplays();
    camelizer.showDisplay("camelizerDisplayNotSupported");
  },
  
  displayProductNotFound: function(ctx) {
    if (!camelizer.isActiveContext(ctx))
      return;
    
    camelizer.hideAllDisplays();
    camelizer.showDisplay("camelizerDisplayProductNotFound");
  },
  
  setLoadingText: function(msg) {
    document.getElementById("camelizerLoadingText").innerHTML = msg;
  },
  
  openProductPage: function() {
    ctx = camelizer.context;
    camelizer.createNewSelectedTab(ctx.product_data.product_url);
  },
  
  openContactPage: function() {
    ctx = camelizer.context;
    camelizer.createNewSelectedTab(ctx.product_data.feedback_url);
  },
  
  createNewSelectedTab: function(url) {
    chrome.tabs.create({"url": url});
  }
};
