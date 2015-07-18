// Tests for keyboard-layout-editor
describe('keyboard-layout-editor', function() {
  var home = 'http://localhost:8080/kb.html';

  // Simple launch test
  it('should launch without an error', function() {
    browser.get(home);
  });

  // Check for exceptions thrown during each scenario
  afterEach(function() {
    browser.manage().logs().get('browser').then(function(browserLog) {
      expect(browserLog.length).toEqual(0);
    });
  });
});

