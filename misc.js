String.prototype.tld = function(){
  str = this;
  str = str.substring(0, str.indexOf("/", 8));
  
	return (m = str.match(new RegExp("\.([a-z,A-Z]{2,6})$") )) ? m[1] : false;
};

String.prototype.getMatches = function(regex)
{
  var out = null;
  
  if (regex.test(this))
    out = regex.exec(this);
  
  return(out);
};
