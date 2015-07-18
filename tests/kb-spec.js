capture = require('./screenshot.js');

function getSpecName() {
  var spec = jasmine.getEnv().currentSpec;
  return spec.description.split(' ').join('-');
}

// Tests for keyboard-layout-editor
describe('keyboard-layout-editor', function() {
  var home = 'http://localhost:8080/kb.html';

  // Simple launch test
  it('should launch without an error', function() {
    browser.get(home);
    browser.driver.manage().window().setSize(1280,720);
    capture.snap(getSpecName(), $('#keyboard'));
  });

  // Check for exceptions thrown during each scenario
  afterEach(function() {
    browser.manage().logs().get('browser').then(function(browserLog) {
      expect(browserLog.length).toEqual(0);
    });
  });
});

