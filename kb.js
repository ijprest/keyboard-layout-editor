/*jslint bitwise:true, white:true, plusplus:true, vars:true, browser:true, devel:true, regexp:true */
/*global angular:true, rison:true, $:true */
(function () {
	"use strict";

	function toJsonPretty(obj) {
		var res = [];
		obj.forEach(function(elem,ndx) {
			// We don't want CSS & notes in the Raw Data editor; they have their
			// own editors, and inclusion in the raw data tab just clutters it up.
			// Other metadata isn't too bad, but doesn't really offer any benefit.
			if(ndx > 0 || (elem instanceof Array)) {
				res.push($serial.toJsonL(elem));
			}
		});
		return res.join(",\n")+"\n";
	}
	function fromJsonPretty(json) { return $serial.fromJsonL('['+json+']'); }

	// The angular module for our application
	var kbApp = angular.module('kbApp', ["ngSanitize", "ngCookies", "ui.utils", "ui.bootstrap", "ui.bootstrap.tooltip", "ui.ace", "ngFileUpload", "ang-drag-drop", "colorpicker.module"], function($tooltipProvider) {
		// Default tooltip behaviour
		$tooltipProvider.options({animation: false, appendToBody: true});
	});

	// The main application controller
	kbApp.controller('kbCtrl', ['$scope','$http','$location','$timeout', '$sce', '$sanitize', '$modal', '$cookies', '$confirm', '$q', function($scope, $http, $location, $timeout, $sce, $sanitize, $modal, $cookies, $confirm, $q) {
		var serializedTimer = false;
		var customStylesTimer = false;

		// The application version
		$scope.version = "0.15";

		// Github data
		$scope.githubClientId = $location.host() === "localhost" ? "8b7b224a9e212c5c17e2" : "631d93caeaa61c9057ab";
		function github(path, method, data) {
			method = method || "GET";
			var headers = {};
			headers["Accept"] = "application/vnd.github.v3+json";
			if($cookies.oauthToken) {
				headers["Authorization"] = "token " + $cookies.oauthToken;
			}
			return $http({method:method, url:"https://api.github.com"+path, headers:headers, data:data, cache:false});
		}
		$scope.currentGist = null;
		$scope.isStarred = false;
		function setGist(gist) {
			$scope.currentGist = gist;
			$scope.isStarred = false;
			if(gist) {
				github("/gists/"+gist.id+"/star").success(function() { $scope.isStarred = true; });
			}
		}
		$scope.setGistStar = function(gist, star) {
			if($scope.user && $scope.user.id && gist && (gist != $scope.currentGist || $scope.isStarred != star)) {
				github("/gists/"+gist.id+"/star", star ? "PUT" : "DELETE").success(function() {
					if(gist === $scope.currentGist) {
						$scope.isStarred = star;
					}
				});
			}
		}

		// The selected tab; 0 == Properties, 1 == Kbd Properties, 3 == Custom Styles, 2 == Raw Data
		$scope.selTab = 0;

		// An array used to keep track of the selected keys
		$scope.selectedKeys = [];

		// A single key selection; if multiple keys are selected, this is the
		// most-recently selected one.
		$scope.multi = {};
		$scope.meta = {};

		// Options
		$scope.sizeStep = 0.25;
		$scope.moveStep = 0.25;
		$scope.rotateStep = 15;

		// The keyboard data
		$scope.keyboard = { keys: [], meta: {} };
		$scope.keys = function(newKeys) { if(newKeys) { $scope.keyboard.keys = newKeys; } return $scope.keyboard.keys; };

		// Custom Styles data
		$scope.customStylesException = "";
		$scope.customStyles = "";
		$scope.customGlyphs = [];

		// Helper function to select/deselect all keys
		$scope.unselectAll = function() {
			$scope.selectedKeys = [];
			$scope.multi = {};
		};
		$scope.selectAll = function(event) {
			if(event) { event.preventDefault(); event.stopPropagation(); }
			$serial.sortKeys($scope.keys());
			$scope.unselectAll();
			$scope.keys().forEach(function(key) {
				$scope.selectedKeys.push(key);
			});
			if($scope.keys().length>0) {
				$scope.multi = angular.copy($scope.keys().last());
			}
		};

		$scope.save = function(event) {
			if(!$scope.user || !$scope.user.id) {
				return;
			}
			if(event) {
				event.preventDefault();
				event.stopPropagation();
			}
			if($scope.dirty) {
				// Make a copy of the keyboard, and extract the CSS & notes
				var layout = angular.copy($scope.keyboard);
				var css = layout.meta.css; delete layout.meta.css;
				var notes = layout.meta.notes; delete layout.meta.notes;
				var description = layout.meta.name || "Untitled Keyboard Layout";

				// Compute a reasonable filename base from the layout's name
				var fn_base = (layout.meta.name || "layout").trim().replace(/[\"\']/g,'').replace(/\s/g,'-').replace(/[^-A-Za-z0-9_,;]/g,'_');
				var fn_base_old = fn_base;

				var url = "/gists";
				var method = "POST";
				if($scope.currentGist) {
					// Saving over existing Gist
					if(!$scope.currentGist.owner || ($scope.currentGist.owner.login !== $scope.user.id)) {
						// Different owner
						if(window.confirm("This layout is owned by a different user.\n\nDid you want create your own fork of this layout?")) {
							github("/gists/" + $scope.currentGist.id + "/forks", "POST").success(function(response) {
								// success
								$location.path("/gists/"+response.id).hash("").replace();
								setGist(response);
								$scope.save(); // recurse to do the actual saving
							}).error(function(data, status) {
								// error
								$scope.saved = false;
								$scope.saveError = status.toString() + " - " + data.toString();
							});
						}
						return;
					}

					// Updating our own Gist
					url = "/gists/" + $scope.currentGist.id;
					method = "PATCH";

					// Determine existing filename base
					for(var fn in $scope.currentGist.files) {
						var ndx = fn.indexOf(".kbd.json");
						if(ndx >= 0) {
							fn_base_old = fn.substring(0,ndx);
							break;
						}
					}
				}

				// Build the data structure
				var data = { description: description, files: {} };
				var doFile = function(suffix, fileData) {
					if(fileData) {
						data.files[fn_base_old+suffix] = {filename: fn_base+suffix, content: fileData};
					} else if($scope.currentGist && $scope.currentGist.files[fn_base_old+suffix]) {
						data.files[fn_base_old+suffix] = null; // Remove existing file
					}
				}
				doFile(".kbd.json", angular.toJson($serial.serialize(layout), true /*pretty*/));
				doFile(".style.css", css);
				doFile(".notes.md", notes);

				// Post data to GitHub
				github(url, method, data).success(function(response) {
					//success
					$scope.dirty = false;
					$scope.saved = response.id;
					$location.path("/gists/"+response.id).hash("").replace();
					$scope.saveError = "";
					setGist(response);
				}).error(function(data,status) {
					// error
					$scope.saved = false;
					$scope.saveError = status.toString() + " - " + data.toString();
				});
			}
		};
		$scope.canSave = function() {
			return $scope.dirty && $scope.user && $scope.user.id;
    };
    $scope.getFilename = function() {
      var name = $scope.keyboard.meta.name.toLowerCase();
      name = name.replace(/[\/\?<>\\:\*\|": \t\x00-\x1f\x80-\x9f\.]+/g,'-'); // control codes, whitespace & invalid filename characters
      name = name.replace(/^(con|prn|aux|nul|com[0-9]|lpt[0-9])$/,''); // reserved windows filenames
      console.log(name);
      return name || "keyboard-layout";
    }
		$scope.downloadSvg = function() {
			var data = $renderKey.fullSVG($scope.keys(), $scope.keyboard.meta);
			var blob = new Blob([data], {type:"image/svg+xml"});
			saveAs(blob, $scope.getFilename()+".svg");
		};
		$scope.downloadPng = function() {
			html2canvas($("#keyboard-bg"), {
				useCORS: true,
				onrendered: function(canvas) {
					canvas.toBlob(function(blob) {
						saveAs(blob, $scope.getFilename()+".png");
					});
				}
			});
		};
		function getResizedCanvas(canvas,newWidth,newHeight,bgcolor) {
			var tmpCanvas = document.createElement('canvas');
			tmpCanvas.width = newWidth;
			tmpCanvas.height = newHeight;

			var ctx = tmpCanvas.getContext('2d');
			if (bgcolor != '') {
				ctx.rect(0,0,newWidth,newHeight);
				ctx.fillStyle=bgcolor;
				ctx.fill();
			};
			ctx.drawImage(canvas,0,0,canvas.width,canvas.height,0,0,newWidth,newHeight);
			return tmpCanvas;
		}

		$scope.downloadJpg = function() {
			html2canvas($("#keyboard-bg"), {
				useCORS: true,
				onrendered: function(canvas) {
					var thm = getResizedCanvas(canvas,canvas.width,canvas.height,'white'); // not actually resize, just get white background
					thm.toBlob(function(blob) {
						saveAs(blob, $scope.getFilename()+".jpg");
					},"image/jpeg");
				}
			});
		};

		$scope.downloadThumb = function() {
			html2canvas($("#keyboard-bg"), {
				useCORS: true,
				onrendered: function(canvas) {
					var p = 110 / canvas.width;
					var thmwidth = canvas.width * p;
					var thmheight = canvas.height * p;
					var thm = getResizedCanvas(canvas,thmwidth,thmheight,'');
					thm.toBlob(function(blob) {
						saveAs(blob, $scope.getFilename()+"-thumb.png");
					});
				}
			})
		};

		$scope.downloadJson = function() {
			var data = angular.toJson($serial.serialize($scope.keyboard), true /*pretty*/);
			var blob = new Blob([data], {type:"application/json"});
			saveAs(blob, $scope.getFilename()+".json");
		};
		$scope.uploadJson = function(file, event) {
			if(file && file[0]) {
				var reader = new FileReader();
				reader.onload = function(event) {
					transaction("upload", function() {
						$scope.$apply(function() {
							$scope.deserializeAndRender($serial.fromJsonL(event.target.result));
						});
					});
				};
				reader.readAsText(file[0]);
			}
		};

		// count the keys
		// use ~Total instead of Total to force it to bottom when displeyed
		$scope.keyCount = function() {
			var kcounts = new Object();
			kcounts["~Total"] = 0;
			kcounts["Decals"] = 0;
			angular.forEach($scope.keys(), function(key) {
				kcounts["~Total"]++;
				var thisk = "";
				if(key.decal) {
					kcounts["Decals"]++;
					thisk = "Decal ";
				}
				thisk += key.width + " x " + key.height;
				if(!key.decal) {
						var foo = key.color; // next line refused to work with key.color.
						var colourname = reverseColors[foo];
						if(!colourname) { // not a defined name
							colourname = "";
						}
					thisk += " " + colourname + " (" + key.color + ")";
				}
				if(kcounts[thisk]) {
					kcounts[thisk]++;
				} else {
					kcounts[thisk] = 1;
				}
			});
			kcounts["~Total less decals"] = kcounts["~Total"] - kcounts["Decals"];
			return kcounts;
		};
		// count the switches
		// use ~Total instead of Total to force it to bottom when displeyed
		$scope.switchCount = function() {
			var scounts = new Object();
			scounts["~Total"] = 0;
			angular.forEach($scope.keys(), function(key) {
				if(!key.decal) {
					scounts["~Total"]++;
					var thissw = key.st || $scope.meta.switchType;
					if(thissw) {
						scounts[thissw] = (scounts[thissw] || 0) + 1;
					}
				}
			});
			return scounts;
		};

		// strip the colour string out of the switch color
		// todo: handle white or near-white since it will be invisible.
		$scope.getTextColor = function(butt) {
			if((butt.substring(0,1) == "~") || (butt.substring(0,1) == "D")) {
				return "#ffffff"; // leave the decals and totals lines alone
			}
			var hex1 = butt;
			var re = /.*\(/;
			var hex2 = hex1.replace(re, '');
			var re = /\).*/;
			hex1 = hex2.replace(re, '');
			return hex1;
		};

		// for printing the summary only. Modified from http://stackoverflow.com/questions/468881/print-div-id-printarea-div-only/7532581#7532581 answered Feb 27 '14 at 17:47
		$scope.printDiv = function(divName) {
			var printContents = document.getElementById(divName).innerHTML;
			document.getElementById("summary_print").innerHTML = printContents;
			document.getElementById("body_all").style.display = "none";
			document.getElementById("summary_print").style.display = "";
			window.print();
			document.getElementById("summary_print").innerHTML = "";
			document.getElementById("body_all").style.display = "";
			document.getElementById("summary_print").style.display = "none";
		};

		$scope.removeLegendsButtons = [
			{ label: "All", re: /.*/, tooltip: "Remove all the legends from all the keys. Does not remove decals." },
			{ label: "Alphas", re: /^[A-Za-z]$/, tooltip: "Remove the legends from all the Alphabetical keys." },
			{ label: "Numbers", re: /^[0-9]*$/, tooltip: "Remove the legends from all the Number keys." },
			{ label: "Punctuation", re: /^[\`\~\!\@\#\$\%\^\&\*\(\)\-\_\=\+\[\{\]\}\;\:\'\"\,\<\.\>\/\?\\\|]$/, tooltip: "Remove the legends from all the Punctuation keys." },
			{ label: "Function", re: /F\d\d?/, tooltip: "Remove the legends from all the Function keys." },
			{ label: "Specials", re: /<.*>/, tooltip: "Remove the special legends, like FontAwesome, WebFont, images, etc, and anything between them in the same slot." },
			{ label: "Others", re: /^[^A-Za-z0-9\`\~\!\@\#\$\%\^\&\*\(\)\-\_\=\+\[\{\]\}\;\:\'\"\,\<\.\>\/\?\\\|]$|^[A-Za-z\s][A-Za-z\s]+$|\&\#.*|\&.*?;/, tooltip: "Remove the legends from (almost) all the other keys except decals." },
			{ label: "Decals", re: /.*/, decals: true, tooltip: "Remove the legends from all the Decals." },
		];
		$scope.removeLegends = function(button) {
			var keys = $scope.selectedKeys.length > 0 ? $scope.selectedKeys : $scope.keys();
			transaction("remove-legends", function() {
				angular.forEach(keys, function(key) {
					if(key.decal === (!!button.decals)) {
						for(var i=0; i<12; i++) {
							if(key.labels[i]) {
								update(key,"labels",key.labels[i].replace(button.re,''),i); // should we wipe the textSize and textColor too?
								renderKey(key);
							}
						}
					}
				});
			});
		};

		var align = { hmask:0x0f, hcenter:0x00, left:0x01, right:0x02, vmask:0xf0, vcenter:0x00, top:0x10, bottom:0x20, center:0x00, };
		$scope.alignLegendsButtons = [
			{ label: "&#8598;", flags: align.left    | align.top     },
			{ label: "&#8593;", flags: align.hcenter | align.top     },
			{ label: "&#8599;", flags: align.right   | align.top     },
			{ label: "&#8592;", flags: align.left    | align.vcenter },
			{ label: "&#9679;", flags: align.hcenter | align.vcenter },
			{ label: "&#8594;", flags: align.right   | align.vcenter },
			{ label: "&#8601;", flags: align.left    | align.bottom  },
			{ label: "&#8595;", flags: align.hcenter | align.bottom  },
			{ label: "&#8600;", flags: align.right   | align.bottom  },
		];

		function moveLabel(key, from, to) {
			key.labels[to] = key.labels[from];
			key.labels[from] = '';
			key.textColor[to] = key.textColor[from];
			key.textColor[from] = '';
			key.textSize[to] = key.textSize[from];
			key.textSize[from] = 0;
		}

		function alignSingleRow(key, flags, left, middle, right) {
			var render = false;
			switch(flags) {
				case align.left:
					if(!key.labels[left]) { render = true; moveLabel(key, middle, left); moveLabel(key, right, middle); }
					if(!key.labels[left]) { render = true; moveLabel(key, middle, left); }
					break;
				case align.right:
					if(!key.labels[right]) { render = true; moveLabel(key, middle, right); moveLabel(key, left, middle); }
					if(!key.labels[right]) { render = true; moveLabel(key, middle, right); }
					break;
				case align.hcenter:
					if(key.labels[left] && !key.labels[middle] && !key.labels[right]) { render = true; moveLabel(key, left, middle); }
					if(key.labels[right] && !key.labels[middle] && !key.labels[left]) { render = true; moveLabel(key, right, middle); }
					break;
			}
			return render;
		}

		$scope.alignLegends = function(flags) {
			var keys = $scope.selectedKeys.length > 0 ? $scope.selectedKeys : $scope.keys();
			transaction("align-legends", function() {
				angular.forEach(keys, function(key) {
					if(!key.decal) {
						var render = false;
						for(var i = 0; i < 12; i += 3) // horizontal alignment
							render = alignSingleRow(key, flags & align.hmask, i, i+1, i+2) || render;
						for(var i = 0; i < 3; i += 1) // vertical alignment
							render = alignSingleRow(key, (flags & align.vmask) >> 4, i, i+3, i+6) || render;
						if(render) renderKey(key);
					}
				});
			});
		};

		$scope.unhideDecals = function() {
			var keys = $scope.selectedKeys.length > 0 ? $scope.selectedKeys : $scope.keys();
			transaction("unhide-decals", function() {
				angular.forEach(keys, function(key) {
					if(key.decal) {
						update(key,'decal',false);
						renderKey(key);
					}
				});
			});
		};

		$scope.moveFromId = null;
		$scope.moveToId = null;
		$scope.moveSingleLegends = function() {
			var keys = $scope.selectedKeys.length > 0 ? $scope.selectedKeys : $scope.keys();
			if($scope.moveFromId >= 0 && $scope.moveToId >= 0) {
				transaction("move-legends", function() {
					angular.forEach(keys, function(key) {
						if(!key.decal && key.labels[$scope.moveFromId] && !key.labels[$scope.moveToId]) {
							moveLabel(key, $scope.moveFromId, $scope.moveToId);
							renderKey(key);
						}
					});
				});
			}
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
		$scope.serializedObjects = [];

		// Known layouts/presets
		$scope.layouts = {};
		$scope.samples = {};
		$http.get('layouts.json').success(function(data) {
			$scope.layouts = data.presets;
			$scope.samples = data.samples;
		});

		// Known backgrounds
		$scope.backgrounds = {};
		$http.get('backgrounds.json').success(function(data) {
			$scope.backgrounds = data;
		});

		$http.get('switches.json').success(function(data) {
			$scope.switches = data;
			$scope.switchNames = {};
			for(var mountName in $scope.switches) {
				var mountType = $scope.switches[mountName];
				for(var brandName in mountType.brands) {
					var brandType = mountType.brands[brandName];
					for(var part in brandType.switches) {
						var switchType = brandType.switches[part];
						$scope.switchNames[part] = brandType.name + " / " + switchType.name;
					}
				}
			}
		});

		// The currently selected palette & character-picker
		$scope.palette = {};
		$scope.picker = {};
		$scope.pickerSelection = {};

		var reverseColors = {}; // array to provide fast reverse lookups of colour names for Summary.
		                        // might be an issue if a colour features twice... only last will stick
		// The set of known palettes
		$scope.palettes = {};
		$http.get('colors.json').success(function(data) {
			$scope.palettes = data;
			$scope.palettes.forEach(function(palette) {
				palette.colors.forEach(function(color) {
					color.css = $color.sRGB8(color.r,color.g,color.b).hex();
					reverseColors[color.css] = palette.name + " " + color.name;
				});
			});
		});

		// The set of known character pickers
		$scope.pickers = {};
		$http.get('pickers.json').success(function(data) {
			$scope.pickers = data;
		});

		// A set of "known special" keys
		$scope.specialKeys = {};
		$http.get('keys.json').success(function(data) {
			$scope.specialKeys = data;
		});

		// Helper to calculate the height of the keyboard layout; cached to improve performance.
		$scope.kbHeight = 0;
		$scope.calcKbHeight = function() {
			var right = 0, bottom = 0;
			$scope.keys().forEach(function(key) {
				right = Math.max(right, key.bbox.x2);
				bottom = Math.max(bottom, key.bbox.y2);
			});
			$scope.kbWidth = right;
			$scope.kbHeight = bottom;
			$scope.kbFullHeight = bottom;
			if($scope.keyboard.meta.name || $scope.keyboard.meta.author)
				$scope.kbFullHeight += 32;
		};

		function updateFromCss(css) {
			var rules = $cssParser.parse(css);
			$scope.customGlyphs = $renderKey.getGlyphsFromRules(rules); // glyphs first, before rules are modified!
			$scope.customStyles = $sce.trustAsHtml($renderKey.sanitizeCssRules(rules));
			if($scope.picker.sentinel === userGlyphsSentinel) {
				$scope.picker.glyphs = $scope.customGlyphs;
			}
		}

		// Given a key, generate the HTML needed to render it
		function renderKey(key) {
			key.html = $sce.trustAsHtml($renderKey.html(key,$sanitize));
		}

		$scope.deserializeAndRender = function(data, skipMetadata) {
			$scope.serializedObjects = data; // cache serialized objects
			var backup = angular.copy($scope.keyboard.meta);
			$scope.keyboard = $serial.deserialize(data);
			$scope.keys().forEach(function(key) {
				renderKey(key);
			});
			if(skipMetadata) {
				// Use backup metadata
				var defaults = $serial.defaultMetaData();
				for(var k in backup) {
					if(backup.hasOwnProperty(k) && $scope.keyboard.meta[k] === defaults[k]) {
						$scope.keyboard.meta[k] = backup[k];
					}
				}
			}
			$scope.meta = angular.copy($scope.keyboard.meta);
			updateFromCss($scope.meta.css || '');
		};

		function updateSerialized() {
			//$timeout.cancel(serializedTimer); // this is slow, for some reason
			$scope.deserializeException = "";
			$scope.serializedObjects = $serial.serialize($scope.keyboard);
			$scope.serialized = toJsonPretty($scope.serializedObjects);
		}

		$scope.$on('$locationChangeStart', function(event, newUrl, oldUrl) {
			if($location.path() === '') {
				event.preventDefault();
			}
		});

		function loadAndRender(path) {
			if(path.substring(0,7) === '/gists/') {
				// Load Gists from Github
				github(path).success(function(data) {
					var json = "", css = "", notes = "";
					for(var fn in data.files) {
						if(fn.indexOf(".kbd.json")>=0) {
							json = data.files[fn].content;
						} else if(fn.indexOf(".style.css")>=0) {
							css = data.files[fn].content;
						} else if(fn.indexOf(".notes.md")>=0) {
							notes = data.files[fn].content;
						}
					}

					$scope.deserializeAndRender(jsonl.parse(json));
					if(css) {
						updateFromCss($scope.meta.css = css);
						$scope.keyboard.meta.css = $scope.meta.css;
					}
					if(notes) {
						$scope.keyboard.meta.notes = $scope.meta.notes = notes;
					}
					updateSerialized();
					$scope.loadError = false;
					setGist(data);
				}).error(function() {
					$scope.loadError = true;
					setGist(null);
				});

			} else {
				// Saved layouts & samples
				var base = $serial.base_href;
				if(path.substring(0,9) === '/samples/') {
					base = ''; // Load samples from local folder
				}
				$http.get(base + path).success(function(data) {
					$scope.deserializeAndRender(data);
					updateSerialized();
					$scope.loadError = false;
				}).error(function() {
					$scope.loadError = true;
				});
			}
		}

		$renderKey.init();
		$scope.deserializeAndRender([]);
		if($location.hash()) {
			var loc = $location.hash();
			if(loc[0]=='@') {
				$scope.deserializeAndRender(URLON.parse(encodeURI(loc)));
			} else {
				$scope.deserializeAndRender($serial.fromJsonL(loc));
			}
		} else if($location.path()[0] === '/' && $location.path().length > 1) {
			loadAndRender($location.path());
		} else {
			// Some simple default content... just a numpad
			$scope.deserializeAndRender([
				["Num Lock","/","*","-",
					{x:0.25,f:4,w:14,h:5,d:true},"<h5><b>Getting Started with Keyboard-Layout-Editor.com</b></h5>"+
					"<p>Keyboard-layout-editor.com is a web application that enables the editing of keyboard-layouts, i.e., the position and appearance of each physical key.</p>"+
					"<p>Start by exploring the presets and samples from the menu-bar to give you an idea of the possibilities.  Once you are ready to start designing your own keyboard, just load one of the presets and start customizing it!  Some tips:</p>"+
					"<ul><li>The selected keys can be modified on the <i>Properties</i> tab.</li>"+
					"<li>The <i>Keyboard Properties</i> tab lets you edit the keyboard background and keyboard metadata.</li>"+
					"<li>The <i>Custom Styles</i> tab lets you write advanced CSS styling rules.</li>"+
					"<li>Don't forget the <i>Color Swatches</i> and <i>Character Picker</i> menu items!  These give you easy access to colors and symbol characters, respectively.</li>"+
					"<li>There are a lot of available keyboard shortcuts; press '?' or 'F1' to see a list.</li></ul>"+
					"<p>When you're ready to save your layout, simply 'Sign In' with your <a href='https://www.github.com'>GitHub</a> account and click the <i>Save</i> button.  Your layout will be saved in a GitHub Gist.</p>"+
					"<p>Have fun!</p>"],
				[{f:3},"7\nHome","8\n↑","9\nPgUp",{h:2},"+"],
				["4\n←","5","6\n→"],
				["1\nEnd","2\n↓","3\nPgDn",{h:2},"Enter"],
				[{w:2},"0\nIns",".\nDel"]
			]);
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
		var dirtyMessage = 'You have made changes to the layout that are not saved.  You can save your layout to the server by clicking the \'Save\' button.  You can also save your layout locally by bookmarking the \'Permalink\' in the application bar.';
		window.onbeforeunload = function(e) {
			if($scope.dirty) return dirtyMessage;
		};
		function confirmNavigate() {
			if(!$scope.dirty) {
				var deferred = $q.defer();
				deferred.resolve();
				return deferred.promise;
			}
			return $confirm.show(dirtyMessage + "\n\nAre you sure you want to navigate away?");
		}
		function resetUndoStack() {
			undoStack = [];
			redoStack = [];
			canCoalesce = false;
			$scope.dirty = false;
			$scope.saved = false;
			$scope.saveError = "";
		}

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
				if(!$scope.currentGist) {
					$location.path("").hash("").replace();
				}
				trans.modified = angular.copy($scope.keyboard);
				trans.open = false;
				redoStack = [];
				if(type !== 'rawdata') {
					updateSerialized();
				}
				$scope.dirty = true;
				$scope.saved = false;
				$scope.saveError = "";
				$scope.loadError = false;
			}
		}

		function refreshAfterUndoRedo(type) {
			updateSerialized();
			$scope.keys().forEach(function(key) {
				renderKey(key);
			});
			$scope.unselectAll();
			$scope.meta = angular.copy($scope.keyboard.meta);
			if(type === 'customstyles' || type === 'preset' || type === 'upload' || type === 'rawdata') {
				updateFromCss($scope.meta.css || '');
			}
		}

		$scope.undo = function() {
			if($scope.canUndo()) {
				var u = undoStack.pop();
				$scope.keyboard = angular.copy(u.original);
				refreshAfterUndoRedo(u.type);
				redoStack.push(u);
				$scope.dirty = u.dirty;
			}
		};

		$scope.redo = function() {
			if($scope.canRedo()) {
				var u = redoStack.pop();
				$scope.keyboard = angular.copy(u.modified);
				refreshAfterUndoRedo(u.type);
				undoStack.push(u);
				$scope.dirty = true;
			}
		};

		// Validate a key's property values
		function validate(key,prop,value) {
			var v = {
				_ : function() { return value; },
				x : function() { return Math.max(0, Math.min(36, value)); },
				y : function() { return Math.max(0, Math.min(36, value)); },
				x2 : function() { return Math.max(-Math.abs(key.width-key.width2), Math.min(Math.abs(key.width-key.width2), value)); },
				y2 : function() { return Math.max(-Math.abs(key.height-key.height2), Math.min(Math.abs(key.height-key.height2), value)); },
				width : function() { return Math.max(0.5, Math.min(24, value)); },
				height : function() { return Math.max(0.5, Math.min(24, value)); },
				width2 : function() { return Math.max(0.5, Math.min(24, value)); },
				height2 : function() { return Math.max(0.5, Math.min(24, value)); },
				textSize : function() { return Math.max(1, Math.min(9, value)); },
				rotation_angle : function() { return Math.max(-180, Math.min(180, value)); },
				rotation_x : function() { return Math.max(0, Math.min(36, value)); },
				rotation_y : function() { return Math.max(0, Math.min(36, value)); },
				"meta.radii" : function() { var ndx = value.indexOf(';'); return ndx>=0 ? value.substring(0,ndx) : value; }
			};
			return (v[prop] || v._)();
		}

		function update(key,prop,value,index) {
			var u = {
				_ : function() { key[prop] = value; },
				width : function() { key.width = value; if(!key.stepped || key.width > key.width2) key.width2 = value; },
				height : function() { key.height = value; if(!key.stepped || key.height > key.height2) key.height2 = value; },
				textColor : function() { if(index<0) { key.default.textColor = value; key.textColor = []; } else { key.textColor[index] = value; } },
				textSize : function() { if(index<0) { key.default.textSize = value; key.textSize = []; } else { key.textSize[index] = value; } },
				labels : function() { key.labels[index] = value; },
				stepped : function() {
					if(!key.decal) {
						key[prop] = value;
						if(value && key.width === key.width2) {
							if(key.width > 1) {
								key.width = Math.max(1, key.width-0.5);
							} else {
								key.width2 = key.width+0.5;
							}
						}
					}
				},
				nub : function() { if(!key.decal) key[prop] = value; },
				ghost : function() { if(!key.decal) key[prop] = value; },
				decal : function() { key[prop] = value; key.x2 = key.y2 = 0; key.width2 = key.width; key.height2 = key.height; key.nub = key.stepped = key.ghost = false; },
				rotation_angle : function() { key.rotation_angle = value; key.rotation_x = $scope.multi.rotation_x; key.rotation_y = $scope.multi.rotation_y; },
				sm : function() { if(value===$scope.meta.switchMount) value=''; if(value != key.sm) { key.sm = value; key.sb = key.st = ''; } },
				sb : function() { if(value===$scope.meta.switchBrand) value=''; if(value != key.sb) { key.sb = value; key.st = ''; } },
				st : function() { if(value===$scope.meta.switchType) value=''; if(value != key.st) { key.st = value; } },
			};
			return (u[prop] || u._)();
		}

		$scope.updateMulti = function(prop, index) {
			if($scope.multi[prop] == null || $scope.selectedKeys.length <= 0) {
				return;
			}
			var value = index < 0 ? $scope.multi.default[prop] : (index !== undefined ? $scope.multi[prop][index] : $scope.multi[prop]);
			var valid = validate($scope.multi, prop, value);
			if(valid !== value) {
				return;
			}

			transaction("update", function() {
				$scope.selectedKeys.forEach(function(selectedKey) {
					update(selectedKey, prop, value, index);
					renderKey(selectedKey);
				});
				$scope.multi = angular.copy($scope.selectedKeys.last());
			});
		};
		$scope.setMulti = function(prop, value) {
			$scope.multi[prop] = value;
			$scope.updateMulti(prop);
		};

		$scope.validateMulti = function(prop, index) {
			if($scope.multi[prop] == null) {
				$scope.multi[prop] = "";
			}
			var value = index < 0 ? $scope.multi.default[prop] : (index !== undefined ? $scope.multi[prop][index] : $scope.multi[prop]);
			var valid = validate($scope.multi, prop, value);
			if(valid !== value) {
				if(index < 0)
					$scope.multi.default[prop] = valid;
				else if(index !== undefined)
					$scope.multi[prop][index] = valid;
				else
					$scope.multi[prop] = valid;
				$scope.updateMulti(prop, index);
			}
		};

		$scope.updateMeta = function(prop) {
			var value = $scope.meta[prop];
			var valid = validate($scope.meta, "meta."+prop, value);
			if(valid !== value) {
				return;
			}
			transaction("metadata", function() {
				$scope.keyboard.meta[prop] = value;
				if(prop==='switchMount') { $scope.keyboard.meta.switchBrand = $scope.keyboard.meta.switchType = ''; }
				else if(prop==='switchBrand') { $scope.keyboard.meta.switchType = ''; }
			});
			$scope.meta = angular.copy($scope.keyboard.meta);
			$scope.calcKbHeight();
		};
		$scope.validateMeta = function(prop) {
			var value = $scope.meta[prop];
			var valid = validate($scope.meta, "meta."+prop, value);
			if(valid !== value) {
				$scope.meta[prop] = valid;
				$scope.updateMeta(prop);
			}
		};
		$scope.setBackground = function(bg) {
			$scope.meta.background = bg;
			$scope.updateMeta('background');
		};

		updateSerialized();

		$scope.swapSizes = function() {
			transaction("swapSizes", function() {
				$scope.selectedKeys.forEach(function(selectedKey) {
					var temp;
					temp = selectedKey.width; selectedKey.width = selectedKey.width2; selectedKey.width2 = temp;
					temp = selectedKey.height; selectedKey.height = selectedKey.height2; selectedKey.height2 = temp;
					selectedKey.x += selectedKey.x2;
					selectedKey.y += selectedKey.y2;
					selectedKey.x2 = -selectedKey.x2;
					selectedKey.y2 = -selectedKey.y2;
					renderKey(selectedKey);
				});
				$scope.multi = angular.copy($scope.selectedKeys.last());
			});
		};

		$scope.swapColors = function() {
			transaction("swapColors", function() {
				$scope.selectedKeys.forEach(function(selectedKey) {
					var temp = selectedKey.color;
					selectedKey.color = selectedKey.default.textColor;
					selectedKey.default.textColor = temp;
					selectedKey.textColor = [];
					renderKey(selectedKey);
				});
				$scope.multi = angular.copy($scope.selectedKeys.last());
			});
		};

		$scope.pickerSelect = function(glyph) {
			$scope.pickerSelection = glyph;
		};
		$scope.dropGlyph = function(glyph,$event,textIndex) {
			$event.preventDefault();
			$event.stopPropagation();
			if($scope.selectedKeys.length<1) {
				return;
			}
			transaction("character-picker", function() {
				$scope.selectedKeys.forEach(function(selectedKey) {
					selectedKey.labels[textIndex] = glyph.html;
					renderKey(selectedKey);
				});
				$scope.multi = angular.copy($scope.selectedKeys.last());
			});
		};

		$scope.clickSwatch = function(color,$event) {
			$scope.dropSwatch(color,$event,$event.ctrlKey || $event.altKey,-1);
		};
		$scope.dropSwatch = function(color,$event,isText,textIndex) {
			$event.preventDefault();
			$event.stopPropagation();
			if($scope.selectedKeys.length<1) {
				return;
			}
			transaction("color-swatch", function() {
				$scope.selectedKeys.forEach(function(selectedKey) {
					if(isText) {
						if(textIndex<0) {
							selectedKey.default.textColor = color.css;
							selectedKey.textColor = [];
						}	else {
							selectedKey.textColor[textIndex] = color.css;
						}
					} else {
						selectedKey.color = color.css;
					}
					renderKey(selectedKey);
				});
				$scope.multi = angular.copy($scope.selectedKeys.last());
			});
		};

		$scope.makePaletteFromKeys = function(event) {
			if(event) {
				event.preventDefault();
			}
			var unselect = false;
			if($scope.selectedKeys.length<1) {
				$scope.selectAll();
				unselect = true;
			}

			var colors = {};
			// Get the unique colors of selected keys.
			$scope.selectedKeys.forEach(function(selectedKey) {
				colors[selectedKey.color] = null;
				colors[selectedKey.text] = null;
			});

			// Build palette.
			var p = {
				"name": "Custom palette",
				"description": "This is a custom palette generated from existing colors in the keyboard layout.",
				"href": $scope.getPermalink(),
				"colors": []
			};

			// Build colors.
			for (var prop in colors) {
				if (colors.hasOwnProperty(prop) && prop[0] == '#') {
					var color = null;
					// Look for the color in the current palette, and use it if found,
					// in order to keep the name.
					if($scope.palette && $scope.palette.colors) {
						for (var i = 0, len = $scope.palette.colors.length; i < len; ++i) {
							if ($scope.palette.colors[i].css == prop) {
								color = $scope.palette.colors[i];
								break;
							}
						}
					}
					if(color == null) {
						// Make a new color.
						color = $color.sRGB8(parseInt(prop.slice(1,3), 16),
						                     parseInt(prop.slice(3,5), 16),
						                     parseInt(prop.slice(5,7), 16));
						color.css = color.hex();
						color.name = color.css;
					}
					if(color) {
						p.colors.push(color);
					}
				}
			}
			p.colors.sort(function(a, b) { return a.name.localeCompare(b.name); });
			$scope.loadPalette(p);

			if (unselect) {
				$scope.unselectAll();
			}
		}

		$scope.moveKeys = function(x,y,$event) {
			$event.preventDefault();
			$event.stopPropagation();
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
					selectedKey.x = Math.round10(Math.max(0,selectedKey.x + x),-2);
					selectedKey.y = Math.round10(Math.max(0,selectedKey.y + y),-2);
					renderKey(selectedKey);
				});
				$scope.multi = angular.copy($scope.selectedKeys.last());
			});
			if(y !== 0) { $scope.calcKbHeight(); }
		};

		$scope.sizeKeys = function(x,y,$event) {
			$event.preventDefault();
			$event.stopPropagation();
			if($scope.selectedKeys.length<1) {
				return;
			}
			transaction("size", function() {
				$scope.selectedKeys.forEach(function(selectedKey) {
					update(selectedKey, 'width', validate(selectedKey, 'width', Math.round10(Math.max(1,selectedKey.width + x),-2)));
					update(selectedKey, 'height', validate(selectedKey, 'height', Math.round10(Math.max(1,selectedKey.height + y),-2)));
					renderKey(selectedKey);
				});
				$scope.multi = angular.copy($scope.selectedKeys.last());
			});
			if(y!==0) { $scope.calcKbHeight(); }
		};

		$scope.rotateKeys = function(angle,$event) {
			$event.preventDefault();
			$event.stopPropagation();
			if($scope.selectedKeys.length<1) {
				return;
			}
			transaction("rotate", function() {
				$scope.selectedKeys.forEach(function(selectedKey) {
					var newangle = (selectedKey.rotation_angle+angle+360)%360;
					while(newangle > 180) { newangle -= 360; }
					update(selectedKey, 'rotation_angle', Math.round(newangle));
					renderKey(selectedKey);
				});
				$scope.multi = angular.copy($scope.selectedKeys.last());
			});
			$scope.calcKbHeight();
		};
		$scope.moveCenterKeys = function(x,y,$event) {
			$event.preventDefault();
			$event.stopPropagation();
			if($scope.selectedKeys.length<1) {
				return;
			}
			transaction("moveCenter", function() {
				$scope.selectedKeys.forEach(function(selectedKey) {
					update(selectedKey, 'rotation_x', validate(selectedKey, 'rotation_x', Math.round10($scope.multi.rotation_x + x,-2)));
					update(selectedKey, 'rotation_y', validate(selectedKey, 'rotation_y', Math.round10($scope.multi.rotation_y + y,-2)));
					renderKey(selectedKey);
				});
				$scope.multi = angular.copy($scope.selectedKeys.last());
			});
			$scope.calcKbHeight();
		};

		var userGlyphsSentinel = {};
		$scope.loadCharacterPicker = function(picker) {
			$scope.picker = picker || {
				name: "User-Defined Glyphs",
				glyphs: $scope.customGlyphs,
				href: "https://github.com/ijprest/keyboard-layout-editor/wiki/Custom-Styles",
				description: "This list will show any glyphs defined in your layout's 'Custom Styles' tab.  See the Commodore VIC-20 sample layout for an example.",
				sentinel: userGlyphsSentinel
			};
			$scope.palette = {}; // turn off the palette
			$scope.pickerFilter = '';
			$scope.pickerSelection = {};

			// Load the CSS if necessary
			if($scope.picker.css && !$scope.picker.glyphs) {
				$http.get($scope.picker.css).success(function(css) {
					$scope.picker.glyphs = $renderKey.getGlyphsFromRules($cssParser.parse(css));
				});
			}
		};

		$scope.loadPalette = function(p) {
			$scope.palette = p;
			$scope.picker = {}; // turn off the character picker
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

		$scope.loadPreset = function(preset, path) {
			confirmNavigate().then(function() {
				transaction("preset", function() {
					$scope.deserializeAndRender(preset);
				});
				setGist(null);
				resetUndoStack();
				$location.path(path || "").hash("").replace();
				$scope.dirty = false;
			});
		};
		$scope.loadSample = function(sample) {
			$http.get(sample).success(function(data) {
				$scope.loadPreset(data, sample);
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
				$scope.keys().forEach(function(key) {
					if(!$scope.selectedKeys.length || (key.rotation_angle == $scope.multi.rotation_angle && key.rotation_x == $scope.multi.rotation_x && key.rotation_y == $scope.multi.rotation_y)) {
						ypos = Math.max(ypos,key.y);
					}
				});
				ypos++;
			}
			return {x:xpos, y:ypos};
		}

		$scope.addKey = function(proto, nextline) {
			var newKey = null;
			transaction("add", function() {
				var pos = whereToAddNewKeys(nextline);
				var _addKey = function(proto) {
					newKey = $serial.defaultKeyProps();
					if($scope.selectedKeys.length>0) {
						newKey.color = $scope.multi.color;
						newKey.textColor = $scope.multi.textColor;
						newKey.profile = $scope.multi.profile;
						newKey.rotation_angle = $scope.multi.rotation_angle;
						newKey.rotation_x = $scope.multi.rotation_x;
						newKey.rotation_y = $scope.multi.rotation_y;
					}
					$.extend(newKey, proto);
					newKey.x += pos.x;
					newKey.y += pos.y;
					renderKey(newKey);
					pos.x += Math.max(newKey.width, newKey.width2);
					$scope.keys().push(newKey);
				}
				if(proto instanceof Array) {
					proto.forEach(_addKey);
				} else {
					_addKey(proto);
				}
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
						$scope.deserializeAndRender(fromJsonPretty($scope.serialized), true);
					});
					$scope.unselectAll();
				} catch(e) {
					$scope.deserializeException = e.toString();
				}
			}, 1000);
		};

		$scope.updateCustomStyles = function() {
			if(customStylesTimer) {
				$timeout.cancel(customStylesTimer);
			}
			customStylesTimer = $timeout(function() {
				try {
					$scope.customStylesException = "";
					transaction("customstyles", function() {
						updateFromCss($scope.meta.css);
						$scope.keyboard.meta.css = $scope.meta.css;
					});
					$scope.calcKbHeight();
				} catch(e) {
					$scope.customStylesException = e.toString();
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
			event.stopPropagation();
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
				var kbElem = $("#keyboard-bg");
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
						if( key.bbox.x >= $scope.selRect.l && key.bbox.x+key.bbox.w <= $scope.selRect.l+$scope.selRect.w &&
							key.bbox.y >= $scope.selRect.t && key.bbox.y+key.bbox.h <= $scope.selRect.t+$scope.selRect.h )
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
						// Rotate the mouse coordinates into transformed key-space, if necessary
						var pt = { x:event.pageX-offsetx, y:event.pageY-offsety };
						if(key.rotation_angle) {
							pt = key.mat.transformPt(pt);
						}

						// Just check to see if the mouse click is within any key rectangle
						if( (key.rect.x <= pt.x && key.rect.x+key.rect.w >= pt.x &&
							 key.rect.y <= pt.y && key.rect.y+key.rect.h >= pt.y) ||
							(key.rect2.x <= pt.x && key.rect2.x+key.rect2.w >= pt.x &&
							 key.rect2.y <= pt.y && key.rect2.y+key.rect2.h >= pt.y) )
						{
							selectKey(key, {ctrlKey:event.ctrlKey, altKey:event.altKey, shiftKey:event.shiftKey});
						}
					});
				}
				canCoalesce = false;

				event.preventDefault();
				event.stopPropagation();

				// Focus the keyboard, so keystrokes have the desired effect
				$('#keyboard').focus();
			}
		};

		$scope.getPermalink = function() {
			var url = $location.absUrl().replace(/#.*$/,"");
			url += "##" + URLON.stringify($scope.serializedObjects);
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
				$('#labeleditor0').focus().select();
			} else {
				if($scope.selTab !== 1) {
					$scope.selTab = 1;
					$('#kbdproperties').removeClass('hidden');
				}
				$('#kbdcoloreditor').focus().select();
			}
		};

		var activeModal = null;
		$scope.showMarkdown = function(filename, event) {
			if($scope.markdownTitle !== filename) {
				$scope.markdownTitle = filename;
				$scope.markdownContent = '';
				$http.get(filename).success(function(data) {
					$scope.markdownContent = $sce.trustAsHtml(marked(data));
				});
			}
			if(activeModal) activeModal.close();
			activeModal = $modal.open({
				templateUrl:"markdownDialog.html",
				controller:"modalCtrl",
				scope:$scope,
				windowClass:"modal-xxl markdownDialog",
				resolve: { params: function() { return { parentScope: $scope }; } }
			});
			if(event) {
				event.preventDefault();
				event.stopPropagation();
			}
		};
		$scope.previewNotes = function(event) {
			$scope.markdownTitle = 'About This Keyboard Layout';
			var name = $scope.keyboard.meta.name;
			var author = $scope.keyboard.meta.author;
			var notes = $scope.keyboard.meta.notes;
			var markdown = (name ? ("### " + name + "\n") : "") +
			               (author ? ("#### _" + author + "_\n") : "") +
			               (notes ? (notes) : "");
			$scope.markdownContent = $sce.trustAsHtml($sanitize(marked(markdown)));
			$scope.showMarkdown($scope.markdownTitle, event);
		};

		$scope.showHelp = function(event) {
			if(!document.activeElement || (document.activeElement.nodeName !== "INPUT" && document.activeElement.nodeName !== "TEXTAREA")) {
				if(activeModal) activeModal.dismiss('cancel');
				activeModal = $modal.open({
					templateUrl:"helpDialog.html",
					controller:"modalCtrl",
					scope:$scope,
					windowClass:"modal-xl",
					resolve: { params: null }
				});
				event.preventDefault();
				event.stopPropagation();
			}
		};

		$scope.showOptions = function(event) {
			if(activeModal) activeModal.dismiss('cancel');
			activeModal = $modal.open({
				templateUrl:"optionsDialog.html",
				controller:"modalCtrl",
				scope:$scope,
				resolve: { params: function() { return { moveStep:$scope.moveStep, sizeStep:$scope.sizeStep, rotateStep:$scope.rotateStep }; } }
			});
			activeModal.result.then(function(params) { $.extend($scope, params); });
			if(event) {
				event.preventDefault();
				event.stopPropagation();
			}
		};

		// Clipboard functions
		var clipboard = {};
		$scope.cut = function(event) {
			if(event) {
				event.preventDefault();
				event.stopPropagation();
			}
			if($scope.selectedKeys.length>0) {
				clipboard = angular.copy($scope.selectedKeys);
				$scope.deleteKeys();
			}
		};
		$scope.copy = function(event) {
			if(event) {
				event.preventDefault();
				event.stopPropagation();
			}
			if($scope.selectedKeys.length>0) {
				clipboard = angular.copy($scope.selectedKeys);
			}
		};
		$scope.paste = function(event) {
			if(event) {
				event.preventDefault();
				event.stopPropagation();
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
		$scope.canCopy = function() { return $scope.selectedKeys.length > 0; };
		$scope.canPaste = function() { return clipboard.length > 0; };

		$scope.keyboardTop = function() { var kbElem = $("#keyboard"); return kbElem.position().top + parseInt(kbElem.css('margin-top'),10); };
		$scope.keyboardLeft = function() { var kbElem = $("#keyboard"); return kbElem.position().left + parseInt(kbElem.css('margin-left'),10); };

		function updateUserInfo() {
			if($cookies.oauthToken) {
				$scope.user = { id: '', name: "User", avatar: "<i class='fa fa-user'></i>" };
				github('/user').success(function(data) {
					$scope.user.id = data.login;
					$scope.user.name = data.login;
					if(data.avatar_url) {
						$scope.user.avatar = "<img src='"+data.avatar_url+"' class='avatar'>";
					}
				});
			} else {
				$scope.user = null;
			}
		}
		updateUserInfo();

		var userLoginSecret;
		var userLoginWindow;
		$scope.userLogin = function() {
			if(userLoginWindow) {
				if(userLoginWindow.closed) {
					userLoginSecret = null;
					userLoginWindow = null;
				} else {
					userLoginWindow.focus();
				}
			}

			if(!userLoginWindow && !$scope.user) {
				var parms = "&client_id="+ $scope.githubClientId +"&redirect_uri="+ ($location.host() === "localhost" ? "http://localhost:8080/oauth.html" : "http://www.keyboard-layout-editor.com/oauth.html");
				userLoginSecret = (window.performance && window.performance.now ? window.performance.now() : Date.now()).toString() + "_" + (Math.random()).toString();
				userLoginWindow = window.open("https://github.com/login/oauth/authorize?scope=gist&state="+userLoginSecret+parms,
					"Sign in with Github", "left="+(window.left+50)+",top="+(window.top+50)+",width=1050,height=630,personalbar=0,toolbar=0,scrollbars=1,resizable=1");
				if(userLoginWindow) {
					userLoginWindow.focus();
				}
			}
		};

		$scope.userLogout = function() {
			$cookies.oauthToken = "";
			updateUserInfo();
		};

		$scope.oauthError = null;
		window.__oauthError = function(error) {
			userLoginSecret = null;
			userLoginWindow = null;
			$scope.oauthError = error || 'Unknown error.';
			$scope.oauthToken = "";
			updateUserInfo();
		};

		window.__oauthSuccess = function(code, secret) {
			if(secret !== userLoginSecret) {
				window.__oauthError('The server returned an incorrect login secret.');
			} else {
				userLoginSecret = null;
				userLoginWindow = null;
				$cookies.oauthToken = code;
				updateUserInfo();
			}
		};

		$scope.showSavedLayouts = function(starred) {
			if(activeModal) activeModal.dismiss('cancel');
			activeModal = $modal.open({
				templateUrl:"savedLayouts.html",
				controller:"savedLayoutsCtrl",
				windowClass:"modal-xl",
				scope:$scope,
				resolve: { params: function() { return { github:github, starred:starred }; } }
			});
			activeModal.result.then(function(params) {
				if(params.load) {
					// Load the selected layout
					confirmNavigate().then(function() {
						var path = "/gists/"+params.load;
						$location.path(path).hash("").replace();
						loadAndRender(path);
						resetUndoStack();
					});
				} else if(params.delete) {
					// Delete the selected layout
					$confirm.show("Are you sure you want to delete this layout?").then(function() {
						github("/gists/"+params.delete, "DELETE").success(function() {
							// If this was the current gist that was deleted, remove it and mark the editor as dirty
							if($scope.currentGist.id == params.delete) {
								$location.path("").hash("").replace();
								setGist(null);
								$scope.dirty = true;
								undoStack.forEach(function(u) {	u.dirty = true;	});
							}
						});
					});
				}
			});
		};

		$scope.aceLoaded = function(editor) {
			editor.$blockScrolling = Infinity;
			editor.getSession().setUseWorker(false);
			editor.setFontSize(14);
			editor.renderer.setVScrollBarAlwaysVisible(true);
		};
	}]);

	// Simple modal-popup controller
	kbApp.controller('modalCtrl', function($scope, $modalInstance, params) {
		$scope.params = params;
		$scope.ok = function() { $modalInstance.close($scope.params); };
		$scope.cancel = function() { $modalInstance.dismiss('cancel'); };
	});

	kbApp.controller('savedLayoutsCtrl', function($scope, $modalInstance, params) {
		$scope.params = params;
		$scope.ok = function() { $modalInstance.close($scope.params); };
		$scope.cancel = function() { $modalInstance.dismiss('cancel'); };
		$scope.load = function(gist) { $scope.params.load = gist;	$scope.ok(); }
		$scope.delete = function(gist) { $scope.params.delete = gist;	$scope.ok(); }

		$scope.layouts = [];
		params.github(params.starred ? "/gists/starred" : "/gists").then(function(response) {
			var index = 0;
			response.data.forEach(function(layout) {
				for(var fn in layout.files) {
					if(fn.indexOf(".kbd.json")>=0) {
						layout.index = ++index;
						$scope.layouts.push(layout);
						break;
					}
				}
			});
		});
	});

	kbApp.directive('kbdColorPicker', function($timeout) {
		return {
			templateUrl: "colorPicker.html",
			restrict: "E",
			scope: { hintText: "@", pickerId: "@", pickerPosition: "@", color: "=ngModel", _onChange: "&ngChange", _onBlur: "&ngBlur", isDisabled: "&ngDisabled" },
			link: function($scope) {
				$scope.onChange = function() { $timeout($scope._onChange); };
				$scope.onBlur = function() { $timeout($scope._onBlur); };
			}
		};
	});

	kbApp.directive('kbdLabelEditor', function() {
		return { templateUrl: "labelEditor.html", restrict: "E", scope: { hintText: "@", labelIndex: "=" } };
	});
	kbApp.directive('kbdMultiCheck', function() {
		return { templateUrl: "multiCheck.html", restrict: "E", scope: { hintText: "@", field: "@", kbdDisable: "=" }, transclude: true };
	});
	kbApp.directive('kbdMultiNumbox', function() {
		return { templateUrl: "multiNumbox.html", restrict: "E", scope: { field: "@", size:"@", min:"@", max:"@", step:"@", kbdDisable: "=" } };
	});

	// Runs a confirmation dialog asynchronously, using promises.
	kbApp.service("$confirm", function($q, $timeout, $window) {
		var current = null;
		return {
			show: function(message) {
				if(current) current.reject();
				current = $q.defer();
				$timeout(function() {
					if($window.confirm(message)) {
						current.resolve();
					} else {
						current.reject();
					}
					current = null;
				}, 0,	false);
				return current.promise;
			}
		}
	});
}());
