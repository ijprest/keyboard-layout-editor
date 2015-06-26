# URL Object Notation

An Object Notation like JSON but for URLs. [Read the full explanation on my blog](http://blog.vjeux.com/2011/javascript/urlon-url-object-notation.html).

## Get URLON

You first need to enable URLON.

### NPM
URLON is on [NPM] (http://search.npmjs.org/#/URLON).

```
npm install URLON
```
```javascript
var URLON = require('URLON');
```

### Webpage
```html
<script src="https://raw.github.com/vjeux/URLON/master/src/urlon.js"></script>
```

## Usage

### stringify

```javascript
URLON.stringify('{"table":{"achievement":{"column":"instance","ascending":true}}}')

// Output:      '_table_achievement_column=instance&ascending:true'
```

### parse

```javascript
URLON.parse('_table_achievement_column=instance&ascending:true')

// Output:  {"table":{"achievement":{"column":"instance","ascending":true}}}
```

