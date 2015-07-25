HiPack (de)serialization library in JavaScript
==============================================

JavaScript module to work with the [HiPack](http://hipack.org) serialization
format. The implementation and API are intentionally simple.

Features:

* Reading and writing HiPack formatted messages.
* Small, self contained JavaScript implementation.
* Works in NodeJS, IoJS, and browsers.


Usage
-----

```javascript
var hipack = require("hipack");
console.info(hipack.dump({
  authors: [
    { name: "Adrián Pérez", email: "aperez@igalia.com" },
    { name: "John Doe", email: "j@doe.org" },
  ]
}));
```

will generate the following output:

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


Installation
------------

With `npm`:

```sh
npm install hipack
```

