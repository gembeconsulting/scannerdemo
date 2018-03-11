sap.ui.define([
	"./ActionBaseController",
	"sap/ui/model/json/JSONModel",
	"sap/m/MessageBox",
	"com/mii/scanner/model/sapType",
	"com/mii/scanner/model/formatter"
], function(ActionBaseController, JSONModel, MessageBox, sapType, formatter) {
	"use strict";

	return ActionBaseController.extend("com.mii.scanner.controller.action.RollerConveyor", {

		sapType: sapType,
		formatter: formatter,

		mapStorageBinToRessource: [{
			BEUM: "00248110"
		}, {
			PALE: "00253110"
		}],

		_oInitData: {
			// entry data
			storageUnit: null,
			entryQuantity: null,
			unitOfMeasure: null,
			storageBin: null,
			stretcherActive: false,
			// external data from storage unit
			LENUM: null,
			MEINH: null,
			ISTME: null
		},

		_oInitView: {
			bValid: false,
			bStorageUnitValid: true,
			storageUnitValueState: sap.ui.core.ValueState.None,
			storageBinValueState: sap.ui.core.ValueState.None
		},

		onInit: function() {
			//call super class onInit to apply user login protection. DO NOT DELETE!
			ActionBaseController.prototype.onInit.call(this);

			//jQuery(document).on("scannerDetectionComplete", this.handleBarcodeScanned.bind(this));

			this.setModel(new JSONModel(jQuery.extend({}, this._oInitData)), "data");

			this.setModel(new JSONModel(jQuery.extend({}, this._oInitView)), "view");
		},

		/*
		 *	if(lgplatz == "02")
		 *		queryString += "&ARBID=00248110";	//BEUM
		 *	if(lgplatz == "04")
		 *		queryString += "&ARBID=00253110";	//PALE
		 */

		onSave: function(oEvent) {
			var oDataModel = this.getModel("data"),
				oData = oDataModel.getData(),
				oBundle = this.getResourceBundle(),
				bIsLastUnit = this.formatter.isLastStorageUnit(oDataModel.getProperty("/storageUnit")),
				bIsEmptyUnit = this.formatter.isEmptyStorageUnit(oDataModel.getProperty("/ISTME")),
				doPosting,
				fnError,
				that = this;

			// prepare messages array
			oData.messages = [];

			if (bIsLastUnit) { // considering bIsEmptyUnit is always true if bIsLastUnit is true
				oData.messages.push("Letzte Palette");
				//oDataModel.setProperty("/movementType", 555);

				doPosting = this._findRunningProcessOrder(oData)
					.then(this._createGoodsReceiptRollerConveyor.bind(this)); //555

			} else if (bIsEmptyUnit) {
				oData.messages.push("Laufende Palette");
				//oDataModel.setProperty("/movementType", 101);

				doPosting = this._createGoodsReceipt(oData); //101

			} else {
				oData.messages.push("Laufende Palette");
				doPosting = Promise.resolve(oData);
			}

			fnError = function(oError) {
				MessageBox.error(oError.message, {
					title: oError.name + oBundle.getText("error.miiTransactionErrorText", [oError.serviceName])
				});
			};

			doPosting.then(this._createStockTransfer.bind(this))
				.catch(fnError)
				.then(function() {
					that.addLogMessage({
						text: oData.messages.join("\n"),
						type: sap.ui.core.MessageType.Success
					});
				});
		},

		onStorageUnitInputChange: function(oEvent) {
			var oSource = oEvent.getSource(),
				sStorageUnitNumber = oEvent.getParameter("value"),
				oDataModel = this.getModel("data"),
				oBundle = this.getResourceBundle(),
				fnResolve,
				fnReject;

			oSource.setValueState(sap.ui.core.ValueState.None);

			if (!sStorageUnitNumber) {
				return false;
			}

			// on last unit, set dummy storageUnit to hide info fragment and repair storage bin selection
			if (this.formatter.isLastStorageUnit(sStorageUnitNumber)) {

				this.addLogMessage({
					text: oBundle.getText("rollerConveyor.messageText.lastStorageUnit"),
					type: sap.ui.core.MessageType.Information
				});

				return this.setAndRepairDataModel(oSource, sStorageUnitNumber);
			}

			sStorageUnitNumber = this._padStorageUnitNumber(sStorageUnitNumber);

			this.showControlBusyIndicator(oSource);

			this.clearLogMessages();

			fnResolve = function(oData) {
				var oStorageUnit,
					aResultList,
					bStorageUnitValid;

				try {

					aResultList = oData.d.results[0].Rowset.results[0].Row.results;

					if (aResultList.length === 1) {
						oStorageUnit = this._formatStorageUnitData(oData.d.results[0].Rowset.results[0].Row.results[0]);
						oSource.setValueState(sap.ui.core.ValueState.Success);
						bStorageUnitValid = true;
					} else {
						this.addLogMessage({
							text: oBundle.getText("rollerConveyor.messageText.storageUnitNotFound", [sStorageUnitNumber])
						});
						oSource.setValueState(sap.ui.core.ValueState.Error);
						bStorageUnitValid = false;
					}

					if (bStorageUnitValid) {
						oDataModel.setData(oStorageUnit, true /*bMerge*/ );

						//remap some properties
						oDataModel.setProperty("/unitOfMeasure", oStorageUnit.MEINH);
						oDataModel.setProperty("/orderNumber", oStorageUnit.AUFNR);

						if (!this.formatter.isEmptyStorageUnit(oStorageUnit.ISTME)) {
							oDataModel.setProperty("/entryQuantity", oStorageUnit.ISTME);
						} else {
							oDataModel.setProperty("/entryQuantity", null);
						}
					}

				} catch (err) {
					MessageBox.error(oBundle.getText("rollerConveyor.errorMessageText.storageUnit"), {
						title: err
					});
					oSource.setValueState(sap.ui.core.ValueState.Error);
					bStorageUnitValid = false;
				} finally {
					this.getModel("view").setProperty("/bStorageUnitValid", bStorageUnitValid);
					this.updateViewControls(oDataModel.getData());
				}

			}.bind(this);

			fnReject = function(oError) {
				MessageBox.error(oBundle.getText("rollerConveyor.storageUnit.errorMessageText"));
			}.bind(this);

			this.requestStorageUnitInfoService(sStorageUnitNumber)
				.then(fnResolve, fnReject)
				.then(function() {
					this.hideControlBusyIndicator(oSource);
				}.bind(this));

			return true;
		},

		setAndRepairDataModel: function(oSource, sStorageUnitNumber) {
			var oDataModel = this.getModel("data"),
				oRessource,
				oStorageBinControl,
				oStorageBin,
				oItem;

			oDataModel.setData({
				entryQuantity: null,
				unitOfMeasure: null,
				LENUM: null,
				MEINH: null,
				ISTME: null
			}, true);

			oSource.setValueState(sap.ui.core.ValueState.Success);

			//reset storage bin, if wrong was selected before
			oStorageBinControl = this.byId("storageBinSelection");
			oStorageBin = oStorageBinControl.getSelectedItem();

			if (oStorageBin && !oStorageBin.getEnabled()) {
				oStorageBinControl.setSelectedItemId(); //clear value
			}

			oRessource = this.getRessourceOfDummyStorageUnit(sStorageUnitNumber);

			if (oRessource) {
				oItem = oStorageBinControl.getItemByKey(oRessource.get("storageBin"));
				oStorageBinControl.setSelectedItem(oItem);
				oStorageBinControl.fireSelectionChange({
					selectedItem: oItem
				});
				//oStorageBinControl.setSelectedKey(oRessource.get("storageBin"));
			}

			return true;
		},

		getRessourceOfDummyStorageUnit: function(sStorageUnitNumber) {
			var sRessource,
				oRessource,
				mRessource = new Map();

			// check if valid LE
			if (!sStorageUnitNumber.startsWith("900") && sStorageUnitNumber.length === 20) {
				return mRessource;
			}

			// find ressource id
			sRessource = sStorageUnitNumber.substring(1, 9);

			//check ressource id
			oRessource = this.mapStorageBinToRessource.filter(function(o) {
				return Object.values(o)[0] === sRessource;
			})[0];

			if (!oRessource) {
				return mRessource;
			}

			mRessource.set("ressourceId", Object.values(oRessource)[0]);
			mRessource.set("storageBin", Object.keys(oRessource)[0]);
			mRessource.set("storageBin", Object.keys(oRessource)[0]);

			return mRessource;
		},

		onQuantityInputChange: function(oEvent) {
			this.updateViewControls(this.getModel("data").getData());
		},

		onUnitOfMeasureInputChange: function(oEvent) {
			var sUoM = oEvent.getParameter("value"),
				oDataModel = this.getModel("data");

			oDataModel.setProperty("/unitOfMeasure", sUoM.toUpperCase());

			this.updateViewControls(oDataModel.getData());
		},

		onStorageBinSelectionChange: function(oEvent) {
			var oSource = oEvent.getSource(),
				oSelectedItem = oSource.getSelectedItem(),
				sStorageBinId = oSelectedItem.data("storageBinId"),
				oDataModel = this.getModel("data");

			oDataModel.setProperty("/storageBinId", sStorageBinId);

			this.updateViewControls(this.getModel("data").getData());
		},

		updateViewControls: function(oData) {
			var oViewModel = this.getModel("view"),
				bStorageUnitValid = oViewModel.getProperty("/bStorageUnitValid"),
				bInputValuesComplete,
				bNoErrorMessagesActive,
				bReadyForPosting;

			// check if all required input data is present
			bInputValuesComplete = this.isInputDataValid(oData);

			// check if all input data has proper format
			bNoErrorMessagesActive = this.isMessageModelClean();

			// we are ready for posting once we have complete and proper formatted input
			bReadyForPosting = bNoErrorMessagesActive && bInputValuesComplete && bStorageUnitValid;

			oViewModel.setProperty("/bValid", bReadyForPosting);
		},

		isInputDataValid: function(oData) {
			return !!oData.storageUnit && !!oData.storageBin && !!oData.storageBinId && oData.entryQuantity > 0 && oData.entryQuantity !== "" && !!oData.unitOfMeasure;
		},

		findRessourceOfStorageBin: function(sStorageBin) {
			return this.mapStorageBinToRessource.filter(function(o) {
				return !!o[sStorageBin];
			})[0][sStorageBin];
		},

		/**
		 * creates a goods receipt by sending goods movement to ERP
		 * 
		 * sBwA controls what service is called: 
		 * - Calls on sBwA 101 => SUMISA/Production/trx_GoodsMovementToSap
		 * - Sends in case 101: BWART, AUFNR, LENUM, MENGE, MEINS, UNAME
		 * 
		 * Example: SUMISA/Production/trx_GoodsMovementToSap&BWART=101&AUFNR=1093338&LENUM=00000000109333800001&MENGE=1000&MEINS=KG&UNAME=PHIGEM
		 * 
		 * @param oData {object} data
		 * @return Promise {object} resolved with message {string}
		 */
		_createGoodsReceipt: function(oData) {
			var sendGoodsReceiptPromise,
				sPath = "/",
				oDataModel = this.getModel("data"),
				oGoodsReceiptModel = this.getModel("goodsMovement"),
				sDefaultMoveType = "101",
				sDefaultUnitOfMeasure = "KG",
				oParam,
				fnResolve,
				fnReject;

			oData.messages.push("Normal-Wareneingang mit echt BwA 101");

			oParam = {
				"Param.1": oDataModel.getProperty(sPath + "storageUnit"),
				"Param.2": oDataModel.getProperty(sPath + "orderNumber"),
				"Param.4": oDataModel.getProperty(sPath + "entryQuantity"),
				"Param.5": oDataModel.getProperty(sPath + "unitOfMeasure") || sDefaultUnitOfMeasure,
				//"Param.10": oDataModel.getProperty(sPath + "UNAME"),
				"Param.11": oDataModel.getProperty(sPath + "movementType") || sDefaultMoveType
			};

			sendGoodsReceiptPromise = oGoodsReceiptModel.loadMiiData(oGoodsReceiptModel._sServiceUrl, oParam);

			fnResolve = function(oIllumData) {
				var oResult = oIllumData.d.results["0"],
					oRow;

				if (oResult.FatalError) {
					throw new Error(oResult.FatalError);
				}

				if (oResult.Messages.results) {
					oResult.Messages.results.forEach(function(msg) {
						oData.messages.push(msg.Message);
					});
				}

				if (oResult.Rowset.results["0"].Row.results.length === 1) {
					oRow = oResult.Rowset.results["0"].Row.results["0"];
					oData.storageUnit = oRow.LENUM;
					oData.messages.push("Lagereinheit " + oRow.LENUM + " gebucht.");
				} else {
					throw new Error("Die Transaktion hat keine LE zurückgegeben.");
				}

				oData.messages.push("Lagereinheit " + oRow.LENUM + " gebucht.");

				return oData;
			}.bind(this);

			fnReject = function(oError) {
				MessageBox.error(oError.message, {
					title: oError.name
				});
			}.bind(this);

			return sendGoodsReceiptPromise.then(fnResolve, fnReject);
		},

		/**
		 * creates a goods receipt special for roller conveyor by sending goods movement to ERP
		 * 
		 * sBwA controls what service is called:
		 * - Calls on sBwA 555 => SUMISA/Production/trx_GoodsMovementToSAP_Rollenbahn
		 * - Sends in case 555: AUFNR, ARBID, MENGE, MEINS, UNAME
		 * 
		 * Example: SUMISA/Production/trx_GoodsMovementToSAP_Rollenbahn&BWART=555&AUFNR=1093334&ARBID=00253110&MENGE=1001&UNAME=PHIGEM
		 * 
		 * @param oData {object} data
		 * @return Promise {object} resolved with message {string}
		 */
		_createGoodsReceiptRollerConveyor: function(oData) {
			var sendGoodsReceiptRollerConveyorPromise,
				sPath = "/",
				oDataModel = this.getModel("data"),
				oGoodsReceiptRollerConveyorModel = this.getModel("goodsMovementRollerConveyor"),
				oParam,
				fnResolve, fnReject;

			oData.messages.push("Spezial-Wareneingang mit pseudo BwA 555");

			oParam = {
				"Param.1": oDataModel.getProperty(sPath + "orderNumber"),
				"Param.2": oDataModel.getProperty(sPath + "ressourceId"),
				"Param.3": oDataModel.getProperty(sPath + "entryQuantity"),
				"Param.4": oDataModel.getProperty(sPath + "UNAME")
			};

			fnResolve = function(oIllumData) {
				var oResult = oIllumData.d.results["0"],
					oRow;

				if (oResult.FatalError) {
					throw new Error(oResult.FatalError);
				}

				if (oResult.Messages.results) {
					oResult.Messages.results.forEach(function(msg) {
						oData.messages.push(msg.Message);
					});
				}

				if (oResult.Rowset.results["0"].Row.results.length === 1) {
					oRow = oResult.Rowset.results["0"].Row.results["0"];
					oData.storageUnit = oRow.LENUM;
					oData.messages.push("Lagereinheit " + oRow.LENUM + " gebucht.");
				} else {
					throw new Error("Die Transaktion hat keine LE zurückgegeben.");
				}

				return oData;
			}.bind(this);

			fnReject = function(oError) {
				MessageBox.error(oError.message, {
					title: oError.name
				});
			}.bind(this);

			sendGoodsReceiptRollerConveyorPromise = oGoodsReceiptRollerConveyorModel.loadMiiData(oGoodsReceiptRollerConveyorModel._sServiceUrl, oParam);

			return sendGoodsReceiptRollerConveyorPromise.then(fnResolve, fnReject);
		},

		/**
		 * Creates a new storage unit aka. palette
		 * - Calls SUMISA/Scanner/Rollenbahn/trx_NeuePalette
		 * - Sends the storage unit number, storage bin, stretch program, IllumLoginName
		 * - Sends the LETZTE_LE flag if storage bin is "BEUM" or "PALE"
		 * 
		 * example for predecessing 101: SUMISA/Scanner/Rollenbahn/trx_NeuePalette&LE=00000000109333800001&Lagerplatz=01&Stretch=1&IllumLoginName=PHIGEM
		 * 
		 * @param {string|number} sStorageUnitNumber storage unit number to be created in MII
		 * @param {string} sStorageBin storage bin to where storage unit will be stored
		 * @param {string} sStretchProgram used stretch program
		 */
		_createStockTransfer: function(oData) {
			var sendStockTransferPromise,
				sPath = "/",
				oDataModel = this.getModel("data"),
				oStorageUnitCreateModel = this.getModel("storageUnitCreate"),
				oParam,
				fnResolve, fnReject;

			oData.messages.push("Spezial-Umbuchung mit pseudo BwA 999");

			oParam = {
				"Param.1": oDataModel.getProperty(sPath + "storageBinId"), //Lagerplatz (ID),
				"Param.2": oDataModel.getProperty(sPath + "stretcherActive") ? 1 : 0, //Stretch,
				"Param.3": this.formatter.isLastStorageUnit(oDataModel.getProperty(sPath + "storageUnit")) ? 1 : 0, //LETZE_LE,
				"Param.4": this._padStorageUnitNumber(oDataModel.getProperty(sPath + "storageUnit")) //LE
			};

			fnResolve = function(oIllumData) {
				var oResult = oIllumData.d.results["0"];

				if (oResult.FatalError) {
					throw new Error(oResult.FatalError);
				}

				if (oResult.Messages.results) {
					oResult.Messages.results.forEach(function(msg) {
						oData.messages.push(msg.Message);
					});
				}
				return oData;
			}.bind(this);

			fnReject = function(oError) {
				MessageBox.error(oError.message, {
					title: oError.name
				});
			}.bind(this);

			sendStockTransferPromise = oStorageUnitCreateModel.loadMiiData(oStorageUnitCreateModel._sServiceUrl, oParam);

			return sendStockTransferPromise.then(fnResolve, fnReject);
		},

		/**
		 * Resolves the currently running process order by the given storage bin
		 * - Calls SUMISA/Scanner/Rollenbahn/sql_FindCurrentPAByARBID
		 * - Sends Param.1 = sRessource (BEUM: 00248110 | PALE:00253110)
		 * 
		 * @param oData {object} data
		 * @return Promise {object} resolved with sOrderNumber {string}
		 */
		_findRunningProcessOrder: function(oData) {
			var findProcessOrderPromise,
				sRessource = this.findRessourceOfStorageBin(oData.storageBin),
				oCurrentProcessOrderModel = this.getModel("currentProcessOrder"),
				oParam,
				fnResolve, fnReject;

			oData.messages.push("Aufgabepunkt für Ressource " + sRessource);

			oParam = {
				"Param.1": sRessource //ARBID
			};

			fnResolve = function(oIllumData) {
				var oResult = oIllumData.d.results["0"],
					oRow;

				if (oResult.FatalError) {
					throw new Error(oResult.FatalError);
				}

				if (oResult.Messages.results) {
					oResult.Messages.results.forEach(function(msg) {
						oData.messages.push(msg.Message);
					});
				}

				if (oResult.Rowset.results["0"].Row.results.length === 1) {
					oRow = oResult.Rowset.results["0"].Row.results["0"];
					oData.orderNumber = oRow.AUFNR;
					oData.operationNumber = oRow.VORNR;
					oData.ressourceId = oRow.ARBID;

					oData.messages.push("Auf Ressource " + sRessource + " läuft Prozessauftrag " + oRow.AUFNR);

				} else {
					throw new Error("Der aktuell laufende Prozessauftrag auf Ressource " + sRessource + " konnte nicht eindeutig bestimmt werden.");
				}

				return oData;
			}.bind(this);

			fnReject = function(oError) {
				MessageBox.error(oError.message, {
					title: oError.name
				});
			}.bind(this);

			findProcessOrderPromise = oCurrentProcessOrderModel.loadMiiData(oCurrentProcessOrderModel._sServiceUrl, oParam);

			return findProcessOrderPromise.then(fnResolve, fnReject);
		}
	});

});