var fs = require('fs');
var lwip = require('lwip');

function capture(name) {
  browser.takeScreenshot().then(function(png) {
    var stream = fs.createWriteStream('./tests/screenshots/'+(name.split(' ').join('_'))+'.png');
    stream.write(new Buffer(png, 'base64'));
    stream.end();
  });
}

exports.takeScreenshot = function(spec) {
  capture(spec.description);
};

exports.takeScreenshotOnFailure = function(spec) {
  if(!spec.results().passed()) {
    capture(spec.description);
  }
};

// snapshot a single element; inspired by snappit-mocha-protractor
function saveImage(name, image, deferred) {
  return browser.controlFlow().execute(function() {
    image.writeFile('./tests/screenshots/'+(name.split(' ').join('_'))+'.png', function (err) {
      if (err) {
        console.log('error saving screenshot:', err);
        return deferred.reject();
      }
      return deferred.fulfill();
    });
  });
}

exports.snap = function(name, elem) {
  return browser.controlFlow().execute(function() {
    return browser.takeScreenshot().then(function(png) {
      var deferred = protractor.promise.defer();
      lwip.open(new Buffer(png, 'base64'), 'png', function (err, image) {
        // Handle errors
        if(err) {
          console.log("error opening screenshot:", err);
          return deferred.reject();
        }
        // Crop the image to the desired element
        var parms = [elem.getLocation(), elem.getSize()]; // promises!
        return protractor.promise.all(parms).then(function(parms) {
          image.crop(parms[0].x, parms[0].y, parms[0].x+parms[1].width, parms[0].y+parms[1].height, function(err, image) {
            // Handle errors
            if(err) {
              console.log("error cropping screenshot:", err);
              return deferred.reject();
            }
            return saveImage(name, image, deferred);
          });
        });
      });
      return deferred.promise;
    });
  });
};
