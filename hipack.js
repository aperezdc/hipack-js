/*
 * hipack.js
 * Copyright (C) 2015 Adrian Perez <aperez@igalia.com>
 *
 * Distributed under terms of the MIT license.
 */

"use strict";
(function () {
	var root = this;
	var previousModule = root.hipack;

	var hipack = {};
	hipack.noConflict = function () {
		root.hipack = previousModule;
		return hipack;
	}

	/* Minimal implementation of ES6 Set, used as fall-back. */
	if (Set === undefined) {
		var Set = function () { this._set = Object.create(null) }
		Set.prototype.add = function (item) { this._set[item] = true }
		Set.prototype.remove = function (item) { delete this._set[item] }
		Set.prototype.contains = function (item) { return !!this._set[item] }
		Set.prototype.clear = function () { this._set = Object.create(null) }
		Set.prototype.empty = function () { return Object.keys(this._set).length == 0 }
		Set.prototype.size = function () { return Object.keys(this._set).length }
		Set.prototype.get = function () { return Object.keys(this._set) }
	}

	hipack.ANNOT_INT    = ".int";
	hipack.ANNOT_FLOAT  = ".float";
	hipack.ANNOT_BOOL   = ".bool";
	hipack.ANNOT_STRING = ".string";
	hipack.ANNOT_LIST   = ".list";
	hipack.ANNOT_DICT   = ".dict";


	function isHiPackWhitespace(ch) {
		switch (ch) {
			case 0x09: /* Horizontal tab. */
			case 0x0A: /* New line. */
			case 0x0D: /* Carriage return. */
			case 0x20: /* Space. */
				return true;
			default:
				return false;
		}
	}


	function isHiPackKeyCharacter(ch) {
		switch (ch) {
			/* Keys do not contain whitespace. */
			case 0x09: /* Horizontal tab. */
			case 0x0A: /* New line. */
			case 0x0D: /* Carriage return. */
			case 0x20: /* Space. */
			/* Characters forbidden in keys by the spec. */
			case 0x5B: /* '[' */
			case 0x5D: /* ']' */
			case 0x7B: /* '{' */
			case 0x7D: /* '}' */
			case 0x3A: /* ':' */
			case 0x2C: /* ',' */
				return false;
			default:
				return true;
		}
	}


	function isHexDigit(ch) {
		switch (ch) {
			case 0x30: /* '0' */
			case 0x31: /* '1' */
			case 0x32: /* '2' */
			case 0x33: /* '3' */
			case 0x34: /* '4' */
			case 0x35: /* '5' */
			case 0x36: /* '6' */
			case 0x37: /* '7' */
			case 0x38: /* '8' */
			case 0x39: /* '9' */
			case 0x61: /* 'a' */ case 0x41: /* 'A' */
			case 0x62: /* 'b' */ case 0x42: /* 'B' */
			case 0x63: /* 'c' */ case 0x43: /* 'C' */
			case 0x64: /* 'd' */ case 0x44: /* 'D' */
			case 0x65: /* 'e' */ case 0x45: /* 'E' */
			case 0x66: /* 'f' */ case 0x46: /* 'F' */
				return true;
			default:
				return false;
		}
	}


	function isNumberCharacter(ch) {
		switch (ch) {
			case 0x2E: /* '.' */
			case 0x2B: /* '+' */
			case 0x3D: /* '-' */
				return true;
			default:
				return isHexDigit(ch);
		}
	}


	function isOctalNonZeroDigit(ch) {
		return (ch > 0x30 /* '0' */) && (ch < 0x38 /* '8' */);
	}


	function hexDigitToInt(xdigit) {
		// TODO: Check that the digit is in range.

		switch (xdigit) {
			case 0x30: /* '0' */ return 0;
			case 0x31: /* '1' */ return 1;
			case 0x32: /* '2' */ return 2;
			case 0x33: /* '3' */ return 3;
			case 0x34: /* '4' */ return 4;
			case 0x35: /* '5' */ return 5;
			case 0x36: /* '6' */ return 6;
			case 0x37: /* '7' */ return 7;
			case 0x38: /* '8' */ return 8;
			case 0x39: /* '9' */ return 9;
			case 0x61: /* 'a' */ case 0x41: /* 'A' */ return 0xA;
			case 0x62: /* 'b' */ case 0x42: /* 'B' */ return 0xB;
			case 0x63: /* 'c' */ case 0x43: /* 'C' */ return 0xC;
			case 0x64: /* 'd' */ case 0x44: /* 'D' */ return 0xD;
			case 0x65: /* 'e' */ case 0x45: /* 'E' */ return 0xE;
			case 0x66: /* 'f' */ case 0x46: /* 'F' */ return 0xF;
			default: // TODO: What to do in this case? assert? throw?
		}
	}


	var _objectKeys = Object.keys;
	var _isArray = Array.isArray;


	hipack.DumpError = function (message) {
		this.message = message;
		if (Error.captureStackTrace) {
			Error.captureStackTrace(this, this.constructor);
		} else {
			this.stack = Error().stack;
		}
	}


	hipack.value = function (obj, annotations) { return obj }

	hipack.Dumper = function (compact, value) {
		if (value === undefined)
			value = hipack.value;
		this.indent = compact ? -1 : 0;
		this.value  = value;
		this.output = "";
	}
	hipack.Dumper.prototype.moreIndent = function () {
		if (this.indent >= 0) this.indent++;
	}
	hipack.Dumper.prototype.lessIndent = function () {
		if (this.indent > 0) this.indent--;
	}
	hipack.Dumper.prototype.dumpIndent = function () {
		var indent = (this.indent >= 0) ? this.indent : 0;
		while (indent--) this.output += "  ";
	}
	hipack.Dumper.prototype.dumpString = function (value) {
		// assert(typeof value === "string")
		this.output += "\"";
		for (var i = 0; i < value.length; i++) {
			var ch = value.charCodeAt(i);
			switch (ch) {
				case 0x09: /* Horizontal tab. */
					this.output += "\\t";
					break;
				case 0x0A: /* New line. */
					this.output += "\\n";
					break;
				case 0x0D: /* Carriage return. */
					this.output += "\\r";
					break;
				case 0x22: /* Double quote. */
					this.output += "\\\"";
					break;
				case 0x5C: /* Backslash. */
					this.output += "\\\\";
					break;
				default:
					if (ch < 0x20) {
						/* ASCII non-printable character. */
						this.output += "\\";
						if (ch < 16) {
							/* Add a leading zero. */
							this.output += "0";
						}
						this.output += ch.toString(16).toUpperCase();
					} else {
						this.output += value.charAt(i);
					}
			}
		}
		this.output += "\"";
	}
	hipack.Dumper.prototype.dumpBoolean = function (value) {
		// assert(typeof value === "boolean")
		this.output += value ? "True" : "False";
	}
	hipack.Dumper.prototype.dumpNumber = function (value) {
		// assert(typeof value === "number")
		this.output += value.toString();
	}
	hipack.Dumper.prototype.dumpKeyVal = function (obj, keys) {
		for (var i = 0; i < keys.length; i++) {
			this.dumpIndent();
			this.output += keys[i];
			var value = obj[keys[i]];

			/* Only write colon for simple (non-compound) objects. */
			if (typeof value !== "object")
				this.output += ":";

			/* Do not write the extra space in compact mode. */
			if (this.indent >= 0)
				this.output += " ";

			this.dumpValue(value);

			if (this.indent >= 0) {
				this.output += "\n";
			} else if (i < keys.length-1) {
				this.output += ",";
			}
		}
	}
	hipack.Dumper.prototype.dumpList = function (list) {
		if (list.length == 0) {
			this.output += "[]";
			return;
		}

		this.output += "[";
		this.moreIndent();

		/* Do not write the newline in compact mode. */
		if (this.indent >= 0)
			this.output += "\n";

		for (var i = 0; i < list.length; i++) {
			this.dumpIndent();
			this.dumpValue(list[i]);
			if (this.indent >= 0) {
				this.output += "\n";
			} else if (i < list.length-1) {
				this.output += ",";
			}
		}
		this.lessIndent();
		this.output += "]";
	}
	hipack.Dumper.prototype.dumpDict = function (dict) {
		var keys = _objectKeys(dict);
		if (keys.length == 0) {
			this.output += "{}";
			return;
		}

		this.output += "{";
		this.moreIndent();

		/* Do not write the newline in compact mode. */
		if (this.indent >= 0)
			this.output += "\n";

		this.dumpKeyVal(dict, keys.sort());

		this.lessIndent();
		this.dumpIndent();
		this.output += "}";
	}
	hipack.Dumper.prototype.dumpValue = function (value) {
		var annotations = new Set();
		value = this.value(value, annotations);
		if (!annotations.empty()) {
			if (this.indent < 0 && this.output[this.output.length-1] != ":") {
				this.output += ":";
			}
			annotations = annotations.get();
			for (var i = 0; i < annotations.length; i++) {
				this.output += ":";
				this.output += annotations[i];
			}
			this.output += " ";
		}
		var valueType = typeof value;
		switch (valueType) {
			case "number":
				this.dumpNumber(value);
				break;
			case "boolean":
				this.dumpBoolean(value);
				break;
			case "string":
				this.dumpString(value);
				break;
			case "object":
				if (value === null) {
					valueType = "null";
				} else {
					if (_isArray(value)) {
						this.dumpList(value);
					} else {
						this.dumpDict(value);
					}
					break;
				}
				/* fall-through */
			default:
				throw new hipack.DumpError("Values of type '" +
						valueType + "' cannot be dumped");
		}
	}


	hipack.dump = function (data, compact, value) {
		var dumper = new hipack.Dumper(Boolean(compact), value);
		var keys = _objectKeys(data);
		dumper.dumpKeyVal(data, keys.sort());
		return dumper.output;
	}


	var EOF = -1;
	var _parseInt = Number.parseInt;
	var _parseFloat = Number.parseFloat;
	var _fromCharCode = String.fromCharCode;

	hipack.ParseError = function (parser, message) {
		this.message  = message;
		this.position = parser.pos;
		this.line     = parser.line;
		this.column   = parser.column;
		if (Error.captureStackTrace) {
			Error.captureStackTrace(this, this.constructor);
		} else {
			this.stack = Error().stack;
		}
	}

	hipack.cast = function (annotations, input, value) { return value }

	hipack.Parser = function (input, cast) {
		if (cast === undefined)
			cast = hipack.cast;
		this.input  = input;
		this.cast   = cast;
		this.look   = 0;
		this.line   = 1;
		this.column = 0;
		this.pos    = 0;
		this.nextCharCode();
		this.skipWhite();
		this.framed = (this.look == 0x7B /* '{' */);
	}
	hipack.Parser.prototype.nextCharCodeRaw = function () {
		if (this.pos >= this.input.length)
			return EOF;

		var ch = this.input.charCodeAt(this.pos++);
		if (ch == 0x0A /* '\n' */) {
			this.column = 0;
			this.line++;
		}
		this.column++;
		return ch;
	}
	hipack.Parser.prototype.nextCharCode = function () {
		do {
			this.look = this.nextCharCodeRaw();
			if (this.look == 0x23 /* '#' */) {
				while (this.look != 0x0A /* '\n' */ && this.look != EOF) {
					this.look = this.nextCharCodeRaw();
				}
			}
		} while (this.look != EOF && this.look == 0x23 /* '#' */);
	}
	hipack.Parser.prototype.skipWhite = function () {
		while (this.look != EOF && isHiPackWhitespace(this.look))
			this.nextCharCode();
	}
	hipack.Parser.prototype.matchCharCode = function (ch, errmsg) {
		if (this.look != ch) {
			if (errmsg === undefined) {
				errmsg = "Expected '" + _fromCharCode(ch) + "', but '" +
					_fromCharCode(this.look) + "' was found instead";
			}
			throw new hipack.ParseError(this, errmsg);
		}
		this.nextCharCode();
	}
	hipack.Parser.prototype.parseKey = function () {
		var key = null;
		while (this.look != EOF && isHiPackKeyCharacter(this.look)) {
			if (key === null) key = "";
			key += _fromCharCode(this.look);
			this.nextCharCode();
		}
		if (key === null)
			throw new hipack.ParseError(this, "key expected");
		return key;
	}
	hipack.Parser.prototype.parseString = function (annotations) {
		this.matchCharCode(0x22 /* '"' */);
		var s = '"';  // Original input string literal
		var str = ""; // String with escapes converted
		while (this.look != 0x22 /* '"' */ && this.look != EOF) {
			s += _fromCharCode(this.look);
			/* Handle escapes. */
			if (this.look == 0x5C /* '\\' */) {
				switch (this.look = this.nextCharCodeRaw()) {
					case 0x22 /* '"'  */: this.look = 0x22 /* '"'  */; break;
					case 0x6E /* 'n'  */: this.look = 0x0A /* '\n' */; break;
					case 0x72 /* 'r'  */: this.look = 0x0D /* '\r' */; break;
					case 0x74 /* 't'  */: this.look = 0x09 /* '\t' */; break;
					case 0x5C /* '\\' */: this.look = 0x5C /* '\\' */; break;
					default:
						/* Hex number. */
						var extra = this.nextCharCodeRaw();
						if (!isHexDigit(extra) || !isHexDigit(this.look)) {
							throw new hipack.ParseError(this, "invalid escape sequence");
						}
						this.look = (hexDigitToInt(this.look) * 16) + hexDigitToInt(extra);
				}
			}
			str += _fromCharCode(this.look);
			this.look = this.nextCharCodeRaw();
		}
		this.matchCharCode(0x22 /* '"'" */);
		s += '"';
		annotations.add(hipack.ANNOT_STRING);
		return this.cast(annotations, s, str);
	}
	hipack.Parser.prototype.parseList = function (annotations) {
		this.matchCharCode(0x5B /* '[' */);
		this.skipWhite();

		var list = [];
		while (this.look != 0x5D /* ']' */) {
			list.push(this.parseValue());
			var gotWhitespace = isHiPackWhitespace(this.look);
			this.skipWhite();

			/* There must be either a comma or whitespace after the value. */
			if (this.look == 0x2C /* ',' */) {
				this.nextCharCode();
			} else if (!gotWhitespace && !isHiPackWhitespace(this.look)) {
				break;
			}
			this.skipWhite();
		}

		this.matchCharCode(0x5D /* ']' */);
		annotations.add(hipack.ANNOT_LIST);
		return this.cast(annotations, null, list);
	}
	hipack.Parser.prototype.parseDict = function (annotations) {
		this.matchCharCode(0x7B /* '{' */);
		this.skipWhite();
		var dict = this.parseKeyValItems(0x7D /* '}' */);
		this.matchCharCode(0x7D /* '}' */);
		annotations.add(hipack.ANNOT_DICT);
		return this.cast(annotations, null, dict);
	}
	hipack.Parser.prototype.parseBoolean = function (annotations) {
		annotations.add(hipack.ANNOT_BOOL);
		var s = _fromCharCode(this.look);
		if (this.look == 0x54 /* 'T' */ || this.look == 0x74 /* 't' */) {
			this.nextCharCode();
			this.matchCharCode(0x72 /* 'r' */);
			this.matchCharCode(0x75 /* 'u' */);
			this.matchCharCode(0x65 /* 'e' */);
			return this.cast(annotations, s + "rue", true);
		} else if (this.look == 0x46 /* 'F' */ || this.look == 0x66 /* 'f' */) {
			this.nextCharCode();
			this.matchCharCode(0x61 /* 'a' */);
			this.matchCharCode(0x6C /* 'l' */);
			this.matchCharCode(0x73 /* 's' */);
			this.matchCharCode(0x65 /* 'e' */);
			return this.cast(annotations, s + "alse", false);
		} else {
			throw new hipack.ParseError(this, "boolean value expected");
		}
	}
	hipack.Parser.prototype.parseNumber = function (annotations) {
		var number = "";
		var hasSign = false;
		if (this.look == 0x2B /* '+' */ || this.look == 0x2D /* '-' */) {
			number += _fromCharCode(this.look);
			this.nextCharCode();
			hasSign = true;
		}

		var isOctal = false;
		var isHex = false;
		if (this.look == 0x30 /* '0' */) {
			number += "0";
			this.nextCharCode();
			if (this.look == 0x58 /* 'X' */ || this.look == 0x78 /* 'x' */) {
				number += _fromCharCode(this.look);
				this.nextCharCode();
				isHex = true;
			} else if (isOctalNonZeroDigit(this.look)) {
				isOctal = true;
			}
		}

		var dotSeen = false;
		var expSeen = false;
		while (this.look != EOF && isNumberCharacter(this.look)) {
			if (!isHex && (this.look == 0x45 /* 'E' */ ||
						   this.look == 0x65 /* 'e' */)) {
				if (expSeen) {
					throw new hipack.ParseError(this, "invalid number");
				}
				number += "e";
				expSeen = true;
				this.nextCharCode();
				/* Optional exponent sign. */
				if (this.look == 0x2B /* '+' */ || this.look == 0x2D /* '-' */) {
					number += _fromCharCode(this.look);
					this.nextCharCode();
				}
			} else {
				if (this.look == 0x2E /* '.' */) {
					if (dotSeen || isHex || isOctal) {
						throw new hipack.ParseError(this, "invalid number");
					}
					dotSeen = true;
				}
				if (this.look == 0x2B /* '+' */ || this.look == 0x2D /* '-' */) {
					throw new hipack.ParseError(this, "invalid number");
				}
				number += _fromCharCode(this.look);
				this.nextCharCode();
			}
		}

		if (number.length == 0) {
			throw new hipack.ParseError(this, "number expected");
		}

		if (isHex) {
			// TODO: assert(!isOctal);
			if (expSeen || dotSeen) {
				throw new hipack.ParseError(this, "invalid hex number");
			}
			annotations.add(hipack.ANNOT_INT)
			return this.cast(annotations, number, _parseInt(number, 16));
		} else if (isOctal) {
			// TODO: assert(!isHex);
			if (expSeen || dotSeen) {
				throw new hipack.ParseError(this, "invalid octal number");
			}
			annotations.add(hipack.ANNOT_INT);
			return this.cast(annotations, number, _parseInt(number, 8));
		} else if (dotSeen || expSeen) {
			// TODO: assert(!isHex);
			// TODO: assert(!isOctal);
			annotations.add(hipack.ANNOT_FLOAT);
			return this.cast(annotations, number, _parseFloat(number));
		} else {
			// TODO: assert(!isHex);
			// TODO: assert(!isOctal);
			// TODO: assert(!expSeen);
			// TODO: assert(!dotSeen);
			annotations.add(hipack.ANNOT_INT);
			return this.cast(annotations, number, _parseInt(number, 10));
		}
	}
	hipack.Parser.prototype.parseAnnotations = function () {
		var annotations = new Set();
		while (this.look == 0x3A /* ':' */) {
			this.nextCharCode();
			var key = this.parseKey();
			if (annotations.contains(key)) {
				throw new ParseError(this, "duplicate annotation: " + key);
			}
			annotations.add(key);
			this.skipWhite();
		}
		return annotations;
	}
	hipack.Parser.prototype.parseValue = function () {
		var annotations = this.parseAnnotations();
		switch (this.look) {
			case 0x22 /* '"' */: return this.parseString(annotations);
			case 0x5B /* '[' */: return this.parseList(annotations);
			case 0x7B /* '{' */: return this.parseDict(annotations);
			case 0x54 /* 'T' */:
			case 0x74 /* 't' */:
			case 0x46 /* 'F' */:
			case 0x66 /* 'f' */: return this.parseBoolean(annotations);
			default: return this.parseNumber(annotations);
		}
	}
	hipack.Parser.prototype.parseKeyValItems = function (eos) {
		var dict = {};
		while (this.look != eos && this.look != EOF) {
			var key = this.parseKey();
			var gotSeparator = false;
			if (isHiPackWhitespace(this.look)) {
				gotSeparator = true;
				this.skipWhite();
			} else if (this.look == 0x3A /* ':' */) {
				gotSeparator = true;
				this.nextCharCode();
				this.skipWhite();
			} else if (this.look == 0x7B /* '{' */ || this.look == 0x5B /* '[' */) {
				gotSeparator = true;
			}

			if (!gotSeparator) {
				throw new hipack.ParseError(this, "missing separator");
			}

			dict[key] = this.parseValue();

			/*
			 * There must be either a comma or a whitespace after the value, or
			 * the end-of-sequence character.
			 */
			if (this.look == 0x2C /* ',' */) {
				this.nextCharCode();
			} else if (this.look != eos && !isHiPackWhitespace(this.look)) {
				break;
			}
			this.skipWhite();
		}
		return dict;
	}
	hipack.Parser.prototype.parseMessage = function () {
		var result = null;
		if (this.framed) {
			if (this.look != EOF) {
				this.matchCharCode(0x7B /* '{' */);
				this.nextCharCode();
				this.skipWhite();
				result = this.parseKeyValItems(0x7D /* '}' */);
				this.matchCharCode(0x7D /* '}' */, "unterminated message, '}' expected");
				this.skipWhite();
			}
		} else {
			result = this.parseKeyValItems(EOF);
		}
		return result;
	}


	hipack.load = function (input, cast) {
		return (new hipack.Parser(String(input), cast)).parseMessage();
	}


	if (typeof exports !== "undefined") {
		if (typeof module !== "undefined" && module.exports) {
			exports = module.exports = hipack;
		}
		exports.hipack = hipack;
	} else {
		root.hipack = hipack;
	}
}).call(this)
