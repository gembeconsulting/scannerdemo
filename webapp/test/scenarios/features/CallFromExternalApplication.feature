Feature: Pass data from external application
	Users can call a deep Link to this app, providing query parameters.
	The app will pre-populate the given input fields with the provided data.
	
	Scenario: Should open Goods Receipt Page with given storage unit number
		Given I start the app on "/Materialbewegung" using remote user "phigem"
		When I navigate to "/WE?LENUM=00000000109330000001"
		Then I can see storageUnitInput with value '109330000001' in action.gm.GoodsReceipt view
		 And I can see storageLocationInput with value '1000' in action.gm.GoodsReceipt view
	
	Scenario: Should open Goods Receipt Page with given order number
		Given I start the app on "/Materialbewegung" using remote user "phigem"
		When I navigate to "/WE?AUFNR=1234567"
		Then I can see orderNumberInput with value '1234567' in action.gm.GoodsReceipt view
		
	Scenario: Should open Goods Receipt Page with given storage location
		Given I start the app on "/Materialbewegung" using remote user "phigem"
		When I navigate to "/WE?LGORT=RB01"
		Then I can see storageLocationInput with value 'RB01' in action.gm.GoodsReceipt view
		 And I can see storageUnitInput with editable being 'false' in action.gm.GoodsReceipt view
		When I navigate to "/WE?LGORT=1000"
		Then I can see storageLocationInput with value '1000' in action.gm.GoodsReceipt view
		 And I can see storageUnitInput with editable being 'true' in action.gm.GoodsReceipt view

	Scenario: Should open Goods Receipt Page with given unit of measure
		Given I start the app on "/Materialbewegung" using remote user "phigem"
		When I navigate to "/WE?MEINH=ST"
		Then I can see unitOfMeasureInput with value 'ST' in action.gm.GoodsReceipt view
		
	Scenario: Should open Goods Issue Page (withLE) with given order number
		Given I start the app on "/Materialbewegung" using remote user "phigem"
		When I navigate to "/WA?type=withLE&AUFNR=1234567"
		Then I can see orderNumberInput with value '1234567' in action.gm.GoodsIssue view
		
	Scenario: Should open Goods Issue Page (withLE) with given storage unit number
		Given I start the app on "/Materialbewegung" using remote user "phigem"
		When I navigate to "/WA?type=withLE&LENUM=00000000109330000004"
		Then I can see storageUnitInput with value '109330000004' in action.gm.GoodsIssue view
		 And I can see storageUnitFragmentBatchText with text '0109331231' in action.gm.GoodsIssue view
		
	Scenario: Should open Goods Issue Page (withLE) with all possible input values
		Given I start the app on "/Materialbewegung" using remote user "phigem"
		When I navigate to "/WA?type=withLE&LENUM=00000000109330000004&AUFNR=1234567"
		Then I can see storageUnitInput with value '109330000004' in action.gm.GoodsIssue view
		 And I can see orderNumberInput with value '1234567' in action.gm.GoodsIssue view
		 And I can see storageUnitFragmentBatchText with text '0109331231' in action.gm.GoodsIssue view
		 
	Scenario: Should open Goods Issue Page (nonLE) with given order number
		Given I start the app on "/Materialbewegung" using remote user "phigem"
		When I navigate to "/WA?type=nonLE&AUFNR=1234567"
		Then I can see orderNumberInput with value '1234567' in action.gm.GoodsIssue view
		
	Scenario: Should open Goods Issue Page (nonLE) with given material number
		Given I start the app on "/Materialbewegung" using remote user "phigem"
		When I navigate to "/WA?type=nonLE&MATNR=1200666-001"
		Then I can see materialNumberInput with value '1200666-001' in action.gm.GoodsIssue view
		
	Scenario: Should open Goods Issue Page (nonLE) with given storage location
		Given I start the app on "/Materialbewegung" using remote user "phigem"
		When I navigate to "/WA?type=nonLE&LGORT=RB01"
		Then I can see storageLocationInput with value 'RB01' in action.gm.GoodsIssue view

	Scenario: Should open Goods Issue Page (nonLE) with given unit of measure
		Given I start the app on "/Materialbewegung" using remote user "phigem"
		When I navigate to "/WA?type=nonLE&MEINH=KG"
		Then I can see unitOfMeasureInput with value 'KG' in action.gm.GoodsIssue view
		
	Scenario: Should open Goods Issue Page (nonLE) with given bulk material indicator
		Given I start the app on "/Materialbewegung" using remote user "phigem"
		When I navigate to "/WA?type=nonLE&SCHGT=true"
		Then I can see bulkMaterialSwitch with state being 'true' in action.gm.GoodsIssue view
		
	Scenario: Should open Goods Issue Page (nonLE) with all possible input values
		Given I start the app on "/Materialbewegung" using remote user "phigem"
		When I navigate to "/WA?type=nonLE&SCHGT=true&AUFNR=1234567&MATNR=1200666-006&LGORT=RB01&MEINH=KG"
		Then I can see bulkMaterialSwitch with state being 'true' in action.gm.GoodsIssue view
		 And I can see orderNumberInput with value '1234567' in action.gm.GoodsIssue view
		 And I can see materialNumberInput with value '1200666-006' in action.gm.GoodsIssue view
		 And I can see storageLocationInput with value 'RB01' in action.gm.GoodsIssue view
		 And I can see unitOfMeasureInput with value 'KG' in action.gm.GoodsIssue view
		 
	Scenario: Should open Start Operation Page with given order number and operation number
		Given I start the app on "/Statusmeldung" using remote user "phigem"
		When I navigate to "/VS?AUFNR=1092695&VORNR=0010"
		Then I can see orderNumberInput with value '1092695' in action.tt.StartOperation view
		 And I can see operationNumberInput with value '0010' in action.tt.StartOperation view
		 And I can see orderNumberInput with valueState 'Success' in action.tt.StartOperation view
		 And I can see operationNumberInput with valueState 'Success' in action.tt.StartOperation view
		 
	Scenario: Should open Interrupt Operation Page with given order number and operation number
		Given I start the app on "/Statusmeldung" using remote user "phigem"
		When I navigate to "/VU?AUFNR=1092700&VORNR=0001"
		Then I can see orderNumberInput with value '1092700' in action.tt.InterruptOperation view
		 And I can see operationNumberInput with value '0001' in action.tt.InterruptOperation view
		 And I can see orderNumberInput with valueState 'Success' in action.tt.InterruptOperation view
		 And I can see operationNumberInput with valueState 'Success' in action.tt.InterruptOperation view
	
	Scenario: Should open Resume Operation Page with given order number and operation number
		Given I start the app on "/Statusmeldung" using remote user "phigem"
		When I navigate to "/VF?AUFNR=1092710&VORNR=0011"
		Then I can see orderNumberInput with value '1092710' in action.tt.ResumeOperation view
		 And I can see operationNumberInput with value '0011' in action.tt.ResumeOperation view
		 And I can see orderNumberInput with valueState 'Success' in action.tt.ResumeOperation view
		 And I can see operationNumberInput with valueState 'Success' in action.tt.ResumeOperation view
		 
	Scenario: Should open Finish Operation Page with given order number and operation number
		Given I start the app on "/Statusmeldung" using remote user "phigem"
		When I navigate to "/VB?AUFNR=1092696&VORNR=0010"
		Then I can see orderNumberInput with value '1092696' in action.tt.FinishOperation view
		 And I can see operationNumberInput with value '0010' in action.tt.FinishOperation view
		 And I can see orderNumberInput with valueState 'Success' in action.tt.FinishOperation view
		 And I can see operationNumberInput with valueState 'Success' in action.tt.FinishOperation view