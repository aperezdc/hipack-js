/*
 * test.js
 * Copyright (C) 2015 Adrian Perez <aperez@igalia.com>
 *
 * Distributed under terms of the MIT license.
 */

var hipack = require("../hipack");
var should = require("should");

describe("hipack", function () {
	describe(".dump()", function () {

		it("encodes empty objects", function () {
			hipack.dump({}).should.equal("");
		});
		it("encodes integer numbers", function () {
			hipack.dump({ value: 42 }).should.equal("value: 42\n");
		});
		it("encodes floating point numbers", function () {
			hipack.dump({ value: 1.5 }).should.equal("value: 1.5\n");
		});
		it("encodes string values", function () {
			hipack.dump({ value: "a string" }).should.equal(
					"value: \"a string\"\n");
		});
		it("encodes boolean values", function () {
			hipack.dump({ value: false }).should.equal("value: False\n");
			hipack.dump({ value: true }).should.equal("value: True\n");
		});
		it("encodes empty arrays", function () {
			hipack.dump({ value: [] }).should.equal("value []\n");
		});
		it("encodes empty objects recursively", function () {
			hipack.dump({ value: {} }).should.equal("value {}\n");
		});
		it("encodes objects recursively", function () {
			hipack.dump({ value: { value: 42 } }).should.equal(
					"value {\n" +
					"  value: 42\n" +
					"}\n");
		});

		it("sorts dictionary keys", function () {
			hipack.dump({ c:1, b:2, a:3 }).should.equal("a: 3\nb: 2\nc: 1\n");
		});

		it("supports compact output mode", function () {
			hipack.dump({ value: [1, 2, 3, 4, 5] }, true)
				.should.equal("value[1,2,3,4,5]");
			hipack.dump({ value: { a: 1, b: [2, 3] } }, true)
				.should.equal("value{a:1,b[2,3]}");
		});

		it("cannot encode nulls", function () {
			(function () {
				hipack.dump({ value: null });
			}).should.throw(hipack.DumpError);
		});
		it("cannot encode undefineds", function () {
			(function () {
				hipack.dump({ value: undefined });
			}).should.throw(hipack.DumpError);
		});
		it("cannot encode functions", function () {
			(function () {
				hipack.dump({ value: function (){} });
			}).should.throw(hipack.DumpError);
		});

		if (typeof Symbol !== "undefined") {
			it("cannot encode symbols", function () {
				(function () {
					hipack.dump({ value: new Symbol() });
				}).should.throw(hipack.DumpError);
			});
		}

	});
});
