var $color = {};
(function () {
	function Lab (l, a, b) { this.l = l; this.a = a; this.b = b; }
	$color.Lab = function (l,a,b) { return new Lab(l,a,b); };

	function XYZ (x, y, z) { this.x = x; this.y = y; this.z = z; }
	$color.XYZ = function (l,a,b) { return new XYZ(x, y, z); };

	function sRGBLinear (r, g, b) { this.r = r; this.g = g; this.b = b; }
	$color.sRGBLinear = function (r,g,b) { return new sRGBLinear(r,g,b); };

	function sRGBPrime (r, g, b) { this.r = r; this.g = g; this.b = b; }
	$color.sRGBPrime = function (r,g,b) { return new sRGBPrime(r,g,b); };

	function sRGB8 (r, g, b) { this.r = r; this.g = g; this.b = b; }
	$color.sRGB8 = function (r,g,b) { return new sRGB8(r,g,b); };
	$color.hex = function(color) { var num = parseInt(color.slice(1), 16); return new sRGB8((num >> 16) & 0xff, (num >> 8) & 0xff, num & 0xFF); };

	var D65 = new XYZ(0.9504, 1.0000, 1.0888);

	Lab.prototype.XYZ = function () { 
		var p = (this.l + 16.0) / 116.0;
		var x_part = p + this.a / 500.0;
		var z_part = (p - this.b / 200.0);
		return new XYZ( D65.x * x_part * x_part * x_part, 
						D65.y * p * p * p,
						D65.z * z_part * z_part * z_part);
	};
	Lab.prototype.sRGB8 = function () { return this.XYZ().sRGBLinear().sRGBPrime().sRGB8(); };

	function _XYZf(t) { if (t > 0.008856) { return Math.pow(t, 1.0/3.0); } else { return 7.787 * t + 16.0/116.0; } }
	XYZ.prototype.Lab = function () {
		var x_xn = this.x / D65.x;
		var y_yn = this.y / D65.y;
		var z_zn = this.z / D65.z;

		var f_x_xn = _XYZf(x_xn);
		var f_y_yn = _XYZf(y_yn);
		var f_z_zn = _XYZf(z_zn);

		return new Lab( y_yn > 0.008856 ? 116.8 * Math.pow(y_yn, 1.0/3.0) - 16 : 903.3 * y_yn,
						500.0 * (f_x_xn - f_y_yn),
						200.0 * (f_y_yn - f_z_zn) );
	};

	var XYZ_TO_RGB = [
		[ 3.240479, -1.537150, -0.498535],
		[-0.969256,  1.875992,  0.041556],
		[ 0.055648, -0.204043,  1.057311]
	];

	XYZ.prototype.sRGBLinear = function () {
		return new sRGBLinear( this.x * XYZ_TO_RGB[0][0] + this.y * XYZ_TO_RGB[0][1] + this.z * XYZ_TO_RGB[0][2],
							   this.x * XYZ_TO_RGB[1][0] + this.y * XYZ_TO_RGB[1][1] + this.z * XYZ_TO_RGB[1][2],
							   this.x * XYZ_TO_RGB[2][0] + this.y * XYZ_TO_RGB[2][1] + this.z * XYZ_TO_RGB[2][2] );
	};

	var RGB_TO_XYZ = [
		[0.412453, 0.357580, 0.180423],
		[0.212671, 0.715160, 0.072169],
		[0.019334, 0.119193, 0.950227]
	];

	sRGBLinear.prototype.XYZ = function () {
		return new XYZ( this.r * RGB_TO_XYZ[0][0] + this.g * RGB_TO_XYZ[0][1] + this.b * RGB_TO_XYZ[0][2],
						this.r * RGB_TO_XYZ[1][0] + this.g * RGB_TO_XYZ[1][1] + this.b * RGB_TO_XYZ[1][2],
						this.r * RGB_TO_XYZ[2][0] + this.g * RGB_TO_XYZ[2][1] + this.b * RGB_TO_XYZ[2][2] );
	};

	var ALPHA = 0.055;
	function _linearToLog(c) { if ( c <= 0.0031308) { return 12.92 * c; } else { return (1 + ALPHA) * Math.pow(c, 1/2.4) - ALPHA; } }
	function _logToLinear(c) { if ( c <= 0.04045) { return c / 12.92; } else { return Math.pow((c + ALPHA) / (1 + ALPHA), 2.4); } }
	sRGBLinear.prototype.sRGBPrime = function () { return new sRGBPrime(_linearToLog(this.r), _linearToLog(this.g), _linearToLog(this.b)); };
	sRGBPrime.prototype.sRGBLinear = function () { return new sRGBLinear(_logToLinear(this.r), _logToLinear(this.g), _logToLinear(this.b)); };
	sRGBPrime.prototype.sRGB8 = function () { return new sRGB8(this.r * 255.0, this.g * 255.0, this.b * 255.0); };
	sRGB8.prototype.sRGBPrime = function () { return new sRGBPrime(this.r/255.0, this.g/255.0, this.b/255.0); };
	sRGB8.prototype.Lab = function () { return this.sRGBPrime().sRGBLinear().XYZ().Lab(); };
	sRGB8.prototype.hex = function () { return "#" + (0x1000000 + (((Math.min(this.r,0xff)&0xff) << 16) + ((Math.min(this.g,0xff)&0xff) << 8) + (Math.min(this.b,0xff)&0xff))).toString(16).slice(1); };
})();
