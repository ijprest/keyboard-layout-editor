var $renderKey = (typeof(exports) !== 'undefined') ? exports : {};
(function () {
	"use strict";

	// Some predefined sizes for our caps:
	// - unit == size of 1 unit, e.g., 0.75", or 19.05mm is standard
	// - keySpacing == distance from edge of unit-square to keycap, e.g., (0.75" - 0.715")/2 (for DCS)
	// - bevelMargin == distance from edge of keycap (at bottom) to edge of keycap (at top), e.g., (0.715" - 0.470")/2 (for DCS)
	// - padding == distance between text & edge of keycap
	// - strokeWidth == thickness of the outline strokes
	// - roundInner/roundOuter == corner roundness for inner/outer borders
	var unitSizes = {
		px : {
			unit : 54,
			strokeWidth: 1,
			"" : { profile: "" , keySpacing: 0, bevelMargin: 6, bevelOffsetTop: 3, bevelOffsetBottom: 3, padding: 3, roundOuter: 5, roundInner: 3 },
			"DCS" : { profile: "DCS", keySpacing: 0, bevelMargin: 6, bevelOffsetTop: 3, bevelOffsetBottom: 3, padding: 3, roundOuter: 5, roundInner: 3 },
			"DSA" : { profile: "DSA", keySpacing: 0, bevelMargin: 6, bevelOffsetTop: 0, bevelOffsetBottom: 0, padding: 3, roundOuter: 5, roundInner: 8 },
			"SA" :  { profile: "SA", keySpacing: 0, bevelMargin: 6, bevelOffsetTop: 2, bevelOffsetBottom: 2, padding: 3, roundOuter: 5, roundInner: 5 },
			"CHICKLET" :  { profile: "CHICKLET", keySpacing: 3, bevelMargin: 1, bevelOffsetTop: 0, bevelOffsetBottom: 2, padding: 4, roundOuter: 4, roundInner: 4 },
			"FLAT" : { profile: "FLAT" , keySpacing: 1, bevelMargin: 1, bevelOffsetTop: 0, bevelOffsetBottom: 0, padding: 4, roundOuter: 5, roundInner: 3 },
		},
		mm : {
			unit: 19.05,
			strokeWidth: 0.20,
			"" : {  profile: "" , keySpacing: 0.4445, bevelMargin: 3.1115, padding: 0, roundOuter: 1.0, roundInner: 2.0 },
			"DCS" : {  profile: "DCS", keySpacing: 0.4445, bevelMargin: 3.1115, padding: 0, roundOuter: 1.0, roundInner: 2.0 },
			"DSA" : {  profile: "DSA", keySpacing: 0.4445, bevelMargin: 3.1115, padding: 0, roundOuter: 1.0, roundInner: 2.0 },
			"SA" : {  profile: "SA", keySpacing: 0.4445, bevelMargin: 3.1115, padding: 0, roundOuter: 1.0, roundInner: 2.0 },
			"CHICKLET" : {  profile: "CHICKLET", keySpacing: 0.4445, bevelMargin: 3.1115, padding: 0, roundOuter: 1.0, roundInner: 2.0 },
			"FLAT" : {  profile: "FLAT" , keySpacing: 0.4445, bevelMargin: 3.1115, padding: 0, roundOuter: 1.0, roundInner: 2.0 },
		}
	};
	["px","mm"].forEach(function(unit) {
		["","DCS","DSA","SA","CHICKLET","FLAT"].forEach(function(profile) {
			unitSizes[unit][profile].unit = unitSizes[unit].unit;
			unitSizes[unit][profile].strokeWidth = unitSizes[unit].strokeWidth;
		});
		unitSizes[unit].OEM = unitSizes[unit].DCS; // same, for now
	});

	// Lighten a color by the specified amount
	function lightenColor(color,mod) {
		var c = $color.sRGB8(color.r,color.g,color.b).Lab();
		c.l = Math.min(100,c.l*mod);
		return c.sRGB8();
	}

	function getProfile(key) {
		return (/\b(SA|DSA|DCS|OEM|CHICKLET|FLAT)\b/.exec(key.profile) || [""])[0];
	}

	function getRenderParms(key, sizes) {
		var parms = {};

		parms.jShaped = (key.width !== key.width2) || (key.height !== key.height2) || key.x2 || key.y2;

		// Overall dimensions of the unit square(s) that the cap occupies
		parms.capwidth   = sizes.unit * key.width;
		parms.capheight  = sizes.unit * key.height;
		parms.capx       = sizes.unit * key.x;
		parms.capy       = sizes.unit * key.y;
		if(parms.jShaped) {
			parms.capwidth2  = sizes.unit * key.width2;
			parms.capheight2 = sizes.unit * key.height2;
			parms.capx2      = sizes.unit * (key.x + key.x2);
			parms.capy2      = sizes.unit * (key.y + key.y2);
		}

		// Dimensions of the outer part of the cap
		parms.outercapwidth   = parms.capwidth   - sizes.keySpacing*2;
		parms.outercapheight  = parms.capheight  - sizes.keySpacing*2;
		parms.outercapx       = parms.capx       + sizes.keySpacing;
		parms.outercapy       = parms.capy       + sizes.keySpacing;
		if(parms.jShaped) {
			parms.outercapy2      = parms.capy2      + sizes.keySpacing;
			parms.outercapx2      = parms.capx2      + sizes.keySpacing;
			parms.outercapwidth2  = parms.capwidth2  - sizes.keySpacing*2;
			parms.outercapheight2 = parms.capheight2 - sizes.keySpacing*2;
		}

		// Dimensions of the top of the cap
		parms.innercapwidth   = parms.outercapwidth   - sizes.bevelMargin*2;
		parms.innercapheight  = parms.outercapheight  - sizes.bevelMargin*2 - (sizes.bevelOffsetBottom-sizes.bevelOffsetTop);
		parms.innercapx       = parms.outercapx       + sizes.bevelMargin;
		parms.innercapy       = parms.outercapy       + sizes.bevelMargin - sizes.bevelOffsetTop;
		if(parms.jShaped) {
			parms.innercapwidth2  = parms.outercapwidth2  - sizes.bevelMargin*2;
			parms.innercapheight2 = parms.outercapheight2 - sizes.bevelMargin*2;
			parms.innercapx2      = parms.outercapx2      + sizes.bevelMargin;
			parms.innercapy2      = parms.outercapy2      + sizes.bevelMargin - sizes.bevelOffsetTop;
		}

		// Dimensions of the text part of the cap
		parms.textcapwidth   = parms.innercapwidth   - sizes.padding*2;
		parms.textcapheight  = parms.innercapheight  - sizes.padding*2;
		parms.textcapx       = parms.innercapx       + sizes.padding;
		parms.textcapy       = parms.innercapy       + sizes.padding;

		parms.darkColor = key.color;
		parms.lightColor = lightenColor($color.hex(key.color), 1.2).hex();

		// Rotation matrix about the origin
		parms.origin_x = sizes.unit * key.rotation_x;
		parms.origin_y = sizes.unit * key.rotation_y;
		var mat = Math.transMatrix(parms.origin_x, parms.origin_y).mult(Math.rotMatrix(key.rotation_angle)).mult(Math.transMatrix(-parms.origin_x, -parms.origin_y));

		// Construct the *eight* corner points, transform them, and determine the transformed bbox.
		parms.rect = { x:parms.capx, y:parms.capy, w:parms.capwidth, h:parms.capheight, x2:parms.capx+parms.capwidth, y2:parms.capy+parms.capheight };
		parms.rect2 = parms.jShaped ? { x:parms.capx2, y:parms.capy2, w:parms.capwidth2, h:parms.capheight2, x2:parms.capx2+parms.capwidth2, y2:parms.capy2+parms.capheight2 } : parms.rect;
		parms.bbox = { x:9999999, y:9999999, x2:-9999999, y2:-9999999 };
		var corners = [
			{x:parms.rect.x, y:parms.rect.y},
			{x:parms.rect.x, y:parms.rect.y2},
			{x:parms.rect.x2, y:parms.rect.y},
			{x:parms.rect.x2, y:parms.rect.y2}
		];
		if(parms.jShaped) corners.push(
			{x:parms.rect2.x, y:parms.rect2.y},
			{x:parms.rect2.x, y:parms.rect2.y2},
			{x:parms.rect2.x2, y:parms.rect2.y},
			{x:parms.rect2.x2, y:parms.rect2.y2}
		);
		for(var i = 0; i < corners.length; ++i) {
			corners[i] = mat.transformPt(corners[i]);
			parms.bbox.x = Math.min(parms.bbox.x, corners[i].x);
			parms.bbox.y = Math.min(parms.bbox.y, corners[i].y);
			parms.bbox.x2 = Math.max(parms.bbox.x2, corners[i].x);
			parms.bbox.y2 = Math.max(parms.bbox.y2, corners[i].y);
		}
		parms.bbox.w = parms.bbox.x2 - parms.bbox.x;
		parms.bbox.h = parms.bbox.y2 - parms.bbox.y;

		return parms;
	}

	var keycap_html, keycap_svg, keyboard_svg;
	$renderKey.init = function() {
		keycap_html = doT.template($('#keycap_html').html(), {__proto__: doT.templateSettings, varname:"key, sizes, parms, $sanitize, lightenColor"});
		keycap_svg = doT.template($('#keycap_svg').html(), {__proto__: doT.templateSettings, varname:"key, sizes, parms, $sanitize, lightenColor", strip:false});
		keyboard_svg = doT.template($('#keyboard_svg').html(), {__proto__: doT.templateSettings, varname:"parms", strip:false});
	};

	// Given a key, generate the HTML needed to render it
	$renderKey.html = function(key, $sanitize) {
		var sizes = unitSizes.px[getProfile(key)]; // always in pixels
		var parms = getRenderParms(key, sizes);

		// Update the rects & bounding-box of the key (for click-selection purposes)
		key.rect = parms.rect;
		key.rect2 = parms.rect2;
		key.bbox = parms.bbox;

		// Keep an inverse transformation matrix so that we can transform mouse coordinates into key-space.
		key.mat = Math.transMatrix(parms.origin_x, parms.origin_y).mult(Math.rotMatrix(-key.rotation_angle)).mult(Math.transMatrix(-parms.origin_x, -parms.origin_y));

		// Determine the location of the rotation crosshairs for the key
		key.crosshairs = "none";
		if(key.rotation_x || key.rotation_y || key.rotation_angle) {
			key.crosshairs_x = parms.origin_x;
			key.crosshairs_y = parms.origin_y;
			key.crosshairs = "block";
		}

		// Generate the HTML
		return keycap_html(key, sizes, parms, $sanitize, lightenColor);
	};

	// Given a key, generate the SVG needed to render it
	$renderKey.svg = function(key, index, bbox, sizes, $sanitize) {

		// Update bbox
		var parms = getRenderParms(key, sizes);
		bbox.x = Math.min(bbox.x, parms.bbox.x);
		bbox.y = Math.min(bbox.y, parms.bbox.y);
		bbox.x2 = Math.max(bbox.x2, parms.bbox.x2);
		bbox.y2 = Math.max(bbox.y2, parms.bbox.y2);
		parms.index = index;

		return keycap_svg(key, sizes, parms, $sanitize, lightenColor);
	};

	$renderKey.fullSVG = function(keys, metadata) {
		// Render all the keys
		var units = "px";
	  var bbox = { x: 99999999, y:99999999, x2:-99999999, y2:-99999999 };
	  var keysSVG = "";
	  keys.forEach(function(key,index) {	  	
	  	keysSVG += $renderKey.svg(key, index, bbox, unitSizes[units][getProfile(key)]);
	  });

	  // Wrap with SVG boilerplate
	  var kbdMargin = 10, kbdPadding = 5;
	  return keyboard_svg({
	  	margin: 10,
	  	padding: 5,	  	
	  	width: bbox.x2,
	  	height: bbox.y2,
	  	units: units,
	  	backcolor: metadata.backcolor,
	  	strokeWidth: unitSizes[units].strokeWidth,
	  	keys: keysSVG
	  });
	};

	$renderKey.getGlyphsFromRules = function(rules) {
		// Find rules that look like the base slyph-set definition
		var classes = [];
		rules.forEach(function(rule) {
			if(!rule.name && rule.selector.length === 1 && rule.selector[0].match(/^\.[a-zA-Z0-9]+$/)) {
				classes.push(rule.selector[0].substring(1));
			}
		});

		// Find rules that look like glyphs
		var glyphs = [];
		rules.forEach(function(rule) {
			if(!rule.name && rule.selector.length > 0) {
				rule.selector.forEach(function(selector) {
					var matches = selector.match(/^\.([a-zA-Z0-9]+)-([-a-zA-Z0-9]+)\:(before|after)$/);
					if(matches) {
						var theClass = classes.indexOf(matches[1]);
						if(theClass != -1) {
							var glyph = { name: matches[2], html: "<i class='" + classes[theClass] + " " + matches[1]+"-"+matches[2] +"'></i>" };
							glyphs.push(glyph);
						}
					}
				});
			}
		});
		glyphs.sort(function(a,b) { return a.name.localeCompare(b.name); });
		return glyphs;
	}

	$renderKey.sanitizeCssRules = function(rules) {
		if(rules) {
			// Sanitize the CSS
			rules.forEach(function(rule) {
				if(!rule.name) {
					for(var i = 0; i < rule.selector.length; ++i) {
						if(rule.selector[i] !== "#keyboard-bg") {
							rule.selector[i] = "#keyboard .keycap " + rule.selector[i] + ", #glyphScroller " + rule.selector[i];
						}
					}
				}
			})

			// Re-stringify the sanitized CSS
			var css = "";
			rules.forEach(function(rule) {
				if(!rule.name) {
					css += rule.selector.join(', ') + " { ";
					if(rule.decls) {
						for(var i = 0; i < rule.decls.length; ++i) {
							css += rule.decls[i][0] + ": " + rule.decls[i][1] + "; ";
						}
					}
					css += "}\n";
				} else {
					var ok = (rule.name === "@font-face")
					      || (rule.name === "@import" && !rule.content && rule.selector.match(/^url\('?https?:\/\/fonts.googleapis.com\/css\?family=[^\)]+'?\)$/));
					if(ok) {
						css += rule.name;
						if(rule.selector) css += ' ' + rule.selector;
						if(rule.content) css += '{ ' + rule.content + ' }\n';
						else css += ';\n';
					}
				}
			});
			return css;
		}
		return "";
	}

}());
