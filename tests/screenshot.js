var fs = require('fs');
var lwip = require('lwip');
var git = require('git-utils');

function getFilename(name) {
  return './tests/screenshots/'+(name.split(' ').join('_'))+'.png';
}

function capture(name) {
  browser.takeScreenshot().then(function(png) {
    var stream = fs.createWriteStream(getFilename(name));
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
    var filename = getFilename(name);
    image.writeFile(filename, function (err) {
      if (err) {
        return deferred.reject('error saving screenshot: ' + err);
      }
      var status = git.open('.').getStatus(filename.substring(2));
      if(status & 128) {
        return deferred.reject("Warning: new baseline image; add image with:\n\t git add " + filename);
      } else if(status & 256) {
        return deferred.reject("Error: screenshot differs from baseline image; see differences:\n\tgit dt " + filename + "\n     If changes are acceptable:\n\tgit add " + filename);
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
          return deferred.reject("error opening screenshot: " + err);
        }
        // Crop the image to the desired element
        var parms = [elem.getLocation(), elem.getSize()]; // promises!
        return protractor.promise.all(parms).then(function(parms) {
          image.crop(parms[0].x, parms[0].y, parms[0].x+parms[1].width, parms[0].y+parms[1].height, function(err, image) {
            // Handle errors
            if(err) {
              return deferred.reject("error cropping screenshot: " + err);
            }
            return saveImage(name, image, deferred);
          });
        });
      });
      return deferred.promise;
    });
  });
};
