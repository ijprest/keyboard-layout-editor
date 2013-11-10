var $renderKey = {};
(function () {
	"use strict";

	// Some predefined sizes for our caps
	var sizes = { cap: 54, padding: 2, margin: 6, spacing: 1 };
	sizes.capsize = function(size) { return (size*sizes.cap) - (2*sizes.spacing); };

	// Lighten a color by the specified amount
	function lightenColor(color,mod) { 
		var c = $color.sRGB8(color.r,color.g,color.b).Lab();
		c.l = Math.min(100,c.l*mod);
		return c.sRGB8();
	}
	
	// Given a key, generate the HTML needed to render it	
	var noRenderText = [0,2,1,3,0,4,2,3];
	$renderKey.html = function(key, $sanitize) {
		var html = "";
		var capwidth = sizes.capsize(key.width), capwidth2 = sizes.capsize(key.width2);
		var capheight = sizes.capsize(key.height), capheight2 = sizes.capsize(key.height2);
		var capx = sizes.capsize(key.x) + sizes.margin, capx2 = sizes.capsize(key.x+key.x2)+sizes.margin;
		var capy = sizes.capsize(key.y) + sizes.margin, capy2 = sizes.capsize(key.y+key.y2)+sizes.margin;
		var jShaped = (capwidth2 !== capwidth) || (capheight2 !== capheight) || (capx2 !== capx) || (capy2 !== capy);
		var darkColor = key.color;
		var lightColor = lightenColor($color.hex(key.color), 1.2).hex();
		var innerPadding = (2*sizes.margin) + (2*sizes.padding);
		var borderStyle = "keyborder", bgStyle = "keybg";

		key.centerx = key.align&1 ? true : false;
		key.centery = key.align&2 ? true : false;
		key.centerf = key.align&4 ? true : false;

		if(key.ghost) {
			borderStyle += " ghosted";
			bgStyle += " ghosted";
		} 
		// The border
		html += "<div style='width:{0}px; height:{1}px; left:{2}px; top:{3}px; background-color:{4};' class='{5}'></div>\n"
					.format( capwidth,    capheight,    capx,       capy,      darkColor,             borderStyle );
		if(jShaped) {
			html += "<div style='width:{0}px; height:{1}px; left:{2}px; top:{3}px; background-color:{4};' class='{5}'></div>\n"
						.format( capwidth2,   capheight2,   capx2,      capy2,     darkColor,             borderStyle );
		}
		// The key edges
		html += "<div style='width:{0}px; height:{1}px; left:{2}px; top:{3}px; background-color:{4};' class='{5}'></div>\n"
					.format( capwidth,    capheight,    capx+1,     capy+1,    darkColor,             bgStyle );
		if(jShaped) {
			html += "<div style='width:{0}px; height:{1}px; left:{2}px; top:{3}px; background-color:{4};' class='{5}'></div>\n"
						.format( capwidth2,   capheight2,   capx2+1,    capy2+1,   darkColor,             bgStyle );
		}

		if(!key.ghost) {
			// The top of the cap
			html += "<div class='keyborder inner' style='width:{0}px; height:{1}px; left:{2}px; top:{3}px; background-color:{4}; padding:{5}px;'></div>\n"
					.format( capwidth-innerPadding, capheight-innerPadding, capx+sizes.margin, capy+(sizes.margin/2), lightColor, sizes.padding );
			if(jShaped && !key.stepped) {
			 	html += "<div class='keyborder inner' style='width:{0}px; height:{1}px; left:{2}px; top:{3}px; background-color:{4}; padding:{5}px;'></div>\n"
			 			.format( capwidth2-innerPadding, capheight2-innerPadding, capx2+sizes.margin, capy2+(sizes.margin/2), lightColor, sizes.padding );
			}

			var maxWidth = capwidth-(2*sizes.margin);
			var maxHeight = capheight-(2*sizes.margin);
			if(jShaped && !key.stepped) {
				maxWidth = Math.max(capwidth,capwidth2)-(2*sizes.margin);
				maxHeight = Math.max(capheight,capheight2)-(2*sizes.margin);
			 	html += "<div class='keyfg' style='width:{0}px; height:{1}px; left:{2}px; top:{3}px; background-color:{4}; padding:{5}px; background-size:{6}px {7}px; background-position:{8}px {9}px;'>\n"
			 			.format( capwidth2-innerPadding, capheight2-innerPadding, capx2+sizes.margin+1, capy2+(sizes.margin/2)+1, lightColor, sizes.padding, maxWidth, maxHeight, Math.min(capx,capx2)-capx2, Math.min(capy,capy2)-capy2 );
			}
			html += "</div><div class='keyfg' style='width:{0}px; height:{1}px; left:{2}px; top:{3}px; background-color:{4}; padding:{5}px; background-size:{6}px {7}px; background-position:{8}px {9}px;'>\n"
					.format( capwidth-innerPadding, capheight-innerPadding, capx+sizes.margin+1, capy+(sizes.margin/2)+1, lightColor, sizes.padding, maxWidth, maxHeight, Math.min(capx,capx2)-capx, Math.min(capy,capy2)-capy );

			// The key labels			
			var textColor = lightenColor($color.hex(key.text), 1.2).hex();
			html += "<div class='keylabels' style='width:{0}px; height:{1}px;'>".format(capwidth-innerPadding, capheight-innerPadding);
			key.labels.forEach(function(label,i) {
				if(label && label !== "" && !(key.align&noRenderText[i])) {
					var sanitizedLabel = $sanitize(label.replace(/<([^a-zA-Z\/]|$)/,"&lt;$1"));
					html += "<div class='keylabel keylabel{2} centerx-{5} centery-{6} centerf-{7} textsize{8}' style='color:{1};width:{3}px;height:{4}px;'><div style='width:{3}px;max-width:{3}px;height:{4}px;'>{0}</div></div>\n"
								.format(sanitizedLabel, i===4||i===5 ? key.text : textColor, i+1, capwidth-innerPadding, capheight-innerPadding, 
										key.centerx, key.centery, key.centerf, i>0 ? key.fontheight2 : key.fontheight);
				}
			});
			html += "</div></div>";
		}

		key.rect = { x:capx, y:capy, w:capwidth, h:capheight };
		key.rect2 = { x:capx2, y:capy2, w:capwidth2, h:capheight2 };
		return html;
	};
}());
