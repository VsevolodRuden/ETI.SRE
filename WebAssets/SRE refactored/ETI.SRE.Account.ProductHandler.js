if (parent.Xrm && parent.Xrm.Page) {
    formContext = parent.Xrm.Page;
    Xrm = parent.Xrm;
}

if (typeof GetGlobalContext !== "undefined") {
    globalContext = GetGlobalContext();
}

var priceLevelId = 0;
var accountBillingType;
var leftTree;
var productTree;
var rightTree;
var bundleTree;
var globalPriceLevels;
var tabstrip = $("#tabstrip").kendoTabStrip().data("kendoTabStrip");
var accountId = formContext.data.entity.getId();
var leftToolbar;
var rightToolbar;
var grid;
var rules;
var associations;
var selectedBundle;
var editmode = false;
var productAssignmentDialog;
var bundleAssignmentDialog;


$(document).ready(function() {
   
    priceLevelId = Xrm.Page.getAttribute("defaultpricelevelid").getValue()[0].id;

if (!priceLevelId) {
displayErrorMessage("Can't access Account Pricelist", "Error");
return;
}
globalPriceLevels = getProductPricelevelsDataSource();
globalPriceLevels.read();


initializeControls();
});

function initializeControls() {

    leftToolbar = kendo.template($("#template-active").html());
    rightToolbar = kendo.template($("#template-pending").html());
    tabstrip = $("#tabstrip").kendoTabStrip().data("kendoTabStrip");
    // $('#activeTabLabel').text("GORKAMORKA");
    //$('#pendingTabLabel').text("EMPERORPROTECTS");
    leftTree = $("#activeGrid").kendoGrid({
        dataSource: null,
        toolbar: leftToolbar,
        groupable: false,
        sortable: false,
        height: 550,
        selectable: "row",
        scrollable: {
            endless: true
        },
        pageable: {
            numeric: false,
            previousNext: false
        },
        editable: false,

        columns: [{
                field: "productName",
                //  editable: false,
                title: "Product",
                width: "250px",
                headerAttributes: {
                    style: "text-align: center; "
                }
            },
            //rate, rateoverr, effective, newquant
            {
                field: "categoryName",
                hidden: true,
                //  editable: false,
                groupHeaderTemplate: "#= data.value #",
                title: "Product Category",
                headerAttributes: {
                    style: "text-align: center; "
                }
            },
            {
                field: "rate",
                format: "{0:c}",
                template: "<span class='amountSpan'>#=  rate == originalRate ?  kendo.format(\"{0:c}\",rate ): concatPrices(rate, originalRate)#</span>",
                title: "Rate",
                attributes: {
                    "class": "table-cell",
                    style: "text-align: right; "
                },
                headerAttributes: {
                    style: "text-align: center; "
                }
            },
            {
                field: "originalRate",
                hidden: true,
                title: "origRate",
                //hidden:true
            },
            // { command: { text: " ", iconClass: "k-icon eti-command-reset k-i-reset", click: resetPrice , title: "Reset", width: "30px" }},

            {
                field: "priceOverriden",
                // editable: true,
                hidden: true,
                title: "Overriden",
                headerAttributes: {
                    style: "text-align: center; "
                },
                attributes: {
                    "class": "table-cell",
                    style: "text-align: right; "
                },
            },
            {
                field: "quantity",
                // editable: true,
                title: "Quantity",
                headerAttributes: {
                    style: "text-align: center; "
                },
                attributes: {
                    "class": "table-cell",
                    style: "text-align: right; "
                },
            },
            {
                field: "amount",
                // editable: false,
                format: "{0:c}",
                title: "Amount",
                template: "<span class='amountSpan'>#= kendo.format(\"{0:c}\",quantity * rate )#</span>",

                attributes: {
                    "class": "table-cell",
                    style: "text-align: right; "
                },
                headerAttributes: {
                    style: "text-align: center; "
                }
            }
        ],
        detailInit: function(e) {
            var detailRow = e.detailRow;
            console.log("DATA DATA");
            console.log(e.data);
            // localAssociations = associations;

            childGrid = $('<div/>')
                .appendTo($(e.detailCell))
                .kendoGrid({
                    editable: false,
                    dataBound: function(e) {
                        
                        if(this.dataSource.data().length === 0) {
                            var masterRow = this.element.closest("tr.k-detail-row").prev();
                            leftTree.collapseRow(masterRow);
                            masterRow.find("td.k-hierarchy-cell .k-icon").removeClass();
                        }
                    },

                    dataSource: buildDetailinitDataSource(e.data, true),
                    columns: [{
                        field: "productName",
                        //  editable: false,
                        title: "Product",
                        width: "250px",
                        headerAttributes: {
                            style: "text-align: center; "
                        }
                    },
                    //rate, rateoverr, effective, newquant
                    {
                        field: "categoryName",
                        hidden: true,
                        //  editable: false,
                        groupHeaderTemplate: "#= data.value #",
                        title: "Product Category",
                        headerAttributes: {
                            style: "text-align: center; "
                        }
                    },
                    {
                        field: "rate",
                        format: "{0:c}",
                        //template: "<span class='amountSpan'>#=  rate == originalRate ?  kendo.format(\"{0:c}\",rate ): concatPrices(rate, originalRate)#</span>",
                        title: "Rate",
                        attributes: {
                            "class": "table-cell",
                            style: "text-align: right; "
                        },
                        headerAttributes: {
                            style: "text-align: center; "
                        }
                    },
                    {
                        field: "originalRate",
                        hidden: true,
                        title: "origRate",
                        //hidden:true
                    },
                    // { command: { text: " ", iconClass: "k-icon eti-command-reset k-i-reset", click: resetPrice , title: "Reset", width: "30px" }},
        
                    {
                        field: "priceOverriden",
                        // editable: true,
                        hidden: true,
                        title: "Overriden",
                        headerAttributes: {
                            style: "text-align: center; "
                        },
                        attributes: {
                            "class": "table-cell",
                            style: "text-align: right; "
                        },
                    },
                    {
                        field: "quantity",
                        // editable: true,
                        title: "Quantity",
                        headerAttributes: {
                            style: "text-align: center; "
                        },
                        attributes: {
                            "class": "table-cell",
                            style: "text-align: right; "
                        },
                    },
                    {
                        field: "amount",
                        // editable: false,
                        format: "{0:c}",
                        title: "Amount",
                        template: "<span class='amountSpan'>#= kendo.format(\"{0:c}\",quantity * rate )#</span>",
        
                        attributes: {
                            "class": "table-cell",
                            style: "text-align: right; "
                        },
                        headerAttributes: {
                            style: "text-align: center; "
                        }
                    }
                ]
                });



        }
    }).data("kendoGrid");
    tabstrip.select(0);

    //leftTree.find(".k-grid-toolbar").on("click", ".k-pager-plus", addProduct);
    $(".k-pager-plus").bind('click', addProduct);
    $(".k-pager-delete").bind('click', removeProduct);
    $(".k-pager-refreshLeft").bind('click', refreshActiveGrid);
    $(".k-pager-edit").bind('click', editProduct);


    rightTree = $("#pendingGrid").kendoGrid({
        dataSource: null,
        toolbar: rightToolbar,
        groupable: false,
        sortable: false,
        height: 550,
        selectable: "row",
        scrollable: {
            endless: true
        },
        pageable: {
            numeric: false,
            previousNext: false
        },
        editable: true,
        edit: function(e) {
            if (e.model.productStructure != 1 || e.model.productStateValue == 964820003 || e.model.productStateValue == 964820006) {
                //revert edited cell back to `read` mode
                this.closeCell();
            }

        },
        save: function(e) {
            updateRow(e);
        },


        columns: [{
                field: "productName",
                //  editable: false,
                title: "Product",
                width: "250px",
                headerAttributes: {
                    style: "text-align: center; "
                }
            },
            //rate, rateoverr, effective, newquant
            {
                field: "categoryName",
                hidden: true,
                //  editable: false,
                groupHeaderTemplate: "#= data.value #",
                title: "Product Category",
                headerAttributes: {
                    style: "text-align: center; "
                }
            },
            {
                field: "newRate",
                format: "{0:c}",
                //   editable: true,
                title: "Rate",
                attributes: {
                    "class": "table-cell",
                    style: "text-align: right; "
                },
                headerAttributes: {
                    style: "text-align: center; "
                }
            },
            {
                field: "originalRate",
                title: "Default Rate",
                format: "{0:c}",
                attributes: {
                    "class": "table-cell",
                    style: "text-align: right; "
                },
                headerAttributes: {
                    style: "text-align: center; "
                }
                //hidden:true
            },
            // { command: { text: " ", iconClass: "k-icon eti-command-reset k-i-reset", click: resetPrice , title: "Reset", width: "30px" }},

            {
                field: "newQuantity",
                // editable: true,
                title: "Quantity",
                headerAttributes: {
                    style: "text-align: center; "
                },
                attributes: {
                    "class": "table-cell",
                    style: "text-align: right; "
                },
            },
            {
                field: "amount",
                // editable: false,
                format: "{0:c}",
                title: "Amount",
                template: "<span class='amountSpan'>#= kendo.format(\"{0:c}\",newQuantity * newRate )#</span>",

                attributes: {
                    "class": "table-cell",
                    style: "text-align: right; "
                },
                headerAttributes: {
                    style: "text-align: center; "
                }
            },

            {
                field: "effectiveDate",
                title: "Activation Date",
                format: "{0:MM/dd/yyyy}",
                headerAttributes: {
                    style: "text-align: center; "
                }
            },
            {
                field: "productStateValue",
                title: "productStateValue",
                hidden: true,
                headerAttributes: {
                    style: "text-align: center; "
                }
            },
            {
                field: "productStateName",
                title: "Status",
                headerAttributes: {
                    style: "text-align: center; "
                }
            }
        ],
        detailInit: function(e) {
            var detailRow = e.detailRow;
            console.log("DATA DATA");
            console.log(e.data);
            // localAssociations = associations;

            childGrid = $('<div/>')
                .appendTo($(e.detailCell))
                .kendoGrid({
                    editable: true,
                    dataBound: function(e) {
                        if(this.dataSource.data().length === 0) {
                            var masterRow = this.element.closest("tr.k-detail-row").prev();
                            rightTree.collapseRow(masterRow);
                            masterRow.find("td.k-hierarchy-cell .k-icon").removeClass();
                        }
                    },
                    edit: function(e) {
                        if (e.model.productStructure != 1 || e.model.productStateValue == 964820003 || e.model.productStateValue == 964820006) {
                            //revert edited cell back to `read` mode
                            this.closeCell();
                        }
        
                    },
                    save: function(e) {
                        updateInlineRow(e);
                    },

                    dataSource: buildDetailinitDataSource(e.data, false),
                    columns: [
                        {
                            field: "productName",
                            //  editable: false,
                            title: "Product",
                            width: "250px",
                            headerAttributes: {
                                style: "text-align: center; "
                            }
                        },
                        //rate, rateoverr, effective, newquant
                        {
                            field: "categoryName",
                            hidden: true,
                            //  editable: false,
                            groupHeaderTemplate: "#= data.value #",
                            title: "Product Category",
                            headerAttributes: {
                                style: "text-align: center; "
                            }
                        },
                        {
                            field: "newRate",
                            format: "{0:c}",
                            //   editable: true,
                            title: "Rate",
                            attributes: {
                                "class": "table-cell",
                                style: "text-align: right; "
                            },
                            headerAttributes: {
                                style: "text-align: center; "
                            }
                        },
                        
                        // { command: { text: " ", iconClass: "k-icon eti-command-reset k-i-reset", click: resetPrice , title: "Reset", width: "30px" }},
        
                        {
                            field: "newQuantity",
                            // editable: true,
                            title: "Quantity",
                            headerAttributes: {
                                style: "text-align: center; "
                            },
                            attributes: {
                                "class": "table-cell",
                                style: "text-align: right; "
                            },
                        },
                        {
                            field: "amount",
                            // editable: false,
                            format: "{0:c}",
                            title: "Amount",
                            template: "<span class='amountSpan'>#= kendo.format(\"{0:c}\",newQuantity * newRate )#</span>",
        
                            attributes: {
                                "class": "table-cell",
                                style: "text-align: right; "
                            },
                            headerAttributes: {
                                style: "text-align: center; "
                            }
                        },
                        {
                            field: "productStateValue",
                            title: "productStateValue",
                            hidden: true,
                            headerAttributes: {
                                style: "text-align: center; "
                            }
                        }
                    ]
                });



        }
    }).data("kendoGrid");
    $(".k-pager-left").bind('click', discardChanges);
    $(".k-pager-right").bind('click', confirmChanges);
    $(".k-pager-reset").bind('click', resetPrice);
    $(".k-pager-refreshRight").bind('click', refreshPendingGrid);


    // $(".k-pager-refreshRight").bind('click',refreshActiveGrid );
    setGridsDataSources();
    refreshActiveGrid();
    refreshPendingGrid();
    recalculatePrices();

}
function setGridsDataSources()
{
    leftTree.setDataSource(getProductsDataSource(true));
    rightTree.setDataSource(getProductsDataSource(false));
}

function buildDetailinitDataSource(masterRow, active)
{
    console.log(masterRow);
    
    try {
        var urlString = `/api/data/v9.1/eti_accountproducts?$select=eti_productstate,eti_rateoverriden,eti_oldquantity,eti_quantity,eti_newquantity,eti_rate,eti_newrate,eti_oldrate,eti_accountproductid,eti_name,eti_amount,eti_effectivedate,_eti_parentbundle_value&$expand=eti_Product($select=name,productstructure,productid,_eti_productcategory_value)&$filter=_eti_account_value eq GUID and eti_Product/productid ne null and _eti_parentbundle_value eq PRGUID`;
        urlString = urlString.replace("PRGUID", masterRow.accountProductId);
        urlString = urlString.replace("GUID", accountId);

        var dataSource = new kendo.data.DataSource({
            transport: {
                read: {
                    url: parent.Xrm.Page.context.getClientUrl() + urlString,
                    dataType: 'json',
                    beforeSend: function(xhr) {
                        xhr.setRequestHeader("OData-MaxVersion", "4.0");
                        xhr.setRequestHeader("OData-Version", "4.0");
                        xhr.setRequestHeader("Accept", "application/json");
                        xhr.setRequestHeader("Content-Type", "application/json; charset=utf-8");
                        xhr.setRequestHeader("Prefer", "odata.include-annotations=\"*\"");
                    }
                },

            },
            schema: {
                model: {
                    //The available options are "string", "number", "boolean", "date". The default is "string".
                    id: "eti_accountproductid",
                    fields: {
                        accountProductId: {
                            from: "eti_accountproductid",
                            type: "string",
                            editable: false
                        },
                        productStateValue: {
                            from: "_productStateValue",
                            type: "number",
                            editable: false
                        },
                        productStateName: {
                            from: "_productStateName",
                            type: "string",
                            editable: false
                        },
                        priceOverriden: {
                            from: "_priceOverriden",
                            type: "boolean",
                            editable: false
                        },
                        oldQuantity: {
                            from: "_oldQuantity",
                            type: "number",
                            editable: false
                        },
                        quantity: {
                            from: "_quantity",
                            type: "number",

                        },
                        newQuantity: {
                            from: "_newQuantity",
                            type: "number"
                        },
                        amount: {
                            from: "_amount",
                            type: "number",
                            editable: false
                        },
                        oldRate: {
                            from: "_oldRate",
                            type: "number",
                            editable: false
                        },
                        rate: {
                            from: "_rate",
                            type: "number"
                        },
                        newRate: {
                            from: "_newRate",
                            type: "number"
                        },
                        effectiveDate: {
                            from: "_effectiveDate",
                            type: "date",

                        },
                        currencyId: {
                            from: "_currencyId",
                            type: "string",
                            editable: false
                        },
                        currencyName: {
                            from: "_currencyName",
                            type: "string",
                            editable: false
                        },
                        productId: {
                            from: "_productId",
                            type: "string",
                            editable: false
                        },
                        productName: {
                            from: "_productName",
                            type: "string",
                            editable: false
                        },
                        categoryId: {
                            from: "_categoryId",
                            type: "string",
                            editable: false
                        },
                        categoryName: {
                            from: "_categoryName",
                            type: "string",
                            editable: false
                        },
                        productStructure: {
                            from: "_productStructure",
                            type: "number",
                            editable: false
                        },
                        originalRate: {
                            from: "_originalRate",
                            type: "number",
                            editable: false
                        }

                    }
                },
                parse: function(response) {
                    debugger;
                    let services = [],
                        result = response.value;
                    if (result.length)
                        for (var i = 0; i < result.length; i++) {
                            console.log(globalPriceLevels);
                            
                            var service = {
                                eti_accountproductid: result[i]["eti_accountproductid"],
                                _productStateValue: result[i]["eti_productstate"],
                                _productStateName: result[i]["eti_productstate@OData.Community.Display.V1.FormattedValue"],
                                _priceOverriden: result[i]["eti_rateoverriden"],
                                _oldQuantity: result[i]["eti_oldquantity"],
                                _newQuantity: result[i]["eti_newquantity"],
                                _quantity: result[i]["eti_quantity"],
                                _oldRate: result[i]["eti_oldrate"],
                                _rate: result[i]["eti_rate"],
                                _newRate: result[i]["eti_newrate"],
                                _amount: result[i]["eti_amount"],
                                _effectiveDate: result[i]["eti_effectivedate"],
                                _currencyId: result[i]["_transactioncurrencyid_value"],
                                _currencyName: result[i]["_transactioncurrencyid_value@OData.Community.Display.V1.FormattedValue"],
                                _productId: result[i].eti_Product["productid"],
                                _productName: result[i].eti_Product["name"],
                                _productStructure: result[i].eti_Product["productstructure"],
                                _categoryId: result[i].eti_Product["_eti_productcategory_value"],
                                _categoryName: result[i].eti_Product["_eti_productcategory_value@OData.Community.Display.V1.FormattedValue"]


                            };
                            try{
                            var originRate = globalPriceLevels._data.filter(el => el.productId == result[i].eti_Product["productid"])[0].amount;
                            service["_originalRate"] = originRate;
                            }
                            catch (e)
                            {
                                service["_originalRate"] = null;
                            }

                            if (service._categoryName == undefined || !service._categoryName)
                                service._categoryName = "No category";
                            if (active) {
                                if ((service._productStateValue == 964820004 || service._productStateValue == 964820001))
                                    services.push(service);
                            } else {
                                if (service._productStateValue != 964820000)
                                    services.push(service);
                            }

                        }
                    if (active) {
                        $('#activeTabLabel').text("Active Products (" + services.length + ")");
                    } else {
                        $('#pendingTabLabel').text("Draft and pending Products (" + services.length + ")");
                    }
                    return services;
                }
            },
            pageSize: 10,
            group: {
                field: "categoryName",
                title: ""
            },
        });


        return dataSource;
    } catch (e) {
        displayErrorMessage(e, "Can't read Account Products!");
        return null;
    }
}


function concatPrices(current, original) {
    var output = "";
    output += kendo.format("{0:c}", current);
    output += " (";
    output += kendo.format("{0:c}", original);
    output += ")";
    return output;
}

function updateRow(item) {
    console.log("edit");
    console.log(item);
    var payload = {};
    if (item.model.dirtyFields.newQuantity) {
        payload["eti_newquantity"] = item.values.newQuantity;
        //check price override
    }
    if (item.model.dirtyFields.newRate) {
        payload["eti_newrate"] = item.values.newRate;
    }
    if (item.model.dirtyFields.effectiveDate) {
        payload["eti_effectivedate"] = item.values.effectiveDate;
    }
    
    $.when(Xrm.WebApi.updateRecord("eti_accountproduct", item.model.accountProductId.replace(/[{}]/g, ""), payload)).then(function success(result) {

            item.dirty = false;
            item.dirtyFields = [];

            refreshActiveGrid();
            refreshPendingGrid();

        },
        function(error) {
            displayErrorMessage(error.message, "Can't update Assignment!");
        }
    );


}

function updateInlineRow(item) {
    console.log("edit");
    console.log(item);
    var payload = {};
    if (item.model.dirtyFields.newQuantity) {
        payload["eti_newquantity"] = item.values.newQuantity;
        //check price override
    }
    if (item.model.dirtyFields.newRate) {
        payload["eti_newrate"] = item.values.newRate;
    }
    if (item.model.dirtyFields.effectiveDate) {
        payload["eti_effectivedate"] = item.values.effectiveDate;
    }
    
    $.when(Xrm.WebApi.updateRecord("eti_accountproduct", item.model.accountProductId.replace(/[{}]/g, ""), payload)).then(function success(result) {

            item.dirty = false;
            item.dirtyFields = [];

            refreshActiveGrid();
            refreshPendingGrid();

        },
        function(error) {
            displayErrorMessage(error.message, "Can't update Assignment!");
        }
    );


}

function resetPrice(){}

function confirmChanges() {}

function discardChanges() {}

function addProduct(e) {
    productAssignmentDialog = $("#productAssignmentDialog").kendoDialog({
        width: "800px",
        visible: true,
        title: "Add Product",
        closable: true,
        modal: false,
        content: "<div id='productList'></div>",
        open: setProductAssignmentGrid,

        actions: [{
                text: 'Cancel',
                primary: false,
                action: productCancelClick
            },
            {
                text: 'Add Product',
                primary: true,
                action: productOkClick
            }
        ]
    });
    productAssignmentDialog.data("kendoDialog").open().element.closest(".k-window").css({
        top: 15
    });
    console.log("plus");
}

function setProductAssignmentGrid(e) {
    ///api/data/v9.1/productpricelevels?$select=amount&$expand=productid($select=name,_eti_productcategory_value,productstructure,productid,_eti_productcategory_value)&$filter=_pricelevelid_value ne 7f244025-9ecb-4116-a90e-a3ab77d9ce62
    productTree = $("#productList").kendoGrid({
        dataSource: getProductPricelevelsDataSource(),
        groupable: false,
        sortable: false,
        toolbar: ["search"],
        height: 600,
        //selectable: "row",
        scrollable: {
            endless: true
        },
        editable: false,
        groupExpand: function(e) {
            console.log(e.element, e.group);
          },
          groupCollapse: function(e) {
            console.log(e.element, e.group);
          },

        columns: [
            { selectable: true, width: "50px" },
            {

            
                field: "productName",
                //  editable: false,
                title: "Product",
                width: "250px",
                headerAttributes: {
                    style: "text-align: center; "
                }
            },
            {
                field: "productId",
                hidden: true,

            },
            //rate, rateoverr, effective, newquant
            {
                field: "categoryName",
                hidden: true,

                groupHeaderTemplate: "#= data.value #",
                title: "Product Category",
                headerAttributes: {
                    style: "text-align: center; "
                }
            },
            {
                field: "categoryId",
                hidden: true,

            },
            {
                field: "currencyName",
                hidden: true,

            },
            {
                field: "currencyId",
                hidden: true,

            },
            {
                field: "productState",
                hidden: true,

            },
            {
                field: "amount",
                format: "{0:c}",
                //   editable: true,
                title: "Rate",
                attributes: {
                    "class": "table-cell",
                    style: "text-align: right; "
                },
                headerAttributes: {
                    style: "text-align: center; "
                }
            }
        ],
    }).data("kendoGrid");
}

function getProductPricelevelsDataSource() {
    try {
        var urlString = `/api/data/v9.1/productpricelevels?$select=amount&$expand=productid($select=name,productstructure,productid,_eti_productcategory_value)&$filter=_pricelevelid_value eq GUID`;

        urlString = urlString.replace("GUID", priceLevelId);
        
        var dataSource = new kendo.data.DataSource({
            transport: {
                read: {
                    url: parent.Xrm.Page.context.getClientUrl() + urlString,
                    dataType: 'json',
                    beforeSend: function(xhr) {
                        xhr.setRequestHeader("OData-MaxVersion", "4.0");
                        xhr.setRequestHeader("OData-Version", "4.0");
                        xhr.setRequestHeader("Accept", "application/json");
                        xhr.setRequestHeader("Content-Type", "application/json; charset=utf-8");
                        xhr.setRequestHeader("Prefer", "odata.include-annotations=\"*\"");
                    }
                },

            },
            schema: {
                model: {
                    //The available options are "string", "number", "boolean", "date". The default is "string".
                    id: "productpricelevelid",
                    fields: {
                        productName: {
                            from: "_productName",
                            type: "string",
                            editable: false
                        },
                        productId: {
                            from: "_productId",
                            type: "string",
                            editable: false
                        },
                        categoryName: {
                            from: "_categoryName",
                            type: "string",
                            editable: false
                        },
                        categoryId: {
                            from: "_categoryId",
                            type: "string",
                            editable: false
                        },
                        amount: {
                            from: "_amount",
                            type: "number",
                            editable: false
                        },
                        currencyName: {
                            from: "_currencyName",
                            type: "string",
                            editable: false
                        },
                        currencyId: {
                            from: "_currencyId",
                            type: "string",
                            editable: false
                        },
                        productState: {
                            from: "_productState",
                            type: "number",
                            editable: false
                        },

                    }
                },
                parse: function(response) {
                    
                    let productpricelevels = [],
                        result = response.value;
                    if (result.length)
                        for (var i = 0; i < result.length; i++) {

                            var productpricelevel = {
                                productpricelevelid: result[i]["productpricelevelid"],
                                _productName: result[i].productid["name"],
                                _productId: result[i].productid["productid"],
                                _categoryName: result[i].productid["_eti_productcategory_value@OData.Community.Display.V1.FormattedValue"],
                                _categoryId: result[i].productid["_eti_productcategory_value"],
                                _amount: result[i]["amount"],
                                _currencyName: result[i]["_transactioncurrencyid_value@OData.Community.Display.V1.FormattedValue"],
                                _currencyId: result[i]["_transactioncurrencyid_value"],
                                _productState: result[i].productid["productstructure"]



                            };
                            if (productpricelevel._categoryName == undefined || !productpricelevel._categoryName)
                                productpricelevel._categoryName = "No category";
                            productpricelevels.push(productpricelevel);


                        }
                    return productpricelevels;
                }
            },
            pageSize: 10,
            group: {
                field: "categoryName",
                title: ""
            },
        });


        return dataSource;
    } catch (e) {
        displayErrorMessage(e, "Can't read Price Level Items!");
        return null;
    }
}

function productCancelClick(e) {
}

function productOkClick(e) {
    kendo.ui.progress(leftTree.element, true);
    kendo.ui.progress(rightTree.element, true);
    var selected = [];
    productTree.select().each(function(){
        selected.push(productTree.dataItem(this));
    });
    var request = {};
    var productsToAdd = [];

    
    selected.forEach(function(e) {
        productsToAdd.push(
            {
                "@odata.type": "Microsoft.Dynamics.CRM.productpricelevel",//entity type
                "productid@odata.bind": "/products("+e.productId.replace(/[{}]/g, "")+")",//Record's guid
               // "pricelevelidname": e.productName,
                "productpricelevelid":e.productpricelevelid,
                "amount": e.amount
            }
        );
    });

    try {

        var parameters = {};
parameters.BundleCollection = [];
parameters.IsBundle = false;
parameters.ProductsToAdd = productsToAdd;
var targetaccount = {};
targetaccount.accountid = accountId.replace(/[{}]/g, ""); //Delete if creating new record 
targetaccount["@odata.type"] = "Microsoft.Dynamics.CRM.account";
parameters.TargetAccount = targetaccount;

 
var eti_ETI_AddAccountProductToAccountRequest = {
    TargetAccount: parameters.TargetAccount,
    ProductsToAdd: parameters.ProductsToAdd,

    getMetadata: function() {
        return {
            boundParameter: null,
            parameterTypes: {
                "TargetAccount": {
                    "typeName": "mscrm.account",
                    "structuralProperty": 5
                },
                "ProductsToAdd": {
                    "typeName": "Collection(mscrm.crmbaseentity)",
                    "structuralProperty": 4
                }
            },
            operationType: 0,
            operationName: "eti_ETI_AddAccountProductToAccount"
        };
    }
};


var response = null;
$.when(Xrm.WebApi.online.execute(eti_ETI_AddAccountProductToAccountRequest)).then(
    function success(result) {
        if (result.ok) {
            result.json().then(function (response){
                kendo.ui.progress(leftTree.element, false);
                kendo.ui.progress(rightTree.element, false);
                if(!response.AssignmentResult)
                {
                    displayErrorMessage(response.AssignmentError, "Can't assign Products!");
                }
                else
                {
                    refreshAndShowPending();
                }
                console.log(response);})}
           
        
       
    },
    function(error) {
        kendo.ui.progress(leftTree.element, false);
        kendo.ui.progress(rightTree.element, false);
        displayErrorMessage(error.message, "Can't assign Products!");
    }
);
console.log(response);



/*var req = new XMLHttpRequest();
req.open("POST", Xrm.Page.context.getClientUrl() + "/api/data/v9.1/eti_ETI_AddAccountProductToAccount", false);
req.setRequestHeader("OData-MaxVersion", "4.0");
req.setRequestHeader("OData-Version", "4.0");
req.setRequestHeader("Accept", "application/json");
req.setRequestHeader("Content-Type", "application/json; charset=utf-8");
req.onreadystatechange = function() {
    if (this.readyState === 4) {
        req.onreadystatechange = null;
        if (this.status === 200) {
            var results = JSON.parse(this.response);
            kendo.ui.progress(leftTree.element, false);
            kendo.ui.progress(rightTree.element, false);
        } else {
            //Xrm.Utility.alertDialog(this.statusText);
            kendo.ui.progress(leftTree.element, false);
            kendo.ui.progress(rightTree.element, false);
        }   
    }
};
req.send(JSON.stringify(parameters));
*/

    } catch (e) {
        alert(e.message);
    }


}


function setBundleaAssignmentGrid(item) {
    bundleTree = $("#bundleproductlist").kendoGrid({
        dataSource: createBundleProductsDataSource(item),
        groupable: false,
        sortable: false,
        toolbar: ["search"],
        height: 400,
        scrollable: {
            endless: true
        },
        dataBound: function(e) {
            var grid = e.sender;
            $.each(grid.tbody.find('tr'), function() {
                var model = grid.dataItem(this);
                if (model.modeValue != 964820002) {
                    grid.select(this);
                }
                if (model.modeValue == 964820000) {
                    this.className += " k-state-disabled";
                }
            });
        },
        change: onChange,
        edit: function(e) {
            if (e.model.mode == 964820000) {
                //revert edited cell back to `read` mode
                this.closeCell();
            }

        },
        editable: false,
        columns: [{
                selectable: true,
                //  editable: true,
                width: "50px",

                /*
                attributes: {
                    "class": "#=mode == '964820000'? 'k-state-disabled':''#"
                } 
                */
            },
            {

                field: "categoryValue",
                //  editable: false,
                title: "Category",
                groupHeaderTemplate: function(dataItem) {
                    console.log("dataItem");
                    console.log(dataItem);
                    
                    var result = "";
                    var targetRule = rules.filter(el => el._eti_productcategory_value == dataItem.value)[0];
                    result += targetRule["_eti_productcategory_value@OData.Community.Display.V1.FormattedValue"];
                    var amount = "";
                    var min = targetRule.eti_min ? targetRule.eti_min : 0;
                    console.log(this.dataSource);
                    
                    var max = targetRule.eti_max ? targetRule.eti_max : bundleTree.dataSource._data.filter(da => da.categoryValue == dataItem.value).length;
                    amount = "  (Select from " + min + " to " + max + " items)"
                    
                    return "<strong>" + kendo.htmlEncode(result) + "</strong>" + kendo.htmlEncode(amount);
                },
                hidden: true,

            }, //rate, rateoverr, effective, newquant*/
            {

                field: "name",
                //  editable: false,
                title: "Product",
                width: "250px",
                headerAttributes: {
                    style: "text-align: center; "
                }
            }, //rate, rateoverr, effective, newquant

            {
                field: "price",
                format: "{0:c}",
                //   editable: true,
                title: "Price",
                attributes: {
                    "class": "table-cell",
                    style: "text-align: right; "
                },
                headerAttributes: {
                    style: "text-align: center; "
                }
            },
            {
                field: "mode",
                format: "{0:c}",
                //   editable: true,
                title: "Mode",
                hidden: true,
                attributes: {
                    "class": "table-cell",
                    style: "text-align: right; "
                },
                headerAttributes: {
                    style: "text-align: center; "
                }
            }
        ]
    }).data("kendoGrid");
}

function onChange(arg) {
    $(".k-state-disabled").addClass("k-state-selected");
    $(".k-state-disabled").find(".k-checkbox").prop("checked", true);
}

function createBundleProductsDataSource(item) {
    console.log("associations source");
    console.log(item);
    

    const bundleRulesAndAssociationsFetchXML = `<fetch>
                <entity name="eti_productassociationrule" >
                <attribute name="eti_bundleproduct" />
                <attribute name="eti_min" />
                <attribute name="eti_max" />
                <attribute name="eti_productcategory" />
                <filter>
                    <condition attribute="eti_bundleproduct" operator="eq" value="GUID" />
                </filter>
                <link-entity name="productassociation" from="productid" to="eti_bundleproduct" >
                    <attribute name="eti_price" />
                    <attribute name="eti_requirementmode" />
                    <attribute name="associatedproduct" />
                    <attribute name="productid" />
                    <attribute name="eti_productassociationrule" />
                </link-entity>
                </entity>
            </fetch>`;
    bundleRulesAndAssociationsRequest = `/api/data/v9.1/eti_productassociationrules?fetchXml=${encodeURIComponent(bundleRulesAndAssociationsFetchXML.replace("GUID", item.productId))}`;

    var dataSource = new kendo.data.DataSource({
        transport: {
            read: {
                url: parent.Xrm.Page.context.getClientUrl() + bundleRulesAndAssociationsRequest,
                dataType: 'json',
                beforeSend: function(xhr) {
                    xhr.setRequestHeader("OData-MaxVersion", "4.0");
                    xhr.setRequestHeader("OData-Version", "4.0");
                    xhr.setRequestHeader("Accept", "application/json");
                    xhr.setRequestHeader("Content-Type", "application/json; charset=utf-8");
                    xhr.setRequestHeader("Prefer", "odata.include-annotations=\"*\"");
                }
            },

        },
        schema: {
            model: {
                id: "_productid",
                fields: {
                    name: "_name",
                    price: {
                        from: "_price",
                        type: "number"
                    },
                    modeValue: "_modeValue",
                    categoryName: "_categoryName",
                    categoryValue: "_categoryValue"
                }
            },
            parse: function(response) {

                var tempRules = [];
                response.value.forEach(function(el) {
                    if (tempRules.filter(ru => ru["_eti_productcategory_value"] == el["_eti_productcategory_value"]).length == 0)
                        tempRules.push({
                            _eti_productcategory_value: el._eti_productcategory_value,
                            eti_max: el.eti_max,
                            eti_min: el.eti_min,
                            "_eti_productcategory_value@OData.Community.Display.V1.FormattedValue": el["_eti_productcategory_value@OData.Community.Display.V1.FormattedValue"],
                            eti_productassociationruleid: el["eti_productassociationruleid"]
                        });
                });
                rules = tempRules;
                let services = [];
                response.value.forEach(function(el) {
                    if (services.filter(se => se["_productid"] == el["productassociation1.associatedproduct"]).length == 0) {
                        var service = {
                            _productid: el["productassociation1.associatedproduct"],
                            _price: el["productassociation1.eti_price"],
                            _modeValue: el["productassociation1.eti_requirementmode"],
                            _name: el["productassociation1.associatedproduct@OData.Community.Display.V1.FormattedValue"],
                            _categoryValue: null,
                            _categoryName: null,
                        };
                        var targetRule = rules.filter(ru => ru.eti_productassociationruleid == el["productassociation1.eti_productassociationrule"])[0];
                        service._categoryName = targetRule["_eti_productcategory_value@OData.Community.Display.V1.FormattedValue"]
                        service._categoryValue = targetRule["_eti_productcategory_value"];

                        services.push(service);
                    }
                });

                console.log(rules);
                console.log(services);
                return services;

            }
        },
        pageSize: 10,
        group: {
            field: "categoryValue",
            title: ""
        },
    });
    console.log(dataSource);
    return dataSource;
}

function bundleCancelClick() {

}

function bundleOkClick() {}

function refreshAndShowPending() {
    tabstrip.select(1);
    refreshActiveGrid();
    refreshPendingGrid();
}

function removeProduct(e) {
    if (leftTree.select().length) {
        var row = leftTree.select();
        var data = leftTree.dataItem(row);

        if (data.productStateValue != 964820000) {
            displayErrorMessage("Product already in pending state!", "Can't update Assignment!");
            return;
        }
        
        var payload = {
            "eti_productstate": 964820006,
            "eti_newquantity": data.quantity,
            "eti_newrate": data.rate
        };
        Xrm.WebApi.updateRecord("eti_accountproduct", data.accountProductId.replace(/[{}]/g, ""), payload).then(
            function success(result) {
                console.log("AccountProduct updated");

                refreshAndShowPending();
                // perform operations on record update
            },
            function(error) {
                displayErrorMessage(error.message, "Can't update Assignment!");
                // handle error conditions
            }
        );

    }
}

function editProduct(e) {
    if (leftTree.select().length) {
        var row = leftTree.select();
        var data = leftTree.dataItem(row);
        console.log(data);
        if (data.productStateValue != 964820000) {
            displayErrorMessage("Product already in pending state!", "Can't update Assignment!");
            return;
        }
        
        var payload = {
            "eti_productstate": 964820005,
            "eti_newquantity": data.quantity,
            "eti_newrate": data.rate
        };
      
        Xrm.WebApi.updateRecord("eti_accountproduct", data.accountProductId.replace(/[{}]/g, ""), payload).then(
            function success(result) {
                console.log("AccountProduct updated");

                refreshAndShowPending();
                // perform operations on record update
            },
            function(error) {
                displayErrorMessage(error.message, "Can't update Assignment!");
                // handle error conditions
            }
        );

    }
}

function refreshActiveGrid(e) {
    leftTree.dataSource.read();
    console.log("refresh");
}

function refreshPendingGrid(e) {
    rightTree.dataSource.read();
    console.log("refresh");
}

function recalculatePrices() {
    console.log("sources");
    var leftSource = leftTree.dataSource;
    var rightSource = rightTree.dataSource;
    console.log(leftSource);
    console.log(rightSource);
    var currentMonthlyPayment = 0;
    leftSource._data.forEach(el => currentMonthlyPayment += el.rate * el.quantity);
    console.log(currentMonthlyPayment);
    $('#totalValue').text("$" + currentMonthlyPayment);
}

function getProductsDataSource(active) {
    try {
        var urlString = `/api/data/v9.1/eti_accountproducts?$select=eti_productstate,eti_rateoverriden,eti_oldquantity,eti_quantity,eti_newquantity,eti_rate,eti_newrate,eti_oldrate,eti_accountproductid,eti_name,eti_amount,eti_effectivedate,_eti_parentbundle_value&$expand=eti_Product($select=name,productstructure,productid,_eti_productcategory_value)&$filter=_eti_account_value eq GUID and eti_Product/productid ne null and _eti_parentbundle_value eq null`;

        urlString = urlString.replace("GUID", accountId);

        var dataSource = new kendo.data.DataSource({
            transport: {
                read: {
                    url: parent.Xrm.Page.context.getClientUrl() + urlString,
                    dataType: 'json',
                    beforeSend: function(xhr) {
                        xhr.setRequestHeader("OData-MaxVersion", "4.0");
                        xhr.setRequestHeader("OData-Version", "4.0");
                        xhr.setRequestHeader("Accept", "application/json");
                        xhr.setRequestHeader("Content-Type", "application/json; charset=utf-8");
                        xhr.setRequestHeader("Prefer", "odata.include-annotations=\"*\"");
                    }
                },

            },
            schema: {
                model: {
                    //The available options are "string", "number", "boolean", "date". The default is "string".
                    id: "eti_accountproductid",
                    fields: {
                        accountProductId: {
                            from: "eti_accountproductid",
                            type: "string",
                            editable: false
                        },
                        productStateValue: {
                            from: "_productStateValue",
                            type: "number",
                            editable: false
                        },
                        productStateName: {
                            from: "_productStateName",
                            type: "string",
                            editable: false
                        },
                        priceOverriden: {
                            from: "_priceOverriden",
                            type: "boolean",
                            editable: false
                        },
                        oldQuantity: {
                            from: "_oldQuantity",
                            type: "number",
                            editable: false
                        },
                        quantity: {
                            from: "_quantity",
                            type: "number",

                        },
                        newQuantity: {
                            from: "_newQuantity",
                            type: "number"
                        },
                        amount: {
                            from: "_amount",
                            type: "number",
                            editable: false
                        },
                        oldRate: {
                            from: "_oldRate",
                            type: "number",
                            editable: false
                        },
                        rate: {
                            from: "_rate",
                            type: "number"
                        },
                        newRate: {
                            from: "_newRate",
                            type: "number"
                        },
                        effectiveDate: {
                            from: "_effectiveDate",
                            type: "date",

                        },
                        currencyId: {
                            from: "_currencyId",
                            type: "string",
                            editable: false
                        },
                        currencyName: {
                            from: "_currencyName",
                            type: "string",
                            editable: false
                        },
                        productId: {
                            from: "_productId",
                            type: "string",
                            editable: false
                        },
                        productName: {
                            from: "_productName",
                            type: "string",
                            editable: false
                        },
                        categoryId: {
                            from: "_categoryId",
                            type: "string",
                            editable: false
                        },
                        categoryName: {
                            from: "_categoryName",
                            type: "string",
                            editable: false
                        },
                        productStructure: {
                            from: "_productStructure",
                            type: "number",
                            editable: false
                        },
                        originalRate: {
                            from: "_originalRate",
                            type: "number",
                            editable: false
                        }

                    }
                },
                parse: function(response) {
                    
                    let services = [],
                        result = response.value;
                    if (result.length)
                        for (var i = 0; i < result.length; i++) {
                            console.log(globalPriceLevels);
                            
                            var service = {
                                eti_accountproductid: result[i]["eti_accountproductid"],
                                _productStateValue: result[i]["eti_productstate"],
                                _productStateName: result[i]["eti_productstate@OData.Community.Display.V1.FormattedValue"],
                                _priceOverriden: result[i]["eti_rateoverriden"],
                                _oldQuantity: result[i]["eti_oldquantity"],
                                _newQuantity: result[i]["eti_newquantity"],
                                _quantity: result[i]["eti_quantity"],
                                _oldRate: result[i]["eti_oldrate"],
                                _rate: result[i]["eti_rate"],
                                _newRate: result[i]["eti_newrate"],
                                _amount: result[i]["eti_amount"],
                                _effectiveDate: result[i]["eti_effectivedate"],
                                _currencyId: result[i]["_transactioncurrencyid_value"],
                                _currencyName: result[i]["_transactioncurrencyid_value@OData.Community.Display.V1.FormattedValue"],
                                _productId: result[i].eti_Product["productid"],
                                _productName: result[i].eti_Product["name"],
                                _productStructure: result[i].eti_Product["productstructure"],
                                _categoryId: result[i].eti_Product["_eti_productcategory_value"],
                                _categoryName: result[i].eti_Product["_eti_productcategory_value@OData.Community.Display.V1.FormattedValue"]


                            };
                            var originRate = globalPriceLevels._data.filter(el => el.productId == result[i].eti_Product["productid"])[0].amount;
                            service["_originalRate"] = originRate;

                            if (service._categoryName == undefined || !service._categoryName)
                                service._categoryName = "No category";
                            if (active) {
                                if (!(service._productStateValue == 964820004 || service._productStateValue == 964820001))
                                    services.push(service);
                            } else {
                                if (service._productStateValue != 964820000)
                                    services.push(service);
                            }

                        }
                    if (active) {
                        $('#activeTabLabel').text("Active Products (" + services.length + ")");
                    } else {
                        $('#pendingTabLabel').text("Draft and pending Products (" + services.length + ")");
                    }
                    return services;
                }
            },
            pageSize: 10,
            group: {
                field: "categoryName",
                title: ""
            },
        });


        return dataSource;
    } catch (e) {
        displayErrorMessage(e, "Can't read Account Products!");
        return null;
    }
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

function replaceUnsupportedCharacters(text) {
    var periodRegExp = /[.]/g;
    var atSignRegExp = /[@]/g;
    return text.replace(periodRegExp, "_").replace(atSignRegExp, "__");
}

function hasUnsupportedCharacters(text) {
    return (text.indexOf(".") !== -1) || (text.indexOf("@") !== -1);
}

function transformResponseRecords(records) {
    var updatedRecords = [];
    records.forEach(function(el) {
        var newObj = {
            ...el
        };
        for (var key in newObj) {
            if (newObj.hasOwnProperty(key) && hasUnsupportedCharacters(key)) {
                delete newObj[key];
                var newKey = replaceUnsupportedCharacters(key);
                newObj[newKey] = el[key];
            }
        }
        updatedRecords.push(newObj);
    });
    return updatedRecords;
}

function errorNotification() {
    alert("oops! something went wrong!");
}