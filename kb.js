/*
TODO / Wishlist
-- Shift+Click to select a range of keys
-- Cap "styles", referenced by other caps
-- Manual "reflow keys" function
*/

/*jslint bitwise:true, white:true, plusplus:true, vars:true, browser:true, devel:true, regexp:true */
/*global angular:true, rison:true, $:true */
(function () {
	"use strict";

	// Helpers 
	function max(a, b) { return a > b ? a : b; }
	function min(a, b) { return a < b ? a : b; }
	
	// Lenient JSON reader/writer
	function toJsonL(obj) {
		var res = [], key;
		if(obj instanceof Array) {
			obj.forEach(function(elem) { res.push(toJsonL(elem));	});
			return '['+res.join(',')+']';
		}		
		if(typeof obj === 'object') {
			for(key in obj) {	if(obj.hasOwnProperty(key)) { res.push(key+':'+toJsonL(obj[key])); } }
			return '{'+res.join(',')+'}';
		}
		return angular.toJson(obj);	
	}		
	function toJsonPretty(obj) {
		var res = [];
		obj.forEach(function(elem) { res.push(toJsonL(elem));	});
		return res.join(",\n")+"\n";
	}	
	function fromJsonL(json) { return angular.fromJson(json.replace(/([a-z_][a-z_0-9]*)[ \t]*:/ig,"\"$1\":")); }
	function fromJsonPretty(json) { return fromJsonL('['+json+']'); }

	// Darken a color by 20%
	function darkenColor(color) {
		var num = parseInt(color.slice(1), 16),
			R = ((num >> 16) & 0xff) * 0.8,
			G = ((num >> 8) & 0xff) * 0.8,
			B = (num & 0xFF) * 0.8;
		return "#" + (0x1000000 + (((R & 0xff) << 16) + ((G & 0xff) << 8) + (B & 0xff))).toString(16).slice(1);
	}
	
	// Convert RGB values to a CSS-color string
	function rgb(r, g, b) {
		r = r.toString(16); while(r.length<2) { r = "0"+r; }
		g = g.toString(16); while(g.length<2) { g = "0"+g; }
		b = b.toString(16); while(b.length<2) { b = "0"+b; }
		return "#"+r+g+b;
	}
	
	// Simple String.format() implementation
	if (!String.prototype.format) {
		String.prototype.format = function() {
			var args = arguments;
			return this.replace(/\{(\d+)\}/g, function(match, number) { 
				return typeof args[number] !== 'undefined'
					? args[number]
					: match
				;
			});
		};
	}
	
	// Convert between our in-memory format & our serialized format
	function serialize(keys) {
		var rows = [], row = [], xpos = 0, ypos = 0, color = "#eeeeee", text = "#000000", profile = "";
		keys.sort(function(a,b) { return a.y === b.y ? a.x - b.x : a.y - b.y; });
		keys.forEach(function(key) {
			var props = {}, prop = false;
			var label = key.label2 ? key.label + "\n" + key.label2 : key.label;
			if(key.y !== ypos) { rows.push(row); row = []; ypos++; xpos = 0; }
			function serializeProp(nname,val,defval) { if(val !== defval) { props[nname] = val; prop = true; } return val; }
			ypos += serializeProp("y", key.y-ypos, 0); 
			xpos += serializeProp("x", key.x-xpos, 0) + key.width;
			color = serializeProp("c", key.color, color);
			text = serializeProp("t", key.text, text);
			serializeProp("w", key.width, 1);
			serializeProp("h", key.height, 1);
			serializeProp("w2", key.width2, key.width);
			serializeProp("h2", key.height2, key.height);
			serializeProp("x2", key.x2, 0);
			serializeProp("y2", key.y2, 0);
			serializeProp("n", key.nub || false, false);
			if(prop) { row.push(props); }
			row.push(label);			
		});
		if(row.length>0) { rows.push(row); }
		return rows;
	}
	function deserialize(rows) {
		var xpos = 0, ypos = 0, color = "#eeeeee", text = "#000000", keys = [], width=1, height=1, xpos2=0, ypos2=0, width2=0, height2=0, profile = "", r, k, nub = false;
		for(r = 0; r < rows.length; ++r) {
			for(k = 0; k < rows[r].length; ++k) {
				var key = rows[r][k];
				if(typeof key === 'string') {
					var labels = key.split('\n');
					keys.push({x:xpos, y:ypos, width:width, height:height, profile:profile, color:color, text:text, label:labels[0], label2:labels[1], x2:xpos2, y2:ypos2, width2:width2===0?width:width2, height2:height2===0?height:height2, nub:nub});
					xpos += width;
					width = height = 1;
					xpos2 = ypos2 = width2 = height2 = 0;
					nub = false;
				} else {
					if(key.p) { profile = key.p; }
					if(key.c) { color = key.c; }
					if(key.t) { text = key.t; }
					if(key.x) { xpos += key.x; }
					if(key.y) { ypos += key.y; }
					if(key.w) { width = key.w; }
					if(key.h) { height = key.h; }
					if(key.x2) { xpos2 = key.x2; }
					if(key.y2) { ypos2 = key.y2; }
					if(key.w2) { width2 = key.w2; }
					if(key.h2) { height2 = key.h2; }
					if(key.n) { nub = key.n; }
				}
			}
			ypos++;
			xpos = 0;
		}
		return keys;
	}
	
	
	// Some predefined sizes for our caps
	var sizes = { cap: 54, padding: 2, margin: 6, spacing: 1 };
	sizes.capsize = function(size) { return (size*sizes.cap) - (2*sizes.spacing); };
	
	// The angular module for our application
	var kbApp = angular.module('kbApp', ["ngSanitize", "ui.utils"]);
	
	// The main application controller
	kbApp.controller('kbCtrl', ['$scope','$http','$location','$timeout', '$sce', function($scope, $http, $location, $timeout, $sce) {
		var serializedTimer = false;
		
		$scope.selTab = 0;
	
		// Load a set of pre-defined layouts
		$scope.layouts = {};
		$http.get('layouts.json').success(function(data) {
			$scope.layouts = data;
		});
	
		// Load the set of known Signature Plastics colors
		$scope.palette = {};
		$scope.palettes = {};
		$http.get('colors.json').success(function(data) {
			$scope.palettes = data;
			$scope.palettes.forEach(function(palette) {
				palette.colors.forEach(function(color) {
					color.css = rgb(color.r,color.g,color.b);
				});
			});
		});
	
		// Helper to calculate the height of the keyboard layout; cached to improve performance.
		$scope.kbHeight = 0;
		$scope.calcKbHeight = function() {
			var bottom = 0;
			$(".keyborder").each(function(i,e) {
				bottom = max(bottom, $(e).offset().top + $(e).outerHeight());
			});
			$scope.kbHeight = bottom - $('#keyboard').position().top - 10;
		};
	
		$scope.renderKey = function(key) {
			var html = "";
			var capwidth = sizes.capsize(key.width), capwidth2 = sizes.capsize(key.width2);
			var capheight = sizes.capsize(key.height), capheight2 = sizes.capsize(key.height2);
			var capx = sizes.capsize(key.x) + sizes.margin, capx2 = sizes.capsize(key.x+key.x2)+sizes.margin;
			var capy = sizes.capsize(key.y) + sizes.margin, capy2 = sizes.capsize(key.y+key.y2)+sizes.margin;
			var jShaped = (capwidth2 !== capwidth) || (capheight2 !== capheight) || (capx2 !== capx) || (capy2 !== capy);
			var darkColor = darkenColor(key.color);
			var innerPadding = (2*sizes.margin) + (2*sizes.padding);
	
			// The border
			html += "<div class='keyborder' style='width:{0}px;height:{1}px;left:{2}px;top:{3}px;'></div>\n".format(capwidth, capheight, capx, capy);
			if(jShaped) {
				html += "<div class='keyborder' style='width:{0}px;height:{1}px;left:{2}px;top:{3}px;'></div>\n".format(capwidth2, capheight2, capx2, capy2);
			}
			// The key edges
			html += "<div class='keybg' style='background-color:{4};width:{0}px;height:{1}px;left:{2}px;top:{3}px;'></div>\n".format(capwidth,capheight,capx+1,capy+1,darkColor);
			if(jShaped) {
				html += "<div class='keybg' style='background-color:{4};width:{0}px;height:{1}px;left:{2}px;top:{3}px;'></div>\n".format(capwidth2,capheight2,capx2+1,capy2+1,darkColor);
			}
			// The top of the cap
			html += "<div class='keyfg' style='background-color:{4};width:{0}px;height:{1}px;left:{2}px;top:{3}px;padding:{5}px;'>\n".format(capwidth - innerPadding, capheight - innerPadding, capx + sizes.margin + 1, capy + (sizes.margin/2) + 1, key.color, sizes.padding);
			if(jShaped) {
				html += "</div><div class='keyfg' style='background-color:{4};width:{0}px;height:{1}px;left:{2}px;top:{3}px;padding:{5}px;'>\n".format(capwidth2 - innerPadding, capheight2 - innerPadding, capx2 + sizes.margin + 1, capy2 + (sizes.margin/2) + 1, key.color, sizes.padding);
			}
			// The key labels			
			html += "<div class='keylabels' style='height:{0}px;'>".format(capheight - innerPadding);
			if(key.label) { html += "<div class='keylabel' style='color:{1};'>{0}</div>\n".format(key.label,key.text); }
			if(key.label2) { html += "<div class='keylabel2' style='color:{1};'>{0}</div>\n".format(key.label2,key.text); }
			html += "</div></div>";
	
			key.html = $sce.trustAsHtml(html);
			key.rect = { x:capx, y:capy, w:capwidth, h:capheight };
		};
	
		$scope.deserializeAndRender = function(data) {
			$scope.keys = deserialize(data);
			$scope.keys.forEach(function(key) {
				$scope.renderKey(key);
			});
		};
	
		if($location.hash()) {
			$scope.deserializeAndRender(fromJsonL($location.hash()));
			$location.hash("");
		} else { 
			$scope.deserializeAndRender([["Num Lock","/","*","-"],["7\nHome","8\n↑","9\nPgUp",{h:2},"+"],["4\n←","5","6\n→"],["1\nEnd","2\n↓","3\nPgDn",{h:2},"Enter"],[{w:2},"0\nIns",".\nDel"]]);
		}
	
		$scope.selectedKeys = [];
		$scope.selectKey = function(key,event) { 
			if(key) {
				if(event.ctrlKey) {
					var ndx = $scope.selectedKeys.indexOf(key);
					if(ndx >= 0) {
						$scope.selectedKeys.splice(ndx,1);
					} else {
						$scope.selectedKeys.push(key);
						$scope.multi = key;
					}
				} else {
					$scope.selectedKeys = [key];
					$scope.multi = key;
				}
			}
		};
	
		function updateSerialized() {
			//$timeout.cancel(serializedTimer); // this is slow, for some reason
			$scope.deserializeException = "";
			$scope.serialized = toJsonPretty(serialize($scope.keys));
		}

		$scope.multi = {};
		$scope.updateMulti = function(prop,sync) {
			$scope.selectedKeys.forEach(function(selectedKey) {
				if(sync) { selectedKey[prop+"2"] = $scope.multi[prop]; }
				selectedKey[prop] = $scope.multi[prop];
				$scope.renderKey(selectedKey);
			});
			updateSerialized();
		};
		$scope.serialized = toJsonPretty(serialize($scope.keys));	
	
		$scope.clickSwatch = function(color,$event) {
			$scope.selectedKeys.forEach(function(selectedKey) {
				if($event.ctrlKey) {
					selectedKey.text = color.css;
				} else {
					selectedKey.color = color.css;
				}
				$scope.renderKey(selectedKey);
			});
			updateSerialized();
			$event.preventDefault();
		};
	
		$scope.moveKeys = function(x,y,$event) {
			$scope.selectedKeys.forEach(function(selectedKey) {
				selectedKey.x = max(0,selectedKey.x + x);
				selectedKey.y = max(0,selectedKey.y + y);
				$scope.renderKey(selectedKey);
			});
			updateSerialized();
			if(y !== 0) { $scope.calcKbHeight(); }
			$event.preventDefault();
		};
	
		$scope.sizeKeys = function(x,y,$event) {
			$scope.selectedKeys.forEach(function(selectedKey) {
				selectedKey.width = selectedKey.width2 = max(1,selectedKey.width + x);
				selectedKey.height = selectedKey.height2 = max(1,selectedKey.height + y);
				$scope.renderKey(selectedKey);
			});
			updateSerialized();
			if(y!==0) { $scope.calcKbHeight(); }
			$event.preventDefault();
		};

		$scope.loadPalette = function(p) {
			$scope.palette = p;
		};
		$scope.loadPreset = function(preset) {
			$scope.deserializeAndRender(preset);
			updateSerialized();
		};
		$scope.deleteKeys = function() {
			$scope.selectedKeys.forEach(function(selectedKey) {
				var ndx = $scope.keys.indexOf(selectedKey);
				if(ndx >= 0) {
					$scope.keys.splice(ndx,1);
				}
			});
			$scope.selectedKeys = [];
			updateSerialized();
			if($scope.keys.length > 0) {
				$scope.nextKey();
				if($scope.keys.indexOf($scope.multi) < 0) {
					$scope.prevKey();
				}
			} else {
				$scope.multi = {};
			}
			$('#keyboard').focus();
		};
		$scope.addKey = function() {
			var xpos = 0, ypos = -1;
			if($scope.findKeyAfter($scope.multi) || typeof $scope.multi.x === "undefined") {
				$scope.keys.forEach(function(key) {	ypos = max(ypos,key.y);	});
				ypos++;
			} else if($scope.keys.length > 0) {
				xpos = $scope.multi.x + $scope.multi.width;
				ypos = $scope.multi.y;
				if(xpos >= 23) { xpos = 0; ypos++; }
			}

			var color = $scope.multi.color || "#eeeeee";
			var textColor = $scope.multi.text || "#000000";
			var newKey = {x:xpos, y:ypos, width:1, height:1, color:color, text:textColor, label:"", label2:"", x2:0, y2:0, width2:1, height2:1, profile:""};
			$scope.renderKey(newKey);
			$scope.keys.push(newKey);
			updateSerialized();
			$scope.selectKey(newKey,{});
			$scope.calcKbHeight();
			$('#keyboard').focus();
		};
		$scope.addKeys = function(count) {
			var i;
			for(i = 0; i < count; ++i) {
				$scope.addKey();
			}
		};

		$scope.deserializeException = "";
		$scope.updateFromSerialized = function() {
			if(serializedTimer) {
				$timeout.cancel(serializedTimer);
			}
			serializedTimer = $timeout(function() {
				try {
					$scope.deserializeException = "";
					$scope.deserializeAndRender(fromJsonPretty($scope.serialized));
				} catch(e) {
					$scope.deserializeException = e.toString();
				}
			}, 1000);
		};

		$scope.selRect = { display:"none" };
		var doingRectSelect = false;
		$scope.selectClick = function(event) {
			$scope.selRect = { display:"none", x:event.pageX, y:event.pageY, l:event.pageX, t:event.pageY, w:0, h:0 };
			doingRectSelect = true;
			event.preventDefault();
		};
		$scope.selectMove = function(event) {
			if(doingRectSelect) {				
				if(event.pageX < $scope.selRect.x) {
					$scope.selRect.l = event.pageX;
					$scope.selRect.w = $scope.selRect.x - event.pageX;
				} else {
					$scope.selRect.l = $scope.selRect.x;
					$scope.selRect.w = event.pageX - $scope.selRect.x;
				}
				if(event.pageY < $scope.selRect.y) {
					$scope.selRect.t = event.pageY;
					$scope.selRect.h = $scope.selRect.y - event.pageY;
				} else {
					$scope.selRect.t = $scope.selRect.y;
					$scope.selRect.h = event.pageY - $scope.selRect.y;
				}
				if($scope.selRect.w + $scope.selRect.h > 5) {
					$scope.selRect.display = "inherit";
				}
			}
		};
		$scope.selectRelease = function(event) {
			if(doingRectSelect) {
				doingRectSelect = false;
				if(!event.ctrlKey) {
					$scope.selectedKeys = [];
				}
				var kbElem = $("#keyboard");
				var kbPos = kbElem.position();
				var offsetx = kbPos.left + parseInt(kbElem.css('padding-left'),10) + parseInt(kbElem.css('margin-left'),10);
				var offsety = kbPos.top + parseInt(kbElem.css('padding-top'),10) + parseInt(kbElem.css('margin-top'),10);

				if($scope.selRect.display !== "none") {
					$scope.selRect.display = "none";
					$scope.selRect.l -= offsetx;
					$scope.selRect.t -= offsety;
					$scope.keys.forEach(function(key) {
						if( key.rect.x >= $scope.selRect.l && key.rect.x+key.rect.w <= $scope.selRect.l+$scope.selRect.w &&
							key.rect.y >= $scope.selRect.t && key.rect.y+key.rect.h <= $scope.selRect.t+$scope.selRect.h )
						{
							if($scope.selectedKeys.indexOf(key) < 0) {
								$scope.selectKey(key, {ctrlKey:true});
							}
						}
					});
				} else {
					// single-key selection
					$scope.keys.forEach(function(key) {
						if( key.rect.x <= event.pageX-offsetx && key.rect.x+key.rect.w >= event.pageX-offsetx &&
							key.rect.y <= event.pageY-offsety && key.rect.y+key.rect.h >= event.pageY-offsety )
						{
							$scope.selectKey(key, event);
						}
					});
				}
				event.preventDefault();
				$('#keyboard').focus();
			}
		};
	
		$scope.getPermalink = function() {
			var url = $location.absUrl().replace(/##.*$/,"");
			url += "##" + encodeURIComponent(toJsonL(serialize($scope.keys)));
			return url;
		};
	
		// Helper functions to get the key before or after the specified key
		$scope.findKeyBefore = function(key) {
			var bestKey, x = -999999, y = -999999;
			$scope.keys.forEach(function(keyi) {
				if(keyi.y < key.y || (keyi.y === key.y && keyi.x < key.x)) {
					var testy = keyi.y - key.y;
					if(testy > y || (testy === y && keyi.x > x)) {
						y = testy;
						x = keyi.x;
						bestKey = keyi;
					}
				}
			});
			return bestKey;
		};
		$scope.findKeyAfter = function(key) {
			var bestKey, x = 999999, y = 999999;
			$scope.keys.forEach(function(keyi) {
				if(keyi.y > key.y || (keyi.y === key.y && keyi.x > key.x)) {
					var testy = keyi.y - key.y;
					if(testy < y || (testy === 0 && keyi.x < x)) {
						y = testy;
						x = keyi.x;
						bestKey = keyi;
					}
				}
			});
			return bestKey;
		};
	
		// Called on 'j' or 'k' keystrokes; navigates to the next or previous key
		$scope.prevKey = function() { $scope.selectKey($scope.findKeyBefore($scope.multi) || $scope.keys[0],{}); };
		$scope.nextKey = function() { $scope.selectKey($scope.findKeyAfter($scope.multi) || $scope.keys[$scope.keys.length-1],{}); };

		$scope.focusKb = function() { $('#keyboard').focus(); };
		$scope.focusEditor = function() { 
			if($scope.selectedKeys.length > 0) {
				if($scope.selTab !== 0) {
					$scope.selTab = 0; 
					$('#properties').removeClass('hidden');
				}
				$('#labeleditor').focus().select();
			}
		};
	}]);
	
	// Modernizr-inspired check to see if "color" input fields are supported; 
	// we hide them if they aren't (e.g., on IE), because it's just a duplicate
	// of the existing text version.
	$(document).ready(function() {
		$('.colorpicker').each(function(i,elem) {
			elem.value = ":)";
			if(elem.value === ":)") {
				elem.style.display = "none";
			}
		});
	});
}());
