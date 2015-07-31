
css = require('../js/cssparser.js');

describe('css parser', function() {

  it('should parse an empty file', function() {
    expect(css.parse('')).toEqual({});
  });

  it('should ignore HTML comments', function() {
    expect(css.parse('<!--')).toEqual({});
    expect(css.parse('-->')).toEqual({});
    expect(css.parse('<!-- -->')).toEqual({});
    expect(css.parse('--> <!--')).toEqual({});
  });

  it('should parse simple selectors', function() {
    expect(css.parse('foo{}')).toEqual({ rules: [ {selector: ["foo"] } ] });
    expect(css.parse('foo {}')).toEqual({ rules: [ {selector: ["foo"] } ] });
    expect(css.parse('* {}')).toEqual({ rules: [ {selector: ["*"] } ] });
    expect(css.parse('.foo {}')).toEqual({ rules: [ {selector: [".foo"] } ] });
    expect(css.parse('foo.bar {}')).toEqual({ rules: [ {selector: ["foo.bar"] } ] });
    expect(css.parse('#foo {}')).toEqual({ rules: [ {selector: ["#foo"] } ] });
    expect(css.parse('foo#bar {}')).toEqual({ rules: [ {selector: ["foo#bar"] } ] });
    expect(css.parse(' foo{}')).toEqual({ rules: [ {selector: ["foo"] } ] });
    expect(css.parse(' foo {} ')).toEqual({ rules: [ {selector: ["foo"] } ] });
    expect(css.parse('foo { }')).toEqual({ rules: [ {selector: ["foo"] } ] });
  });

  it('should parse combinators', function() {
    expect(css.parse('foo bar {}')).toEqual({ rules: [ {selector: ["foo bar"] } ] });
    expect(css.parse('foo\nbar {}')).toEqual({ rules: [ {selector: ["foo bar"] } ] });
    expect(css.parse('foo > bar {}')).toEqual({ rules: [ {selector: ["foo>bar"] } ] });
    expect(css.parse('foo + bar {}')).toEqual({ rules: [ {selector: ["foo+bar"] } ] });
    expect(css.parse('foo ~ bar {}')).toEqual({ rules: [ {selector: ["foo~bar"] } ] });
  });

  it('should parse attribute selectors', function() {
    expect(css.parse('foo[attr] {}')).toEqual({ rules: [ {selector: ["foo[attr]"] } ] });
    expect(css.parse('foo[attr=val] {}')).toEqual({ rules: [ {selector: ["foo[attr=val]"] } ] });
    expect(css.parse('foo[attr~=val] {}')).toEqual({ rules: [ {selector: ["foo[attr~=val]"] } ] });
    expect(css.parse('foo[attr|=val] {}')).toEqual({ rules: [ {selector: ["foo[attr|=val]"] } ] });
    expect(css.parse('foo[attr^=val] {}')).toEqual({ rules: [ {selector: ["foo[attr^=val]"] } ] });
    expect(css.parse('foo[attr$=val] {}')).toEqual({ rules: [ {selector: ["foo[attr$=val]"] } ] });
    expect(css.parse('foo[attr*=val] {}')).toEqual({ rules: [ {selector: ["foo[attr*=val]"] } ] });
    expect(css.parse('foo[attr="val"] {}')).toEqual({ rules: [ {selector: ["foo[attr=\"val\"]"] } ] });
    expect(css.parse('foo[attr~="val"] {}')).toEqual({ rules: [ {selector: ["foo[attr~=\"val\"]"] } ] });
    expect(css.parse('foo[attr|="val"] {}')).toEqual({ rules: [ {selector: ["foo[attr|=\"val\"]"] } ] });
    expect(css.parse('foo[attr^="val"] {}')).toEqual({ rules: [ {selector: ["foo[attr^=\"val\"]"] } ] });
    expect(css.parse('foo[attr$="val"] {}')).toEqual({ rules: [ {selector: ["foo[attr$=\"val\"]"] } ] });
    expect(css.parse('foo[attr*="val"] {}')).toEqual({ rules: [ {selector: ["foo[attr*=\"val\"]"] } ] });
    expect(css.parse('foo[attr=\'val\'] {}')).toEqual({ rules: [ {selector: ["foo[attr='val']"] } ] });
    expect(css.parse('foo[attr~=\'val\'] {}')).toEqual({ rules: [ {selector: ["foo[attr~='val']"] } ] });
    expect(css.parse('foo[attr|=\'val\'] {}')).toEqual({ rules: [ {selector: ["foo[attr|='val']"] } ] });
    expect(css.parse('foo[attr^=\'val\'] {}')).toEqual({ rules: [ {selector: ["foo[attr^='val']"] } ] });
    expect(css.parse('foo[attr$=\'val\'] {}')).toEqual({ rules: [ {selector: ["foo[attr$='val']"] } ] });
    expect(css.parse('foo[attr*=\'val\'] {}')).toEqual({ rules: [ {selector: ["foo[attr*='val']"] } ] });
    expect(css.parse('foo[attr=5] {}')).toEqual({ rules: [ {selector: ["foo[attr=5]"] } ] });
    expect(css.parse('foo[attr=--5] {}')).toEqual({ rules: [ {selector: ["foo[attr=--5]"] } ] });
    expect(css.parse('foo[attr=4:5] {}')).toEqual({ rules: [ {selector: ["foo[attr=4:5]"] } ] });
    expect(css.parse('foo[attr=x.y.z] {}')).toEqual({ rules: [ {selector: ["foo[attr=x.y.z]"] } ] });
  });

  it('should parse pseudo-classes', function() {
    expect(css.parse(':after {}')).toEqual({ rules: [ {selector: [":after"] } ] });
    expect(css.parse('foo:after {}')).toEqual({ rules: [ {selector: ["foo:after"] } ] });
    expect(css.parse('foo:after:disabled {}')).toEqual({ rules: [ {selector: ["foo:after:disabled"] } ] });
    expect(css.parse(':lang(fr-be) {}')).toEqual({ rules: [ {selector: [":lang(fr-be)"] } ] });
    expect(css.parse('foo:lang(de) {}')).toEqual({ rules: [ {selector: ["foo:lang(de)"] } ] });
    expect(css.parse('foo:nth-child(2n+1) {}')).toEqual({ rules: [ {selector: ["foo:nth-child(2n+1)"] } ] });
    expect(css.parse('foo:nth-child(2n + 1) {}')).toEqual({ rules: [ {selector: ["foo:nth-child(2n+1)"] } ] });
    expect(css.parse('foo:nth-child(2n) {}')).toEqual({ rules: [ {selector: ["foo:nth-child(2n)"] } ] });
    expect(css.parse('foo:nth-child(n+1) {}')).toEqual({ rules: [ {selector: ["foo:nth-child(n+1)"] } ] });
    expect(css.parse('foo:nth-child(n+-1) {}')).toEqual({ rules: [ {selector: ["foo:nth-child(n+-1)"] } ] });
    expect(css.parse('foo:nth-child(+3n - 2) {}')).toEqual({ rules: [ {selector: ["foo:nth-child(+3n-2)"] } ] });
  });

  it('should parse pseudo-elements', function() {
    expect(css.parse('::first-line {}')).toEqual({ rules: [ {selector: ["::first-line"] } ] });
    expect(css.parse('div::first-line {}')).toEqual({ rules: [ {selector: ["div::first-line"] } ] });
  });

  it('should parse selector groups', function() {
    expect(css.parse('foo, bar {}')).toEqual({ rules: [ {selector: ["foo","bar"] } ] });
    expect(css.parse('foo ,bar {}')).toEqual({ rules: [ {selector: ["foo","bar"] } ] });
    expect(css.parse('foo,bar {}')).toEqual({ rules: [ {selector: ["foo","bar"] } ] });
    expect(css.parse('foo:after,\nbar {}')).toEqual({ rules: [ {selector: ["foo:after","bar"] } ] });
  });

  it('should parse multiple rules', function() {
    expect(css.parse('foo{} bar{}')).toEqual({ rules: [ {selector: ["foo"] }, { selector:["bar"] } ] });
  });

  it('should parse simple declarations', function() {
    expect(css.parse('foo{a:b}')).toEqual({ rules: [ {selector: ["foo"], decls: [['a','b']] } ] });
    expect(css.parse('foo{a:b;}')).toEqual({ rules: [ {selector: ["foo"], decls: [['a','b']] } ] });
    expect(css.parse('foo{a:b;c:d}')).toEqual({ rules: [ {selector: ["foo"], decls: [['a','b'],['c','d']] } ] });
    expect(css.parse('foo{a:b;c:d;}')).toEqual({ rules: [ {selector: ["foo"], decls: [['a','b'],['c','d']] } ] });
    expect(css.parse('foo{a: b; c:d;}')).toEqual({ rules: [ {selector: ["foo"], decls: [['a','b'],['c','d']] } ] });
    expect(css.parse('foo{ a: b; c : d; }')).toEqual({ rules: [ {selector: ["foo"], decls: [['a','b'],['c','d']] } ] });
  });

  it('should parse complex declarations', function() {
    // Basically, anything other than a semicolon is fair game!
    expect(css.parse('foo{a:b(x+a);c:d}')).toEqual({ rules: [ {selector: ["foo"], decls: [['a','b(x+a)'],['c','d']] } ] });
    expect(css.parse('foo{a:b(x+a\n) ;c:d;}')).toEqual({ rules: [ {selector: ["foo"], decls: [['a','b(x+a\n)'],['c','d']] } ] });
  });

  it('should parse at-rules', function() {
    expect(css.parse('@foo;')).toEqual({ rules: [ {name: '@foo'} ] });
    expect(css.parse('@foo ;')).toEqual({ rules: [ {name: '@foo'} ] });
    expect(css.parse('@foo arbitrary-stuff here();')).toEqual({ rules: [ {name: '@foo', selector: "arbitrary-stuff here()"} ] });
    expect(css.parse('@foo {}')).toEqual({ rules: [ {name: '@foo'} ] });
    expect(css.parse('@foo { arbitrary-stuff; here(); }')).toEqual({ rules: [ {name: '@foo', content: "arbitrary-stuff; here();"} ] });
  });

});

