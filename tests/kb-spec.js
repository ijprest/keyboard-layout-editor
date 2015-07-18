capture = require('./screenshot.js');

function getSpecName() {
  var spec = jasmine.getEnv().currentSpec;
  return spec.description.split(' ').join('-');
}

// Tests for keyboard-layout-editor
describe('keyboard-layout-editor', function() {
  var home = 'http://localhost:8080/kb.html';
  var kbScreenshot = function() {
    browser.waitForAngular();
    browser.driver.manage().window().setSize(1440,1024);
    browser.actions().mouseMove({x:0,y:0}).perform();
    browser.waitForAngular();
    capture.snap(getSpecName(), $('#keyboard'));
  };

  // Simple launch test
  it('should launch without an error', function() {
    browser.get(home);
    kbScreenshot();
  });

  // Test renderings of various samples
  describe('rendering sample', function() {
    it('commodore-vic20', function() {
      browser.get(home + "#/samples/commodore-vic20");
      browser.waitForAngular();
      browser.driver.sleep(2000); // give the browser time to load the custom font
      kbScreenshot();
    });

    it('gb-ccng', function() {
      browser.get(home + "#/samples/gb-ccng");
      kbScreenshot();
    });

    it('gb-retro-dsa', function() {
      browser.get(home + "#/samples/gb-retro-dsa");
      kbScreenshot();
    });

    it('stealth-black', function() {
      browser.get(home + "#/samples/stealth-black");
      kbScreenshot();
    });
  });

  // Check for exceptions thrown during each scenario
  afterEach(function() {
    browser.manage().logs().get('browser').then(function(browserLog) {
      expect(browserLog.length).toEqual(0);
    });
  });
});

