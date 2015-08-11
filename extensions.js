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
  Math.Matrix = function(a,b,c,d,e,f) { return new Matrix(a,b,c,d,e,f); }
  Math.transMatrix = function(x,y) {
    return new Matrix(1, 0, 0, 1, x, y);
  }
  Math.rotMatrix = function(angleInDegrees) {
    var angleInRad = (angleInDegrees*Math.PI/180.0);
    var cos = Math.cos(angleInRad), sin = Math.sin(angleInRad);
    return new Matrix(cos, sin, -sin, cos, 0, 0);
  };


  /**
   * Decimal adjustment of a number.
   *
   * @param {String}  type  The type of adjustment.
   * @param {Number}  value The number.
   * @param {Integer} exp   The exponent (the 10 logarithm of the adjustment base).
   * @returns {Number} The adjusted value.
   */
  function decimalAdjust(type, value, exp) {
    // If the exp is undefined or zero...
    if (typeof exp === 'undefined' || +exp === 0) {
      return Math[type](value);
    }
    value = +value;
    exp = +exp;
    // If the value is not a number or the exp is not an integer...
    if (isNaN(value) || !(typeof exp === 'number' && exp % 1 === 0)) {
      return NaN;
    }
    // Shift
    value = value.toString().split('e');
    value = Math[type](+(value[0] + 'e' + (value[1] ? (+value[1] - exp) : -exp)));
    // Shift back
    value = value.toString().split('e');
    return +(value[0] + 'e' + (value[1] ? (+value[1] + exp) : exp));
  }

  // Decimal round
  if (!Math.round10) {
    Math.round10 = function(value, exp) {
      return decimalAdjust('round', value, exp);
    };
  }
  // Decimal floor
  if (!Math.floor10) {
    Math.floor10 = function(value, exp) {
      return decimalAdjust('floor', value, exp);
    };
  }
  // Decimal ceil
  if (!Math.ceil10) {
    Math.ceil10 = function(value, exp) {
      return decimalAdjust('ceil', value, exp);
    };
  }

  // Extend array objects with a last() function that returns the last element 
  // in the array.
  if(!Array.prototype.last) {
    Array.prototype.last = function() {
      return this[this.length-1];
    };
  }

  // Extend array objects with a remove() function that removes elements
  // by value; from: http://stackoverflow.com/questions/3954438
  Array.prototype.remove = function() {
    var what, a = arguments, L = a.length, ax;
    while (L && this.length) {
      what = a[--L];
      while ((ax = this.indexOf(what)) !== -1) {
        this.splice(ax, 1);
      }
    }
    return this;
  };

  // Polyfill for HTMLCanvasElement.toBlob, which is currently only available on Firefox
  if (typeof(HTMLCanvasElement) !== 'undefined' && !HTMLCanvasElement.prototype.toBlob) {
    Object.defineProperty(HTMLCanvasElement.prototype, 'toBlob', {
      value: function (callback, type, quality) {
        var binStr = atob( this.toDataURL(type, quality).split(',')[1] ),
            len = binStr.length,
            arr = new Uint8Array(len);
        for (var i=0; i<len; i++ ) {
          arr[i] = binStr.charCodeAt(i);
        }
        callback( new Blob( [arr], {type: type || 'image/png'} ) );
      }
    });
  }

}());
