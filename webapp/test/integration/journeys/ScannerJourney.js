sap.ui.require(["sap/ui/test/opaQunit"], function(opaTest) {
	"use strict";

	/*
	 * The three objects Given, When, Then are filled by the OPA runtime when the test is executed and contain the arrangements, actions, and assertions for the test. 
	 * The "Given-When-Then" pattern is a common style for writing tests in a readable format. To describe a test case, you basically write a user story. 
	 * Test cases in this format are easy to understand, even by non-technical people.
	 */

	QUnit.module("Login on mobile/scanner device");

	opaTest("Should show login screen on empty navigation", function(Given, When, Then) {
		// Arrangements
		// -Define possible initial states, e.g. the app is started, or specific data exists. 
		// -For performance reasons, starting the app is usually done only in the first test case of a journey.
		Given.iStartTheApp();

		// Actions
		// -Define possible events triggered by a user, e.g. entering some text, clicking a button, navigating to another page.
		When.onTheLoginPage.iLookAtTheScreen();

		// Assertions
		// -Define possible verifications, e.g. do we have the correct amount of items displayed, does a label display the right data, is a list filled. 
		// -At the end of the test case, the app is destroyed again. This is typically done only once in the last test case of the journey for performance reasons.
		Then.onTheLoginPage.thePageShouldHaveLoginInput().
		and.thePageShouldHaveLoginButton().
		and.theAppShouldNotNavigateAndStayOnLoginPage();
	});

	opaTest("Should prevent login, if input takes longer than 75ms", function(Given, When, Then) {
		// Arrangements
		// Actions
		When.onTheScannerLoginPage.iTypeInUsername("foobar");

		// Assertions
		Then.onTheScannerLoginPage
			.theInputFieldShouldPurgeInput().
		and.theAppShouldShowLoginPage();
	});

	opaTest("Should perform login, if username has been submitted within 75ms", function(Given, When, Then) {
		// Arrangements
		// Actions
		When.onTheScannerLoginPage.iTypeInUsernameAndSubmitVeryFast("phigem");

		// Assertions
		Then.onHomePage.theAppShouldNavigateToHomePage();
	});
	
	QUnit.module("Scanning barcodes from hardware to browser, without input field focus");

	opaTest("Should find the correct input field for STORAGE BIN", function(Given, When, Then) {
		// Arrangements
		Given.iTeardownMyApp();
		Given.iStartTheApp({
				hash: "/Start/Materialbewegung/WE",
				illumLoginName: "phigem"
		});
		
		// Actions
		//When.onHomePage.iEnterNewHashToAnotherPage("/Start/Materialbewegung/WE");
		When.onGoodsReceiptPage.iScanTheBarcode("109330000001");
		
		// Assertions
		Then.onGoodsReceiptPage.iShouldSeeTheMessageBox("Storage Unit 109330000001 scanned");
	});

	opaTest("Should find the correct input field for PROCESS ORDER / PHASE", function(Given, When, Then) {
		// Arrangements
		// Actions
		// Assertions
	});

	opaTest("Should find the correct input field for STORAGE LOCATION", function(Given, When, Then) {
		// Arrangements
		// Actions
		// Assertions
	});

	opaTest("Should find the correct input field for INCIDENT REASON", function(Given, When, Then) {
		// Arrangements
		// Actions
		// Assertions
	});
});