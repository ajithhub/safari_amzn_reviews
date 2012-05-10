chrome.extension.onRequest.addListener(
  function(request, sender, sendResponse) {
    if (request.c3_action == "get_doc")
    {
      sendResponse({
        c3_data: document.body.innerHTML, 
        c3_url: window.location.href, 
        c3_ctx: request.c3_ctx
      });
    }
    else if (request.c3_action == "onload")
    {
      sendResponse({c3_data: "OK"});
    }
    console.log("HERE in onload");
  }
);

chrome.extension.sendRequest({c3_action: "onload"}, function(e) {});
