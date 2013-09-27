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
				return typeof args[number] !== 'undefined' ? args[number] : match;
			});
		};
	}

	function sortKeys(keys) {
		keys.sort(function(a,b) { return a.y === b.y ? a.x - b.x : a.y - b.y; });
	}
	
	// Convert between our in-memory format & our serialized format
	function serialize(keys) {
		var rows = [], row = [], xpos = 0, ypos = 0, color = "#eeeeee", text = "#000000", profile = "";
		sortKeys(keys);
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

		// The application version
		$scope.version = "0.4";

		// The selected tab; 0 == Properties, 1 == Raw Data
		$scope.selTab = 0;
	
		// An array used to keep track of the selected keys
		$scope.selectedKeys = [];

		// A single key selection; if multiple keys are selected, this is the 
		// most-recently selected one.
		$scope.multi = {};

		// Helper function to select a single key
		function selectKey(key,event) { 
			if(key) {
				// If CTRL is held down, we toggle the selection state
				if(event.ctrlKey) {
					var ndx = $scope.selectedKeys.indexOf(key);
					if(ndx >= 0) {
						$scope.selectedKeys.splice(ndx,1);
						if($scope.selectedKeys.length<1) { 
							$scope.multi = {};
						} else {
							$scope.multi = angular.copy($scope.selectedKeys[$scope.selectedKeys.length-1]);
						}
					} else {
						$scope.selectedKeys.push(key);
						$scope.multi = angular.copy(key);
					}
				} else {
					$scope.selectedKeys = [key];
					$scope.multi = angular.copy(key);
				}
			}
		};

		// The serialized key data
		$scope.serialized = "";

		// Known layouts/presets
		$scope.layouts = {};
		$http.get('layouts.json').success(function(data) { 
			$scope.layouts = data; 
		});

		// The currently selected palette
		$scope.palette = {};

		// The set of known palettes
		$scope.palettes = {};
		$http.get('colors.json').success(function(data) {
			$scope.palettes = data;
			$scope.palettes.forEach(function(palette) {
				palette.colors.forEach(function(color) {
					color.css = rgb(color.r,color.g,color.b);
				});
			});
		});

		// A set of "known special" keys
		$scope.specialKeys = null;
		$http.get('keys.json').success(function(data) {
			$scope.specialKeys = data;
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

		// Given a key, generate the HTML needed to render it	
		function renderKey(key) {
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
			key.rect2 = { x:capx2, y:capy2, w:capwidth2, h:capheight2 };
		};
	
		$scope.deserializeAndRender = function(data) {
			$scope.keys = deserialize(data);
			$scope.keys.forEach(function(key) {
				renderKey(key);
			});
		};
	
		if($location.hash()) {
			$scope.deserializeAndRender(fromJsonL($location.hash()));
			$location.hash("");
		} else { 
			$scope.deserializeAndRender([["Num Lock","/","*","-"],["7\nHome","8\n↑","9\nPgUp",{h:2},"+"],["4\n←","5","6\n→"],["1\nEnd","2\n↓","3\nPgDn",{h:2},"Enter"],[{w:2},"0\nIns",".\nDel"]]);
		}

		function updateSerialized() {
			//$timeout.cancel(serializedTimer); // this is slow, for some reason
			$scope.deserializeException = "";
			$scope.serialized = toJsonPretty(serialize($scope.keys));
		}

		function validate(key,prop,value) {
			var v = {
				_ : function(key,x) { return x; },
				x : function(key,x) { return max(0, min(36, x)); },
				y : function(key,y) { return max(0, min(36, y)); },
				x2 : function(key,x2) { return max(-key.width, min(key.width, x2)); },
				y2 : function(key,y2) { return max(-key.height, min(key.height, y2)); },
				width : function(key,width) { return max(0.5, min(12, width)); },
				height : function(key,height) { return max(0.5, min(12, height)); },
				width2 : function(key,width2) { return max(0.5, min(12, width2)); },
				height2 : function(key,height2) { return max(0.5, min(12, height2)); },
			};
			return (v[prop] || v._)(key,value);
		}

		function update(key,prop,value) {
			var u = {
				_ : function(prop,key) { key[prop] = $scope.multi[prop]; },
				width : function(prop,key) { key.width2 = key.width = $scope.multi.width; },
				height : function(prop,key) { key.height2 = key.height = $scope.multi.height; },
			};
			return (u[prop] || u._)(prop,key);
		}

		$scope.updateMulti = function(prop) {
			if($scope.multi[prop] == null) {
				return;
			}
			var valid = validate($scope.multi, prop, $scope.multi[prop]);
			if(valid !== $scope.multi[prop]) {
				return;
			}
			$scope.selectedKeys.forEach(function(selectedKey) {				
				update(selectedKey, prop, $scope.multi[prop]);
				renderKey(selectedKey);
			});
			update($scope.multi, prop, $scope.multi[prop]);
			updateSerialized();
		};

		$scope.validateMulti = function(prop) {
			if($scope.multi[prop] == null) { 
				$scope.multi[prop] = "";
			}
			var valid = validate($scope.multi, prop, $scope.multi[prop]);
			if(valid !== $scope.multi[prop]) {
				$scope.multi[prop] = valid;
				$scope.updateMulti(prop);
			}
		};

		$scope.serialized = toJsonPretty(serialize($scope.keys));
	
		$scope.clickSwatch = function(color,$event) {
			$scope.selectedKeys.forEach(function(selectedKey) {
				if($event.ctrlKey) {
					selectedKey.text = color.css;
				} else {
					selectedKey.color = color.css;
				}
				renderKey(selectedKey);
			});
			updateSerialized();
			$event.preventDefault();
		};
	
		$scope.moveKeys = function(x,y,$event) {
			$scope.selectedKeys.forEach(function(selectedKey) {
				selectedKey.x = max(0,selectedKey.x + x);
				selectedKey.y = max(0,selectedKey.y + y);
				renderKey(selectedKey);
			});
			updateSerialized();
			if(y !== 0) { $scope.calcKbHeight(); }
			$event.preventDefault();
		};
	
		$scope.sizeKeys = function(x,y,$event) {
			$scope.selectedKeys.forEach(function(selectedKey) {
				selectedKey.width = selectedKey.width2 = max(1,selectedKey.width + x);
				selectedKey.height = selectedKey.height2 = max(1,selectedKey.height + y);
				renderKey(selectedKey);
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
			if($scope.selectedKeys<1)
				return;

			// Sort the keys, so we can easily select the next key after deletion
			sortKeys($scope.keys);

			// Get the indicies of all the selected keys
			var toDelete = $scope.selectedKeys.map(function(key) { return $scope.keys.indexOf(key); });
			toDelete.sort(function(a,b) { return parseInt(a) - parseInt(b); });

			// Figure out which key we're going to select after deletion
			var toSelectNdx = toDelete[toDelete.length-1]+1;
			var toSelect = $scope.keys[toSelectNdx];

			// Delete the keys in reverse order so that the indicies remain valid
			for(var i = toDelete.length-1; i >= 0; --i) {
				$scope.keys.splice(toDelete[i],1);
			}

			// Select the next key
			var ndx = $scope.keys.indexOf(toSelect);
			if(ndx < 0) { ndx = toDelete[0]-1; }
			if(ndx < 0) { ndx = 0; }
			toSelect = $scope.keys[ndx];
			if(toSelect) {
				$scope.selectedKeys = [toSelect];
				$scope.multi = angular.copy(toSelect);
			} else {
				$scope.selectedKeys = [];
				$scope.multi = {};
			}

			// Update our data
			updateSerialized();
			$('#keyboard').focus();
		};

		$scope.addKey = function(proto) {
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
			var newKey = {width:1, height:1, color:color, text:textColor, label:"", label2:"", x:0, y:0, x2:0, y2:0, width2:1, height2:1, profile:""};
			$.extend(newKey, proto);
			newKey.x += xpos;
			newKey.y += ypos;
			renderKey(newKey);
			$scope.keys.push(newKey);
			updateSerialized();
			selectKey(newKey,{});
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

		// Called when the mouse is clicked within #keyboard; we use this to initiate a marquee
		// selection action.
		var doingMarqueeSelect = false;
		$scope.selectClick = function(event) {
			var kbElem = $("#keyboard");
			$scope.selRect = { display:"none", x:event.pageX, y:event.pageY, l:event.pageX, t:event.pageY, w:0, h:0 };
			$scope.selRect.kb = { 	left: kbElem.position().left + parseInt(kbElem.css('margin-left'),10),
									top: kbElem.position().top + parseInt(kbElem.css('margin-top'),10),
									width: kbElem.outerWidth(), 
									height:kbElem.outerHeight() 
								};
			doingMarqueeSelect = true;
			event.preventDefault();
		};

		// Called whenever the mouse moves over the document; ideally we'd get mouse-capture on 
		// mouse-down over #keyboard, but it doesn't look like there's a real way to do that in 
		// JS/HTML, so we do our best to simulate it.  Also, there doesn't appear to be any way
		// to recover if the user releases the mouse-button outside of the browser window.
		$scope.selectMove = function(event) {
			if(doingMarqueeSelect) {
				// Restrict the mouse position to the bounds #keyboard
				var pageX = min($scope.selRect.kb.left + $scope.selRect.kb.width, max($scope.selRect.kb.left, event.pageX));
				var pageY = min($scope.selRect.kb.top + $scope.selRect.kb.height, max($scope.selRect.kb.top, event.pageY));

				// Calculate the new marquee rectangle (normalized)
				if(pageX < $scope.selRect.x) {					
					$scope.selRect.l = pageX;
					$scope.selRect.w = $scope.selRect.x - pageX;
				} else {
					$scope.selRect.l = $scope.selRect.x;
					$scope.selRect.w = pageX - $scope.selRect.x;
				}
				if(pageY < $scope.selRect.y) {
					$scope.selRect.t = pageY;
					$scope.selRect.h = $scope.selRect.y - pageY;
				} else {
					$scope.selRect.t = $scope.selRect.y;
					$scope.selRect.h = pageY - $scope.selRect.y;
				}

				// If the mouse has moved more than our threshold, then display the marquee
				if($scope.selRect.w + $scope.selRect.h > 5) {
					$scope.selRect.display = "inherit";
				}
			}
		};

		// Called when the mouse button is released anywhere over the document; see notes above 
		// about mouse-capture.
		$scope.selectRelease = function(event) {
			if(doingMarqueeSelect) {
				doingMarqueeSelect = false;

				// Clear the array of selected keys if the CTRL isn't held down.
				if(!event.ctrlKey) {
					$scope.selectedKeys = [];
					$scope.multi = {};
				}

				// Calculate the offset between #keyboard and the mouse-coordinates
				var kbElem = $("#keyboard");
				var kbPos = kbElem.position();
				var offsetx = kbPos.left + parseInt(kbElem.css('padding-left'),10) + parseInt(kbElem.css('margin-left'),10);
				var offsety = kbPos.top + parseInt(kbElem.css('padding-top'),10) + parseInt(kbElem.css('margin-top'),10);

				// Check to see if the marquee was actually displayed
				if($scope.selRect.display !== "none") {
					$scope.selRect.display = "none";

					// Adjust the mouse coordinates to client coordinates
					$scope.selRect.l -= offsetx;
					$scope.selRect.t -= offsety;

					// Iterate over all the keys
					$scope.keys.forEach(function(key) {
						// Check to see if the key is *entirely within* the marquee rectangle
						if( key.rect.x >= $scope.selRect.l && key.rect.x+key.rect.w <= $scope.selRect.l+$scope.selRect.w &&
							key.rect.y >= $scope.selRect.t && key.rect.y+key.rect.h <= $scope.selRect.t+$scope.selRect.h &&
							key.rect2.x >= $scope.selRect.l && key.rect2.x+key.rect2.w <= $scope.selRect.l+$scope.selRect.w &&
							key.rect2.y >= $scope.selRect.t && key.rect2.y+key.rect2.h <= $scope.selRect.t+$scope.selRect.h )
						{
							// Key is inside the rectangle; select it (if not already selected).
							if($scope.selectedKeys.indexOf(key) < 0) {
								selectKey(key, {ctrlKey:true});
							}
						}
					});					
				} else {
					// The marquee wasn't displayed, so we're doing a single-key selection; 
					// iterate over all the keys.
					$scope.keys.forEach(function(key) {
						// Just check to see if the mouse click is within any key rectangle
						if( (key.rect.x <= event.pageX-offsetx && key.rect.x+key.rect.w >= event.pageX-offsetx &&
							 key.rect.y <= event.pageY-offsety && key.rect.y+key.rect.h >= event.pageY-offsety) ||
							(key.rect2.x <= event.pageX-offsetx && key.rect2.x+key.rect2.w >= event.pageX-offsetx &&
							 key.rect2.y <= event.pageY-offsety && key.rect2.y+key.rect2.h >= event.pageY-offsety) )
						{
							selectKey(key, event);
						}
					});
				}

				event.preventDefault();

				// Focus the keyboard, so keystrokes have the desired effect
				$('#keyboard').focus();
			}
		};
	
		$scope.getPermalink = function() {
			var url = $location.absUrl().replace(/##.*$/,"");
			url += "##" + encodeURIComponent(toJsonL(serialize($scope.keys)));
			return url;
		};
	
		// Helper functions to get the key before or after the specified key
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
		$scope.prevKey = function() { 
			sortKeys($scope.keys);
			var ndx = ($scope.selectedKeys.length>0) ? max(0,$scope.keys.indexOf($scope.selectedKeys[$scope.selectedKeys.length-1])-1) : 0;
			selectKey($scope.keys[ndx], {});
		};
		$scope.nextKey = function() { 
			sortKeys($scope.keys);
			var ndx = ($scope.selectedKeys.length>0) ? min($scope.keys.length-1,$scope.keys.indexOf($scope.selectedKeys[$scope.selectedKeys.length-1])+1) : $scope.keys.length-1;
			selectKey($scope.keys[ndx], {});
		};

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

		$scope.showHelp = function() {
			$('#helpDialog').modal('show');
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
