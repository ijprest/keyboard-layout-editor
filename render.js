var $renderKey = {};
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
			"" : 		{ keySpacing: 0, bevelMargin: 6, bevelOffsetY: 3, padding: 3, roundOuter: 5, roundInner: 3 },
			"DCS" : { keySpacing: 0, bevelMargin: 6, bevelOffsetY: 3, padding: 3, roundOuter: 5, roundInner: 3 },
			"DSA" : { keySpacing: 0, bevelMargin: 6, bevelOffsetY: 0, padding: 3, roundOuter: 5, roundInner: 8 },
			"SA" :  { keySpacing: 0, bevelMargin: 6, bevelOffsetY: 2, padding: 3, roundOuter: 5, roundInner: 5 }
		},
		mm : {
			unit: 19.05,
			strokeWidth: 0.20,
			"" :    {  keySpacing: 0.4445, bevelMargin: 3.1115, padding: 0, roundOuter: 1.0, roundInner: 2.0 },
			"DCS" : {  keySpacing: 0.4445, bevelMargin: 3.1115, padding: 0, roundOuter: 1.0, roundInner: 2.0 },
			"DSA" : {  keySpacing: 0.4445, bevelMargin: 3.1115, padding: 0, roundOuter: 1.0, roundInner: 2.0 },
			"SA" : {  keySpacing: 0.4445, bevelMargin: 3.1115, padding: 0, roundOuter: 1.0, roundInner: 2.0 }
		}
	};
	["px","mm"].forEach(function(unit) {
		["","DCS","DSA", "SA"].forEach(function(profile) {
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
		return (/\b(SA|DSA|DCS|OEM)\b/.exec(key.profile) || [""])[0];
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
		parms.innercapheight  = parms.outercapheight  - sizes.bevelMargin*2;
		parms.innercapx       = parms.outercapx       + sizes.bevelMargin;
		parms.innercapy       = parms.outercapy       + sizes.bevelMargin - sizes.bevelOffsetY;
		if(parms.jShaped) {
			parms.innercapwidth2  = parms.outercapwidth2  - sizes.bevelMargin*2;
			parms.innercapheight2 = parms.outercapheight2 - sizes.bevelMargin*2;
			parms.innercapx2      = parms.outercapx2      + sizes.bevelMargin;
			parms.innercapy2      = parms.outercapy2      + sizes.bevelMargin - sizes.bevelOffsetY;
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

	function STYLE(style) {
		var html = "";
		for(var key in style) {
			if(style.hasOwnProperty(key)) {
				html += key + ":" + style[key].toString();
				if(typeof style[key] === 'number') html += "px";
				html += ';';
			}
		}
		return html;
	}

	function DIV(style, className, content) {
		var html = "<div style='" + STYLE(style) + "'";
		if(className) html += " class='"+className+"'";
		html += ">";
		if(content) html += (typeof content === 'function' ? content() : content.toString());
		html += "</div>";
		return html;
	}

	var html_t;
	$(document).ready(function() {
		html_t = doT.template($('#keycap_t').html(), {__proto__: doT.templateSettings, varname:"key, $sanitize, lightenColor"});
	});	

	// Given a key, generate the HTML needed to render it
	$renderKey.noRenderText = [0,2,1,3,0,4,2,3];
	$renderKey.html = function(key, $sanitize) {
		var sizes = unitSizes.px[getProfile(key)]; // always in pixels
		var parms = getRenderParms(key, sizes);

		key.sizes = sizes;
		key.parms = parms;

		// Update the key alignment flags (UI depends on these being up-to-date)
		key.centerx = key.align&1 ? true : false;
		key.centery = key.align&2 ? true : false;
		key.centerf = key.align&4 ? true : false;

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
		return html_t(key, $sanitize, lightenColor);
	};

	// Given a key, generate the SVG needed to render it
	$renderKey.svg = function(key, bbox, sizes, $sanitize) {

		// Update bbox
		var parms = getRenderParms(key, sizes);
		bbox.x = Math.min(bbox.x, parms.bbox.x);
		bbox.y = Math.min(bbox.y, parms.bbox.y);
		bbox.x2 = Math.max(bbox.x2, parms.bbox.x2);
		bbox.y2 = Math.max(bbox.y2, parms.bbox.y2);

		// Generate the SVG
		var svg = "<g class='key'>\n";
		if(key.rotation_angle) {
			svg = "<g class='key' transform='rotate({0} {1} {2})'>\n".format(key.rotation_angle, parms.origin_x, parms.origin_y);
		}

		var rectStrokeAndFill = ("<rect width='{0}' height='{1}' x='{2}' y='{3}' stroke='black' class='{5}' {6}/>\n" +
					                   "<rect width='{0}' height='{1}' x='{2}' y='{3}' fill='{4}' class='{5}' {6}/>\n");
		var rectFill = "<rect width='{0}' height='{1}' x='{2}' y='{3}' fill='{4}' class='{5}' {6}/>\n";
		var roundOuter = "rx='{0}' ry='{0}'".format(sizes.roundOuter);
		var roundInner = "rx='{0}' ry='{0}'".format(sizes.roundInner);

		// The border
		svg += rectStrokeAndFill.format( parms.capwidth, parms.capheight, parms.capx+1, parms.capy+1, parms.darkColor, parms.borderStyle, roundOuter );
		if(parms.jShaped) {
			svg += rectStrokeAndFill.format( parms.capwidth2, parms.capheight2, parms.capx2+1, parms.capy2+1, parms.darkColor, parms.borderStyle, roundOuter );
		}
		// The key edges
		svg += rectFill.format( parms.capwidth, parms.capheight, parms.capx+1, parms.capy+1, parms.darkColor, parms.bgStyle, roundOuter );
		if(parms.jShaped) {
			svg += rectFill.format( parms.capwidth2, parms.capheight2, parms.capx2+1, parms.capy2+1, parms.darkColor, parms.bgStyle, roundOuter );
		}

		if(!key.ghost) {
			// The top of the keycap
			svg += rectStrokeAndFill.format( parms.capwidth-(2*sizes.bevelMargin), parms.capheight-(2*sizes.bevelMargin), parms.capx+sizes.bevelMargin+1, parms.capy+(sizes.bevelMargin/2)+1, parms.lightColor, "keyborder inner", roundInner );
			if(parms.jShaped && !key.stepped) {
			 	svg += rectStrokeAndFill.format( parms.capwidth2-(2*sizes.bevelMargin), parms.capheight2-(2*sizes.bevelMargin), parms.capx2+sizes.bevelMargin+1, parms.capy2+(sizes.bevelMargin/2)+1, parms.lightColor, "keyborder inner", roundInner );
			}

			var maxWidth = parms.capwidth-(2*sizes.bevelMargin);
			var maxHeight = parms.capheight-(2*sizes.bevelMargin);
			if(parms.jShaped && !key.stepped) {
				maxWidth = Math.max(parms.capwidth,parms.capwidth2)-(2*sizes.bevelMargin);
				maxHeight = Math.max(parms.capheight,parms.capheight2)-(2*sizes.bevelMargin);
			 	svg += rectFill.format( parms.capwidth2-(2*sizes.bevelMargin), parms.capheight2-(2*sizes.bevelMargin), parms.capx2+sizes.bevelMargin+1, parms.capy2+(sizes.bevelMargin/2)+1, parms.lightColor, "keyfg", roundInner );
			}
			svg += rectFill.format( parms.capwidth-(2*sizes.bevelMargin), parms.capheight-(2*sizes.bevelMargin), parms.capx+sizes.bevelMargin+1, parms.capy+(sizes.bevelMargin/2)+1, parms.lightColor, "keyfg", roundInner );

			//TODO//key labels
		}
		svg += "</g>\n";
		return svg;
	};

	$renderKey.fullSVG = function(keys, metadata) {
		// Render all the keys
		var units = "px";
	  var bbox = { x: 99999999, y:99999999, x2:-99999999, y2:-99999999 };
	  var keysSVG = "";
	  keys.forEach(function(key) {
	  	keysSVG += $renderKey.svg(key, bbox, unitSizes[units][getProfile(key)]);
	  });

	  // Wrap with SVG boilerplate
	  var kbdMargin = 10, kbdPadding = 5;
	  var width = bbox.x2 + kbdMargin*2 + kbdPadding*2;
	  var height = bbox.y2 + kbdMargin*2 + kbdPadding*2;
		var svg = "<svg width='{0}{4}' height='{1}{4}' viewBox='0 0 {2} {3}' xmlns='http://www.w3.org/2000/svg'>\n"
							.format( width, height, width, height, units);

		// styles
		svg += "<style type='text/css'>\n";
		svg += "* { stroke-width: {0}; }\n".format(sizes.strokeWidth*2);
		svg += ".keyborder.inner { opacity: 0.1; }\n";
		svg += ".keyfg { <!-- font-family: \"Helvetica\", \"Arial\", sans-serif; --> }\n";
		svg += "</style>\n";

		svg += "<g transform='translate({0},{0})'>\n".format(kbdMargin);
		svg += "<rect width='{0}' height='{1}' stroke='#ddd' stroke-width='1' fill='{2}' rx='6' />\n"
						.format( bbox.x2 + kbdPadding*2, bbox.y2 + kbdPadding*2, metadata.backcolor);
	  svg += "<g transform='translate({0},{0})'>\n".format(kbdPadding);

	  svg += keysSVG;

	  svg += "</g>\n";
	  svg += "</g>\n";
	  svg += "</svg>\n";
	  return svg;
	};

}());
