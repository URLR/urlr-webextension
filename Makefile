# Variables
ADDON_DIR := addon
MANIFEST_DIR := manifests
FIREFOX_MANIFEST := $(MANIFEST_DIR)/firefox/manifest.json
CHROME_MANIFEST := $(MANIFEST_DIR)/chrome/manifest.json
ADDON_MANIFEST := $(ADDON_DIR)/manifest.json
FIREFOX_PACKAGE := urlr-firefox.zip
CHROME_PACKAGE := urlr-chrome.zip

# Targets
firefox_package:
	rm -f $(ADDON_MANIFEST)
	cp $(FIREFOX_MANIFEST) $(ADDON_MANIFEST)
	cd $(ADDON_DIR) && zip -r -FS ../$(FIREFOX_PACKAGE) *
	rm -f $(ADDON_MANIFEST)

chrome_package:
	rm -f $(ADDON_MANIFEST)
	cp $(CHROME_MANIFEST) $(ADDON_MANIFEST)
	cd $(ADDON_DIR) && zip -r -FS ../$(CHROME_PACKAGE) *
	rm -f $(ADDON_MANIFEST)
