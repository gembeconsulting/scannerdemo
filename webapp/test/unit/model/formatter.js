sap.ui.define([
	"com/mii/scanner/model/formatter"
], function(formatter) {
	"use strict";

	QUnit.module("Test formatter function 'isPastDate(sDate, sFormat)'", {

	});

	function pastDateTestCase(assert, sDate, sFormat, bExpectedValue) {
		// Act
		var bIsPastDate = formatter.isPastDate(sDate, sFormat);

		// Assert 
		assert.strictEqual(bIsPastDate, bExpectedValue, "The past date detection of '" + sDate + "' (format: " + sFormat + ") was correct");
	}

	QUnit.test("Should detect yesterday as past date", function(assert) {
		var yesterday = new Date(Date.now() - 864e5),
			sYesterday = [yesterday.getFullYear(), yesterday.getMonth()+1, yesterday.getDate()].join("-");

		pastDateTestCase.call(this, assert, sYesterday, "YYYY-MM-DD", true);
	});

	QUnit.test("Should not detect tomorrow as past date", function(assert) {
		var tomorrow = new Date(Date.now() + 864e5),
			sTomorrow = [tomorrow.getFullYear(), tomorrow.getMonth()+1, tomorrow.getDate()].join("-");

		pastDateTestCase.call(this, assert, sTomorrow, "YYYY-MM-DD", false);
	});

	QUnit.test("Should not detect today as past date", function(assert) {
		var today = new Date(),
			sToday = [today.getFullYear(), today.getMonth()+1, today.getDate()].join("-");

		pastDateTestCase.call(this, assert, sToday, "YYYY-MM-DD", false);
	});

	QUnit.test("Should detect last year as past date in default format", function(assert) {
		var lastYear = new Date(Date.now() - 864e5*365),
			sLastYear = [lastYear.getMonth()+1, lastYear.getDate(), lastYear.getFullYear()].join("-");

		pastDateTestCase.call(this, assert, sLastYear, null, true);
	});

	QUnit.module("Test formatter function 'isEmptyStorageUnit(sQuantity)'", {});

	QUnit.test("Should detect '0.0' as empty storage unit", 1, function(assert) {
		//Arrange
		var sQuantity = "0.0";
		//System under Test + Act
		assert.ok(formatter.isEmptyStorageUnit(sQuantity), sQuantity + " is considered as empty storage unit");
	});

	QUnit.test("Should detect '0.001' as empty storage unit", 1, function(assert) {
		//Arrange
		var sQuantity = "0.001";
		//System under Test + Act
		assert.ok(formatter.isEmptyStorageUnit(sQuantity), sQuantity + " is considered as empty storage unit");
	});

	QUnit.test("Should detect 0.0 as empty storage unit", 1, function(assert) {
		//Arrange
		var sQuantity = 0.0;
		//System under Test + Act
		assert.ok(formatter.isEmptyStorageUnit(sQuantity), sQuantity + " is considered as empty storage unit");
	});

	QUnit.test("Should detect 0.001 as empty storage unit", 1, function(assert) {
		//Arrange
		var sQuantity = 0.001;
		//System under Test + Act
		assert.ok(formatter.isEmptyStorageUnit(sQuantity), sQuantity + " is considered as empty storage unit");
	});

	QUnit.test("Should detect '' as empty storage unit", 1, function(assert) {
		//Arrange
		var sQuantity = "";
		//System under Test + Act
		assert.ok(formatter.isEmptyStorageUnit(sQuantity), sQuantity + " is considered as empty storage unit");
	});

	QUnit.test("Should detect null as empty storage unit", 1, function(assert) {
		//Arrange
		var sQuantity = null;
		//System under Test + Act
		assert.ok(formatter.isEmptyStorageUnit(sQuantity), sQuantity + " is considered as empty storage unit");
	});

	QUnit.test("Should detect undefined as empty storage unit", 1, function(assert) {
		//Arrange
		var sQuantity;
		//System under Test + Act
		assert.ok(formatter.isEmptyStorageUnit(sQuantity), sQuantity + " is considered as empty storage unit");
	});

	QUnit.test("Should not detect '0.002' as empty storage unit", 1, function(assert) {
		//Arrange
		var sQuantity = "0.002";
		//System under Test + Act
		assert.ok(!formatter.isEmptyStorageUnit(sQuantity), sQuantity + " is not considered as empty storage unit");
	});

	QUnit.module("Test formatter function 'isFullStorageUnit(sQuantity)'", {});

	QUnit.test("Should detect '1.0' as full storage unit", 1, function(assert) {
		//Arrange
		var sQuantity = "1.0";
		//System under Test + Act
		assert.ok(formatter.isFullStorageUnit(sQuantity), sQuantity + " is considered as full storage unit");
	});

	QUnit.test("Should detect '1.001' as full storage unit", 1, function(assert) {
		//Arrange
		var sQuantity = "1.001";
		//System under Test + Act
		assert.ok(formatter.isFullStorageUnit(sQuantity), sQuantity + " is considered as full storage unit");
	});

	QUnit.test("Should detect 0.01 as full storage unit", 1, function(assert) {
		//Arrange
		var sQuantity = 0.01;
		//System under Test + Act
		assert.ok(formatter.isFullStorageUnit(sQuantity), sQuantity + " is considered as full storage unit");
	});

	QUnit.test("Should not detect '0.001' as full storage unit", 1, function(assert) {
		//Arrange
		var sQuantity = "0.001";
		//System under Test + Act
		assert.ok(!formatter.isFullStorageUnit(sQuantity), sQuantity + " is not considered as full storage unit");
	});

	QUnit.test("Should not detect 0.001 as full storage unit", 1, function(assert) {
		//Arrange
		var sQuantity = 0.001;
		//System under Test + Act
		assert.ok(!formatter.isFullStorageUnit(sQuantity), sQuantity + " is not considered as full storage unit");
	});

	QUnit.test("Should not detect '0.0' as full storage unit", 1, function(assert) {
		//Arrange
		var sQuantity = "0.0";
		//System under Test + Act
		assert.ok(!formatter.isFullStorageUnit(sQuantity), sQuantity + " is not considered as full storage unit");
	});

	QUnit.test("Should not detect 0.0 as full storage unit", 1, function(assert) {
		//Arrange
		var sQuantity = 0.0;
		//System under Test + Act
		assert.ok(!formatter.isFullStorageUnit(sQuantity), sQuantity + " is not considered as full storage unit");
	});

	QUnit.test("Should not detect null as full storage unit", 1, function(assert) {
		//Arrange
		var sQuantity = null;
		//System under Test + Act
		assert.ok(!formatter.isFullStorageUnit(sQuantity), sQuantity + " is not considered as full storage unit");
	});

	QUnit.test("Should not detect undefined as full storage unit", 1, function(assert) {
		//Arrange
		var sQuantity;
		//System under Test + Act
		assert.ok(!formatter.isFullStorageUnit(sQuantity), sQuantity + " is not considered as full storage unit");
	});

	QUnit.test("Should not detect '' as full storage unit", 1, function(assert) {
		//Arrange
		var sQuantity = "";
		//System under Test + Act
		assert.ok(!formatter.isFullStorageUnit(sQuantity), sQuantity + " is not considered as full storage unit");
	});
	
	QUnit.test("Should detect '90000000000000000000' as last storage unit", 2, function(assert) {
		//Arrange
		var sStorageUnit = "90000000000000000000";
		//System under Test + Act
		assert.ok(formatter.isLastStorageUnit(sStorageUnit), sStorageUnit + " is considered as last storage unit");
		assert.ok(!formatter.isNotLastStorageUnit(sStorageUnit), sStorageUnit + " is considered as last storage unit");
	});
	
	QUnit.test("Should detect 90000000000000000000 as last storage unit", 2, function(assert) {
		//Arrange
		var iStorageUnit = 90000000000000000000;
		//System under Test + Act
		assert.ok(formatter.isLastStorageUnit(iStorageUnit), iStorageUnit + " is considered as last storage unit");
		assert.ok(!formatter.isNotLastStorageUnit(iStorageUnit), iStorageUnit + " is considered as last storage unit");
	});
	
	QUnit.test("Should not detect '00000000000123458' as last storage unit", 2, function(assert) {
		//Arrange
		var sStorageUnit = "00000000000123458";
		//System under Test + Act
		assert.ok(formatter.isNotLastStorageUnit(sStorageUnit), sStorageUnit + " is considered as last storage unit");
		assert.ok(!formatter.isLastStorageUnit(sStorageUnit), sStorageUnit + " is considered as last storage unit");
	});
	
	QUnit.test("Should not detect 00000000000123458 as last storage unit", 2, function(assert) {
		//Arrange
		var iStorageUnit = 123458;
		//System under Test + Act
		assert.ok(formatter.isNotLastStorageUnit(iStorageUnit), iStorageUnit + " is considered as last storage unit");
		assert.ok(!formatter.isLastStorageUnit(iStorageUnit), iStorageUnit + " is considered as last storage unit");
	});
	
	QUnit.test("Should not detect '', null or undefined as last storage unit", 6, function(assert) {
		//Arrange
		var isEmpty = "";
		var isNull = null;
		var isUndefined = undefined;
		
		//System under Test + Act
		assert.ok(!formatter.isNotLastStorageUnit(isEmpty), isEmpty + " is not considered as last storage unit");
		assert.ok(!formatter.isNotLastStorageUnit(isNull), isNull + " is not considered as last storage unit");
		assert.ok(!formatter.isNotLastStorageUnit(isUndefined), isUndefined + " is not considered as last storage unit");
		
		assert.ok(!formatter.isLastStorageUnit(isEmpty), isEmpty + " is not considered as last storage unit");
		assert.ok(!formatter.isLastStorageUnit(isNull), isNull + " is not considered as last storage unit");
		assert.ok(!formatter.isLastStorageUnit(isUndefined), isUndefined + " is not considered as last storage unit");
	});
});