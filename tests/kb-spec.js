capture = require('./screenshot.js');

function getSpecName() {
  var spec = jasmine.getEnv().currentSpec;
  return spec.description.split(' ').join('-');
}

// Tests for keyboard-layout-editor
describe('keyboard-layout-editor', function() {
  var kbScreenshot = function() {
    browser.waitForAngular();
    browser.driver.manage().window().setSize(1440,1024);
    browser.actions().mouseMove({x:0,y:0}).perform();
    browser.waitForAngular();
    capture.snap(getSpecName(), $('#keyboard'));
  };

  // Simple launch test
  it('should launch without an error', function() {
    browser.get('');
    kbScreenshot();
  });

  // Test renderings of various samples
  describe('rendering sample', function() {
    it('commodore-vic20', function() {
      browser.get("#/samples/commodore-vic20");
      browser.waitForAngular();
      browser.driver.sleep(2000); // give the browser time to load the custom font
      kbScreenshot();
    });

    it('gb-ccng', function() {
      browser.get("#/samples/gb-ccng");
      kbScreenshot();
    });

    it('gb-retro-dsa', function() {
      browser.get("#/samples/gb-retro-dsa");
      kbScreenshot();
    });

    it('stealth-black', function() {
      browser.get("#/samples/stealth-black");
      kbScreenshot();
    });
  });

  describe('text positioning', function() {
    it('alignment flags', function() {
      browser.get("##@@_a:0%3B&=1%0A5%0A2%0A6%0A7%0A8%0A3%0A4&_a:1%3B&=1%0A5%0A2%0A6%0A7%0A8%0A3%0A4&_a:2%3B&=1%0A5%0A2%0A6%0A7%0A8%0A3%0A4&_a:3%3B&=1%0A5%0A2%0A6%0A7%0A8%0A3%0A4%3B&@_a:4%3B&=1%0A5%0A2%0A6%0A7%0A8%0A3%0A4&_a:5%3B&=1%0A5%0A2%0A6%0A7%0A8%0A3%0A4&_a:6%3B&=1%0A5%0A2%0A6%0A7%0A8%0A3%0A4&_a:7%3B&=1%0A5%0A2%0A6%0A7%0A8%0A3%0A4");
      kbScreenshot();
    });

    it('legend sizes', function() {
      browser.get("##@@_a:0&f:5&f2:1%3B&=1%0A5%0A2%0A6%0A7%0A8%0A3%0A4&_a:1%3B&=1%0A5%0A2%0A6%0A7%0A8%0A3%0A4&_a:2%3B&=1%0A5%0A2%0A6%0A7%0A8%0A3%0A4&_a:3%3B&=1%0A5%0A2%0A6%0A7%0A8%0A3%0A4%3B&@_a:4%3B&=1%0A5%0A2%0A6%0A7%0A8%0A3%0A4&_a:5%3B&=1%0A5%0A2%0A6%0A7%0A8%0A3%0A4&_a:6%3B&=1%0A5%0A2%0A6%0A7%0A8%0A3%0A4&_a:7%3B&=1%0A5%0A2%0A6%0A7%0A8%0A3%0A4");
      kbScreenshot();
    });

    it('color overrides', function() {
      browser.get("##@@_t=%230000ff%0A%0A%23ff0000&a:0%3B&=1%0A5%0A2%0A6%0A7%0A8%0A3%0A4&_t=%2300ff00%0A%0A%0A%0A%0A%0A%23ff0000&a:1%3B&=1%0A5%0A2%0A6%0A7%0A8%0A3%0A4&_t=%230000ff%0A%0A%23ff0000&a:2%3B&=1%0A5%0A2%0A6%0A7%0A8%0A3%0A4&_t=%2300ff00%0A%0A%0A%0A%23ff0000&a:3%3B&=1%0A5%0A2%0A6%0A7%0A8%0A3%0A4");
      kbScreenshot();
    });
  });

  // Check for exceptions thrown during each scenario
  afterEach(function() {
    browser.manage().logs().get('browser').then(function(browserLog) {
      expect(browserLog.length).toEqual(0);
      if(browserLog.length) console.log(browserLog);
    });
  });
});

