var $renderKey = {};
(function () {
	"use strict";

	// Some predefined sizes for our caps
	var sizesHTML = { cap: 54, padding: 2, margin: 6, spacing: 1 };
	var sizesSVG = { cap: 54, padding: 2, margin: 6, spacing: 1 };
	sizesHTML.capsize = function(size) { return (size*sizesHTML.cap) - (2*sizesHTML.spacing); };
	sizesSVG.capsize = function(size) { return (size*sizesSVG.cap) - (2*sizesSVG.spacing); };

	// Lighten a color by the specified amount
	function lightenColor(color,mod) {
		var c = $color.sRGB8(color.r,color.g,color.b).Lab();
		c.l = Math.min(100,c.l*mod);
		return c.sRGB8();
	}

	$renderKey.getKeyRotationStyles = function(key) {
		if(key.rotation_angle == 0) {
			return "";
		}
		var angle = key.rotation_angle.toString() + "deg";
		var origin = (sizesHTML.capsize(key.rotation_x) + sizesHTML.margin).toString() + "px " + (sizesHTML.capsize(key.rotation_y) + sizesHTML.margin).toString() + "px";
		return "transform: rotate("+angle+"); -ms-transform: rotate("+angle+"); -webkit-transform: rotate("+angle+"); " +
		       "transform-origin: "+origin+"; -ms-transform-origin: "+origin+"; -webkit-transform-origin: "+origin+";";
	};

	function getRenderParms(key, sizes) {
		var parms = {};
		parms.capwidth = sizes.capsize(key.width);
		parms.capwidth2 = sizes.capsize(key.width2);
		parms.capheight = sizes.capsize(key.height);
		parms.capheight2 = sizes.capsize(key.height2);
		parms.capx = sizes.capsize(key.x) + sizes.margin;
		parms.capx2 = sizes.capsize(key.x+key.x2)+sizes.margin;
		parms.capy = sizes.capsize(key.y) + sizes.margin;
		parms.capy2 = sizes.capsize(key.y+key.y2)+sizes.margin;
		parms.jShaped = (parms.capwidth2 !== parms.capwidth) || (parms.capheight2 !== parms.capheight) || (parms.capx2 !== parms.capx) || (parms.capy2 !== parms.capy);
		parms.innerPadding = (2*sizes.margin) + (2*sizes.padding);
		parms.borderStyle = key.ghost ? "keyborder ghosted" : "keyborder";
		parms.bgStyle = key.ghost ? "keybg ghosted" : "keybg";
		parms.darkColor = key.color;
		parms.lightColor = lightenColor($color.hex(key.color), 1.2).hex();
		key.centerx = key.align&1 ? true : false;
		key.centery = key.align&2 ? true : false;
		key.centerf = key.align&4 ? true : false;
		return parms;
	}

	function getKeyBounds(key, sizes, parms) {
		var bounds = {};

		// Rotation matrix about the origin
		bounds.origin_x = sizes.capsize(key.rotation_x)+sizes.margin;
		bounds.origin_y = sizes.capsize(key.rotation_y)+sizes.margin;
		var mat = Math.transMatrix(bounds.origin_x, bounds.origin_y).mult(Math.rotMatrix(key.rotation_angle)).mult(Math.transMatrix(-bounds.origin_x, -bounds.origin_y));

		// Construct the *eight* corner points, transform them, and determine the transformed bbox.
		bounds.rect = { x:parms.capx, y:parms.capy, w:parms.capwidth, h:parms.capheight, x2:parms.capx+parms.capwidth, y2:parms.capy+parms.capheight };
		bounds.rect2 = { x:parms.capx2, y:parms.capy2, w:parms.capwidth2, h:parms.capheight2, x2:parms.capx2+parms.capwidth2, y2:parms.capy2+parms.capheight2 };
		bounds.bbox = { x:9999999, y:9999999, x2:-9999999, y2:-9999999 };
		var corners = [
			{x:bounds.rect.x, y:bounds.rect.y},
			{x:bounds.rect.x, y:bounds.rect.y2},
			{x:bounds.rect.x2, y:bounds.rect.y},
			{x:bounds.rect.x2, y:bounds.rect.y2},
			{x:bounds.rect2.x, y:bounds.rect2.y},
			{x:bounds.rect2.x, y:bounds.rect2.y2},
			{x:bounds.rect2.x2, y:bounds.rect2.y},
			{x:bounds.rect2.x2, y:bounds.rect2.y2},
		];
		for(var i = 0; i < corners.length; ++i) {
			corners[i] = mat.transformPt(corners[i]);
			bounds.bbox.x = Math.min(bounds.bbox.x, corners[i].x);
			bounds.bbox.y = Math.min(bounds.bbox.y, corners[i].y);
			bounds.bbox.x2 = Math.max(bounds.bbox.x2, corners[i].x);
			bounds.bbox.y2 = Math.max(bounds.bbox.y2, corners[i].y);
		}
		bounds.bbox.w = bounds.bbox.x2 - bounds.bbox.x;
		bounds.bbox.h = bounds.bbox.y2 - bounds.bbox.y;

		return bounds;
	}

	// Given a key, generate the HTML needed to render it
	$renderKey.noRenderText = [0,2,1,3,0,4,2,3];
	$renderKey.html = function(key, $sanitize) {
		var sizes = sizesHTML;
		var parms = getRenderParms(key, sizes);
		var html = "";

		var div = "<div style='width:{0}px; height:{1}px; left:{2}px; top:{3}px; background-color:{4};' class='{5}'></div>\n";

		// The border
		html += div.format(parms.capwidth, parms.capheight, parms.capx, parms.capy, parms.darkColor, parms.borderStyle);
		if(parms.jShaped) {
			html += div.format(parms.capwidth2, parms.capheight2, parms.capx2, parms.capy2, parms.darkColor, parms.borderStyle);
		}
		// The key edges
		html += div.format(parms.capwidth, parms.capheight, parms.capx+1, parms.capy+1, parms.darkColor, parms.bgStyle);
		if(parms.jShaped) {
			html += div.format(parms.capwidth2, parms.capheight2, parms.capx2+1, parms.capy2+1, parms.darkColor, parms.bgStyle);
		}

		if(!key.ghost) {
			// The top of the cap
			var divInner = "<div class='keyborder inner' style='width:{0}px; height:{1}px; left:{2}px; top:{3}px; background-color:{4}; padding:{5}px;'></div>\n";
			html += divInner.format( parms.capwidth-parms.innerPadding, parms.capheight-parms.innerPadding, parms.capx+sizes.margin, parms.capy+(sizes.margin/2), parms.lightColor, sizes.padding );
			if(parms.jShaped && !key.stepped) {
			 	html += divInner.format( parms.capwidth2-parms.innerPadding, parms.capheight2-parms.innerPadding, parms.capx2+sizes.margin, parms.capy2+(sizes.margin/2), parms.lightColor, sizes.padding );
			}

			var maxWidth = parms.capwidth-(2*sizes.margin);
			var maxHeight = parms.capheight-(2*sizes.margin);
			var divFg = "<div class='keyfg' style='width:{0}px; height:{1}px; left:{2}px; top:{3}px; background-color:{4}; padding:{5}px; background-size:{6}px {7}px; background-position:{8}px {9}px;'>\n"
			if(parms.jShaped && !key.stepped) {
				maxWidth = Math.max(parms.capwidth,parms.capwidth2)-(2*sizes.margin);
				maxHeight = Math.max(parms.capheight,parms.capheight2)-(2*sizes.margin);
			 	html += divFg.format( parms.capwidth2-parms.innerPadding, parms.capheight2-parms.innerPadding, parms.capx2+sizes.margin+1, parms.capy2+(sizes.margin/2)+1, parms.lightColor, sizes.padding, maxWidth, maxHeight, Math.min(parms.capx,parms.capx2)-parms.capx2, Math.min(parms.capy,parms.capy2)-parms.capy2 );
			}
			//TODO//this extra </div> here looks wrong...
		 	html += "</div>";
			html += divFg.format( parms.capwidth-parms.innerPadding, parms.capheight-parms.innerPadding, parms.capx+sizes.margin+1, parms.capy+(sizes.margin/2)+1, parms.lightColor, sizes.padding, maxWidth, maxHeight, Math.min(parms.capx,parms.capx2)-parms.capx, Math.min(parms.capy,parms.capy2)-parms.capy );

			// The key labels
			html += "<div class='keylabels' style='width:{0}px; height:{1}px;'>".format(parms.capwidth-parms.innerPadding, parms.capheight-parms.innerPadding);
			key.labels.forEach(function(label,i) {
				if(label && label !== "" && !(key.align&$renderKey.noRenderText[i])) {
					var sanitizedLabel = '<div class="hint--top hint--rounded" data-hint="Error: Invalid HTML in label field."><i class="fa fa-times-circle"></div></i>';
					try { sanitizedLabel = $sanitize(label.replace(/<([^a-zA-Z\/]|$)/,"&lt;$1")); } catch(e) {}
					var textColor = i < key.text.length ? key.text[i] : key.text[0];
					if(!textColor) textColor = key.text[0];
					var textColorLight = lightenColor($color.hex(textColor), 1.2).hex();
					html += "<div class='keylabel keylabel{2} centerx-{5} centery-{6} centerf-{7} textsize{8}' style='color:{1};width:{3}px;height:{4}px;'><div style='width:{3}px;max-width:{3}px;height:{4}px;'>{0}</div></div>\n"
								.format(sanitizedLabel, i===4||i===5 ? textColor : textColorLight, i+1, parms.capwidth-parms.innerPadding, parms.capheight-parms.innerPadding,
										key.centerx, key.centery, key.centerf, i>0 ? key.fontheight2 : key.fontheight);
				}
			});
			html += "</div></div>";
		}

		// Get the rects & bounding-box of the key (for click-selection purposes)
		var bounds = getKeyBounds(key, sizes, parms);
		key.rect = bounds.rect;
		key.rect2 = bounds.rect2;
		key.bbox = bounds.bbox;

		// Keep an inverse transformation matrix so that we can transform mouse
		// coordinates into key-space.
		key.mat = Math.transMatrix(bounds.origin_x, bounds.origin_y).mult(Math.rotMatrix(-key.rotation_angle)).mult(Math.transMatrix(-bounds.origin_x, -bounds.origin_y));

		// Determine the location of the rotation crosshairs for the key
		key.crosshairs = "none";
		if(key.rotation_x || key.rotation_y || key.rotation_angle) {
			key.crosshairs_x = sizes.capsize(key.rotation_x) + sizes.margin;
			key.crosshairs_y = sizes.capsize(key.rotation_y) + sizes.margin;
			key.crosshairs = "block";
		}
		return html;
	};

	// Given a key, generate the SVG needed to render it
	$renderKey.svg = function(key, bbox, $sanitize) {
		var sizes = sizesSVG;
		var parms = getRenderParms(key, sizes);
		var svg = "<g class='key'>\n";

		var rectStrokeAndFill = ("<rect width='{0}' height='{1}' x='{2}' y='{3}' class='{5} stroke' {6}/>\n" +
					                   "<rect width='{0}' height='{1}' x='{2}' y='{3}' fill='{4}' class='{5} fill' {6}/>\n");
		var rectFill = "<rect width='{0}' height='{1}' x='{2}' y='{3}' fill='{4}' class='{5}' {6}/>\n";

		// The border
		svg += rectStrokeAndFill.format( parms.capwidth, parms.capheight, parms.capx+1, parms.capy+1, parms.darkColor, parms.borderStyle, "rx='5' ry='5'" );
		if(parms.jShaped) {
			svg += rectStrokeAndFill.format( parms.capwidth2, parms.capheight2, parms.capx2+1, parms.capy2+1, parms.darkColor, parms.borderStyle, "rx='5' ry='5'" );
		}
		// The key edges
		svg += rectFill.format( parms.capwidth, parms.capheight, parms.capx+1, parms.capy+1, parms.darkColor, parms.bgStyle, "rx='5' ry='5'" );
		if(parms.jShaped) {
			svg += rectFill.format( parms.capwidth2, parms.capheight2, parms.capx2+1, parms.capy2+1, parms.darkColor, parms.bgStyle, "rx='5' ry='5'" );
		}

		if(!key.ghost) {
			// The top of the cap
			svg += rectStrokeAndFill.format( parms.capwidth-(2*sizes.margin), parms.capheight-(2*sizes.margin), parms.capx+sizes.margin+1, parms.capy+(sizes.margin/2)+1, parms.lightColor, "keyborder inner", "rx='3' ry='3'" );
			if(parms.jShaped && !key.stepped) {
			 	svg += rectStrokeAndFill.format( parms.capwidth2-(2*sizes.margin), parms.capheight2-(2*sizes.margin), parms.capx2+sizes.margin+1, parms.capy2+(sizes.margin/2)+1, parms.lightColor, "keyborder inner", "rx='3' ry='3'" );
			}

			var maxWidth = parms.capwidth-(2*sizes.margin);
			var maxHeight = parms.capheight-(2*sizes.margin);
			if(parms.jShaped && !key.stepped) {
				maxWidth = Math.max(parms.capwidth,parms.capwidth2)-(2*sizes.margin);
				maxHeight = Math.max(parms.capheight,parms.capheight2)-(2*sizes.margin);
			 	svg += rectFill.format( parms.capwidth2-(2*sizes.margin), parms.capheight2-(2*sizes.margin), parms.capx2+sizes.margin+1, parms.capy2+(sizes.margin/2)+1, parms.lightColor, "keyfg", "rx='3' ry='3'" );
			}
			svg += rectFill.format( parms.capwidth-(2*sizes.margin), parms.capheight-(2*sizes.margin), parms.capx+sizes.margin+1, parms.capy+(sizes.margin/2)+1, parms.lightColor, "keyfg", "rx='3' ry='3'" );

			//TODO//key labels
		}
		svg += "</g>\n";

		// Update bbox
		var bounds = getKeyBounds(key, sizes, parms);
		bbox.x = Math.min(bbox.x, bounds.bbox.x);
		bbox.y = Math.min(bbox.y, bounds.bbox.y);
		bbox.x2 = Math.max(bbox.x2, bounds.bbox.x2);
		bbox.y2 = Math.max(bbox.y2, bounds.bbox.y2);

		return svg;
	};

	$renderKey.fullSVG = function(keys, metadata) {
		// Render all the keys
		var sizes = sizesSVG;
	  var bbox = { x: 999999, y:999999, x2:-999999, y2:-999999 };
	  var keysSVG = "";
	  keys.forEach(function(key) {
	  	keysSVG += $renderKey.svg(key, bbox);
	  });

	  // Wrap with SVG boilerplate
	  var kbdMargin = 10, kbdPadding = 5;
		var svg = "<svg width='{0}px' height='{1}px' viewBox='0 0 {0} {1}' xmlns='http://www.w3.org/2000/svg'>\n"
							.format( bbox.x2 + sizes.margin*2 + kbdMargin*2 + kbdPadding*2, bbox.y2 + sizes.margin*2 + kbdMargin*2 + kbdPadding*2);

		// styles
		svg += "<style type='text/css'>\n";
		svg += ".keyborder.stroke { stroke: black; stroke-width: 2; }\n";
		svg += ".keyborder.inner { opacity: 0.1; }\n";
		svg += ".keyfg { <!-- font-family: \"Helvetica\", \"Arial\", sans-serif; --> }\n";
		svg += "</style>\n";

		svg += "<g transform='translate({0},{0})'>\n".format(kbdMargin);
		svg += "<rect width='{0}' height='{1}' stroke='#ddd' stroke-width='1' fill='{2}' rx='6' />\n"
						.format( bbox.x2 + sizes.margin + kbdPadding*2, bbox.y2 + sizes.margin + kbdPadding*2, metadata.backcolor);
	  svg += "<g transform='translate({0},{0})'>\n".format(kbdPadding);

	  svg += keysSVG;

	  svg += "</g>\n";
	  svg += "</g>\n";
	  svg += "</svg>\n";
	  return svg;
	};

}());
