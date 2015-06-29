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


	// a c e
	// b d f
	// 0 0 1
	function Matrix(a,b,c,d,e,f) { this.a = a || 1; this.b = b || 0; this.c = c || 0; this.d = d || 1; this.e = e || 0; this.f = f || 0; }
	Matrix.prototype.mult = function(Y) {
		return new Matrix(this.a*Y.a + this.c*Y.b, this.b*Y.a + this.d*Y.b, this.a*Y.c + this.c*Y.d, this.b*Y.c + this.d*Y.d, this.a*Y.e + this.c*Y.f + this.e, this.b*Y.e + this.d*Y.f + this.f);
	};
	Matrix.prototype.transformPt = function(pt) {
		return { x: this.a*pt.x + this.c*pt.y + this.e, y: this.b*pt.x + this.d*pt.y + this.f };
	};
	Math.Matrix = function(a,b,c,d,e,f) { return new Matrix(a,b,c,d,e,f); };
	Math.transMatrix = function(x,y) {
		return new Matrix(1, 0, 0, 1, x, y);
	};
	Math.rotMatrix = function(angleInDegrees) {
		var angleInRad = (angleInDegrees*Math.PI/180.0);
		var cos = Math.cos(angleInRad), sin = Math.sin(angleInRad);
		return new Matrix(cos, sin, -sin, cos, 0, 0);
	};

	// Extend array objects with a last() function that returns the last element
	// in the array.
	if(!Array.prototype.last) {
		Array.prototype.last = function() {
			return this[this.length-1];
		};
	}
}());
