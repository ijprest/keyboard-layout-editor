var $serial = {};
(function () {
	"use strict";

	// We need this so we can test locally and still save layouts to AWS
	$serial.base_href = "http://www.keyboard-layout-editor.com";

	// Lenient JSON reader/writer
	$serial.toJsonL = function(obj) {
		var res = [], key;
		if(obj instanceof Array) {
			obj.forEach(function(elem) { res.push($serial.toJsonL(elem));	});
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
		keys.sort(function(a,b) { return a.y === b.y ? a.x - b.x : a.y - b.y; });
	};

	// Convert between our in-memory format & our serialized format
	$serial.serialize = function(keyboard) {
		var keys = keyboard.keys;
		var rows = [], row = [], xpos = 0, ypos = 0, color = "#cccccc", text = "#000000", profile = "", ghost = false, align = 4, fontheight = 3, fontheight2 = 3;
		if(keyboard.meta) {
			var meta = angular.copy(keyboard.meta); 
			if(meta.backcolor === '#eeeeee') { delete meta.backcolor; }
			if(!$.isEmptyObject(meta)) {
				rows.push(meta);
			}
		}
		$serial.sortKeys(keys);
		keys.forEach(function(key) {
			var props = {}, prop = false;
			var label = key.labels.join("\n").trimEnd();
			if(key.y !== ypos) { rows.push(row); row = []; ypos++; xpos = 0; }
			function serializeProp(nname,val,defval) { if(val !== defval) { props[nname] = val; prop = true; } return val; }
			ypos += serializeProp("y", key.y-ypos, 0);
			xpos += serializeProp("x", key.x-xpos, 0) + key.width;
			color = serializeProp("c", key.color, color);
			text = serializeProp("t", key.text, text);
			ghost = serializeProp("g", key.ghost, ghost);
			profile = serializeProp("p", key.profile, profile);
			align = serializeProp("a", key.align, align);
			if(key.fontheight != fontheight) {
				fontheight = serializeProp("f", key.fontheight, fontheight);
				fontheight2 = serializeProp("f2", key.fontheight2, fontheight);
			} else {
				fontheight2 = serializeProp("f2", key.fontheight2, fontheight2);
			}
			serializeProp("w", key.width, 1);
			serializeProp("h", key.height, 1);
			serializeProp("w2", key.width2, key.width);
			serializeProp("h2", key.height2, key.height);
			serializeProp("x2", key.x2, 0);
			serializeProp("y2", key.y2, 0);
			serializeProp("n", key.nub || false, false);
			serializeProp("l", key.stepped || false, false);
			if(prop) { row.push(props); }
			row.push(label);
		});
		if(row.length>0) { rows.push(row); }
		return rows;
	}

	$serial.deserialize = function(rows) {
		var xpos = 0, ypos = 0, color = "#cccccc", text = "#000000", keys = [], width=1, height=1, xpos2=0, ypos2=0, width2=0, height2=0, profile = "", r, k, nub = false, ghost = false, align = 4, fontheight = 3, fontheight2 = 3, stepped = false;
		var meta = { backcolor: "#eeeeee" };
		for(r = 0; r < rows.length; ++r) {
			if(rows[r] instanceof Array) {
				for(k = 0; k < rows[r].length; ++k) {
					var key = rows[r][k];
					if(typeof key === 'string') {
						keys.push({x:xpos, y:ypos, width:width, height:height, profile:profile, color:color, text:text, labels:key.split('\n'), x2:xpos2, y2:ypos2, width2:width2===0?width:width2, height2:height2===0?height:height2, nub:nub, ghost:ghost, align:align, fontheight:fontheight, fontheight2:fontheight2, stepped:stepped});
						xpos += width;
						width = height = 1;
						xpos2 = ypos2 = width2 = height2 = 0;
						nub = stepped = false;
					} else {
						if(key.a != null) { align = key.a; }
						if(key.f) { fontheight = fontheight2 = key.f; }
						if(key.f2) { fontheight2 = key.f2; }
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
						if(key.l) { stepped = key.l; }
						if(key.g != null) { ghost = key.g; }
					}
				}
				ypos++;
			} else if(typeof rows[r] === 'object') {
				$.extend(meta, rows[r]);
			}
			xpos = 0;
		}
		return { meta:meta, keys:keys };
	}
	
	$serial.saveLayout = function($http, layout, success, error) {
		var data = angular.toJson(layout);
		var fn = CryptoJS.MD5(data).toString();

		// First test to see if the file is already available
		$http.get($serial.base_href+"/layouts/"+fn).success(function() { success(fn); }).error(function() {
			// Nope... need to upload it
			var fd = new FormData();
			fd.append("key", "layouts/"+fn);
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
					$http.get($serial.base_href+"/layouts/"+fn).success(function() { success(fn); }).error(error);
				} else {
					error(data,status);
				}
			});
		});
	};

}());
