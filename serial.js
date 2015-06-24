var $serial = {};
(function () {
	"use strict";

	// We need this so we can test locally and still save layouts to AWS
	$serial.base_href = "http://www.keyboard-layout-editor.com";

	// Lenient JSON reader/writer
	$serial.toJsonL = function(obj) {
		var res = [], key;
		if(obj instanceof Array) {
			obj.forEach(function(elem) { res.push($serial.toJsonL(elem)); });
			return '['+res.join(',')+']';
		}
		if(typeof obj === 'object') {
			for(key in obj) {	if(obj.hasOwnProperty(key)) { res.push(key+':'+$serial.toJsonL(obj[key])); } }
			return '{'+res.join(',')+'}';
		}
		return angular.toJson(obj);
	};
	$serial.fromJsonL = function(json) { return jsonl.parse(json); };

	// function to sort the key array
	$serial.sortKeys = function(keys) {
		keys.sort(function(a,b) {
			return ((a.rotation_angle+360)%360 - (b.rotation_angle+360)%360) ||
				   (a.rotation_x - b.rotation_x) ||
				   (a.rotation_y - b.rotation_y) ||
				   (a.y - b.y) ||
				   (a.x - b.x);
		});
	};

	var _defaultKeyProps = {
		x: 0, y: 0, x2: 0, y2: 0,								// position
		width: 1, height: 1, width2: 1, height2: 1,				// size
		color: "#cccccc", text: "#000000",						// colors
		labels:[], align: 4, fontheight: 3, fontheight2: 3,		// label properties
		rotation_angle: 0, rotation_x: 0, rotation_y: 0,		// rotation
		profile: "", nub: false, ghost: false, stepped: false	// misc
	};
	var _defaultMetaData = { backcolor: '#eeeeee' };
	$serial.defaultKeyProps = function() { return angular.copy(_defaultKeyProps); };
	$serial.defaultMetaData = function() { return angular.copy(_defaultMetaData); };

	// Convert between our in-memory format & our serialized format
	function serializeProp(props, nname, val, defval) { if(val !== defval) { props[nname] = val; } return val; }
	$serial.serialize = function(keyboard) {
		var keys = keyboard.keys;
		var rows = [], row = [];
		var current = $serial.defaultKeyProps();
		var cluster = {r:0, rx:0, ry:0};

		// Serialize metadata
		var meta = {};
		for(var metakey in keyboard.meta) {
			serializeProp(meta, metakey, keyboard.meta[metakey], _defaultMetaData[metakey]);
		}
		if(!$.isEmptyObject(meta)) {
			rows.push(meta);
		}

		// Serialize row/key-data
		$serial.sortKeys(keys);
		keys.forEach(function(key) {
			var props = {};
			var label = key.labels.join("\n").trimEnd();

			// start a new row when necessary
			if(row.length>0 && (key.y !== current.y || key.rotation_angle != cluster.r || key.rotation_x != cluster.rx || key.rotation_y != cluster.ry)) {
				// Push the old row
				rows.push(row);
				row = [];

				// Set up for the new row
				if(key.rotation_angle != cluster.r || key.rotation_x != cluster.rx || key.rotation_y != cluster.ry) {
					cluster.r = key.rotation_angle;
					cluster.rx = key.rotation_x;
					cluster.ry = key.rotation_y;
					current.x = cluster.rx;
					current.y = cluster.ry;
				} else {
					current.x = cluster.rx;
					current.y++;
				}
			}

			current.rotation_angle = serializeProp(props, "r", key.rotation_angle, current.rotation_angle);
			current.rotation_x = serializeProp(props, "rx", key.rotation_x, current.rotation_x);
			current.rotation_y = serializeProp(props, "ry", key.rotation_y, current.rotation_y);
			current.y += serializeProp(props, "y", key.y-current.y, 0);
			current.x += serializeProp(props, "x", key.x-current.x, 0) + key.width;
			current.color = serializeProp(props, "c", key.color, current.color);
			current.text = serializeProp(props, "t", key.text, current.text);
			current.ghost = serializeProp(props, "g", key.ghost, current.ghost);
			current.profile = serializeProp(props, "p", key.profile, current.profile);
			current.align = serializeProp(props, "a", key.align, current.align);
			if(key.fontheight != current.fontheight) {
				current.fontheight = serializeProp(props, "f", key.fontheight, current.fontheight);
				current.fontheight2 = serializeProp(props, "f2", key.fontheight2, current.fontheight);
			} else {
				current.fontheight2 = serializeProp(props, "f2", key.fontheight2, current.fontheight2);
			}
			serializeProp(props, "w", key.width, 1);
			serializeProp(props, "h", key.height, 1);
			serializeProp(props, "w2", key.width2, key.width);
			serializeProp(props, "h2", key.height2, key.height);
			serializeProp(props, "x2", key.x2, 0);
			serializeProp(props, "y2", key.y2, 0);
			serializeProp(props, "n", key.nub || false, false);
			serializeProp(props, "l", key.stepped || false, false);
			if(!jQuery.isEmptyObject(props)) { row.push(props); }
			row.push(label);
		});
		if(row.length>0) {
			rows.push(row);
		}
		return rows;
	}

	function dserializeError(msg,data) {
		throw "Error: " + msg + (data ? (":\n  " + $serial.toJsonL(data)) : "");
	}
	$serial.deserialize = function(rows) {
		// Initialize with defaults
		var current = $serial.defaultKeyProps();
		var meta = { backcolor: "#eeeeee" };
		var keys = [];
		var cluster = { x: 0, y: 0 };
		for(var r = 0; r < rows.length; ++r) {
			if(rows[r] instanceof Array) {
				for(var k = 0; k < rows[r].length; ++k) {
					var key = rows[r][k];
					if(typeof key === 'string') {
						var newKey = angular.copy(current);
						newKey.width2 = newKey.width2 === 0 ? current.width : current.width2;
						newKey.height2 = newKey.height2 === 0 ? current.height : current.height2;
						newKey.labels = key.split('\n');
						keys.push(newKey);

						// Set up for the next key
						current.x += current.width;
						current.width = current.height = 1;
						current.x2 = current.y2 = current.width2 = current.height2 = 0;
						current.nub = current.stepped = false;
					} else {
						if(key.r != null) { if(k!=0) {dserializeError("'r' can only be used on the first key in a row", key);} current.rotation_angle = key.r; }
						if(key.rx != null) { if(k!=0) {dserializeError("'rx' can only be used on the first key in a row", key);} current.rotation_x = cluster.x = key.rx; $.extend(current, cluster); }
						if(key.ry != null) { if(k!=0) {dserializeError("ry' can only be used on the first key in a row", key);} current.rotation_y = cluster.y = key.ry; $.extend(current, cluster); }
						if(key.a != null) { current.align = key.a; }
						if(key.f) { current.fontheight = current.fontheight2 = key.f; }
						if(key.f2) { current.fontheight2 = key.f2; }
						if(key.p) { current.profile = key.p; }
						if(key.c) { current.color = key.c; }
						if(key.t) { current.text = key.t; }
						if(key.x) { current.x += key.x; }
						if(key.y) { current.y += key.y; }
						if(key.w) { current.width = key.w; }
						if(key.h) { current.height = key.h; }
						if(key.x2) { current.x2 = key.x2; }
						if(key.y2) { current.y2 = key.y2; }
						if(key.w2) { current.width2 = key.w2; }
						if(key.h2) { current.height2 = key.h2; }
						if(key.n) { current.nub = key.n; }
						if(key.l) { current.stepped = key.l; }
						if(key.g != null) { current.ghost = key.g; }
					}
				}

				// End of the row
				current.y++;
			} else if(typeof rows[r] === 'object') {
				if(r != 0) { throw "Error: keyboard metadata must the be first element:\n  "+$serial.toJsonL(rows[r]); }
				$.extend(meta, rows[r]);
			}
			current.x = current.rotation_x;
		}
		return { meta:meta, keys:keys };
	}

	$serial.saveLayout = function($http, layout, success, error) {
		var data = angular.toJson(layout);
		var fn = CryptoJS.MD5(data).toString();

		// First test to see if the file is already available
		$http.get($serial.base_href+"/saves/"+fn).success(function() { success(fn); }).error(function() {
			// Nope... need to upload it
			var fd = new FormData();
			fd.append("key", "saves/"+fn);
			fd.append("AWSAccessKeyId", "AKIAJSXGG74EMFBC57QQ");
			fd.append("acl", "public-read");
			fd.append("success_action_redirect", $serial.base_href);
			fd.append("policy", "eyJleHBpcmF0aW9uIjoiMjAwMTQtMDEtMDFUMDA6MDA6MDBaIiwiY29uZGl0aW9ucyI6W3siYnVja2V0Ijoid3d3LmtleWJvYXJkLWxheW91dC1lZGl0b3IuY29tIn0sWyJzdGFydHMtd2l0aCIsIiRrZXkiLCJsYXlvdXRzLyJdLHsiYWNsIjoicHVibGljLXJlYWQifSx7InN1Y2Nlc3NfYWN0aW9uX3JlZGlyZWN0IjoiaHR0cDovL3d3dy5rZXlib2FyZC1sYXlvdXQtZWRpdG9yLmNvbSJ9LHsiQ29udGVudC1UeXBlIjoiYXBwbGljYXRpb24vanNvbiJ9LFsiY29udGVudC1sZW5ndGgtcmFuZ2UiLDAsODE5Ml1dfQ==");
			fd.append("signature", "WOsX5QV/y9UlOs2kmtduXYEPeEQ=");
			fd.append("Content-Type", "application/json");
			fd.append("file", data);
			$http.post("http://www.keyboard-layout-editor.com.s3.amazonaws.com/", fd, {
				headers: {'Content-Type': undefined },
				transformRequest: angular.identity
			}).success(function() { success(fn); }).error(function(data, status) {
				if(status == 0) {
					// We seem to get a 'cancelled' notification even though the POST
					// is successful, so we have to double-check.
					$http.get($serial.base_href+"/saves/"+fn).success(function() { success(fn); }).error(error);
				} else {
					error(data,status);
				}
			});
		});
	};

}());
