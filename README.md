HiPack (de)serialization library in JavaScript
==============================================

[![Builld status](https://img.shields.io/travis/aperezdc/hipack-js.svg?style=flat-square)](https://travis-ci.org/aperezdc/hipack-js)

JavaScript module to work with the [HiPack](http://hipack.org) serialization
format. The implementation and API are intentionally simple.

Features:

* Reading and writing HiPack formatted messages.
* Works in NodeJS and browsers.
* Small, self contained JavaScript implementation.
* Less than 8kB when minified using [UglifyJS2](http://lisperator.net/uglifyjs/)!


Installation
------------

For [Node](http://nodejs.org), `npm` can be used to install the module:

```sh
npm install hipack-js
```

A `hipack-js` package is also available to be used with
[Bower](http://bower.io):

```sh
bower install hipack-js
```


Usage
-----

(The following examples use [Node](http://nodejs.org).)

First, import the module:

```javascript
var hipack = require("hipack")
```

To serialize an object containing data, use `hipack.dump()`:

```javascript
var hiPackText = hipack.dump({
  authors: [
    { name: "Adrián Pérez", email: "aperez@igalia.com" },
    { name: "John Doe", email: "j@doe.org" },
  ]
});
console.info(hiPackText);
```

The call to `console.info()` will output the following

```
authors [
  {
     email: "aperez@igalia.com"
     name: "Adrián Pérez"
  }
  {
    email: "j@doe.org"
    name: "John Doe"
  }
]
```

Optionally, pass `true` as a second parameter to `hipack.dump()` in order to
generate a “compact” representation of the data with indentation and
whitespace removed, all in a single line.

Parsing is done using the `hipack.load()` function:

```javascript
var data = hipack.load(hiPackText);
```


Browser Usage
-------------

The [hipack.js](hipack.js) script can be directly used with a `<script>`
tag (a [minified version](hipack.min.js) is also available):

```html
<!-- This creates a global "hipack" object -->
<script type="text/javascript" src="hipack.js"></script>
```

If the `hipack` global name needs to be used for other purposes,
a `hipack.noConflict()` function is provided, which will restore its previous
value and return the `hipack` object:

```html
<script type="text/javascript">
  var myHiPack = hipack.noConflict();
  // Now the API functions are in "myHiPack"
  var data = myHiPack.load( ... );
</script>
```
