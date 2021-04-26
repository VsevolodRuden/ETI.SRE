if (parent.Xrm && parent.Xrm.Page) {
    formContext = parent.Xrm.Page;
    Xrm = parent.Xrm;
}

if (typeof GetGlobalContext !== "undefined") {
    globalContext = GetGlobalContext();
}
var products;
var pricelevels;
var productPriceLevels;
var entityAttributes;
var optionSetValues;
var configurationId;
var prorateBy;
var autoPost;
var dropDown;
var defaultValues = {
    "eti_name": "Default Configuration",
    "eti_automaticallypostbillingdocuments": true,
    "eti_billingtype": 964820000,
    "eti_billrunautocreate": true,
    "eti_creditbackforotc": true,
    "eti_determineindividuallyusagerecords": true,
    "eti_monthlyrecurringchargesforpartialmonth": true,
    "eti_monthlyusagechargesforpartialmonths": true,
    "eti_negativetotalsinvoicesinaccbalance": true,
    "eti_proratebyday": true,
    "eti_prorateforpartialperiod": true,
    "eti_prorateperiodsgreaterthanamonth": true,
    "eti_proratingwithactualnumberofdays": true,
    "eti_weeklyrecurringchargesforpartialweek": true,
    "eti_weeklyusagechargesforpartialweek": true
};
var fields = [
    "eti_automaticallypostbillingdocuments",
    "eti_billingtype",
    "eti_billrunautocreate",
    "eti_creditbackforotc",
    "eti_determineindividuallyusagerecords",
    "eti_monthlyrecurringchargesforpartialmonth",
    "eti_monthlyusagechargesforpartialmonths",
    "eti_negativetotalsinvoicesinaccbalance",
    "eti_proratebyday",
    "eti_prorateforpartialperiod",
    "eti_prorateperiodsgreaterthanamonth",
    "eti_proratingwithactualnumberofdays",
    "eti_weeklyrecurringchargesforpartialweek",
    "eti_weeklyusagechargesforpartialweek"
];
var billingConfigurationXML = `<fetch>
                <entity name="eti_billingconfiguration" >
                  <attribute name="eti_automaticallypostbillingdocuments" />
                  <attribute name="eti_billingtype" />
                  <attribute name="eti_billrunautocreate" />
                  <attribute name="eti_creditbackforotc" />
                  <attribute name="eti_determineindividuallyusagerecords" />
                  <attribute name="eti_monthlyrecurringchargesforpartialmonth" />
                  <attribute name="eti_monthlyusagechargesforpartialmonths" />
                  <attribute name="eti_negativetotalsinvoicesinaccbalance" />
                  <attribute name="eti_proratebyday" />
                  <attribute name="eti_prorateforpartialperiod" />
                  <attribute name="eti_prorateperiodsgreaterthanamonth" />
                  <attribute name="eti_proratingwithactualnumberofdays" />
                  <attribute name="eti_weeklyrecurringchargesforpartialweek" />
                  <attribute name="eti_weeklyusagechargesforpartialweek" />
                  <filter>
                    <condition attribute="statecode" operator="eq" value="0" />
                  </filter>
                </entity>
              </fetch>`;
$(document).ready(function() {
    parent.document.title = "General Billing Settings";
    loadConfiguration();
});

function loadConfiguration() {
    $.when(Xrm.Utility.getEntityMetadata("eti_billingconfiguration", fields)).then(function(s) {
        entityAttributes = s.Attributes.getAll();

        var localOptionSetValues = entityAttributes.filter(atr => atr._logicalName == "eti_billingtype")[0].OptionSet;
        optionSetValues = [];
        for(var prop in localOptionSetValues)
        {
            optionSetValues.push({text:localOptionSetValues[prop].text, value:localOptionSetValues[prop].value})
        }
        console.log(entityAttributes);
        console.log(optionSetValues);
        billingConfigurationRequest = `?fetchXml=${encodeURIComponent(billingConfigurationXML)}`;
        $.when(
                Xrm.WebApi.retrieveMultipleRecords("eti_billingconfiguration", billingConfigurationRequest)
            )
            .then(function(billingConfigurateionResponse) {
                if (billingConfigurateionResponse.entities.length) {
                    initializeFields(billingConfigurateionResponse.entities[0]);
                } else {
                    showCreateDialog();
                }
            });

    });
}

function initializeFields(values) {

    console.log("initialize");
    console.log(values);
    configurationId = values.eti_billingconfigurationid;
    

    dropDown =  $("#billingTypeDropDown").kendoDropDownList({
        dataTextField: "text",
        dataValueField: "value",
        dataSource: { data:optionSetValues},
        change: onDropDownChange
    });


    dropDown.select(function(dataItem) {
        return dataItem.value == values.eti_billingtype;
    });

    $("#creditBack").kendoSwitch({
        messages: {
            checked: "Yes",
            unchecked: "No"
        },
        chkecked: values.eti_creditbackforotc,
        change: function(e){ switchFlip(e, "eti_creditbackforotc")}
    });
    $("#creditBackInfo").kendoTooltip({

        showOn: "click",
        position: "left",
        hideAfter: 1000,
        content: entityAttributes.filter(val => val._logicalName =="eti_creditbackforotc")[0].attributeDescriptor.Description
    });
    $("#prorateForPartial").kendoSwitch({
        messages: {
            checked: "Yes",
            unchecked: "No"
        },
        checked: values.eti_prorateforpartialperiod,
        change: function(e){ switchFlip(e, "eti_prorateforpartialperiod")}
    });
    $("#prorateForPartialInfo").kendoTooltip({

        showOn: "click",
        hideAfter: 1000,
        position: "left",
        content: entityAttributes.filter(val => val._logicalName =="eti_prorateforpartialperiod")[0].attributeDescriptor.Description
    });
    $("#monthlyRecurring").kendoSwitch({
        messages: {
            checked: "Yes",
            unchecked: "No"
        },
        checked: values.eti_monthlyrecurringchargesforpartialmonth,
        change: function(e){ switchFlip(e, "eti_monthlyrecurringchargesforpartialmonth")}
    });
    $("#monthlyRecurringInfo").kendoTooltip({

        showOn: "click",
        hideAfter: 1000,
        position: "left",
        content: entityAttributes.filter(val => val._logicalName =="eti_monthlyrecurringchargesforpartialmonth")[0].attributeDescriptor.Description
    });

    $("#weeklyRecurring").kendoSwitch({
        messages: {
            checked: "Yes",
            unchecked: "No"
        },
        checked: values.eti_weeklyrecurringchargesforpartialweek,
        change: function(e){ switchFlip(e, "eti_weeklyrecurringchargesforpartialweek")}
    });
    
    $("#weeklyRecurringInfo").kendoTooltip({

        showOn: "click",
        hideAfter: 1000,
        position: "left",
        content: entityAttributes.filter(val => val._logicalName =="eti_weeklyrecurringchargesforpartialweek")[0].attributeDescriptor.Description
    });

    $("#monthlyUsage").kendoSwitch({
        messages: {
            checked: "Yes",
            unchecked: "No"
        },
        checked: values.eti_monthlyusagechargesforpartialmonths,
        change: function(e){ switchFlip(e, "eti_monthlyusagechargesforpartialmonths")}
    });

    $("#monthlyUsageInfo").kendoTooltip({

        showOn: "click",
        hideAfter: 1000,
        position: "left",
        content: entityAttributes.filter(val => val._logicalName =="eti_monthlyusagechargesforpartialmonths")[0].attributeDescriptor.Description
    });

    $("#weeklyUsage").kendoSwitch({
        messages: {
            checked: "Yes",
            unchecked: "No"
        },
        checked: values.eti_weeklyusagechargesforpartialweek,
        change: function(e){ switchFlip(e, "eti_weeklyusagechargesforpartialweek")}
    });

    $("#weeklyUsageInfo").kendoTooltip({

        showOn: "click",
        hideAfter: 1000,
        position: "left",
        content: entityAttributes.filter(val => val._logicalName =="eti_weeklyusagechargesforpartialweek")[0].attributeDescriptor.Description
    });

    $("#proratingWithDays").kendoSwitch({
        messages: {
            checked: "Yes",
            unchecked: "No"
        },
        checked: values.eti_proratingwithactualnumberofdays,
        change: function(e){ switchFlip(e, "eti_proratingwithactualnumberofdays")}
    });

    $("#proratingWithDaysInfo").kendoTooltip({

        showOn: "click",
        hideAfter: 1000,
        position: "left",
        content: entityAttributes.filter(val => val._logicalName =="eti_proratingwithactualnumberofdays")[0].attributeDescriptor.Description
    });

    $("#proratePeriods").kendoSwitch({
        messages: {
            checked: "Yes",
            unchecked: "No"
        },
        checked: values.eti_prorateperiodsgreaterthanamonth,
        change: function(e){ switchFlip(e, "eti_prorateperiodsgreaterthanamonth")}
    });

    $("#proratePeriodsInfo").kendoTooltip({

        showOn: "click",
        hideAfter: 1000,
        position: "left",
        content: entityAttributes.filter(val => val._logicalName =="eti_prorateperiodsgreaterthanamonth")[0].attributeDescriptor.Description
    });

    prorateBy = $("#prorateBy").kendoSwitch({
        messages: {
            checked: "Yes",
            unchecked: "No"
        },
        checked: values.eti_proratebyday,
        
        change: function(e){ switchFlip(e, "eti_proratebyday")}
    });

    $("#prorateByInfo").kendoTooltip({

        showOn: "click",
        hideAfter: 1000,
        position: "left",
        content: entityAttributes.filter(val => val._logicalName =="eti_proratebyday")[0].attributeDescriptor.Description
    });

    $("#runAutoCreate").kendoSwitch({
        messages: {
            checked: "Yes",
            unchecked: "No"
        },
        checked: values.eti_billrunautocreate,
        change: function(e){ switchFlip(e, "eti_billrunautocreate")}
    });

    $("#runAutoCreateInfo").kendoTooltip({

        showOn: "click",
        hideAfter: 1000,
        position: "left",
        content: entityAttributes.filter(val => val._logicalName =="eti_billrunautocreate")[0].attributeDescriptor.Description
    });

    autoPost = $("#autoPost").kendoSwitch({
        messages: {
            checked: "Yes",
            unchecked: "No"
        },
        checked: values.eti_automaticallypostbillingdocuments,
        
        change: function(e){ switchFlip(e, "eti_automaticallypostbillingdocuments")}
    });

    $("#autoPostInfo").kendoTooltip({

        showOn: "click",
        hideAfter: 1000,
        position: "left",
        content: entityAttributes.filter(val => val._logicalName =="eti_automaticallypostbillingdocuments")[0].attributeDescriptor.Description
    });

    $("#negativeTotals").kendoSwitch({
        messages: {
            checked: "Yes",
            unchecked: "No"
        },
        checked: values.eti_negativetotalsinvoicesinaccbalance,
        change: function(e){ switchFlip(e, "eti_negativetotalsinvoicesinaccbalance")}
    });

    $("#negativeTotalsInfo").kendoTooltip({

        showOn: "click",
        hideAfter: 1000,
        position: "left",
        content: entityAttributes.filter(val => val._logicalName =="eti_negativetotalsinvoicesinaccbalance")[0].attributeDescriptor.Description
    });

    $("#determineUsage").kendoSwitch({
        messages: {
            checked: "Yes",
            unchecked: "No"
        },
        checked: values.eti_determineindividuallyusagerecords,
        change: function(e){ switchFlip(e, "eti_determineindividuallyusagerecords")}
    });

    $("#determineUsageInfo").kendoTooltip({

        showOn: "click",
        hideAfter: 1000,
        position: "left",
        content: entityAttributes.filter(val => val._logicalName =="eti_determineindividuallyusagerecords")[0].attributeDescriptor.Description
    });

    prorateBy.data("kendoSwitch").enable(values.eti_proratebyday);
    autoPost.data("kendoSwitch").enable(values.eti_billrunautocreat);


}

function onDropDownChange(e) {
    kendo.ui.progress($(document.body),true)
    var payload = {};
    payload["eti_billingtype"] = dropDown.data("kendoDropDownList").value();
   
    $.when(Xrm.WebApi.updateRecord("eti_billingconfiguration", configurationId.replace(/[{}]/g, ""), payload)).then(function success(result) {
        kendo.ui.progress($(document.body),false)
    },
    function(error) {
        kendo.ui.progress($(document.body),false)
        displayErrorMessage(error.message, "Can't update Configuration!");
    });
}


function switchFlip(sender, field) {
    kendo.ui.progress($(document.body),true)
    console.log(sender);
    console.log(field);
    var payload = {};
    payload[field] = sender.checked;
    $.when(Xrm.WebApi.updateRecord("eti_billingconfiguration", configurationId.replace(/[{}]/g, ""), payload)).then(function success(result) {
        if(field == "eti_prorateperiodsgreaterthanamonth")
            prorateBy.data("kendoSwitch").enable(sender.checked);
        if(field == "eti_billrunautocreate")
            autoPost.data("kendoSwitch").enable(sender.checked);

        kendo.ui.progress($(document.body),false)
    },
    function(error) {
        kendo.ui.progress($(document.body),false)
        sender.checked  =!sender.checked;
        displayErrorMessage(error.message, "Can't update Configuration!");
    }
);
    

}

function showCreateDialog() {
    displayErrorMessage("System now will create default Configuration Record", "No Configuration Record was found!");
    $.when(Xrm.WebApi.createRecord("eti_billingconfiguration", defaultValues)).then(function success(result) {
            loadConfiguration();
        },
        function(error) {
            displayErrorMessage(error.message, "Can't create Configuration!");
        }
    );
}

function displayErrorMessage(errorText, errorHeader) {
    var dialog = $('#dialog');
    var contentString = "<strong>" + errorText + "</strong>";
    dialog.kendoDialog({
        width: "450px",
        title: errorHeader,
        closable: false,
        modal: true,
        content: contentString,
        actions: [{
            text: 'Ok'
        }]
    });
    dialog.data("kendoDialog").open().element.closest(".k-window").css({
        top: 15
    });
}