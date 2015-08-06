
css = require('../js/cssparser.js');

describe('css parser', function() {

  it('should parse an empty file', function() {
    expect(css.parse('')).toEqual([]);
  });

  it('should ignore HTML comments', function() {
    expect(css.parse('<!--')).toEqual([]);
    expect(css.parse('-->')).toEqual([]);
    expect(css.parse('<!-- -->')).toEqual([]);
    expect(css.parse('--> <!--')).toEqual([]);
  });

  it('should parse simple selectors', function() {
    expect(css.parse('foo{}')).toEqual([ {selector: ["foo"]} ]);
    expect(css.parse('foo {}')).toEqual([ {selector: ["foo"]} ]);
    expect(css.parse('* {}')).toEqual([ {selector: ["*"]} ]);
    expect(css.parse('.foo {}')).toEqual([ {selector: [".foo"]} ]);
    expect(css.parse('foo.bar {}')).toEqual([ {selector: ["foo.bar"]} ]);
    expect(css.parse('#foo {}')).toEqual([ {selector: ["#foo"]} ]);
    expect(css.parse('foo#bar {}')).toEqual([ {selector: ["foo#bar"]} ]);
    expect(css.parse(' foo{}')).toEqual([ {selector: ["foo"]} ]);
    expect(css.parse(' foo {} ')).toEqual([ {selector: ["foo"]} ]);
    expect(css.parse('foo { }')).toEqual([ {selector: ["foo"]} ]);
  });

  it('should parse combinators', function() {
    expect(css.parse('foo bar {}')).toEqual([ {selector: ["foo bar"]} ]);
    expect(css.parse('foo\nbar {}')).toEqual([ {selector: ["foo bar"]} ]);
    expect(css.parse('foo > bar {}')).toEqual([ {selector: ["foo>bar"]} ]);
    expect(css.parse('foo + bar {}')).toEqual([ {selector: ["foo+bar"]} ]);
    expect(css.parse('foo ~ bar {}')).toEqual([ {selector: ["foo~bar"]} ]);
  });

  it('should parse attribute selectors', function() {
    expect(css.parse('foo[attr] {}')).toEqual([ {selector: ["foo[attr]"]} ]);
    expect(css.parse('foo[attr=val] {}')).toEqual([ {selector: ["foo[attr=val]"]} ]);
    expect(css.parse('foo[attr~=val] {}')).toEqual([ {selector: ["foo[attr~=val]"]} ]);
    expect(css.parse('foo[attr|=val] {}')).toEqual([ {selector: ["foo[attr|=val]"]} ]);
    expect(css.parse('foo[attr^=val] {}')).toEqual([ {selector: ["foo[attr^=val]"]} ]);
    expect(css.parse('foo[attr$=val] {}')).toEqual([ {selector: ["foo[attr$=val]"]} ]);
    expect(css.parse('foo[attr*=val] {}')).toEqual([ {selector: ["foo[attr*=val]"]} ]);
    expect(css.parse('foo[attr="val"] {}')).toEqual([ {selector: ["foo[attr=\"val\"]"]} ]);
    expect(css.parse('foo[attr~="val"] {}')).toEqual([ {selector: ["foo[attr~=\"val\"]"]} ]);
    expect(css.parse('foo[attr|="val"] {}')).toEqual([ {selector: ["foo[attr|=\"val\"]"]} ]);
    expect(css.parse('foo[attr^="val"] {}')).toEqual([ {selector: ["foo[attr^=\"val\"]"]} ]);
    expect(css.parse('foo[attr$="val"] {}')).toEqual([ {selector: ["foo[attr$=\"val\"]"]} ]);
    expect(css.parse('foo[attr*="val"] {}')).toEqual([ {selector: ["foo[attr*=\"val\"]"]} ]);
    expect(css.parse('foo[attr=\'val\'] {}')).toEqual([ {selector: ["foo[attr='val']"]} ]);
    expect(css.parse('foo[attr~=\'val\'] {}')).toEqual([ {selector: ["foo[attr~='val']"]} ]);
    expect(css.parse('foo[attr|=\'val\'] {}')).toEqual([ {selector: ["foo[attr|='val']"]} ]);
    expect(css.parse('foo[attr^=\'val\'] {}')).toEqual([ {selector: ["foo[attr^='val']"]} ]);
    expect(css.parse('foo[attr$=\'val\'] {}')).toEqual([ {selector: ["foo[attr$='val']"]} ]);
    expect(css.parse('foo[attr*=\'val\'] {}')).toEqual([ {selector: ["foo[attr*='val']"]} ]);
    expect(css.parse('foo[attr=5] {}')).toEqual([ {selector: ["foo[attr=5]"]} ]);
    expect(css.parse('foo[attr=--5] {}')).toEqual([ {selector: ["foo[attr=--5]"]} ]);
    expect(css.parse('foo[attr=4:5] {}')).toEqual([ {selector: ["foo[attr=4:5]"]} ]);
    expect(css.parse('foo[attr=x.y.z] {}')).toEqual([ {selector: ["foo[attr=x.y.z]"]} ]);
  });

  it('should parse pseudo-classes', function() {
    expect(css.parse(':after {}')).toEqual([ {selector: [":after"]} ]);
    expect(css.parse('foo:after {}')).toEqual([ {selector: ["foo:after"]} ]);
    expect(css.parse('foo:after:disabled {}')).toEqual([ {selector: ["foo:after:disabled"]} ]);
    expect(css.parse(':lang(fr-be) {}')).toEqual([ {selector: [":lang(fr-be)"]} ]);
    expect(css.parse('foo:lang(de) {}')).toEqual([ {selector: ["foo:lang(de)"]} ]);
    expect(css.parse('foo:nth-child(2n+1) {}')).toEqual([ {selector: ["foo:nth-child(2n+1)"]} ]);
    expect(css.parse('foo:nth-child(2n + 1) {}')).toEqual([ {selector: ["foo:nth-child(2n+1)"]} ]);
    expect(css.parse('foo:nth-child(2n) {}')).toEqual([ {selector: ["foo:nth-child(2n)"]} ]);
    expect(css.parse('foo:nth-child(n+1) {}')).toEqual([ {selector: ["foo:nth-child(n+1)"]} ]);
    expect(css.parse('foo:nth-child(n+-1) {}')).toEqual([ {selector: ["foo:nth-child(n+-1)"]} ]);
    expect(css.parse('foo:nth-child(+3n - 2) {}')).toEqual([ {selector: ["foo:nth-child(+3n-2)"]} ]);
  });

  it('should parse pseudo-elements', function() {
    expect(css.parse('::first-line {}')).toEqual([ {selector: ["::first-line"]} ]);
    expect(css.parse('div::first-line {}')).toEqual([ {selector: ["div::first-line"]} ]);
  });

  it('should parse selector groups', function() {
    expect(css.parse('foo, bar {}')).toEqual([ {selector: ["foo","bar"]} ]);
    expect(css.parse('foo ,bar {}')).toEqual([ {selector: ["foo","bar"]} ]);
    expect(css.parse('foo,bar {}')).toEqual([ {selector: ["foo","bar"]} ]);
    expect(css.parse('foo:after,\nbar {}')).toEqual([ {selector: ["foo:after","bar"]} ]);
  });

  it('should parse multiple rules', function() {
    expect(css.parse('foo{} bar{}')).toEqual([ {selector: ["foo"]}, {selector: ["bar"]} ]);
  });

  it('should parse simple declarations', function() {
    expect(css.parse('foo{a:b}')).toEqual([ {selector: ["foo"], decls: [['a','b']]} ]);
    expect(css.parse('foo{a:b;}')).toEqual([ {selector: ["foo"], decls: [['a','b']]} ]);
    expect(css.parse('foo{a:b;c:d}')).toEqual([ {selector: ["foo"], decls: [['a','b'],['c','d']]} ]);
    expect(css.parse('foo{a:b;c:d;}')).toEqual([ {selector: ["foo"], decls: [['a','b'],['c','d']]} ]);
    expect(css.parse('foo{a: b; c:d;}')).toEqual([ {selector: ["foo"], decls: [['a','b'],['c','d']]} ]);
    expect(css.parse('foo{ a: b; c : d; }')).toEqual([ {selector: ["foo"], decls: [['a','b'],['c','d']]} ]);
  });

  it('should parse complex declarations', function() {
    // Basically, anything other than a semicolon is fair game!
    expect(css.parse('foo{a:b(x+a);c:d}')).toEqual([ {selector: ["foo"], decls: [['a','b(x+a)'],['c','d']]} ]);
    expect(css.parse('foo{a:b(x+a\n) ;c:d;}')).toEqual([ {selector: ["foo"], decls: [['a','b(x+a\n)'],['c','d']]} ]);
  });

  it('should parse at-rules', function() {
    expect(css.parse('@foo;')).toEqual([ {name: '@foo'} ]);
    expect(css.parse('@foo ;')).toEqual([ {name: '@foo'} ]);
    expect(css.parse('@foo arbitrary-stuff here();')).toEqual([ {name: '@foo', selector: "arbitrary-stuff here()"} ]);
    expect(css.parse('@foo {}')).toEqual([ {name: '@foo'} ]);
    expect(css.parse('@foo{}')).toEqual([ {name: '@foo'} ]);
    expect(css.parse('@foo { arbitrary-stuff; here(); }')).toEqual([ {name: '@foo', content: "arbitrary-stuff; here();"} ]);
    expect(css.parse('@foo { nested { arbitrary-stuff; } here(); }')).toEqual([ {name: '@foo', content: "nested { arbitrary-stuff; } here();"} ]);
  });

  it('should ignore CSS comments', function() {
    expect(css.parse('/*foo*/\n')).toEqual([]);
    expect(css.parse('/*foo*/foo{}')).toEqual([ {selector: ["foo"]} ]);
    expect(css.parse('foo{}/*foo*/')).toEqual([ {selector: ["foo"]} ]);
  });
});

