if (parent.Xrm && parent.Xrm.Page) {
    formContext = parent.Xrm.Page;
    Xrm = parent.Xrm;
}

if (typeof GetGlobalContext !== "undefined") {
    globalContext = GetGlobalContext();
}
var mainGrid;
var accountId = formContext.data.entity.getId();

$(document).ready(function() {
    initalizeControls();
});

function initalizeControls() {
    centerToolbar = kendo.template($("#template-main").html());

    leftTree = $("#frame-center").kendoGrid({
        dataSource: getHistoryDataSource(),
        toolbar: centerToolbar,
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

                field: "operationDate",
                //  editable: false,
                title: "Date",
                format: "{0:MM/dd/yyyy}",
               
                headerAttributes: {
                    style: "text-align: center; "
                }
            },
            {
                field: "event",
                //  editable: false,
                title: "Event",
               
                headerAttributes: {
                    style: "text-align: center; "
                }
            }, {
                field: "product",
                //  editable: false,
                title: "Product",
              
               
                headerAttributes: {
                    style: "text-align: center; "
                }
            },
            {
                field: "productId",
                //  editable: false,
                title: "Product",
                hidden: true,
               
                headerAttributes: {
                    style: "text-align: center; "
                }
            },
            {
                field: "newProduct",
                //  editable: false,
                title: "New Product",
               
                headerAttributes: {
                    style: "text-align: center; "
                }
            },
            {
                field: "newProductId",
                //  editable: false,
                title: "New Product",
                hidden: true,
               
                headerAttributes: {
                    style: "text-align: center; "
                }
            },
            {
                field: "rate",
                //  editable: false,
                title: "Rate",
                format: "{0:c}",
               
                headerAttributes: {
                    style: "text-align: center; "
                }
            },
            {
                field: "quantity",
                //  editable: false,
                title: "Quantity",
               
                headerAttributes: {
                    style: "text-align: center; "
                }
            },
            {
                field: "amount",
                //  editable: false,
                title: "Amount",
                format: "{0:c}",
               
                headerAttributes: {
                    style: "text-align: center; "
                }
            },
            {
                field: "newRate",
                //  editable: false,
                title: "New Rate",
                format: "{0:c}",
               
                headerAttributes: {
                    style: "text-align: center; "
                }
            },
            {
                field: "newQuantity",
                //  editable: false,
                title: "New Quantity",
               
                headerAttributes: {
                    style: "text-align: center; "
                }
            },
            {
                field: "newAmount",
                //  editable: false,
                title: "New Amount",
                format: "{0:c}",
               
                headerAttributes: {
                    style: "text-align: center; "
                }
            },
            {
                field: "callingUser",
                //  editable: false,
                title: "User",
               
                headerAttributes: {
                    style: "text-align: center; "
                }
            }
            ,
            {
                field: "callingUserId",
                //  editable: false,
                hidden: true,
                title: "User",
               
                headerAttributes: {
                    style: "text-align: center; "
                }
            }


        ]
    }).data("kendoGrid");

    $(".k-pager-refreshRight").bind('click', refreshHistory);
}
function refreshHistory() {
    leftTree.dataSource.read();
}

function getHistoryDataSource() {
    try {
        var urlString = `/api/data/v9.1/eti_productassignmenthistoryitems?$orderby=eti_operationdate desc&$filter=_eti_account_value eq GUID`;

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
                    id: "eti_productassignmenthistoryid",
                    fields: {
                        product: {
                            from: "eti_product",
                            type: "string",
                            editable: false
                        },
                        newProduct: {
                            from: "eti_newproduct",
                            type: "string",
                            editable: false
                        },
                        productId: {
                            from: "eti_productId",
                            type: "string",
                            editable: false
                        },
                        newProductId: {
                            from: "eti_newproductId",
                            type: "string",
                            editable: false
                        },
                        rate: {
                            from: "eti_rate",
                            type: "number",
                            editable: false
                        },
                        newRate: {
                            from: "eti_newrate",
                            type: "number",
                            editable: false
                        },
                        quantity: {
                            from: "eti_quantity",
                            type: "number",
                            editable: false
                        },
                        newQuantity: {
                            from: "eti_newquantity",
                            type: "number",
                            editable: false
                        },
                        amount: {
                            from: "eti_amount",
                            type: "number",
                            editable: false
                        },
                        newAmount: {
                            from: "eti_newamount",
                            type: "number",
                            editable: false
                        },
                        operationDate: {
                            from: "eti_operationdate",
                            type: "date",
                            editable: false
                        },
                        event: {
                            from: "eti_event",
                            type: "string",
                            editable: false
                        },
                        callingUser: {
                            from: "eti_user",
                            type: "string",
                            editable: false
                        },
                        callingUserId: {
                            from: "eti_userid",
                            type: "string",
                            editable: false
                        }


                    }
                },
                parse: function(response) {

                    let services = [],
                        result = response.value;
                    if (result.length)
                        for (var i = 0; i < result.length; i++) {

                            var service = {
                                eti_product: result[i]["_eti_product_value@OData.Community.Display.V1.FormattedValue"],
                                eti_newproduct: result[i]["_eti_newproduct_value@OData.Community.Display.V1.FormattedValue"],
                                eti_productId: result[i]["_eti_product_value"],
                                eti_newproductId: result[i]["_eti_newproduct_value"],
                                eti_rate: result[i]["eti_rate"],
                                eti_newrate: result[i]["eti_newrate"],
                                eti_quantity: result[i]["eti_quantity"],
                                eti_newquantity: result[i]["eti_newquantity"],
                                eti_amount: result[i]["eti_amount"],
                                eti_newamount: result[i]["eti_newamount"],
                                eti_operationdate: result[i]["eti_operationdate"],
                                eti_event: result[i]["eti_event@OData.Community.Display.V1.FormattedValue"],
                                eti_user: result[i]["_eti_user_value@OData.Community.Display.V1.FormattedValue"],
                                eti_userId: result[i]["_eti_user_value"]

                            };
                            services.push(service);
                        }
                    return services;
                }
            },
            pageSize: 10
        });


        return dataSource;
    } catch (e) {
        displayErrorMessage(e, "Can't read Account Products!");
        return null;
    }
}



function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0,
            v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}


function errorNotification() {}

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