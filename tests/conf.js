exports.config = {
  seleniumAddress: 'http://localhost:4444/wd/hub',
  specs: ['kb-spec.js', 'kb-serial.js'],
  baseUrl: 'http://localhost:8080/kb.html'
};
