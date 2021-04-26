            let globaluints;
            let dropDownValues;
            if (parent.Xrm && parent.Xrm.Page) {
                formContext = parent.Xrm.Page;
                Xrm = parent.Xrm;
            }

            if (typeof GetGlobalContext !== "undefined") {
                globalContext = GetGlobalContext();
            }

            $(document).ready(function() {

                var currentProductID = formContext.data.entity.getId();

                //e7c656b2-067f-ea11-a812-000d3a33a5cc
                const priceLevelItemsFetchXML = `<fetch>
                    <entity name="pricelevel" >
                    <attribute name="name" />
                    <attribute name="eti_serviceprovider" />
                    <link-entity name="productpricelevel" from="pricelevelid" to="pricelevelid" link-type="outer" >
                        <attribute name="uomid" />
                        <attribute name="uomidname" />
                        <attribute name="amount" />
                        <attribute name="transactioncurrencyid" />
                        <attribute name="pricingmethodcode" />
                        <attribute name="productpricelevelid" />
                        <filter>
                        <condition attribute="productid" operator="eq" value="GUID" />
                        </filter>
                        <link-entity name="product" from="productid" to="productid" link-type="outer" >
                        <attribute name="defaultuomscheduleid" />
                        </link-entity>
                    </link-entity>
                    </entity>
                </fetch>`;
                priceLevelsRequest = `?fetchXml=${encodeURIComponent(priceLevelItemsFetchXML.replace("GUID", currentProductID))}`;
                const uomFetchXML = `<fetch>
                    <entity name="uom" >
                    <attribute name="uomscheduleid" />
                    <attribute name="uomid" />
                    <attribute name="name" />
                    <filter>
                    <condition attribute="uomscheduleid" operator="eq" value="GUID" />
                    </filter>
                    </entity>
                </fetch>`;
                var globalContext = Xrm.Utility.getGlobalContext();
                clientUrl = globalContext.getClientUrl();
                var uomscheduleId = null;
                uomscheduleId = window.parent.Xrm.Page.getAttribute("defaultuomscheduleid").getValue()[0].id.replace(/[{}]/g, "").toLowerCase();
                uomRequest = `?fetchXml=${encodeURIComponent(uomFetchXML.replace("GUID", uomscheduleId))}`;

                const currencyFetchXML = `<fetch>
                    <entity name="transactioncurrency" >
                    <attribute name="currencyname" />
                    </entity>
                </fetch>`;
                currencyRequest = `?fetchXml=${encodeURIComponent(currencyFetchXML)}`;
                $.when(
                        Xrm.WebApi.retrieveMultipleRecords("pricelevel", priceLevelsRequest),
                        Xrm.WebApi.retrieveMultipleRecords("uom", uomRequest),
                        Xrm.WebApi.retrieveMultipleRecords("transactioncurrency", currencyRequest)
                    )
                    .then(function(priceLevelResponse, uomResponse, CurrencyResponse) {
                        initalizeControls(priceLevelResponse, uomResponse, CurrencyResponse);

                    }, errorNotification);
                //THEN map multiselect items and display boxes


            });

            function initalizeControls(pls, uoms, currs) {
                var pricelevels = transformResponseRecords(pls.entities);
                var units = transformResponseRecords(uoms.entities);
                var currencies = transformResponseRecords(currs.entities);


                console.log("raw pricelevels");
                console.log(pricelevels);
                console.log(units);
                console.log(currencies);
                dropDownValues = [];

                var dropDownCurrencies = [];
                units.forEach(element => dropDownValues.push({"value": element.uomid, "text": element.name}));
                currencies.forEach(element => dropDownCurrencies.push({"value": element.transactioncurrencyid, "text": element.currencyname}));
                var arruom = new kendo.data.DataSource({data: dropDownValues});
                var currarr = new kendo.data.DataSource({data: dropDownCurrencies});
                $("#frame-center").kendoGrid({
                    dataSource: buildCenterGridDataSource(pricelevels,dropDownValues),
                    filterable: false,
                    groupable: false,
                    valuePrimitive: true,
                    height: 540,
                    scrollable: {
                        endless: true
                    },
                    sortable: {
                        mode: "single",
                        allowUnsort: false
                    },
                    columns: [{
                            field: "name",
                            width: 400,
                            title: "Price List Name",
                            template: "<div class = 'pricelistCell'><div class ='pricelistName' style= 'white-space: nowrap;'><img src='#: globalContext.getClientUrl()#/WebResources/eti_pricelist_png' /> <a href = '#: globalContext.getClientUrl()#/main.aspx?etc=1022&id=%7b#:pricelevelid#%7d&pagetype=entityrecord' target = '_blank' style='text-decoration: none;   white-space: nowrap;'>#: name # </a></div><button class = 'copyButton' id = 'copyButton'><img  class 'copyImage' src='#: globalContext.getClientUrl()#/WebResources/eti_copy_png'/></button><button class = 'trashButton' id = 'trashButton'><img  class 'trashImage' src='#: globalContext.getClientUrl()#/WebResources/eti_trashbin_png'/></button></div>",
                            headerAttributes: {
                                style: "text-align: left; "
                                }
                        },
                        {
                            field: "productpricelevel1_productpricelevelid",
                        hidden:true
                        },
                        {
                            field: "productpricelevel1_amount",
                            width: 160,
                            title: "Amount",
                            format: "{0:c}",
                        // template: "<div class = 'amountCell'><div class ='amountValue' style= 'white-space: nowrap;'><img src='#: globalContext.getClientUrl()#/WebResources/eti_pricelist_png' /> <a href = '#: globalContext.getClientUrl()#/main.aspx?etc=1022&id=%7b#:pricelevelid#%7d&pagetype=entityrecord' target = '_blank' style='text-decoration: none;   white-space: nowrap;'>#: name # </a></div><button class = 'trashButton' id = 'trashButton'><img  class 'trashImage' src='#: globalContext.getClientUrl()#/WebResources/eti_trashbin_png'/></button></div>",
                            attributes: {
                                "class": "table-cell",
                                style: "text-align: right; "
                            },
                            headerAttributes: {
                                style: "text-align: left; "
                                }
                        },
                        {
                            field: "productpricelevel1_uomid",
                            title: "Unit",  
                            width: 160,
                            editor: unitsDropDownEditor,
                        
                            template: function(dataitem) {console.log("di", dataitem); console.log(units); try {return units.find(el => el.uomid == dataitem.productpricelevel1_uomid).name} catch(e) {return ""}},
                            headerAttributes: {
                                style: "text-align: left; "
                                },
                                attributes: {
                                    "class": "table-cell",
                                    style: "text-align: right; "
                                },

                        },
                        {
                            field: "serviceproviderName",
                            width: 300,
                            title: "Service Provider",

                            headerAttributes: {
                                style: "text-align: left; "
                                }
                        },
                        { command: ["edit"],  title: "&nbsp;", width: 180}
                        
                            /*{ command: [
                                {
                                    name: "destroy",
                                    hidden: true,
                                    title: "Remove from Price List", 
                                    width: "em",
                                    text: "&nbsp",
                                    visible: function(dataItem) 
                                        { return dataItem.productpricelevel1_productpricelevelid}
                                }
                            ]
                        },*/
                    
                    ],
                    editable: {
                        mode: "inline", // mode can be incell/inline/popup with Q1 '12 Beta Release of Kendo UI
                        confirmation: false // the confirmation message for destroy command
                    },
                    

                    edit: function(e) {
                    
                    
                    },
                
                    save: function(e) {
                        console.log("save");
                    
                        if(e.model.productpricelevel1_productpricelevelid === undefined)
                        {
                            var payload = {
                                "productid@odata.bind": "/products(" + formContext.data.entity.getId().replace(/[{}]/g, "") + ")",
                                "uomid@odata.bind": "/uoms(" + e.model.productpricelevel1_uomid.replace(/[{}]/g, "") + ")",
                                "pricelevelid@odata.bind": "/pricelevels(" + e.model.pricelevelid.replace(/[{}]/g, "") + ")",
                                //"transactioncurrencyid@odata.bind": "/transactioncurrencies(" + e.model.productpricelevel1_transactioncurrencyid.replace(/[{}]/g, "") + ")",
                                "pricingmethodcode":1,
                                "quantitysellingcode":1,
                                "amount": e.model.productpricelevel1_amount
                                
                            };
                            console.log(payload);
                            Xrm.WebApi.createRecord("productpricelevel", payload).then(
                                function success(result) {

                                    e.model.productpricelevel1_productpricelevelid = result.id;
                                    var grid = $("#frame-center").data("kendoGrid");
                                    // select the first table row
                                
                                    refreshGrid();
                                },
                                function(error) {
                                    var alertStrings = {
                                        confirmButtonLabel: "Ok",
                                        text: error.message,
                                        title: "Unable to associate product"
                                    };
                                    var alertOptions = {
                                        height: 120,
                                        width: 260
                                    };
                                    Xrm.Navigation.openAlertDialog(alertStrings, alertOptions)
                                }
                            );
                        }
                        else
                        {
                            payload =  
                            {
                                "amount" : e.model.productpricelevel1_amount,
                                "uomid@odata.bind": "/uoms(" + e.model.productpricelevel1_uomid.replace(/[{}]/g, "") + ")",
                            };
                            
                            Xrm.WebApi.updateRecord("productpricelevel",  e.model.productpricelevel1_productpricelevelid.replace(/[{}]/g, ""), payload).then(
                                function success(result) {
                                    console.log("PL updated");
                                    var grid = $("#frame-center").data("kendoGrid");
                                    refreshGrid();
                                },
                                function (error) {
                                    var alertStrings = {
                                        confirmButtonLabel: "Ok",
                                        text: error.message,
                                        title: "Unable to associate product"
                                    };
                                    var alertOptions = {
                                        height: 120,
                                        width: 260
                                    };
                                    Xrm.Navigation.openAlertDialog(alertStrings, alertOptions)
                                    // handle error conditions
                                }
                                );
                        }
                    },
                    cancel: function(e) {
                    
                    }
                });

                $("#frame-center").on("click", ".trashButton", function(){
                    var grid = $("#frame-center").data("kendoGrid");
                    var row = $(this).closest("tr");
                    console.log("row");
                    removePriceLevelEntry(grid.dataItem(row));
                });
                $("#frame-center").on("click", ".copyButton", function(){
                    var grid = $("#frame-center").data("kendoGrid");
                    var row = $(this).closest("tr");
                    console.log("row");
                    copyPricelevelEntry(grid.dataItem(row));
                    //removePriceLevelEntry(grid.dataItem(row));
                });
                function copyPricelevelEntry(entr) {
                    if(!entr.productpricelevel1_productpricelevelid)
                    return;

                    var grid = $("#frame-center").data("kendoGrid");   
                    var ds = grid.dataSource.transport.data.filter(el => !el.productpricelevel1_productpricelevelid);
                    console.log(ds);
                   
                    var pricelists = [];
                    
                    ds.forEach(function(e) {
                        var payload = {
                            "productid@odata.bind": "/products(" + formContext.data.entity.getId().replace(/[{}]/g, "") + ")",
                            "uomid@odata.bind": "/uoms(" + entr.productpricelevel1_uomid.replace(/[{}]/g, "") + ")",
                            "pricelevelid@odata.bind": "/pricelevels(" + e.pricelevelid.replace(/[{}]/g, "") + ")",
                            //"transactioncurrencyid@odata.bind": "/transactioncurrencies(" + e.model.productpricelevel1_transactioncurrencyid.replace(/[{}]/g, "") + ")",
                            "pricingmethodcode":1,
                            "quantitysellingcode":1,
                            "amount": entr.productpricelevel1_amount
                            
                        };

                        var body = JSON.stringify(payload);
                        pricelists.push(body);
                    });
                    var data = [];
                                                    data.push('--batch_123456');
                                                    data.push('Accept: application/json;odata=verbose');
                                                    data.push('Content-Type: multipart/mixed;boundary=changeset_BBB456');
                                                    data.push('');

                                                    for (var i = 0; i < pricelists.length; i++) {
                                                        data.push('--changeset_BBB456');
                                                        data.push('Accept: application/json;odata=verbose');
                                                        data.push('Content-Type:application/http');
                                                       
                                                        data.push('Content-Transfer-Encoding:binary');
                                                        var id = i + 1;
                                                        data.push('Content-ID:' + id);
                                                        data.push('');
                                                        data.push('POST ' + parent.Xrm.Page.context.getClientUrl() + '/api/data/v8.1/productpricelevels HTTP/1.1');

                                                        data.push('Content-Type:application/json;type=entry');
                                                        data.push('');
                                                        data.push(pricelists[i]);
                                                    }
                                                    data.push('--changeset_BBB456--');
                                                    data.push('--batch_123456--');
                                                    var payload = data.join('\r\n');

                                                    $.ajax({
                                                        method: 'POST',
                                                        url: parent.Xrm.Page.context.getClientUrl() + '/api/data/v8.1/$batch',
                                                        headers: {
                                                            'Accept': 'Accept: application/json;odata=verbose',
                                                            'Content-Type': 'multipart/mixed;boundary=batch_123456',
                                                            
                                                            'Odata-MaxVersion': '4.0',
                                                            'Odata-Version': '4.0'
                                                        },
                                                        data: payload,
                                                        async: false,
                                                        success: function(data, textStatus, xhr) {
                                                        refreshGrid();


                                                        },
                                                        error: function(xhr, textStatus, errorThrown) {
                                                            console.log("error");
                                                            console.log(errorThrown, textStatus, xhr);
                                                        
                                                        }
                                                    });
                                                    
                    //find all empty pricelists
                    //generate batch
                    //dostuff
                }
                function refreshGrid()
                {

                    var currentProductID = formContext.data.entity.getId();

                    //e7c656b2-067f-ea11-a812-000d3a33a5cc
                    const priceLevelItemsFetchXML = `<fetch>
                        <entity name="pricelevel" >
                        <attribute name="name" />
                        <attribute name="eti_serviceprovider" />
                        <link-entity name="productpricelevel" from="pricelevelid" to="pricelevelid" link-type="outer" >
                            <attribute name="uomid" />
                            <attribute name="uomidname" />
                            <attribute name="amount" />
                            <attribute name="transactioncurrencyid" />
                            <attribute name="pricingmethodcode" />
                            <attribute name="productpricelevelid" />
                            <filter>
                            <condition attribute="productid" operator="eq" value="GUID" />
                            </filter>
                            <link-entity name="product" from="productid" to="productid" link-type="outer" >
                            <attribute name="defaultuomscheduleid" />
                            </link-entity>
                        </link-entity>
                        </entity>
                    </fetch>`;
                    priceLevelsRequest = `?fetchXml=${encodeURIComponent(priceLevelItemsFetchXML.replace("GUID", currentProductID))}`;
                  
                    $.when(
                            Xrm.WebApi.retrieveMultipleRecords("pricelevel", priceLevelsRequest)
                           
                        )
                        .then(function(priceLevelResponse) {
                            
                            var pricelevels = transformResponseRecords(priceLevelResponse.entities);
                            var updatedDataSource= buildCenterGridDataSource(pricelevels,dropDownValues);
                            var grid = $("#frame-center").data("kendoGrid");  
                            updatedDataSource.read();
                            grid.dataSource = updatedDataSource;
                            grid.clearSelection();
                            grid.refresh();

    
                        }, errorNotification);
                    //THEN map multiselect items and display boxes
    
    
                }
                

                function removePriceLevelEntry(e) {
                    
                    console.log(e);

                
                    if(!e.productpricelevel1_productpricelevelid)
                    return;
                    var grid = $("#frame-center").data("kendoGrid");   
                    Xrm.WebApi.deleteRecord("productpricelevel",  e.productpricelevel1_productpricelevelid.replace(/[{}]/g, "")).then(
                        function success(result) {
                        
                            var grid = $("#frame-center").data("kendoGrid");   
                            e.productpricelevel1_uomid = null;   
                            e.productpricelevel1_amount = null;      
                            e.productpricelevel1_productpricelevelid = undefined;        
                            refreshGrid();
                            // perform operations on record deletion
                        },
                        function (error) {
                            
                            var dialog = $('#dialog');
                            var contentString = "<strong>"+error.message+"</strong>";
                            dialog.kendoDialog({
                                width: "450px",
                                title: "An error occured",
                                closable: false,
                                modal: true,
                                content: contentString,
                                actions: [
                                    { text: 'Ok' }
                                ]
                    });
                    dialog.data("kendoDialog").open();    
                
                        
                            console.log(error.message);
                            // handle error conditions
                        }
                    );
                    refreshGrid();
                }
                function unitsDropDownEditor(container, options) {
                
                    var it = $('<input name="' + options.field + '" />')
                        .appendTo(container)
                        .kendoDropDownList({
                            valuePrimitive: true,
                            dataSource: arruom,
                            dataTextField: "text",
                            dataValueField: "value",
                        });
                    
                }
                function currencyDropDownEditor(container, options) {
                
                    var it = $('<input name="' + options.field + '" />')
                        .appendTo(container)
                        .kendoDropDownList({
                            valuePrimitive: true,
                            dataSource: currarr,
                            dataTextField: "text",
                            dataValueField: "value",
                        });
                    
                }
            }
            


            function buildCenterGridDataSource(pricelevels, dropDownValues) {

                var dataSource = new kendo.data.DataSource({
                    data: pricelevels,
                    pageSize: 15,

                    schema: {
                        model: {
                            id: "pricelevelid",
                            fields: {
                                name: {type: "string", editable: false},
                                pricelevelid: {type: "string", editable: false},
                                productpricelevel1_amount: {type: "number", validation: { required: true}},
                                productpricelevel1_uomid: {type: "string", validation: { required: true}},
                                productpricelevel1_productpricelevelid: {type: "string"},
                                serviceproviderId: {
                                    from: "_eti_serviceprovider_value",
                                    type: "string",
                                    editable: false
                                },
                                serviceproviderName: {
                                    from: "_eti_serviceprovider_value__OData_Community_Display_V1_FormattedValue",
                                    type: "string",
                                    editable: false
                                },
                                
                            }
                        }
                    },
                    sort: { field: "name", dir: "asc" }
                });
                console.log(dataSource);
                return dataSource;
            }
            async function callAssociation(params) {
                let result = await associateRequest(params);
                console.log(result);
            }
            async function callDeAssociation(params) {
                let result = await dissociateRequest(params);
                console.log(result);
            }

            function uuidv4() {
                return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
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

            function associateRequest(params) {
                return new Promise(function(resolve, reject) {
                    var association = {
                        "@odata.id": globalContext.getClientUrl() + "/api/data/v9.1/" + params.relatedEntitySetName + "(" + params.relatedId + ")"
                    };
                    var req = new XMLHttpRequest();
                    req.open("POST", globalContext.getClientUrl() + "/api/data/v9.1/" + params.parentEntitySetName + "(" + params.parentId + ")/" + params.relationshipName + "/$ref", true);
                    req.setRequestHeader("Accept", "application/json");
                    req.setRequestHeader("Content-Type", "application/json; charset=utf-8");
                    req.setRequestHeader("OData-MaxVersion", "4.0");
                    req.setRequestHeader("OData-Version", "4.0");
                    req.onreadystatechange = function() {
                        if (this.readyState === 4) {

                            req.onreadystatechange = null;

                            if (this.status === 204 || this.status === 1223) {
                                console.log("success");

                            } else {

                                console.log("error");

                            }

                        }

                    };
                    req.send(JSON.stringify(association));
                });
            }

            function dissociateRequest(params) {
                return new Promise(function(resolve, reject) {
                    if (!globalContext) {
                        reject(new Error("Global context is not available"));
                        return;
                    }
                    var req = new XMLHttpRequest();
                    req.open("DELETE", globalContext.getClientUrl() + "/api/data/v9.1/" + params.parentEntitySetName + "(" + params.parentId + ")/" + params.relationshipName + "(" + params.relatedId + ")/$ref", true);
                    req.setRequestHeader("Accept", "application/json");
                    req.setRequestHeader("Content-Type", "application/json; charset=utf-8");
                    req.setRequestHeader("OData-MaxVersion", "4.0");
                    req.setRequestHeader("OData-Version", "4.0");
                    req.onreadystatechange = function() {
                        if (this.readyState === 4) {
                            req.onreadystatechange = null;
                            if (this.status === 204 || this.status === 1223) {
                                console.log("success");
                            } else {
                                console.log("error");
                            }
                        }
                    };
                    req.send();
                });
            }