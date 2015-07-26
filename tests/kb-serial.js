$serial = require('../serial.js');

describe('keyboard serialization', function() {

  it('should handle empty keyboard', function() {
    var original = [];
    var kbd = $serial.deserialize(original);
    expect($serial.serialize(kbd)).toEqual(original);
  });

});
