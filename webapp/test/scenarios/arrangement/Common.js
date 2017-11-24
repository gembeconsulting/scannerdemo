sap.ui.define([
		'sap/ui/test/Opa5'
	],
	function(Opa5) {
		"use strict";

		function getFrameUrl(sHash, sUrlParameters) {
			sHash = sHash || "";
			var sUrl = jQuery.sap.getResourcePath("com/mii/scanner/app", ".html");

			if (sUrlParameters) {
				sUrlParameters = "?" + sUrlParameters;
			}

			return sUrl + sUrlParameters + "#" + sHash;
		}

		return Opa5.extend("com.mii.scanner.test.arrangement.Common", {

			constructor: function(oConfig) {
				Opa5.apply(this, arguments);

				this._oConfig = oConfig;
			},

			iStartTheApp: function(oOptions) {
				var sUrlParameters;
				oOptions = oOptions || {
					delay: 0,
					mobile: false,
					illumLoginName: ""
				};

				sUrlParameters = "serverDelay=" + oOptions.delay;

				if (oOptions.illumLoginName !== "") {
					sUrlParameters = sUrlParameters + "&IllumLoginName=" + oOptions.illumLoginName;
				}

				this.iStartMyAppInAFrame(getFrameUrl(oOptions.hash, sUrlParameters));
			},

			urlParameterDoesNotExist: function(sUrlParameter) {
				
				var bHasParamInUrl = window.location.href.indexOf(sUrlParameter) < 0 ? true : false;
				
				return this.waitFor({
					success: function() {
						Opa5.assert.ok(bHasParamInUrl, sUrlParameter + " has been removed from window.location.href");
					},
					errorMessage: "Could not check window.location.href"
				});
			},
			
			urlParameterExists: function(sUrlParameter) {
				
				var bHasParamInUrl = window.location.href.indexOf(sUrlParameter) > 0 ? true : false;
				
				return this.waitFor({
					success: function() {
						Opa5.assert.ok(bHasParamInUrl, sUrlParameter + " exists in window.location.href");
					},
					errorMessage: "Could not check window.location.href"
				});
			},

			iNavigateToPage: function(sHash, sViewName, sViewNamespace) {
				sViewNamespace = sViewNamespace || "com.mii.scanner.view.nav.";

				var oHashChanger = sap.ui.test.Opa5.getHashChanger();

				oHashChanger.setHash(sHash);

				return this.waitFor({
					viewName: sViewName,
					viewNamespace: sViewNamespace,
					success: function() {
						Opa5.assert.ok(true, "Navigation complete to: " + sViewName);
					},
					errorMessage: "Page " + sViewName + " not found in namespace " + sViewNamespace
				});
			}
		});
	});