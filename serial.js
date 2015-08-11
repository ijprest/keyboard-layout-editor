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
		var keys = keyboard.keys;
		var rows = [], row = [];
		var current = $serial.defaultKeyProps();
		current.textColor = current.default.textColor;
		current.align = 4;
		var cluster = {r:0, rx:0, ry:0};

		// Serialize metadata
		var meta = {};
		for(var metakey in keyboard.meta) {
			serializeProp(meta, metakey, keyboard.meta[metakey], _defaultMetaData[metakey]);
		}
		if(!isEmptyObject(meta)) {
			rows.push(meta);
		}

		var newRow = true;
		current.y--; // will be incremented on first row

		// Serialize row/key-data
		$serial.sortKeys(keys);
		keys.forEach(function(key) {
			var props = {};
			var ordered = reorderLabels(key,current);

			// start a new row when necessary
			var clusterChanged = (key.rotation_angle != cluster.r || key.rotation_x != cluster.rx || key.rotation_y != cluster.ry);
			var rowChanged = (key.y !== current.y);
			if(row.length>0 && (rowChanged || clusterChanged)) {
				// Push the old row
				rows.push(row);
				row = [];
				newRow = true;
			}

			if(newRow) {
				// Set up for the new row
				current.y++;

				// 'y' is reset if *either* 'rx' or 'ry' are changed
				if(key.rotation_y != cluster.ry || key.rotation_x != cluster.rx)
					current.y = key.rotation_y;
				current.x = key.rotation_x; // always reset x to rx (which defaults to zero)

				// Update current cluster
				cluster.r = key.rotation_angle;
				cluster.rx = key.rotation_x;
				cluster.ry = key.rotation_y;

				newRow = false;
			}

			current.rotation_angle = serializeProp(props, "r", key.rotation_angle, current.rotation_angle);
			current.rotation_x = serializeProp(props, "rx", key.rotation_x, current.rotation_x);
			current.rotation_y = serializeProp(props, "ry", key.rotation_y, current.rotation_y);
			current.y += serializeProp(props, "y", key.y-current.y, 0);
			current.x += serializeProp(props, "x", key.x-current.x, 0) + key.width;
			current.color = serializeProp(props, "c", key.color, current.color);
			if(!ordered.textColor[0]) {
				ordered.textColor[0] = key.default.textColor;
			} else {
				for(var i = 2; i < 12; ++i) {
					if(!ordered.textColor[i] && ordered.textColor[i] !== ordered.textColor[0]) {
						ordered.textColor[i] !== key.default.textColor;
					}
				}
			}
			current.textColor = serializeProp(props, "t", ordered.textColor.join("\n").trimEnd(), current.textColor);
			current.ghost = serializeProp(props, "g", key.ghost, current.ghost);
			current.profile = serializeProp(props, "p", key.profile, current.profile);
			current.sm = serializeProp(props, "sm", key.sm, current.sm);
			current.sb = serializeProp(props, "sb", key.sb, current.sb);
			current.st = serializeProp(props, "st", key.st, current.st);
			current.align = serializeProp(props, "a", ordered.align, current.align);
			current.default.textSize = serializeProp(props, "f", key.default.textSize, current.default.textSize);
			if(props.f) current.textSize = [];
			if(!compareTextSizes(current.textSize, ordered.textSize, ordered.labels)) {
				if(ordered.textSize.length == 0) {
					serializeProp(props, "f", key.default.textSize, -1); // Force 'f' to be written
				} else {
					var optimizeF2 = !ordered.textSize[0];
					for(var i = 2; i < ordered.textSize.length && optimizeF2; ++i) {
						optimizeF2 = (ordered.textSize[i] == ordered.textSize[1]);
					}
					if(optimizeF2) {
						var f2 = ordered.textSize[1];
						current.f2 = serializeProp(props, "f2", f2, -1);
						current.textSize = [0,f2,f2,f2,f2,f2,f2,f2,f2,f2,f2,f2];
					} else {
						current.f2 = undefined;
						current.textSize = serializeProp(props, "fa", ordered.textSize, []);
					}
				}
			}
			serializeProp(props, "w", key.width, 1);
			serializeProp(props, "h", key.height, 1);
			serializeProp(props, "w2", key.width2, key.width);
			serializeProp(props, "h2", key.height2, key.height);
			serializeProp(props, "x2", key.x2, 0);
			serializeProp(props, "y2", key.y2, 0);
			serializeProp(props, "n", key.nub || false, false);
			serializeProp(props, "l", key.stepped || false, false);
			serializeProp(props, "d", key.decal || false, false);
			if(!isEmptyObject(props)) { row.push(props); }
			current.labels = ordered.labels;
			row.push(ordered.labels.join("\n").trimEnd());
		});
		if(row.length>0) {
			rows.push(row);
		}
		return rows;
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
}());
