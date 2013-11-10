/*jslint bitwise:true, white:true, plusplus:true, vars:true, browser:true, devel:true, regexp:true */
/*global angular:true, rison:true, $:true */
(function () {
	"use strict";

	// We need this so we can test locally and still save layouts to AWS
	var base_href = "http://www.keyboard-layout-editor.com";

	function toJsonPretty(obj) {
		var res = [];
		obj.forEach(function(elem) { res.push($serial.toJsonL(elem));	});
		return res.join(",\n")+"\n";
	}	
	function fromJsonPretty(json) { return $serial.fromJsonL('['+json+']'); }

	// The angular module for our application
	var kbApp = angular.module('kbApp', ["ngSanitize", "ui.utils"]);

	// The main application controller
	kbApp.controller('kbCtrl', ['$scope','$http','$location','$timeout', '$sce', '$sanitize', function($scope, $http, $location, $timeout, $sce, $sanitize) {
		var serializedTimer = false;

		// The application version
		$scope.version = "0.9";

		// The selected tab; 0 == Properties, 1 == Kbd Properties, 2 == Raw Data
		$scope.selTab = 0;
	
		// An array used to keep track of the selected keys
		$scope.selectedKeys = [];

		// A single key selection; if multiple keys are selected, this is the 
		// most-recently selected one.
		$scope.multi = {};
		$scope.meta = {};

		// The keyboard data
		$scope.keyboard = { keys: [] };
		$scope.keys = function(newKeys) { if(newKeys) { $scope.keyboard.keys = newKeys; } return $scope.keyboard.keys; };

		// Helper function to select/deselect all keys
		$scope.unselectAll = function() {
			$scope.selectedKeys = [];
			$scope.multi = {};
		};
		$scope.selectAll = function(event) {
			if(event) { event.preventDefault(); }
			$serial.sortKeys($scope.keys());
			$scope.unselectAll();
			$scope.keys().forEach(function(key) {
				$scope.selectedKeys.push(key);				
			});
			if($scope.keys().length>0) {
				$scope.multi = angular.copy($scope.keys().last());
			}
		};

		function saveLayout(layout) {
			var data = angular.toJson(layout);
			var fn = CryptoJS.MD5(data).toString();

			// First test to see if the file is already available
			$http.get(base_href+"/layouts/"+fn).success(function() {
				$scope.dirty = false;
				$scope.saved = fn;
				$location.path("/layouts/"+fn);
				$location.hash("");
				$scope.saveError = "";
			}).error(function() {
				// Nope... need to upload it
				var fd = new FormData();
				fd.append("key", "layouts/"+fn);
				fd.append("AWSAccessKeyId", "AKIAJSXGG74EMFBC57QQ");
				fd.append("acl", "public-read");
				fd.append("success_action_redirect", base_href);
				fd.append("policy", "eyJleHBpcmF0aW9uIjoiMjAwMTQtMDEtMDFUMDA6MDA6MDBaIiwiY29uZGl0aW9ucyI6W3siYnVja2V0Ijoid3d3LmtleWJvYXJkLWxheW91dC1lZGl0b3IuY29tIn0sWyJzdGFydHMtd2l0aCIsIiRrZXkiLCJsYXlvdXRzLyJdLHsiYWNsIjoicHVibGljLXJlYWQifSx7InN1Y2Nlc3NfYWN0aW9uX3JlZGlyZWN0IjoiaHR0cDovL3d3dy5rZXlib2FyZC1sYXlvdXQtZWRpdG9yLmNvbSJ9LHsiQ29udGVudC1UeXBlIjoiYXBwbGljYXRpb24vanNvbiJ9LFsiY29udGVudC1sZW5ndGgtcmFuZ2UiLDAsODE5Ml1dfQ==");
				fd.append("signature", "WOsX5QV/y9UlOs2kmtduXYEPeEQ=");
				fd.append("Content-Type", "application/json");
				fd.append("file", data);
				$http.post("http://www.keyboard-layout-editor.com.s3.amazonaws.com/", fd, {
					headers: {'Content-Type': undefined },
					transformRequest: angular.identity
				}).success(function() {
					$scope.dirty = false;
					$scope.saved = fn;
					$location.path("/layouts/"+fn);
					$location.hash("");
					$scope.saveError = "";
				}).error(function(data, status) {
					if(status == 0) {
						// We seem to get a 'cancelled' notification even though the POST 
						// is successful, so we have to double-check.
						$http.get(base_href+"/layouts/"+fn).success(function() { 
							$scope.dirty = false; 
							$scope.saved = fn;
							$location.path("/layouts/"+fn);
							$location.hash("");
							$scope.saveError = "";
						}).error(function(data, status) {
							$scope.saved = false;
							$scope.saveError = status.toString() + " - " + data.toString();
						});
					} else {
						$scope.saved = false;
						$scope.saveError = status.toString() + " - " + data.toString();
					}
				});
			});
		}
		$scope.save = function(event) {
			if(event) {
				event.preventDefault();
			}
			if($scope.dirty) {
				saveLayout($serial.serialize($scope.keyboard));
			}
		};
		$scope.canSave = function() {
			return $scope.dirty;
		};

		// Helper function to select a single key
		function selectKey(key,event) { 
			if(key) {
				// If SHIFT is held down, we want to *extend* the selection from the last 
				// selected item to the new one.
				if(event.shiftKey && $scope.selectedKeys.length > 0) {
					// Get the indicies of all the selected keys
					var currentSel = $scope.selectedKeys.map(function(key) { return $scope.keys().indexOf(key); });
					currentSel.sort(function(a,b) { return parseInt(a) - parseInt(b); });
					var cursor = $scope.keys().indexOf(key);					
					var anchor = $scope.keys().indexOf($scope.selectedKeys.last());
					$scope.selectedKeys.pop();
				}

				// If neither CTRL or ALT is held down, clear the existing selection state
				if(!event.ctrlKey && !event.altKey) {
					$scope.unselectAll();
				}

				// SHIFT held down: toggle the selection everything between the anchor & cursor
				if(anchor !== undefined && cursor !== undefined) {					
					if(anchor > cursor) {
						for(var i = anchor; i >= cursor; --i) {
							selectKey($scope.keys()[i],{ctrlKey:true});
						}
					} else {
						for(var i = anchor; i <= cursor; ++i) {
							selectKey($scope.keys()[i],{ctrlKey:true});
						}
					}
					return;
				}

				// Modify the selection
				var ndx = $scope.selectedKeys.indexOf(key);
				if(ndx >= 0) { //deselect
					$scope.selectedKeys.splice(ndx,1);
					if($scope.selectedKeys.length<1) { 
						$scope.multi = {};
					} else {
						$scope.multi = angular.copy($scope.selectedKeys.last());
					}
				} else { //select
					$scope.selectedKeys.push(key);
					$scope.multi = angular.copy(key);
				}
			}
		};

		// The serialized key data
		$scope.serialized = "";

		// Known layouts/presets
		$scope.layouts = {};
		$scope.samples = {};
		$http.get('layouts.json').success(function(data) { 
			$scope.layouts = data.presets;
			$scope.samples = data.samples;
		});

		// The currently selected palette
		$scope.palette = {};

		// The set of known palettes
		$scope.palettes = {};
		$http.get('colors.json').success(function(data) {
			$scope.palettes = data;
			$scope.palettes.forEach(function(palette) {
				palette.colors.forEach(function(color) {
					color.css = $color.sRGB8(color.r,color.g,color.b).hex();
				});
			});
		});

		// A set of "known special" keys
		$scope.specialKeys = {};
		$http.get('keys.json').success(function(data) {
			$scope.specialKeys = data;
		});
	
		// Helper to calculate the height of the keyboard layout; cached to improve performance.
		$scope.kbHeight = 0;
		$scope.calcKbHeight = function() {
			var bottom = 0;
			$(".keyborder").each(function(i,e) {
				bottom = Math.max(bottom, $(e).offset().top + $(e).outerHeight());
			});
			$scope.kbHeight = bottom - $('#keyboard').position().top - 10;
		};

		// Given a key, generate the HTML needed to render it	
		function renderKey(key) {
			key.html = $sce.trustAsHtml($renderKey.html(key,$sanitize));
		}

		$scope.deserializeAndRender = function(data) {
			$scope.keyboard = $serial.deserialize(data);
			$scope.keys().forEach(function(key) {
				renderKey(key);
			});
			$scope.meta = angular.copy($scope.keyboard.meta);
		};
	
		function updateSerialized() {
			//$timeout.cancel(serializedTimer); // this is slow, for some reason
			$scope.deserializeException = "";
			$scope.serialized = toJsonPretty($serial.serialize($scope.keyboard));
		}

		$scope.deserializeAndRender([]);
		if($location.hash()) {
			var loc = $location.hash();
			if(loc[0]=='@') {
				$scope.deserializeAndRender(URLON.parse(encodeURI(loc)));
			} else {
				$scope.deserializeAndRender($serial.fromJsonL(loc));
			}
		} else if($location.path()[0] === '/') {
			$http.get(base_href + $location.path()).success(function(data) {
				$scope.deserializeAndRender(data);
				updateSerialized();
			}).error(function() {
				$scope.loadError = true;				
			});
		} else {
			// Some simple default content... just a numpad
			$scope.deserializeAndRender([["Num Lock","/","*","-"],["7\nHome","8\n↑","9\nPgUp",{h:2},"+"],["4\n←","5","6\n→"],["1\nEnd","2\n↓","3\nPgDn",{h:2},"Enter"],[{w:2},"0\nIns",".\nDel"]]);
		}

		// Undo/redo support
		var undoStack = [];
		var redoStack = [];
		var canCoalesce = false;
		$scope.canUndo = function() { return undoStack.length>0; };
		$scope.canRedo = function() { return redoStack.length>0; };
		$scope.dirty = false;
		$scope.saved = false;
		$scope.saveError = "";
		window.onbeforeunload = function(e) {
			return $scope.dirty ? 'You have made changes to the layout that are not saved.  You can save your layout to the server by clicking the \'Save\' button.  You can also save your layout locally by bookmarking the \'Permalink\' in the application bar.' : null;
		};

		function transaction(type, fn) {
			var trans = undoStack.length>0 ? undoStack.last() : null;
			if(trans === null || !canCoalesce || trans.type !== type) {
				trans = { type:type, original:angular.copy($scope.keyboard), open:true, dirty:$scope.dirty };
				undoStack.push(trans);
				if(undoStack.length>32) {
					undoStack.shift();
				}
			}
			canCoalesce = true;
			try {
				fn();
			} finally {
				if($location.hash()) {
					$location.hash("");
				}
				if($location.path()) {
					$location.path("");
				}
				trans.modified = angular.copy($scope.keyboard);
				trans.open = false;
				redoStack = [];
				if(type !== 'rawdata') { updateSerialized(); }
				$scope.dirty = true;
				$scope.saved = false;
				$scope.saveError = "";
				$scope.loadError = false;
			}
		}

		$scope.undo = function() { 
			if($scope.canUndo()) { 
				var u = undoStack.pop(); 
				$scope.keyboard = angular.copy(u.original);
				updateSerialized();
				$scope.keys().forEach(function(key) {
					renderKey(key);
				});
				redoStack.push(u); 
				$scope.dirty = u.dirty;
				$scope.unselectAll();
				$scope.meta = $scope.keyboard.meta;
			}
		};

		$scope.redo = function() { 
			if($scope.canRedo()) { 
				var u = redoStack.pop(); 
				$scope.keyboard = angular.copy(u.modified);
				updateSerialized(); 
				$scope.keys().forEach(function(key) {
					renderKey(key);
				});
				undoStack.push(u); 
				$scope.dirty = true;
				$scope.unselectAll();
				$scope.meta = $scope.keyboard.meta;
			}
		};

		function validate(key,prop,value) {
			var v = {
				_ : function() { return value; },
				x : function() { return Math.max(0, Math.min(36, value)); },
				y : function() { return Math.max(0, Math.min(36, value)); },
				x2 : function() { return Math.max(-Math.abs(key.width-key.width2), Math.min(Math.abs(key.width-key.width2), value)); },
				y2 : function() { return Math.max(-Math.abs(key.height-key.height2), Math.min(Math.abs(key.height-key.height2), value)); },
				width : function() { return Math.max(0.5, Math.min(12, value)); },
				height : function() { return Math.max(0.5, Math.min(12, value)); },
				width2 : function() { return Math.max(0.5, Math.min(12, value)); },
				height2 : function() { return Math.max(0.5, Math.min(12, value)); },
				fontheight : function() { return Math.max(1, Math.min(9, value)); },
				fontheight2 : function() { return Math.max(1, Math.min(9, value)); },
			};
			return (v[prop] || v._)();
		}

		function update(key,prop,value) {
			var u = {
				_ : function() { key[prop] = value; },
				width : function() { key.width = value; if(!key.stepped || key.width > key.width2) key.width2 = value; },
				height : function() { key.height = value; if(!key.stepped || key.height > key.height2) key.height2 = value; },
				centerx : function() { if(value) { key.align = key.align | 1; } else { key.align = key.align & (~1); } },
				centery : function() { if(value) { key.align = key.align | 2; } else { key.align = key.align & (~2); } },
				centerf : function() { if(value) { key.align = key.align | 4; } else { key.align = key.align & (~4); } },
				fontheight : function() { key.fontheight = key.fontheight2 = value; },
				stepped : function() {
					key[prop] = value;
					if(value && key.width === key.width2) {
						if(key.width > 1) {
							key.width = Math.max(1, key.width-0.5);
						} else {
							key.width2 = key.width+0.5;
						}
					}
				},
			};
			return (u[prop] || u._)();
		}

		$scope.updateMulti = function(prop) {
			if($scope.multi[prop] == null || $scope.selectedKeys.length <= 0) {
				return;
			}
			var valid = validate($scope.multi, prop, $scope.multi[prop]);
			if(valid !== $scope.multi[prop]) {
				return;
			}

			transaction("update", function() {
				$scope.selectedKeys.forEach(function(selectedKey) {				
					update(selectedKey, prop, $scope.multi[prop]);
					renderKey(selectedKey);
				});
				$scope.multi = angular.copy($scope.selectedKeys.last());
			});
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

		$scope.updateMeta = function(prop) {
			transaction("metadata", function() {
				$scope.keyboard.meta[prop] = $scope.meta[prop];
			});
		};
		$scope.validateMeta = function(prop) {
		};

		$scope.serialized = toJsonPretty($serial.serialize($scope.keyboard));

		$scope.swapColors = function() {
			transaction("swapColors", function() {
				$scope.selectedKeys.forEach(function(selectedKey) {
					var temp = selectedKey.color;
					selectedKey.color = selectedKey.text;
					selectedKey.text = temp;
					renderKey(selectedKey);
				});
				$scope.multi = angular.copy($scope.selectedKeys.last());
			});
		};
	
		$scope.clickSwatch = function(color,$event) {
			$event.preventDefault();
			if($scope.selectedKeys.length<1) { 
				return; 
			}
			transaction("color-swatch", function() {
				$scope.selectedKeys.forEach(function(selectedKey) {
					if($event.ctrlKey || $event.altKey) {
						selectedKey.text = color.css;
					} else {
						selectedKey.color = color.css;
					}
					renderKey(selectedKey);
				});
				$scope.multi = angular.copy($scope.selectedKeys.last());
			});
		};
	
		$scope.moveKeys = function(x,y,$event) {
			$event.preventDefault();
			if($scope.selectedKeys.length<1) { 
				return; 
			}

			if(x<0 || y<0) {
				var canMoveKeys = true;
				$scope.selectedKeys.forEach(function(selectedKey) {
					if(selectedKey.x + x < 0 || 
					   selectedKey.y + y < 0 || 
					   selectedKey.x + selectedKey.x2 + x < 0 || 
					   selectedKey.y + selectedKey.y2 + y < 0) {
						canMoveKeys = false;
					}
				});
				if(!canMoveKeys) {
					return;
				}
			}

			transaction("move", function() {
				$scope.selectedKeys.forEach(function(selectedKey) {
					selectedKey.x = Math.max(0,selectedKey.x + x);
					selectedKey.y = Math.max(0,selectedKey.y + y);
					renderKey(selectedKey);
				});
				$scope.multi = angular.copy($scope.selectedKeys.last());
			});
			if(y !== 0) { $scope.calcKbHeight(); }
		};
	
		$scope.sizeKeys = function(x,y,$event) {
			$event.preventDefault();
			if($scope.selectedKeys.length<1) { 
				return; 
			}
			transaction("size", function() {
				$scope.selectedKeys.forEach(function(selectedKey) {
					update(selectedKey, 'width', Math.max(1,selectedKey.width + x));
					update(selectedKey, 'height', Math.max(1,selectedKey.height + y));
					renderKey(selectedKey);
				});
				$scope.multi = angular.copy($scope.selectedKeys.last());
			});
			if(y!==0) { $scope.calcKbHeight(); }
		};

		$scope.loadPalette = function(p) {
			$scope.palette = p;
		};
		$scope.colorName = function(color) {
			if(color && $scope.palette.colors) {
				for (var i = 0; i < $scope.palette.colors.length; i++) {
					if($scope.palette.colors[i].css === color) {
						return $scope.palette.colors[i].name;
					}
				}
			}
			return "";
		};

		$scope.loadPreset = function(preset) {
			transaction("preset", function() {
				$scope.deserializeAndRender(preset);
			});
			$scope.dirty = false;
		};
		$scope.loadSample = function(sample) {
			$http.get(sample).success(function(data) {
				$scope.loadPreset(data);
				$location.path(sample);
			}).error(function() {
				$scope.loadError = true;
			});
		};

		$scope.deleteKeys = function() {
			if($scope.selectedKeys<1)
				return;

			transaction('delete', function() {
				// Sort the keys, so we can easily select the next key after deletion
				$serial.sortKeys($scope.keys());

				// Get the indicies of all the selected keys
				var toDelete = $scope.selectedKeys.map(function(key) { return $scope.keys().indexOf(key); });
				toDelete.sort(function(a,b) { return parseInt(a) - parseInt(b); });

				// Figure out which key we're going to select after deletion
				var toSelectNdx = toDelete.last()+1;
				var toSelect = $scope.keys()[toSelectNdx];

				// Delete the keys in reverse order so that the indicies remain valid
				for(var i = toDelete.length-1; i >= 0; --i) {
					$scope.keys().splice(toDelete[i],1);
				}

				// Select the next key
				var ndx = $scope.keys().indexOf(toSelect);
				if(ndx < 0) { ndx = toDelete[0]-1; }
				if(ndx < 0) { ndx = 0; }
				toSelect = $scope.keys()[ndx];
				if(toSelect) {
					$scope.selectedKeys = [toSelect];
					$scope.multi = angular.copy(toSelect);
				} else {
					$scope.unselectAll();
				}
			});
			$('#keyboard').focus();
		};

		function whereToAddNewKeys(nextline) {
			var xpos = 0, ypos = -1;
			$serial.sortKeys($scope.keys());
			if(!nextline && $scope.selectedKeys.length>0 && $scope.keys().length>0 && $scope.multi.x == $scope.keys().last().x) {
				xpos = $scope.multi.x + Math.max($scope.multi.width, $scope.multi.width2 || 0);
				ypos = $scope.multi.y;
				if(xpos >= 23) { xpos = 0; ypos++; }
			} else {
				$scope.keys().forEach(function(key) { ypos = Math.max(ypos,key.y); });
				ypos++;
			}
			return {x:xpos, y:ypos};
		}

		$scope.addKey = function(proto, nextline) {
			var newKey = null;
			transaction("add", function() {
				var pos = whereToAddNewKeys(nextline);
				var color = $scope.multi.color || "#cccccc";
				var textColor = $scope.multi.text || "#000000";
				var profile = $scope.multi.profile || "";
				newKey = {width:1, height:1, color:color, text:textColor, labels:[], x:0, y:0, x2:0, y2:0, width2:1, height2:1, profile:profile, ghost:false, align:4, fontheight:3, fontheight2:3, nub:false, stepped:false};
				$.extend(newKey, proto);
				newKey.x += pos.x;
				newKey.y += pos.y;
				renderKey(newKey);
				$scope.keys().push(newKey);
			});
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
					transaction("rawdata", function() {
						$scope.deserializeAndRender(fromJsonPretty($scope.serialized));
					});
					$scope.unselectAll();
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
				var pageX = Math.min($scope.selRect.kb.left + $scope.selRect.kb.width, Math.max($scope.selRect.kb.left, event.pageX));
				var pageY = Math.min($scope.selRect.kb.top + $scope.selRect.kb.height, Math.max($scope.selRect.kb.top, event.pageY));

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
				$serial.sortKeys($scope.keys());
				doingMarqueeSelect = false;

				// Calculate the offset between #keyboard and the mouse-coordinates
				var kbElem = $("#keyboard");
				var kbPos = kbElem.position();
				var offsetx = kbPos.left + parseInt(kbElem.css('padding-left'),10) + parseInt(kbElem.css('margin-left'),10);
				var offsety = kbPos.top + parseInt(kbElem.css('padding-top'),10) + parseInt(kbElem.css('margin-top'),10);

				// Check to see if the marquee was actually displayed
				if($scope.selRect.display !== "none") {
					// Clear the array of selected keys if the CTRL isn't held down.
					if(!event.ctrlKey && !event.altKey) {
						$scope.unselectAll();
					}

					$scope.selRect.display = "none";

					// Adjust the mouse coordinates to client coordinates
					$scope.selRect.l -= offsetx;
					$scope.selRect.t -= offsety;

					// Iterate over all the keys
					$scope.keys().forEach(function(key) {
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
					// Clear the array of selected keys if the CTRL isn't held down.
					if(!event.ctrlKey && !event.altKey && !event.shiftKey) {
						$scope.unselectAll();
					}

					// The marquee wasn't displayed, so we're doing a single-key selection; 
					// iterate over all the keys.
					$scope.keys().forEach(function(key) {
						// Just check to see if the mouse click is within any key rectangle
						if( (key.rect.x <= event.pageX-offsetx && key.rect.x+key.rect.w >= event.pageX-offsetx &&
							 key.rect.y <= event.pageY-offsety && key.rect.y+key.rect.h >= event.pageY-offsety) ||
							(key.rect2.x <= event.pageX-offsetx && key.rect2.x+key.rect2.w >= event.pageX-offsetx &&
							 key.rect2.y <= event.pageY-offsety && key.rect2.y+key.rect2.h >= event.pageY-offsety) )
						{
							selectKey(key, {ctrlKey:event.ctrlKey, altKey:event.altKey, shiftKey:event.shiftKey});
						}
					});
				}
				canCoalesce = false;

				event.preventDefault();

				// Focus the keyboard, so keystrokes have the desired effect
				$('#keyboard').focus();
			}
		};
	
		$scope.getPermalink = function() {
			var url = $location.absUrl().replace(/#.*$/,"");
			url += "##" + URLON.stringify($serial.serialize($scope.keyboard));
			return url;
		};
	
		// Called on 'j' or 'k' keystrokes; navigates to the next or previous key
		$scope.prevKey = function(event) {
			if($scope.keys().length>0) {
				$serial.sortKeys($scope.keys());
				var ndx = ($scope.selectedKeys.length>0) ? Math.max(0,$scope.keys().indexOf($scope.selectedKeys.last())-1) : 0;
				var selndx = $scope.selectedKeys.indexOf($scope.keys()[ndx]);
				if(event.shiftKey && $scope.keys().length>1 && $scope.selectedKeys.length>0 && selndx>=0) {
					$scope.selectedKeys.pop(); //deselect the existing cursor
					$scope.selectedKeys.splice(selndx,1); //make sure the new cursor is at the end of the selection list
				}
				selectKey($scope.keys()[ndx], {ctrlKey:event.shiftKey});
				canCoalesce = false;
			}
		};
		$scope.nextKey = function(event) {
			if($scope.keys().length>0) {
				$serial.sortKeys($scope.keys());
				var ndx = ($scope.selectedKeys.length>0) ? Math.min($scope.keys().length-1,$scope.keys().indexOf($scope.selectedKeys.last())+1) : $scope.keys().length-1;
				var selndx = $scope.selectedKeys.indexOf($scope.keys()[ndx]);
				if(event.shiftKey && $scope.keys().length>1 && $scope.selectedKeys.length>0 && selndx>=0) {
					$scope.selectedKeys.pop(); //deselect the existing cursor
					$scope.selectedKeys.splice(selndx,1); //make sure the new cursor is at the end of the selection list
				}
				selectKey($scope.keys()[ndx], {ctrlKey:event.shiftKey});
				canCoalesce = false;
			}
		};

		$scope.focusKb = function() { $('#keyboard').focus(); };
		$scope.focusEditor = function() { 
			if($scope.selectedKeys.length > 0) {
				if($scope.selTab !== 0) {
					$scope.selTab = 0; 
					$('#properties').removeClass('hidden');
				}
				$('#labeleditor').focus().select();
			} else {
				if($scope.selTab !== 1) {
					$scope.selTab = 1; 
					$('#kbdproperties').removeClass('hidden');
				}
				$('#kbdcoloreditor').focus().select();
			}
		};

		$scope.showHelp = function(event) {
			if(event.srcElement.nodeName !== "INPUT" && event.srcElement.nodeName !== "TEXTAREA") {
				event.preventDefault();
				$('#helpDialog').modal('show');
			}
		};

		// Clipboard functions
		var clipboard = {};
		$scope.cut = function(event) {
			if(event) {
				event.preventDefault();
			}
			if($scope.selectedKeys.length>0) {
				clipboard = angular.copy($scope.selectedKeys);
				$scope.deleteKeys();
			}
		};
		$scope.copy = function(event) {
			if(event) {
				event.preventDefault();
			}
			if($scope.selectedKeys.length>0) {
				clipboard = angular.copy($scope.selectedKeys);
			}
		};
		$scope.paste = function(event) {
			if(event) {
				event.preventDefault();
			}
			if(clipboard.length<1) {
				return;
			}
			$serial.sortKeys(clipboard);

			// Copy the clipboard keys, and adjust them all relative to the first key
			var clipCopy = angular.copy(clipboard);
			var minx = 0, miny = 0, singleRow = true;
			clipCopy.forEach(function(key) { 
				minx = Math.min(minx, key.x -= clipboard[0].x);
				miny = Math.min(miny, key.y -= clipboard[0].y);
			});

			// Adjust to make sure nothing < 0
			clipCopy.forEach(function(key) { 
				key.x -= minx;
				key.y -= miny;
				if(key.y>0) { singleRow = false; }
			});

			// Figure out where to put the keys
			var pos = whereToAddNewKeys(!singleRow);

			// Perform the transaction
			transaction("paste", function() {
				clipCopy.forEach(function(key,i) {
					key.x += pos.x;
					key.y += pos.y;
					renderKey(key);
					$scope.keys().push(key);
					$scope.selectedKeys = clipCopy;
					$scope.multi = angular.copy($scope.selectedKeys.last());
				});
			});
		};
		$scope.canCopy = function() { return $scope.selectedKeys.length > 0; }
		$scope.canPaste = function() { return clipboard.length > 0; }
	}]);
	
	// Modernizr-inspired check to see if "color" input fields are supported; 
	// we hide them if they aren't (e.g., on IE), because it's just a duplicate
	// of the existing text version.
	$(document).ready(function() {
		$('.colorpicker').each(function(i,elem) {
			var old = elem.value;
			elem.value = ":)";
			if(elem.value === ":)") {
				elem.style.display = "none";
			}
			elem.value = old;
		});
	});
}());
