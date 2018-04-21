sap.ui.define([
	"./BaseTTController",
	"sap/ui/model/json/JSONModel",
	"sap/m/MessageBox",
	"com/mii/scanner/model/sapType",
	"com/mii/scanner/model/formatter"
], function(BaseTTController, JSONModel, MessageBox, sapType, formatter) {
	"use strict";

	return BaseTTController.extend("com.mii.scanner.controller.action.tt.InterruptOperation", {

		sapType: sapType,
		formatter: formatter,

		_oInitData: {
			//user input data
			orderNumber: null,
			operationNumber: null,
			interruptionReason: null,
			dateTimeValue: null,
			//external data
			AUFNR: null
		},

		_oInitView: {
			bValid: false,
			bOrderOperationValid: false,
			bDateTimeEntryValid: true,
			orderInputValueState: sap.ui.core.ValueState.None,
			dateTimeInputValueState: sap.ui.core.ValueState.None
		},

		onInit: function() {
			//call super class onInit to apply user login protection. DO NOT DELETE!
			BaseTTController.prototype.onInit.call(this);

			this.setModel(new JSONModel(jQuery.extend({}, this._oInitData)), "data");

			this.setModel(new JSONModel(jQuery.extend({}, this._oInitView)), "view");

			this.getRouter()
				.getRoute("interruptOperation")
				.attachMatched(this._onRouteMatched, this);

		},

		//http://su-mii-dev01.intern.suwelack.de:50000/XMII/Illuminator?QueryTemplate=SUMISA/ProcessOrder/xac_SendBeginEndPhaseToSAP_TE&Param.2=1093364&Param.3=0010&Param.4=0098&Param.5=Störung&Param.9=B30&Param.6=19.04.2018 14:17:27&Param.7=P150&Param.8=PHIGEM&Param.32=1&Content-Type=text/xml
		onSave: function() {
			var oDataModel = this.getModel("data"),
				oServiceData,
				fnResolve,
				fnReject;

			this.getOwnerComponent().showBusyIndicator();

			fnResolve = function(oData) {
				var oConfiramationNumber,
					aRows;

				if (!oData.success) {

					this.addUserMessage({
						text: oData.lastErrorMessage
					});

					return;
				}

				aRows = oData.d.results[0].Rowset.results[0].Row.results;

				/* Check if oData contains required results: extract value, evaluate value, set UI, set model data */
				if (aRows.length === 1) {
					oConfiramationNumber = aRows[0];
				} else {
					throw new Error(this.getTranslation("interruptOperation.messageText.resultIncomplete") + " @OpInterrupt");
				}

				this.addUserMessage({
					text: this.getTranslation("interruptOperation.messageText.postingSuccessfull", [oServiceData.orderNumber, oServiceData.operationNumber, moment(oServiceData.date).format("LLLL")]),
					type: sap.ui.core.MessageType.Success
				});

				this.addMessageManagerMessage("Rückmeldung " + oConfiramationNumber.CONF_NO + " erfolgreich gebucht.");

			}.bind(this);

			fnReject = function(oError) {
				this.addUserMessage({
					text: oError.message
				});
			}.bind(this);

			oServiceData = {
				orderNumber: oDataModel.getProperty("/orderNumber"),
				operationNumber: oDataModel.getProperty("/operationNumber"),
				newStatus: this.oProcessOrderStatus.interrupted,
				date: oDataModel.getProperty("/dateTimeValue"),
				materialNumber: oDataModel.getProperty("/MATNR"),
				incident: oDataModel.getProperty("/interruptionReason")
			};

			//function(sOrderNumber, sOperationNumber, oStatus, oDate, sMaterialNumber, sIncident) || function(oServiceData)
			this.requestTimeTicketService(oServiceData)
				.then(fnResolve, fnReject)
				.then(this.getOwnerComponent().hideBusyIndicator)
				.then(function() {
					this.onClearFormPress({}, true /*bKeepMessageStrip*/ );
				}.bind(this));
		},

		onOrderChange: function(oEvent) {
			var oSource = oEvent.getSource(),
				oOrderNumberInput = this.byId("orderNumberInput"),
				oOperationNumberInput = this.byId("operationNumberInput"),
				oDataModel = this.getModel("data"),
				sOrderNumber = oDataModel.getProperty("/orderNumber"),
				sOperationNumber = oDataModel.getProperty("/operationNumber"),
				fnResolve,
				fnReject,
				fnResolveIncidentService,
				fnCleanUp;

			/* check if current input is valid */
			if (!sOrderNumber || !sOperationNumber) {
				return;
			}
			if (this.controlHasValidationError(oSource)) {
				return;
			}

			/* Prepare UI: busy, value states, log messages */
			this.showControlBusyIndicator(oOrderNumberInput);
			this.showControlBusyIndicator(oOperationNumberInput);

			this.removeAllUserMessages();

			/* Prepare Data */

			/* Prepare success callback */
			fnResolve = function(oData) {
				var oOrderOperation = {
						AUFNR: null
					},
					aRows = oData.d.results[0].Rowset.results[0].Row.results,
					bOrderOperationValid = true;

				/* Check if oData contains required results: extract value, evaluate value, set UI, set model data */
				if (aRows.length === 1) {
					oOrderOperation = aRows[0];
				} else {
					this.addUserMessage({
						text: this.getTranslation("interruptOperation.messageText.orderNotFound", [sOrderNumber, sOperationNumber])
					});

					bOrderOperationValid = false;
				}

				oDataModel.setData(oOrderOperation, true);

				this.getModel("view").setProperty("/bOrderOperationValid", bOrderOperationValid);

				if (bOrderOperationValid) {
					oOrderNumberInput.setValueState(sap.ui.core.ValueState.Success);
					oOperationNumberInput.setValueState(sap.ui.core.ValueState.Success);
				} else {
					oOrderNumberInput.setValueState(sap.ui.core.ValueState.Error);
					oOperationNumberInput.setValueState(sap.ui.core.ValueState.Error);
					return Promise.reject("Order or Operation not found!");
				}

				return oData;

			}.bind(this);

			fnResolveIncidentService = function(oData) {
				var aRows = oData.d.results[0].Rowset.results[0].Row.results,
					oLatestIncidentFinishDate,
					oNullDate = null,
					fnLatestEndDate;

				fnLatestEndDate = function(oldDate, oIncident, currentIndex, array) {
					var oNewDate = this.formatter.parseJSONDate(oIncident.STR_ENDE);
					return oldDate > oNewDate ? oldDate : oNewDate;
				}.bind(this);

				oLatestIncidentFinishDate = aRows.reduce(fnLatestEndDate, oNullDate /*initial value*/ );

				// set LATEST_EVENT_FINISH property
				this.getModel("data").setProperty("/LATEST_EVENT_FINISH", oLatestIncidentFinishDate);

			}.bind(this);

			/* Prepare error callback */
			fnReject = function(oError) {
				MessageBox.error(oError.responseText || oError.message, {
					title: this.getTranslation("error.miiTransactionErrorText", ["OrderOperationRead"]),
					contentWidth: "500px"
				});
				//oSource.setValueState(sap.ui.core.ValueState.Error).setValue("");
				this.getModel("view").setProperty("/bOrderOperationValid", false);
			}.bind(this);

			fnCleanUp = function(oDate) {
				this.hideControlBusyIndicator(oOrderNumberInput);
				this.hideControlBusyIndicator(oOperationNumberInput);
				this.updateViewControls(this.getModel("data").getData());
			}.bind(this);

			/* Perform service call, Hide Busy Indicator, Update View Controls */
			this.requestOrderOperationInfoService(sOrderNumber, sOperationNumber)
				.then(fnResolve, fnReject)
				.then(this.requestOrderOperationIncidentsService.bind(this))
				.then(fnResolveIncidentService, jQuery.noop)
				.then(fnCleanUp);
		},

		isInputDataValid: function(oData) {
			return !!oData.interruptionReason && !!oData.dateTimeValue && !!oData.orderNumber && !!oData.operationNumber;
		},

		checkInputIsValid: function(oData) {
			var oStartMoment, oFinishMoment, oLastResumeMoment,
				//oData = this.getModel("data").getData(),
				oOrderNumberInput = this.byId("orderNumberInput"),
				oOperationNumberInput = this.byId("operationNumberInput"),
				oDateTimeInput = this.byId("dateTimeEntry");

			// 0. check if necessary data is present
			if (!oData.AUFNR || !oData.dateTimeValue) {
				return false;
			}

			oStartMoment = moment(this.formatter.parseJSONDate(oData.ISTSTART));
			oLastResumeMoment = moment(oData.LATEST_EVENT_FINISH);
			oFinishMoment = moment(oData.dateTimeValue);

			// 1. ensure operation status is valid
			if (oData.STATUS !== this.oProcessOrderStatus.started.STATUS_ID) { // check if operation has status "started"
				this.addUserMessage({
					text: this.getTranslation("interruptOperation.messageText.wrongCurrentStatus", [oData.AUFNR, oData.VORNR, oData.STATUS_TXT])
				});
				oOrderNumberInput.setValueState(sap.ui.core.ValueState.Error);
				oOperationNumberInput.setValueState(sap.ui.core.ValueState.Error);
				return false;
			}

			// 2. ensure enterd finish date is after start date
			if (oFinishMoment.isBefore(oStartMoment)) {
				this.removeAllUserMessages();
				this.addUserMessage({
					text: this.getTranslation("interruptOperation.messageText.finishDateBeforeStartDate", [oData.AUFNR, oData.VORNR, oStartMoment.format("LLLL"), oFinishMoment.format("LLLL")])
				});
				oDateTimeInput.setValueState(sap.ui.core.ValueState.Error);
				return false;
			}

			// 3. ensure entered finish date is after latest interruption finish date
			if (oFinishMoment.isBefore(oLastResumeMoment)) {
				this.removeAllUserMessages();
				this.addUserMessage({
					text: this.getTranslation("interruptOperation.messageText.finishDateBeforeLastResumeDate", [oData.AUFNR, oData.VORNR, oLastResumeMoment.format("LLLL"), oFinishMoment.format("LLLL")])
				});
				oDateTimeInput.setValueState(sap.ui.core.ValueState.Error);
				return false;
			}

			oOrderNumberInput.setValueState(sap.ui.core.ValueState.Success);
			oOperationNumberInput.setValueState(sap.ui.core.ValueState.Success);
			oDateTimeInput.setValueState(sap.ui.core.ValueState.Success);

			return true;
		}
	});

});