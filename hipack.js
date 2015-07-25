/*
 * hipack.js
 * Copyright (C) 2015 Adrian Perez <aperez@igalia.com>
 *
 * Distributed under terms of the MIT license.
 */

"use strict";

var _hasOwnProperty = Object.prototype.hasOwnProperty;
var _objectKeys = Object.keys;
var _isArray = Array.isArray;


function DumpError(message) {
	this.message = message;
	if (Error.captureStackTrace) {
		Error.captureStackTrace(this, this.constructor);
	} else {
		this.stack = Error().stack;
	}
}
module.exports.DumpError = DumpError;


function Dumper(compact) {
	this.indent = compact ? -1 : 0;
	this.output = "";
}
Dumper.prototype.moreIndent = function () {
	if (this.indent >= 0) this.indent++;
}
Dumper.prototype.lessIndent = function () {
	if (this.indent > 0) this.indent--;
}
Dumper.prototype.dumpIndent = function () {
	var indent = (this.indent >= 0) ? this.indent : 0;
	while (indent--) this.output += "  ";
}
Dumper.prototype.dumpString = function (value) {
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
Dumper.prototype.dumpBoolean = function (value) {
	// assert(typeof value === "boolean")
	this.output += value ? "True" : "False";
}
Dumper.prototype.dumpNumber = function (value) {
	// assert(typeof value === "number")
	this.output += value.toString();
}
Dumper.prototype.dumpKeyVal = function (obj, keys) {
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
Dumper.prototype.dumpList = function (list) {
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
Dumper.prototype.dumpDict = function (dict) {
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
Dumper.prototype.dumpValue = function (value) {
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
		default:
			throw new DumpError("Values of type '" + valueType + "' cannot be dumped");
	}
}


function dump(data, compact) {
	var dumper = new Dumper(Boolean(compact));
	var keys = _objectKeys(data);
	dumper.dumpKeyVal(data, keys.sort());
	return dumper.output;
}

module.exports.dump = dump;
