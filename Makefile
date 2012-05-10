Objects= \
loading.gif \
misc.js \
overlay.css \
background.html \
onload.js \
simple_iframe.html \
amazon_16.png \
amazon_48.png \
camelhump.js \
feed.html \
overlay.js \
manifest.json \

KEY=safari_plugin.pem

PACK_DIR = pack
DIST_DIR = dist
PUB=safari_plugin.pub
SIG=signature.sig
ZIP_FILE=$(DIST_DIR)/safari_extension.zip
CRX_OUTPUT=$(DIST_DIR)/safari_extension.crx

$(CRX_OUTPUT): $(Objects)
	mkdir -p $(PACK_DIR)
	mkdir -p $(DIST_DIR)
	cp ${Objects} $(PACK_DIR)
	cd $(PACK_DIR) && zip -qr -9 -X ../$(ZIP_FILE) .
	openssl sha1 -sha1 -binary -sign $(KEY) < $(ZIP_FILE) > $(SIG)
	openssl rsa -pubout -outform DER < $(KEY) > $(PUB) 2>/dev/null
	bash ./sign_package.sh $(PUB) $(SIG) $(ZIP_FILE) $(CRX_OUTPUT)

clean:
	rm -rf $(PACK_DIR) $(DIST_DIR)
	rm -rf $(SIG) $(PUB) 

foo:
	sss

