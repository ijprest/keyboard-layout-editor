/* Different Methods for Cycle Detection 

  http://jsperf.com/object-cycle-detection/3
*/

var CycleDetection = {
	generateCyclicObject: function (size) {
		var root = {};
		var obj = root;
		for (var i = 0; i < size; ++i) {
			obj['child'] = {};
			obj = obj['child'];
		}
		obj['child'] = root;
		return root;
	},

	array: function (obj) {
		var seenObjects = [];

		function detect (obj) {
			if (typeof obj === 'object') {
				if (seenObjects.indexOf(obj) !== -1) {
					return true;
				}
				seenObjects.push(obj);
				for (var key in obj) {
					if (obj.hasOwnProperty(key) && detect(obj[key])) {
						return true;
					}
				}
			}
			return false;
		}
			
		return detect(obj);
	},

	mark: function (obj) {
		var seenObjects = [];
		var mark = String(Math.random());

		function detect (obj) {
			if (typeof obj === 'object') {
				if (mark in obj) {
					return true;
				}
				obj[mark] = true;
				seenObjects.push(obj);
				for (var key in obj) {
					if (obj.hasOwnProperty(key) && detect(obj[key])) {
						return true;
					}
				}
			}
			return false;
		}

		var result = detect(obj);
		
		for (var i = 0; i < seenObjects.length; ++i) {
			delete seenObjects[i][mark];
		}
		
		return result;
	},
	
	json: function (obj) {
		var isNativeJSON = typeof JSON !== 'undefined' && JSON.stringify.toString().match(/\{ \[native code\] \}$/);
		if (!isNativeJSON) {
			throw 'Native JSON.stringify is not available, can\'t use this technique.';
		}
		try {
			JSON.stringify(obj);
			return false;
		} catch (e) {
			return true;
		}
	}
};
