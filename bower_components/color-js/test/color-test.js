var vows   = require('vows'),
    assert = require('assert'),
    color  = require('../color');

var Color = color.Color;

assert.colorEqual = function(color1, color2) {
  assert.deepEqual(color1.toRGB(), color2.toRGB());
};

function validCSS(bool) {
  var context = {
    topic: function() {
      return this.context.name.match(/"(.*)"/)[1];
    }
  };

  var shouldString = (bool ? 'should' : 'shouldn\'t') + ' be a valid CSS color';

  context[shouldString] = function(colorString) {
    var valid = Color.isValid(colorString);
    assert.equal(valid, bool);
  };

  return context;
}

vows.describe('Color').addBatch({
  // Parsing:
  'A color built from the CSS string': {
    '#f00': {
      topic: Color('#f00'),
      
      'should be equal to RGB(R=1; G=0; B=0; ALPHA=1)': function(color) {
        assert.colorEqual( color,
                           Color({ red: 1,
                                   green: 0,
                                   blue: 0,
                                   alpha: 1 }) );
      }
    },
    '#f0f000': {
      topic: Color('#f0f000'),
      'should be equal to RGB(R=240/255; G=240/255; B=0; ALPHA=1)': function(color) {
        assert.colorEqual( color,
                           Color({ red: 240/255,
                                   green: 240/255,
                                   blue: 0,
                                   alpha: 1 }) );
      }
    },
    'rgb(0, 23, 42)': {
      topic: Color('rgb(0, 23, 42)'),
      
      'should be equal to RGB(R=0; G=23/255; B=42/255; ALPHA=1)': function(color) {
        assert.colorEqual( color,
                           Color({ red: 0,
                                   green: 23/255,
                                   blue: 42/255,
                                   alpha: 1 }) );
      },
      'should be equal to \'rgba(0, 23, 42, 1)\'': function(color) {
        assert.colorEqual( color,
                           Color('rgba(0, 23, 42, 1)') );
      }
    },
    'rgb( 0% , 9%, 16% )': {
      topic: Color('rgb( 0% , 9%, 16% )'),
      
      'should be equal to RGB(R=0; G=0.09; B=0.16; ALPHA=1)': function(color) {
        assert.colorEqual(color,
                          Color({ red: 0,
                                  green: .09,
                                  blue: .16,
                                  alpha: 1 }) );
      },
      'should be equal to \'rgba(0%,9%,16%,1)\'': function(color) {
        assert.colorEqual(color,
                          Color('rgba(0%,9%,16%,1)'));
      }
    },
    'rgba( 255, 0, 0, .45 )': {
      topic: Color('rgba( 255, 0, 0, .45 )'),

      'should be equal to RGB(R=1; G=0: B=0; ALPHA=0.45)': function (color) {
        assert.colorEqual(color,
                          Color({ red: 1,
                                  green: 0,
                                  blue: 0,
                                  alpha: .45 }) );
      }
    },
    'hsl(203, 50%, 40%)': {
      topic: Color('hsl(203, 50%, 40%)'),
      
      'should be equal to HSL(H=203; S=0.5; L=40%; ALPHA=1)': function(color) {
        assert.colorEqual( color,
                           Color({ hue: 203,
                                   saturation: .5,
                                   lightness: .4,
                                   alpha: 1 }));
      },
      'should be equal to \'hsla(563, 50%, 40%, 2)\'': function(color) {
        assert.colorEqual( color,
                           Color('hsla(563, 50%, 40%, 2)'));
      }
    },
    'hsla(203, 50%, 40%, .48)': {
      topic: Color('hsla(203, 50%, 40%, .48)'),
      
      'should be equal to HSL(H=203; S=0.5; L=40%; ALPHA=0.48)': function(color) {
        assert.colorEqual( color,
                           Color({ hue: 203,
                                   saturation: .5,
                                   lightness: .4,
                                   alpha: .48 }));
      }
    },
    'darkseagreen': {
      topic: Color('darkseagreen'),
      
      'should be equal to `Color(\'#8FBC8F\')`': function(color) {
        assert.colorEqual(color, Color('#8FBC8F'));
      },
      'shouldn\'t be case-sensitive': function(color) {
        assert.deepEqual(Color('dArKsEaGrEeN'), color);
      }
    }
  },
  // Conversion:
  'An RGB color (R=1; G=0.5; B=0; ALPHA=.49)': {
    topic: Color({ red: 1,
                   green: .5,
                   blue: 0,
                   alpha: .49 }),
    
    'converted to HSV should be equal to HSV(H=30; S=1; V=1; ALPHA=0.49)': function(color) {
      assert.deepEqual(color.toHSV(), Color({ hue: 30,
                                              saturation: 1,
                                              value: 1,
                                              alpha: .49 }));
    },
    'converted to HSL should be equal to HSL(H=30; S=1; L=0.5; ALPHA=0.49)': function(color) {
      assert.deepEqual( color.toHSL(), Color({ hue: 30,
                                               saturation: 1,
                                               lightness: .5,
                                               alpha: .49 }) );
    }
  },
  'A HSV color (H=180; S=1; V=0.5; ALPHA=0.69)': {
    topic: Color({ hue: 180,
                   saturation: 1,
                   value: .5,
                   alpha: .69 }),
    
    'converted to RGB should be equal to RGB(R=0; G=0.5; B=0.5; ALPHA=0.69)': function(color) {
      assert.deepEqual(color.toRGB(), Color({ red: 0,
                                              green: .5,
                                              blue: .5,
                                              alpha: .69 }));
    },
    'converted to HSL should be equal to HSL(H=180; S=1; L=0.25; ALPHA=0.69)': function(color) {
      assert.deepEqual( color.toHSL(), Color({ hue: 180,
                                               saturation: 1,
                                               lightness: .25,
                                               alpha: .69 }) );
    }
  },
  'A HSL color (H=0; S=0.25; L=0.25; ALPHA=0.81)': {
    topic: Color({ hue: 0,
                   saturation: .25,
                   lightness: .25,
                   alpha: .81 }),
    'converted to RGB should be equal to RGB(R=0.3125; G=0.1875; B=0.1875; ALPHA=0.81)': function(color) {
      assert.deepEqual( color.toRGB(), Color({ red: .3125,
                                               green: .1875,
                                               blue: .1875,
                                               alpha: .81 }) );
    },
    'converted to HSV should be equal to HSV(H=0; S=0.4; V=0.3125; ALPHA=0.81)': function(color) {
      assert.deepEqual( color.toHSV(), Color({ hue: 0,
                                               saturation: .4,
                                               value: .3125,
                                               alpha: .81 }) );
    }
  },
  'Converting RGB(R=0.75; G=0.75; B=0.75; ALPHA=.45) to a hex string': {
    topic: Color({ red: .75,
                   green: .75,
                   blue: .75,
                   alpha: .45 }).toCSS(),
    
    'should result in the string \'#BFBFBF\'': function(cssColor) {
      assert.equal(cssColor, 'rgba(191,191,191,0.45)');
    }
  },
  'A color RGB (R=0; G=1; B=0) blended with 60% RGB(R=0; G=0; B=1)': {
    topic: Color({ red: 0,
                   green: 1,
                   blue: 0 }).blend(Color({ red: 0,
                                            green: 0,
                                            blue: 1 }), .6),
    
    'should result in RGB (R=0; G=0.4; B=0.6)': function(color) {
      assert.colorEqual(color, Color({ red: 0,
                                       green: .4,
                                       blue: .6 }));
    }
  },
  'The luminance of': {
    'RGB(R=1; G=1; B=1) (white)': {
      topic: Color({ red: 1,
                     green: 1,
                     blue: 1 }).getLuminance(),
      
      'should be equal to 1': function(luminance) {
        assert.equal(luminance, 1);
      }
    },
    'RGB(R=0; G=0; B=0) (black)': {
      topic: Color({ red: 0,
                     green: 0,
                     blue: 0 }).getLuminance(),
      
      'should be equal to 0': function(luminance) {
        assert.equal(luminance, 0);
      }
    }
  },
  'The complementary color of RGB(R=1; G=0; B=0)': {
    topic: Color({ red: 1,
                   green: 0,
                   blue: 0 }).complementaryScheme()[1].toRGB(),
    'should be RGB(R=0; G=1; B=0) (cyan)': function(color) {
      assert.colorEqual( color,
                         Color({ red: 0,
                                 green: 1,
                                 blue: 1 }) );
    }
  },
  'HSV(H=90; S=0.5; V=0.5)': {
    topic: Color({ hue: 90,
                   saturation: .5,
                   value: .5 }),
    'increase value by 1000% should be equal to HSV(H=90; S=0.5; V=1)': function(color) {
      assert.colorEqual( color.valueByRatio(10), 
                         Color({ hue: 90,
                                 saturation: .5,
                                 value: 1 }));
    },
    'increase value by 0.1 should be equal to HSV(H=90; S=0.5; V=0.6)': function(color) {
      assert.colorEqual( color.valueByAmount(.1),
                         Color({ hue: 90,
                                 saturation: .5,
                                 value: .6 }) );
    },
    'devalue by 50% should be equal to HSV(H=90; S=0.5; V=0.25)': function(color) {
      assert.colorEqual( color.devalueByRatio(.5),
                         Color({ hue: 90,
                                 saturation: .5,
                                 value: .25 }) );
    },
    'devalue by 2.3 should be equal to HSV(H=90; S=0.5; V=0)': function(color) {
      assert.colorEqual( color.devalueByAmount(2.3),
                         Color({ hue: 90,
                                 saturation: .5,
                                 value: 0 }) );
    },
    'saturated by 2% should be equal to HSV(H=90; S=0.51; V=0.5)': function(color) {
      assert.colorEqual( color.saturateByRatio(.02),
                         Color({ hue: 90,
                                 saturation: .51,
                                 value: .5 }) );
    },
    'saturated by -0.1 should be equal to HSV(H=90; S=0.4; V=0.5)': function(color) {
      assert.colorEqual( color.saturateByAmount(-.1),
                         Color({ hue: 90,
                                 saturation: .4,
                                 value: .5 }) );
    },
    'desaturated by 50% should be equal to HSV(H=90; S=0.25; V=0.5)': function(color) {
      assert.colorEqual( color.desaturateByRatio(.5),
                         Color({ hue: 90,
                                 saturation: .25,
                                 value: .5 }) );
    },
    'desaturated by -2.3 should be equal to HSV(H=90; S=1; V=0.5)': function(color) {
      assert.colorEqual( color.desaturateByAmount(-2.3),
                         Color({ hue: 90,
                                 saturation: 1,
                                 value: .5 }) );
    },
    'hue shifted by 359 degrees should be equal to HSV(H=89; S=0.5; V=0.5)': function(color) {
      assert.colorEqual( color.shiftHue(359),
                         Color({ hue: 89,
                                 saturation: .5,
                                 value: .5 }) );
    }
  },
  '"rgb(55, 111, 222)"': validCSS(true),
  '"rgb(2.2, 3.3, 127.3 )"': validCSS(false),
  '"rgb(1, 2, 3, 4)"': validCSS(false),
  '"rgb(aa, 22, 44)"': validCSS(false),
  '"rgb(-100, 300, +137)"': validCSS(true),
  '"rgb(100%, 50%, 30%)"': validCSS(true),
  '"rgb(88.8%, +111%, -30%)"': validCSS(true),
  '"rgb(2 %, 2%, 2%)"': validCSS(false),
  '"rgb(33%, 22%, 11)"': validCSS(false),
  '"rgba(42, 24, 42, 0)"': validCSS(true),
  '"rgba(42, 24, 42, 1)"': validCSS(true),
  '"rgba(42, 24, 42, 2)"': validCSS(true),
  '"rgba(1, 2, 3)"': validCSS(false),
  '"rgba(11, 22, 33, -.5)"': validCSS(true),
  '"rgba(33%, 50%, )"': validCSS(false),
  '"#f00"': validCSS(true),
  '"f00"': validCSS(false),
  '"#00AA00"': validCSS(true),
  '"#00aAAA999"': validCSS(false),
  '"hsl(300.3, 100%, 50%)"': validCSS(true),
  '"hsl(-300.3, 110%, -50%)"': validCSS(true),
  '"hsla(-300.3, 110%, -50%)"': validCSS(false),
  '"hsla(-300.3, 110%, -50%, 3)"': validCSS(true),
  '"seagreen"': validCSS(true),
  '"transparent"': validCSS(true)
}).export(module);
