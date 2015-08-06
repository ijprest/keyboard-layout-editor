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
    jasmine.addMatchers(customMatchers);
  });

  it('should handle empty keyboard', function() {
    var original = [];
    var kbd = $serial.deserialize(original);
    expect($serial.serialize(kbd)).toEqual(original);
  });

  describe('of labels', function() {
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
  });

  describe('of font-size', function() {
    it('should handle "f"', function() {
      for(var align = 0; align < 7; ++align) {
        var original = [ [{f:1,a:align}, '1\n2\n3\n4\n5\n6\n7\n8\n9\n10\n11\n12'] ];
        var kbd = $serial.deserialize(original);
        for(var i = 0; i < 12; ++i) {
          // All labels should be 1
          expect(kbd.keys[0].textSize[i] || kbd.keys[0].default.textSize).toEqual(1);
        }
      }
    });

    it('should handle "f2"', function() {
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

    it('should always output "f2" if "f" has been output when serializing', function() {
      var original = [[ {"a":7,"f":7},"←",{"a":5},"!\n1",{"f":9,"f2":7}, "\"\n2", {"f":5,"f2":7}, "#\n3"]];
      var kbd = $serial.deserialize(original);
      expect($serial.serialize(kbd)).toEqual(original);
    });

    it('should write "f" to reset back to default, even if default didn\'t change', function() {
      var original = [[{f2:5},"X\nY",{f:3}, "X\nY"]];
      var kbd = $serial.deserialize(original);
      expect($serial.serialize(kbd)).toEqual(original);
    });

    it('should handle "fa"', function() {
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

    it('should handle blanks in "fa"', function() {
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

  describe('of text-color', function() {
    it('should handle simple case', function() {
      var original = [ [{a:0,t:'#444444'}, '1\n2\n3\n4\n5\n6\n7\n8\n9\n10\n11\n12'] ];
      var kbd = $serial.deserialize(original);
      for(var i = 0; i < 12; ++i) {
        expect(kbd.keys[0].textColor[i] || kbd.keys[0].default.textColor).toEqual('#444444');
      }
      expect($serial.serialize(kbd)).toEqual(original);
    });

    it('should handle generic case', function() {
      var original = [ [{a:0,t:'#111111\n#222222\n#333333\n#444444\n#555555\n#666666\n#777777\n#888888\n#999999\n#aaaaaa\n#bbbbbb\n#cccccc'}, 
                     /*labels*/'#111111\n#222222\n#333333\n#444444\n#555555\n#666666\n#777777\n#888888\n#999999\n#aaaaaa\n#bbbbbb\n#cccccc'] ];
      var kbd = $serial.deserialize(original);
      expect(kbd.keys[0].default.textColor).toEqual('#111111');
      for(var i = 0; i < 12; ++i) {
        expect(kbd.keys[0].textColor[i] || kbd.keys[0].default.textColor).toEqual(kbd.keys[0].labels[i]);
      }
      expect($serial.serialize(kbd)).toEqual(original);
    });

    it('should handle blanks', function() {
      var original = [ [{a:0,t:'#111111\n\n#333333\n#444444\n\n#666666\n\n#888888\n#999999\n#aaaaaa\n#bbbbbb\n#cccccc'}, 
                     /*labels*/'#111111\nx\n#333333\n#444444\nx\n#666666\nx\n#888888\n#999999\n#aaaaaa\n#bbbbbb\n#cccccc'] ];
      var kbd = $serial.deserialize(original);
      expect(kbd.keys[0].default.textColor).toEqual('#111111');
      for(var i = 0; i < 12; ++i) {
        // if blank, should be same as color[0] / default
        expect(kbd.keys[0].textColor[i] || kbd.keys[0].default.textColor).toEqual(kbd.keys[0].labels[i] === 'x' ? '#111111' : kbd.keys[0].labels[i]);
      }
      expect($serial.serialize(kbd)).toEqual(original);
    });
  });
});
