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
          ctx.product_data = {"result_code": R_ERROR}
        }
        
        if (xhr.status != 200){
          ctx.product_data = {"result_code": R_ERROR};
           console.log("REsponse was not good")
        }

        if (ctx.product_data.ItemLookupResponse.Items.Request.Errors){
            console.log(ctx.product_data.ItemLookupResponse.Items.Request.Errors.Error.Message);
            ctx.product_data.result_code =  R_ERROR;
            console.log(ctx.product_data.result_code);
        } else {
          ctx.product_data.result_code =  R_PRODUCT_LOADED;

        }
        camelizer.updateDisplay(ctx);
      }
    };
  },
  
  hideAllDisplays: function() {
    document.getElementById("camelizerDisplayLoading").style.display = "none";
    document.getElementById("camelizerDisplayError").style.display = "none";
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


    if (!ctx && !(ctx = camelizer_urls[camelizer.getActiveContextUrl()]))
      return;
    
    if (!camelizer.isActiveContext(ctx))
      return;
    

    switch (ctx.product_data.result_code)
    {
    case R_PRODUCT_LOADED:
        var frame = document.createElement('iframe');
        frame.setAttribute('width', '100%');
        frame.setAttribute('height', '100%');
        frame.setAttribute('frameborder', '0');
        frame.setAttribute('id', 'rtmframe');
        frame.setAttribute('src', ctx.product_data.ItemLookupResponse.Items.Item.CustomerReviews.IFrameURL);

        var link = document.createElement('a');
        link.setAttribute('href',
                ctx.product_data.ItemLookupResponse.Items.Item.DetailPageURL);
        link.innerHTML =
            ctx.product_data.ItemLookupResponse.Items.Item.ItemAttributes.Title;

        var image= document.createElement('img');

        var image_sets = ctx.product_data.ItemLookupResponse.Items.Item.ImageSets;
        var image_set;

        // If there is more than one image set use the first one
        if (image_sets.ImageSet instanceof Array) {
            image_set = image_sets.ImageSet[0];
        } else {
            image_set = image_sets.ImageSet;
        }

        image.setAttribute('src', image_set.TinyImage.URL);

        document.body.appendChild(image);
        document.body.appendChild(link);
        document.body.appendChild(frame);
        camelizer.hideAllDisplays();
      
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
};
