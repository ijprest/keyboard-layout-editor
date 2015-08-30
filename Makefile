ifeq ($(OS),Windows_NT)
export NODE_PATH=$(APPDATA)/npm/node_modules
cp = copy /y "$(subst /,\,$1)" "$(subst /,\,$2)"
mkdir = @if not exist "$(subst /,\,$1)" mkdir "$(subst /,\,$1)"
& = &
else
cp = cp "$1" "$2"
mkdir = @if [ ! -d "$1" ]; then mkdir "$1"; fi
& = ;
endif

all: js_files css_files bower_copy
.PHONY: js_files css_files bower_copy

# Rules to minify our .js files
js_files: js/jsonl.min.js js/cssparser.min.js
js/%.min.js: js/%.js
	$(call mkdir,$(dir $@))
	uglifyjs "$^" > "$@"
js/%.js: %.y
	$(call mkdir,$(dir $@))
	jison "$^" -o "$@"
js/%.js: ./%.js
	$(call mkdir,$(dir $@))
	uglifyjs "$^" > "$@"

.PRECIOUS: js/%.js

# Rules to run Stylus on our .css files
css_files: css/kb.css css/kbd-webfont.css 
css/%.css: %.css
	$(call mkdir,$(dir $@))
	stylus --out css -c -m --inline --with {limit:1024} $^

# Rules to copy stuff from bower_components to our folders
bower_copy: 
_BOWER_DIR[.js] = js
_BOWER_DIR[.css] = css
_BOWER_DIR[*] = fonts
_BOWER_TARGET = $(or $(_BOWER_DIR[$(suffix $(1))]),$(_BOWER_DIR[*]))/$(notdir $(1))
define _BOWER
bower_copy: $(call _BOWER_TARGET,$(1))
$(call _BOWER_TARGET,$(1)): $1
	$$(call mkdir,$$(dir $$@)) 
	$$(call cp,$$<,$$@)
endef
BOWER = $(eval $(call _BOWER,$1,$2))

# Bootstrap
$(call BOWER,bower_components/bootstrap/dist/css/bootstrap.min.css)
$(call BOWER,bower_components/bootstrap/dist/fonts/glyphicons-halflings-regular.eot)
$(call BOWER,bower_components/bootstrap/dist/fonts/glyphicons-halflings-regular.svg)
$(call BOWER,bower_components/bootstrap/dist/fonts/glyphicons-halflings-regular.ttf)
$(call BOWER,bower_components/bootstrap/dist/fonts/glyphicons-halflings-regular.woff)
$(call BOWER,bower_components/bootstrap/dist/fonts/glyphicons-halflings-regular.woff2)
# FontAwesome
$(call BOWER,bower_components/fontawesome/css/font-awesome.min.css)
$(call BOWER,bower_components/fontawesome/fonts/fontawesome-webfont.ttf)
$(call BOWER,bower_components/fontawesome/fonts/fontawesome-webfont.eot)
$(call BOWER,bower_components/fontawesome/fonts/fontawesome-webfont.svg)
$(call BOWER,bower_components/fontawesome/fonts/fontawesome-webfont.woff)
$(call BOWER,bower_components/fontawesome/fonts/fontawesome-webfont.woff2)
# JQeury & Angular stuff
$(call BOWER,bower_components/jquery/jquery.min.js)
$(call BOWER,bower_components/angular/angular.min.js)
$(call BOWER,bower_components/angular-bootstrap-colorpicker/css/colorpicker.min.css)
$(call BOWER,bower_components/angular-sanitize/angular-sanitize.min.js)
$(call BOWER,bower_components/angular-cookies/angular-cookies.min.js)
$(call BOWER,bower_components/angular-ui-utils/components/angular-ui-docs/build/ui-utils.min.js)
$(call BOWER,bower_components/ng-file-upload/ng-file-upload.min.js)
$(call BOWER,bower_components/angular-native-dragdrop/draganddrop.js)
$(call BOWER,bower_components/angular-ui-bootstrap/dist/ui-bootstrap-tpls-0.12.0.min.js)
$(call BOWER,bower_components/angular-bootstrap-colorpicker/js/bootstrap-colorpicker-module.min.js)
# Ace editor
$(call BOWER,bower_components/angular-ui-ace/ui-ace.min.js)
$(call BOWER,bower_components/ace-builds/src-min-noconflict/ace.js)
$(call BOWER,bower_components/ace-builds/src-min-noconflict/mode-css.js)
$(call BOWER,bower_components/ace-builds/src-min-noconflict/mode-json.js)
$(call BOWER,bower_components/ace-builds/src-min-noconflict/mode-markdown.js)
$(call BOWER,bower_components/ace-builds/src-min-noconflict/theme-textmate.js)
$(call BOWER,bower_components/ace-builds/src-min-noconflict/ext-searchbox.js)
# Misc
$(call BOWER,bower_components/hint.css/hint.min.css)
$(call BOWER,bower_components/crypto-js/crypto-js.js)
$(call BOWER,bower_components/marked/marked.min.js)
$(call BOWER,bower_components/FileSaver/FileSaver.min.js)
$(call BOWER,bower_components/doT/doT.min.js)
$(call BOWER,bower_components/URLON/src/urlon.js)
$(call BOWER,bower_components/html2canvas/dist/html2canvas.min.js)


# Rules to generate a webfont from our source .svg files
define _CUSTOM_FONT 
fonts: fonts/$(1)
fonts/$(1): font-src/$(basename $(1)).sfd font-src/$(basename $(1)).pe $(2)
	fontforge -quiet -script "font-src/$(basename $(1)).pe" "$$<" "$$@"
endef
CUSTOM_FONT = $(eval $(call _CUSTOM_FONT,$(1).ttf,$(2)))$(eval $(call _CUSTOM_FONT,$(1).eot,$(2)))$(eval $(call _CUSTOM_FONT,$(1).svg,$(2)))$(eval $(call _CUSTOM_FONT,$(1).woff,$(2)))

$(call CUSTOM_FONT,kbd-webfont,$(wildcard font-src/kbd-webfont/*.svg))
$(call CUSTOM_FONT,combining-diacritical,$(wildcard font-src/combining-diacritical/*.svg))


test: e2e-test unit-test
unit-test:
	jasmine
e2e-test:
	protractor tests/conf.js

install:
	bower install
	cd bower_components/angular-ui-bootstrap $& npm install
	cd bower_components/angular-ui-bootstrap $& grunt before-test after-test
	cd bower_components/angular-ui-utils $& npm install
	cd bower_components/angular-ui-utils $& grunt build
