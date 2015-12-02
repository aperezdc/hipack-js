/*
 * test.js
 * Copyright (C) 2015 Adrian Perez <aperez@igalia.com>
 *
 * Distributed under terms of the MIT license.
 */

var hipack = require("../hipack");
var should = require("should");

describe("hipack", function () {
	it("has a .dump() function", function () {
		hipack.should.have.property("dump").which.is.a.Function();
	});
	it("has a .load() function", function () {
		hipack.should.have.property("load").which.is.a.Function();
	});
	it("has a Dumper() function", function () {
		hipack.should.have.property("Dumper").which.is.a.Function();
	});
	if("has a Parser() function", function () {
		hipack.should.have.property("Parser").which.is.a.Function();
	});
	it("has a DumpError() function", function () {
		hipack.should.have.property("DumpError").which.is.a.Function();
	});
	it("has a ParseError() function", function () {
		hipack.should.have.property("ParseError").which.is.a.Function();
	});
	it("has a noConflict() function", function () {
		hipack.should.have.property("noConflict").which.is.a.Function();
	});
	it("has an ANNOT_INT property", function () {
		hipack.should.have.property("ANNOT_INT").which.is.a.String();
	});
	it("has an ANNOT_FLOAT property", function () {
		hipack.should.have.property("ANNOT_FLOAT").which.is.a.String();
	});
	it("has an ANNOT_BOOL property", function () {
		hipack.should.have.property("ANNOT_BOOL").which.is.a.String();
	});
	it("has an ANNOT_STRING property", function () {
		hipack.should.have.property("ANNOT_STRING").which.is.a.String();
	});
	it("has an ANNOT_LIST property", function () {
		hipack.should.have.property("ANNOT_LIST").which.is.a.String();
	});
	it("has an ANNOT_DICT property", function () {
		hipack.should.have.property("ANNOT_DICT").which.is.a.String();
	});

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
		it("encodes values with annotations", function () {
			hipack.dump({ value: 1 }, false, function (obj, ann) {
				ann.add("annot"); return obj;
			}).should.equal("value: :annot 1\n");
		});
		it("encodes values with annotations compactly", function () {
			hipack.dump({ value: 1 }, true, function (obj, ann) {
				ann.add("annot"); return obj;
			}).should.equal("value::annot 1");
		});
		it("encodes compound values with annotations", function () {
			hipack.dump({ value: [] }, false, function (obj, ann) {
				ann.add("annot"); return obj;
			}).should.equal("value :annot []\n");
		});
		it("encodes compund values with annotations compactly", function () {
			hipack.dump({ value: [] }, true, function (obj, ann) {
				ann.add("annot"); return obj;
			}).should.equal("value::annot []");
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
					hipack.dump({ value: Symbol("aSymbol") });
				}).should.throw(hipack.DumpError);
			});
		}

	});


	describe(".load()", function () {

		it("decodes boolean values", function () {
			hipack.load("value: True").should.have.property("value")
				.which.is.a.Boolean().and.is.True();
			hipack.load("value: true").should.have.property("value")
				.which.is.a.Boolean().and.is.True();
			hipack.load("value: False").should.have.property("value")
				.which.is.a.Boolean().and.is.False();
			hipack.load("value: false").should.have.property("value")
				.which.is.a.Boolean().and.is.False();
		});
		it("decodes integer values", function () {
			hipack.load("value: 42").should.have.property("value")
				.which.is.a.Number().and.is.equal(42);
		});
		it("decodes negative integer values", function () {
			hipack.load("value: -42").should.have.property("value")
				.which.is.a.Number().and.is.equal(-42);
		});
		it("decodes hex integer values", function () {
			hipack.load("value: 0xCAFE").should.have.property("value")
				.which.is.a.Number().and.is.equal(0xCAFE);
		});
		it("decodes negative hex integer values", function () {
			hipack.load("value: -0xCAFE").should.have.property("value")
				.which.is.a.Number().and.is.equal(-0xCAFE);
		});
		it("decodes octal integer values", function () {
			hipack.load("value: 01755").should.have.property("value")
				.which.is.a.Number().and.is.equal(01755);
		});
		it("decodes negative octal integer values", function () {
			hipack.load("value: -01755").should.have.property("value")
				.which.is.a.Number().and.is.equal(-01755);
		});
		it("decodes floating point values", function () {
			hipack.load("value: 3.14").should.have.property("value")
				.which.is.a.Number().and.is.equal(3.14);
			hipack.load("value: -3.14").should.have.property("value")
				.which.is.a.Number().and.is.equal(-3.14);
			hipack.load("value: -3.14e4").should.have.property("value")
				.which.is.a.Number().and.is.equal(-3.14e4);
			hipack.load("value: 3.14e-4").should.have.property("value")
				.which.is.a.Number().and.is.equal(3.14e-4);
			hipack.load("value: -3.14e-4").should.have.property("value")
				.which.is.a.Number().and.is.equal(-3.14e-4);
			hipack.load("value: 3e4").should.have.property("value")
				.which.is.a.Number().and.is.equal(3e4);
			hipack.load("value: -3e4").should.have.property("value")
				.which.is.a.Number().and.is.equal(-3e4);
		});
		it("decodes string values", function () {
			hipack.load("value: \"Spam\"").should.have.property("value")
				.which.is.a.String().and.is.equal("Spam");
		});
		it("decodes empty list values", function () {
			hipack.load("value: []").should.have.property("value")
				.which.is.an.Array().and.is.empty();
		});
		it("decodes list values", function () {
			hipack.load("value: [True, False, True]")
				.should.have.property("value")
				.which.is.an.Array().and.is.eql([true, false, true]);
		});
		it("decodes empty dictionary values", function () {
			hipack.load("value: {}").should.have.property("value")
				.which.is.an.Object().and.is.eql({});
		});
		it("decodes dictionary values", function () {
			hipack.load("value: { value: True }")
				.should.have.property("value")
				.which.is.an.Object().eql({ value: true });
		});
		it("decodes space-separated list items", function () {
			hipack.load("value: [1 2 3]").should.have.property("value")
				.which.is.an.Array().and.is.eql([1, 2, 3]);
		});
		it("decodes comma-separated list items", function () {
			hipack.load("value: [1,2, 3]").should.have.property("value")
				.which.is.an.Array().and.is.eql([1, 2, 3]);
		});
		it("decodes mixed-separated list items", function () {
			hipack.load("value: [1,2 3]").should.have.property("value")
				.which.is.an.Array().and.is.eql([1, 2, 3]);
		});
		it("decodes space-separated dict items", function () {
			hipack.load("value { a:1 b:2 }").should.have.property("value")
				.which.is.an.Object().and.is.eql({ a:1, b:2 });
		});
		it("decodes comma-separated dict items", function () {
			hipack.load("value { a:1,b:2 }").should.have.property("value")
				.which.is.an.Object().and.is.eql({ a:1, b:2 });
		});
		it("decodes mixed-separated dict items", function () {
			hipack.load("value { a:1,b:2 c:3 }").should.have.property("value")
				.which.is.an.Object().and.is.eql({ a:1, b:2, c:3 });
		});
		it("decodes dict items which omit colon-after-key", function () {
			hipack.load("value { a 1, b 2 }").should.have.property("value")
				.which.is.an.Object().and.is.eql({ a:1, b:2 });
		});
		it("decodes space-separated dict items which omit colon-after-key", function () {
			hipack.load("value { a 1 b 2 }").should.have.property("value")
				.which.is.an.Object().and.is.eql({ a:1, b:2 });
		});
		it("parses a single annotation", function () {
			hipack.load("value :annot { a 1 }", function (annotations, _, value) {
				if (typeof value === "object") {
					annotations.contains("annot").should.equal(true);
					annotations.contains("other").should.equal(false);
				}
				return value;
			}).should.have.property("value").which.is.an.Object().and.is.eql({ a:1 });
		});
		it("parses multiple annotations", function () {
			hipack.load("value :ann1 :ann2 :ann3 { a 1 }", function (annotations, _, value) {
				if (typeof value === "object") {
					annotations.contains("ann1").should.equal(true);
					annotations.contains("ann2").should.equal(true);
					annotations.contains("ann3").should.equal(true);
					annotations.contains("other").should.equal(false);
				}
				return value;
			}).should.have.property("value").which.is.an.Object().and.is.eql({ a:1 });
		});
	});
});
