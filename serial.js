var $serial = (typeof(exports) !== 'undefined') ? exports : {};
(function () {
	"use strict";

	// We need this so we can test locally and still save layouts to AWS
	$serial.base_href = "http://www.keyboard-layout-editor.com";

	// Helper to copy an object; doesn't handle loops/circular refs, etc.
	function copy(o) {
		if (typeof(o) !== 'object') {
			// primitive value
			return o;
		} else if (o instanceof Array) {
			// array
			var result = [];
			for (var i = 0; i < o.length; i++) {
				result[i] = copy(o[i]);
			}
			return result;
		} else {
			// Object
			var result = {};
			for (var prop in o) {
				result[prop] = copy(o[prop]);
			}
			return result;
		}
	}
	function isEmptyObject(o) {
		for(var prop in o)
			return false;
		return true;
	}
	function extend(target, source) {
		target = target || {};
		for (var prop in source) {
			if (typeof source[prop] === 'object') {
				target[prop] = extend(target[prop], source[prop]);
			} else {
				target[prop] = source[prop];
			}
		}
		return target;
	}
	// Map from serialized label position to normalized position,
	// depending on the alignment flags.
	var labelMap = [
	  //0  1  2  3  4  5  6  7  8  9 10 11   // align flags
		[ 0, 6, 2, 8, 9,11, 3, 5, 1, 4, 7,10], // 0 = no centering
		[ 1, 7,-1,-1, 9,11, 4,-1,-1,-1,-1,10], // 1 = center x
		[ 3,-1, 5,-1, 9,11,-1,-1, 4,-1,-1,10], // 2 = center y
		[ 4,-1,-1,-1, 9,11,-1,-1,-1,-1,-1,10], // 3 = center x & y
		[ 0, 6, 2, 8,10,-1, 3, 5, 1, 4, 7,-1], // 4 = center front (default)
		[ 1, 7,-1,-1,10,-1, 4,-1,-1,-1,-1,-1], // 5 = center front & x
		[ 3,-1, 5,-1,10,-1,-1,-1, 4,-1,-1,-1], // 6 = center front & y
		[ 4,-1,-1,-1,10,-1,-1,-1,-1,-1,-1,-1], // 7 = center front & x & y
	];
	var disallowedAlignmentForLabels = [
		[1,2,3,5,6,7],	//0
		[2,3,6,7],			//1
		[1,2,3,5,6,7],	//2
		[1,3,5,7],			//3
		[],							//4
		[1,3,5,7],			//5
		[1,2,3,5,6,7],	//6
		[2,3,6,7],			//7
		[1,2,3,5,6,7],	//8
		[4,5,6,7],			//9
		[],							//10
		[4,5,6,7]				//11
	];

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
		if(typeof obj === 'number') {
			return Math.round10(obj,-4);
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
		x: 0, y: 0, x2: 0, y2: 0,                         // position
		width: 1, height: 1, width2: 1, height2: 1,       // size
		rotation_angle: 0, rotation_x: 0, rotation_y: 0,  // rotation
		labels:[], textColor: [], textSize: [],           // label properties
		default: { textColor: "#000000", textSize: 3 },   // label defaults
		color: "#cccccc", profile: "", nub: false,        // cap appearance
		ghost: false, stepped: false, decal: false,       // miscellaneous options
		coloredBorder: false,                             // miscellaneous options
		sm: "", sb:"", st:""                              // switch
	};

	var _defaultMetaData = { backcolor: '#eeeeee', name: '', author: '', notes: '', background: undefined, radii: '', switchMount: '', switchBrand: '', switchType: '' };
	$serial.defaultKeyProps = function() { return copy(_defaultKeyProps); };
	$serial.defaultMetaData = function() { return copy(_defaultMetaData); };

	function reorderLabels(key,current) {
		// Possible alignment flags in order of preference (this is fairly
		// arbitrary, but hoped to reduce raw data size).
		var align = [7,5,6,4,3,1,2,0];

		// remove impossible flag combinations
		for(var i = 0; i < key.labels.length; ++i) {
			if(key.labels[i]) {
				align.remove.apply(align, disallowedAlignmentForLabels[i]);
			}
		}

		// For the chosen alignment, generate the label array in the correct order
		var ret = {
			align: align[0],
			labels: ["","","","","","","","","","","",""],
			textColor: ["","","","","","","","","","","",""],
			textSize: []
		};
		for(var i = 0; i < 12; ++i) {
			var ndx = labelMap[ret.align].indexOf(i);
			if(ndx >= 0) {
				if(key.labels[i]) ret.labels[ndx] = key.labels[i];
				if(key.textColor[i]) ret.textColor[ndx] = key.textColor[i];
				if(key.textSize[i]) ret.textSize[ndx] = key.textSize[i];
			}
		}
		// Clean up
		for(var i = 0; i < ret.textSize.length; ++i) {
			if(!ret.labels[i])
				ret.textSize[i] = current.textSize[i];
			if(!ret.textSize[i] || ret.textSize[i] == key.default.textSize)
				ret.textSize[i] = 0;
		}
		return ret;
	}

	function compareTextSizes(current,key,labels) {
		if(typeof(current) === "number")
			current = [current];
		for(var i = 0; i < 12; ++i) {
			if( labels[i] && ((!!current[i] !== !!key[i]) || (current[i] && current[i] !== key[i])) )
				return false;
		}
		return true;
	}

	// Convert between our in-memory format & our serialized format
	function serializeProp(props, nname, val, defval) { if(val !== defval) { props[nname] = val; } return val; }
	$serial.serialize = function(keyboard) {
		var key1 = [];
		key1.push(1200);
		key1.push(keyboard.meta);
		for(var key in keyboard.keys) {
			key1.push(keyboard.keys[key]);
		}
		return key1;
	}

	function deserializeError(msg,data) {
		throw "Error: " + msg + (data ? (":\n  " + $serial.toJsonL(data)) : "");
	}

	function reorderLabelsIn(labels, align, skipdefault) {
		var ret = [];
		for(var i = skipdefault ? 1 : 0; i < labels.length; ++i) {
			ret[labelMap[align][i]] = labels[i];
		}
		return ret;
	}

	$serial.deserialize = function(rows) {
		if (rows[0] == 1200) {
			var meta = rows[1];
			var keys = [];
			for (var i = 2; i < rows.length; i++) {
				if (rows[i] !== null)
					keys.push(rows[i]);
			}
			return { meta:meta, keys:keys };
		} else {
		// Initialize with defaults
		var current = $serial.defaultKeyProps();
		var meta = $serial.defaultMetaData();
		var keys = [];
		var cluster = { x: 0, y: 0 };
		var align = 4;
		for(var r = 0; r < rows.length; ++r) {
			if(rows[r] instanceof Array) {
				for(var k = 0; k < rows[r].length; ++k) {
					var key = rows[r][k];
					if(typeof key === 'string') {
						var newKey = copy(current);
						newKey.width2 = newKey.width2 === 0 ? current.width : current.width2;
						newKey.height2 = newKey.height2 === 0 ? current.height : current.height2;
						newKey.labels = reorderLabelsIn(key.split('\n'), align);
						newKey.textSize = reorderLabelsIn(newKey.textSize, align);

						// Clean up the data
						for(var i = 0; i < 12; ++i) {
							if(!newKey.labels[i]) {
								newKey.textSize[i] = undefined;
								newKey.textColor[i] = undefined;
							}
							if(newKey.textSize[i] == newKey.default.textSize)
								newKey.textSize[i] = undefined;
							if(newKey.textColor[i] == newKey.default.textColor)
								newKey.textColor[i] = undefined;
						}

						// Add the key!
						keys.push(newKey);

						// Set up for the next key
						current.x += current.width;
						current.width = current.height = 1;
						current.x2 = current.y2 = current.width2 = current.height2 = 0;
						current.nub = current.stepped = current.decal = false;

					} else {
						if(key.r != null) { if(k!=0) {deserializeError("'r' can only be used on the first key in a row", key);} current.rotation_angle = key.r; }
						if(key.rx != null) { if(k!=0) {deserializeError("'rx' can only be used on the first key in a row", key);} current.rotation_x = cluster.x = key.rx; extend(current, cluster); }
						if(key.ry != null) { if(k!=0) {deserializeError("ry' can only be used on the first key in a row", key);} current.rotation_y = cluster.y = key.ry; extend(current, cluster); }
						if(key.a != null) { align = key.a; }
						if(key.f) { current.default.textSize = key.f; current.textSize = []; }
						if(key.f2) { for(var i = 1; i < 12; ++i) { current.textSize[i] = key.f2; } }
						if(key.fa) { current.textSize = key.fa; }
						if(key.p) { current.profile = key.p; }
						if(key.c) { current.color = key.c; }
						if(key.t) { 
							var split = key.t.split('\n');
							current.default.textColor = split[0];
							current.textColor = reorderLabelsIn(split, align);
						}
						if(key.x) { current.x += key.x; }
						if(key.y) { current.y += key.y; }
						if(key.w) { current.width = current.width2 = key.w; }
						if(key.h) { current.height = current.height2 = key.h; }
						if(key.x2) { current.x2 = key.x2; }
						if(key.y2) { current.y2 = key.y2; }
						if(key.w2) { current.width2 = key.w2; }
						if(key.h2) { current.height2 = key.h2; }
						if(key.n) { current.nub = key.n; }
						if(key.l) { current.stepped = key.l; }
						if(key.d) { current.decal = key.d; }
						if(key.g != null) { current.ghost = key.g; }
						if(key.cb != null) { current.coloredBorder = key.cb; }
						if(key.sm) { current.sm = key.sm; }
						if(key.sb) { current.sb = key.sb; }
						if(key.st) { current.st = key.st; }
					}
				}

				// End of the row
				current.y++;
			} else if(typeof rows[r] === 'object') {
				if(r != 0) { throw "Error: keyboard metadata must the be first element:\n  "+$serial.toJsonL(rows[r]); }
				extend(meta, rows[r]);
			}
			current.x = current.rotation_x;
		}
		return { meta:meta, keys:keys };
		}
	}
}());
