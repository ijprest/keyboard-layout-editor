$serial = require('../serial.js');
require('../extensions.js')

var customMatchers = {
  toEqualSparse: function(util, customEqualityTesters) {
    return {
      compare: function(actual, expected) {
        if(actual instanceof Array && expected instanceof Array) {
          var result = {};
          result.pass = JSON.stringify(actual) === JSON.stringify(expected);
          result.message = 'Expected '+actual+' to '+(result.pass ? ' not' : '')+'equal '+expected;
          return result;
        }
        return {pass:false, message:'Expected '+actual+' to be an Array'};
      }
    };
  }
};

describe('keyboard serialization', function() {

  beforeEach(function() {
    this.addMatchers(customMatchers);
  });

  it('should handle empty keyboard', function() {
    var original = [];
    var kbd = $serial.deserialize(original);
    expect($serial.serialize(kbd)).toEqual(original);
  });

  it('should handle labels with alignment flag 0', function() {
    var original = [ [{a:0}, '1\n2\n3\n4\n5\n6\n7\n8\n9\n10\n11\n12'] ];
    var kbd = $serial.deserialize(original);
    expect(kbd.keys[0].labels).toEqual(['1','9','3','7','10','8','2','11','4','5','12','6']);
    expect($serial.serialize(kbd)).toEqual(original);
  });

  it('should handle labels with alignment flag 1', function() {
    var original = [ [{a:1}, '1\n2\n\n\n5\n6\n7\n\n\n\n\n12'] ];
    var kbd = $serial.deserialize(original);
    expect(kbd.keys[0].labels).toEqualSparse([,'1',,,'7',,,'2',,'5','12','6']);
    expect($serial.serialize(kbd)).toEqual(original);
  });

  it('should handle labels with alignment flag 2', function() {
    var original = [ [{a:2}, '1\n\n3\n\n5\n6\n\n\n9\n\n\n12'] ];
    var kbd = $serial.deserialize(original);
    expect(kbd.keys[0].labels).toEqualSparse([,,,'1','9','3',,,,'5','12','6']);
  });

  it('should handle labels with alignment flag 3', function() {
    var original = [ [{a:3}, '1\n\n\n\n5\n6\n\n\n\n\n\n12'] ];
    var kbd = $serial.deserialize(original);
    expect(kbd.keys[0].labels).toEqualSparse([,,,,'1',,,,,'5','12','6']);
    expect($serial.serialize(kbd)).toEqual(original);
  });

  it('should handle labels with alignment flag 4', function() {
    var original = [ [/*{a:4}*/ '1\n2\n3\n4\n5\n\n7\n8\n9\n10\n11'] ]; //a:4 is the default
    var kbd = $serial.deserialize(original);
    expect(kbd.keys[0].labels).toEqualSparse(['1','9','3','7','10','8','2','11','4',,'5']);
    expect($serial.serialize(kbd)).toEqual(original);
  });

  it('should handle font-size property "f"', function() {
    for(var align = 0; align < 7; ++align) {
      var original = [ [{f:1,a:align}, '1\n2\n3\n4\n5\n6\n7\n8\n9\n10\n11\n12'] ];
      var kbd = $serial.deserialize(original);
      for(var i = 0; i < 12; ++i) {
        // All labels should be 1
        expect(kbd.keys[0].textSize[i] || kbd.keys[0].default.textSize).toEqual(1);
      }
    }
  });

  it('should handle font-size property "f2"', function() {
    for(var align = 0; align < 7; ++align) {
      var original = [ [{f:1,f2:2,a:align}, '1\n2\n3\n4\n5\n6\n7\n8\n9\n10\n11\n12'] ];
      var kbd = $serial.deserialize(original);
      for(var i = 0; i < 12; ++i) {
        // All labels should be 2, except the first one ('1')
        if(kbd.keys[0].labels[i]) {
          var textSize = kbd.keys[0].textSize[i] || kbd.keys[0].default.textSize;
          var expected = kbd.keys[0].labels[i]==='1' ? 1 : 2;
          expect(textSize).toEqual(expected);
        }
      }
    }
  });

  it('should handle font-size property "fa"', function() {
    for(var align = 0; align < 7; ++align) {
      var original = [ [{f:1,fa:[1,2,3,4,5,6,7,8,9,10,11,12],a:align}, '1\n2\n3\n4\n5\n6\n7\n8\n9\n10\n11\n12'] ];
      var kbd = $serial.deserialize(original);
      for(var i = 0; i < 12; ++i) {
        if(kbd.keys[0].labels[i]) {
          var textSize = kbd.keys[0].textSize[i] || kbd.keys[0].default.textSize;
          expect(textSize.toString()).toEqual(kbd.keys[0].labels[i]);
        }
      }
    }
  });

  it('should handle blanks in font-size property "fa"', function() {
    for(var align = 0; align < 7; ++align) {
      var original = [ [{f:1,fa:[,2,,4,,6,,8,9,10,,12],a:align}, 'x\n2\nx\n4\nx\n6\nx\n8\n9\n10\nx\n12'] ];
      var kbd = $serial.deserialize(original);
      for(var i = 0; i < 12; ++i) {
        if(kbd.keys[0].labels[i]==='x') {
          expect(kbd.keys[0].textSize[i]).toBeUndefined();
        }
      }
    }
  });
});
