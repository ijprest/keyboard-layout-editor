(function () {
	"use strict";

	// Extend string objects with a simple String.format() function
	if(!String.prototype.format) {
		String.prototype.format = function() {
			var args = arguments;
			return this.replace(/\{(\d+)\}/g, function(match, number) { 
				return typeof args[number] !== 'undefined' ? args[number] : match;
			});
		};
	}

	// Extend string objects with trimStart(), trimEnd(), and trim() functions.
	if(!String.prototype.trimStart) {
		String.prototype.trimStart = function() { return this.replace(/^\s\s*/, ''); };
	}
	if(!String.prototype.trimEnd) {
		String.prototype.trimEnd = function() { return this.replace(/\s\s*$/, ''); };
	}
	if(!String.prototype.trim) {
		String.prototype.trim = function() { this.trimStart().trimEnd(); };
	}

	// Extend array objects with a last() function that returns the last element 
	// in the array.
	if(!Array.prototype.last) {
		Array.prototype.last = function() {
			return this[this.length-1];
		}
	}

}());
