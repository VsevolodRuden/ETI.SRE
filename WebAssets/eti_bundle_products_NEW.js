            //#region dlobal variables
            if (parent.Xrm && parent.Xrm.Page) {
                formContext = parent.Xrm.Page;
                Xrm = parent.Xrm;
            }

            if (typeof GetGlobalContext !== "undefined") {
                globalContext = GetGlobalContext();
            }

            var debugMode = true;
            var frameLeft, frameRight;
            var leftGrid;
            var rightGrid;

            var associationModes = [{
                value: "964820000",
                label: "Required"
            }, {
                value: "964820001",
                label: "Pre-assigned"
            }, {
                value: "964820002",
                label: "Optional"
            }];
            //#endregion

            //#region common routines
            $(document).ready(function() {
                initialize();
            });

            function initialize() {
                initializeControls();
            }

            function initializeControls() {
                initializeRightGrid();
               



            }

            function refreshRightGrid() {
                var grid = $("#frame-right").data("kendoGrid");
                grid.dataSource.read();
                grid.refresh()
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
                dialog.data("kendoDialog").open();
            }
            //#endregion


            //#region leftgrid
            function initializeLeftGrid() {
                leftGrid = $("#frame-left").kendoGrid({
                    
                    dataSource: getLeftFrameDataSource(),
                    // toolbar: kendo.template($("#template-left").html()),
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
                            field: "name",
                            title: "Product",
                            headerAttributes: {
                                style: "text-align: center; "
                            }
                        },
                        {
                            field: "categoryName",
                            title: "Category",
                            hidden: true,
                            groupHeaderTemplate: "#= data.value #",
                            headerAttributes: {
                                style: "text-align: center; "
                            }
                        },
                        {
                            field: "amount",
                            title: "Amount",
                            format: "{0:c}",
                            attributes: {
                                "class": "table-cell",
                                style: "text-align: right; "
                            },
                            headerAttributes: {
                                style: "text-align: center; "
                            }
                        },
                        {
                            field: "currency",
                            title: "Currency",
                            hidden: true,
                            headerAttributes: {
                                style: "text-align: center; "
                            }
                        },
                        {
                            field: "currencyName",
                            title: "Currency",
                            headerAttributes: {
                                style: "text-align: center; "
                            }
                        }

                    ],
                    dataBound: function(e) {}
                });
                leftGrid.find(".k-grid-toolbar").on("click", ".k-pager-plus", addProductTobundle);
            }

            function addProductTobundle(e) {
                var grid = $("#frame-left").data("kendoGrid");
                var selectedItem = grid.dataItem(grid.select());
                var data = $("#frame-right").data("kendoGrid").dataSource;
                console.log("selectedItem");
                console.log(selectedItem);
                console.log("data");
                console.log(data);
                if (data._data.filter(el => el.id == selectedItem.id).length == 0) {
                    var needToCreateRule = data._data.filter(el => el.categoryId == selectedItem.category).length == 0;
                    if (needToCreateRule)
                        createRule(selectedItem);
                    else
                        createProduct(selectedItem, data._data.filter(el => el.categoryId == selectedItem.category)[0].productassociationruleid);
                } else
                    displayErrorMessage("This product is already assigned to bundle!", "Duplicate detected");


            }

            function createProduct(pr, ruleId) {


                var entity = {};
                entity["eti_ProductAssociationRule@odata.bind"] = "/eti_productassociationrules(" + ruleId + ")";
                entity["productid@odata.bind"] = "/products(" + formContext.data.entity.getId().replace(/[{}]/g, "").toLowerCase() + ")";
                entity["uomid@odata.bind"] = "/uoms(" + pr.uom + ")";
                entity["associatedproduct@odata.bind"] = "/products(" + pr.id + ")";
                entity["transactioncurrencyid@odata.bind"] = "/transactioncurrencies(" + pr.currency + ")";
                entity.eti_price = parseFloat(pr.amount);
                entity.quantity = 1;
                entity.eti_amount = parseFloat(entity["eti_price"] * entity["quantity"]);
                entity.eti_requirementmode = 964820002;
                entity.productisrequired = 0;

                Xrm.WebApi.createRecord("productassociation", entity).then(
                    function success(result) {
                        refreshRightGrid();
                    },
                    function(error) {
                        displayErrorMessage(error.message, "Can't associate product!");
                        deleteEmptyRules();
                    }
                );

            }

            function createRule(pr) {
                var entity = {};
                entity["eti_BundleProduct@odata.bind"] = "/products(" + formContext.data.entity.getId().replace(/[{}]/g, "").toLowerCase() + ")";
                entity["eti_ProductCategory@odata.bind"] = "/eti_productcategories(" + pr.category + ")";
                entity["eti_name"] = "New Rule";
                Xrm.WebApi.createRecord("eti_productassociationrule", entity).then(
                    function success(result) {

                        createProduct(pr, result.id);
                        // perform operations on record creation
                    },
                    function(error) {
                        displayErrorMessage(error.message, "Error occured while creating rule!");
                        deleteEmptyRules();
                        // handle error conditions
                    }
                );

            }

            function deleteProduct(pr) {

            }

            function deleteEmptyRules() {

            }

            function getLeftFrameDataSource() {
                try {
                    var urlString = `/api/data/v9.1/productpricelevels?$select=amount,_transactioncurrencyid_value,_productid_value,_uomid_value&$expand=productid($select=productstructure,_eti_productcategory_value)&$filter=_pricelevelid_value eq PLGUID and _productid_value ne PRGUID and productid/productid ne null`;
                    var priceLevelId = Xrm.Page.getAttribute("eti_associatedpricelist").getValue()[0].id;
                    var currentProductID = formContext.data.entity.getId();
                    urlString = urlString.replace("PLGUID", priceLevelId);
                    urlString = urlString.replace("PRGUID", currentProductID);
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
                            }
                        },
                        schema: {
                            model: {
                                id: "_productid_value",
                                fields: {
                                    amount: "_amount",
                                    name: "_name",
                                    uom: "_uomId",
                                    currency: "_currencyId",
                                    currencyName: "_currencyName",
                                    category: "_categoryId",
                                    categoryName: "_categoryName"
                                }
                            },
                            parse: function(response) {
                                var services = [],
                                    result = response.value;
                                for (var i = 0; i < result.length; i++) {
                                    var service = {
                                        _amount: result[i].amount,
                                        _productid_value: result[i]["_productid_value"],
                                        _name: result[i]["_productid_value@OData.Community.Display.V1.FormattedValue"],
                                        _currencyId: result[i]["_transactioncurrencyid_value"],
                                        _currencyName: result[i]["_transactioncurrencyid_value@OData.Community.Display.V1.FormattedValue"],
                                        _categoryId: result[i].productid._eti_productcategory_value,
                                        _categoryName: result[i].productid["_eti_productcategory_value@OData.Community.Display.V1.FormattedValue"],
                                        _uomId: result[i]._uomid_value
                                    };
                                    if (result[i].productid.productstructure == 1)
                                        services.push(service);


                                }
                                return services;
                            }
                        },
                        group: {
                            field: "categoryName",
                            title: ""
                        },
                        serverGrouping: false,
                    }, );

                    if (debugMode) console.log(dataSource);
                    return dataSource;
                } catch (e) {
                    if (debugMode) console.log(e);
                    return null;
                }
            }
            //#endregion

            //#region rightgrid
            function initializeRightGrid() {
                rightGrid = $("#frame-right").kendoGrid({
                    dataSource: getRightFrameDataSource(),
                    groupable: false,
                    sortable: false,
                    selectable: "row",
                    height: 550,
                    scrollable: {
                        endless: true
                    },
                    pageable: {
                        numeric: false,
                        previousNext: false
                    },
                    dataBound: function() {
                        this.expandRow(this.tbody.find("tr.k-master-row"));
                    },
                    save: function(e) {
                        let entity = {};
                        var min, max;
                        if ('min' in e.values) {
                            min = e.values.min;
                            entity.eti_min = e.values.min;
                        } else {
                            min = e.model.min;
                        }
                        if ('max' in e.values) {
                            max = e.values.max;
                            entity.eti_max = e.values.max;
                        } else {
                            max = e.model.max;
                        }
                        if (!isNaN(min) && !isNaN(max))
                            if (min > max) {
                                displayErrorMessage("The minimum must be less than the maximum", "Can't update rule!");

                                $("#frame-right").data("kendoGrid").dataSource.cancelChanges();
                                e.preventDefault();
                            }
                        else {
                            Xrm.WebApi.updateRecord("eti_productassociationrule", e.model.productassociationruleid, entity).then(
                                function success(result) {
                                    console.log("Rule updated");


                                    // perform operations on record update
                                },
                                function(error) {

                                    displayErrorMessage(error.message, "Can't update rule!");

                                    $("#frame-right").data("kendoGrid").dataSource.cancelChanges();
                                    e.preventDefault();
                                    //refreshRightGrid();
                                    // handle error conditions
                                }
                            );
                        }
                    },
                    detailInit: detailInit,
                    editable: true,
                    columns: [{
                            field: "category",
                            title: "Category",
                            headerAttributes: {
                                style: "text-align: center; "
                            }
                        },
                        {
                            field: "categoryId",
                            title: "categoryId",
                            hidden: true,
                            headerAttributes: {
                                style: "text-align: center; "
                            }
                        },
                        {
                            field: "price",
                            title: "Price, $",
                            format: "{0:c}",
				            attributes: {
					            "class": "table-cell",
					            style: "text-align: right; "
			                },
                           
                        },
                        {
                            field: "min",
                            title: "Min",
                            headerAttributes: {
                                style: "text-align: center; "
                            }
                        },
                        {
                            field: "max",
                            title: "Max",
                            headerAttributes: {
                                style: "text-align: center; "
                            }
                        }

                    ]

                });
                rightGrid.find(".k-grid-toolbar").on("click", ".k-pager-minus", removeAll);
            }



            function removeAll() {
                var grid = $("#frame-right").data("kendoGrid");
                var selectedItem = grid.dataItem(grid.select());
                if (selectedItem != null) {
                    var associationsFetch = `<fetch>
                <entity name="productassociation" >
                <attribute name="eti_productassociationrule" />
                <filter>
                    <condition attribute="eti_productassociationrule" operator="eq" value="GUID" />
                </filter>
                </entity>
                </fetch>`;
                    associationsFetch = associationsFetch.replace("GUID", selectedItem.productassociationruleid);
                    associationsRequest = `?fetchXml=${encodeURIComponent(associationsFetch)}`;
                    Xrm.WebApi.retrieveMultipleRecords("productassociation", associationsRequest).then(
                        function success(result) {
                            for (var i = 0; i < result.entities.length; i++) {
                                console.log(result.entities[i]);
                            }
                            batchDeleteAssociations(result.entities, selectedItem.productassociationruleid);
                            // perform additional operations on retrieved records
                        },
                        function(error) {
                            console.log(error.message);
                            // handle error conditions
                        }
                    );
                    /*
                    $.when(
                        Xrm.WebApi.deleteRecord("eti_productassociationrule", selectedItem.productassociationruleid
                        
                    ))
                    .then(
                        function success(result) {
                            refreshRightGrid();
                            console.log("rollback performed!");
                        },
                        function(error) {
                        refreshRightGrid();
                        alert("oops! something went wrong");
                        }
                    );*/

                }

            }

            function batchDeleteAssociations(entities, parentId) {
                console.log("entities");
                console.log(entities);

                var data = [];
                data.push('--batch_123456');
                data.push('Content-Type: multipart/mixed;boundary=changeset_BBB456');
                data.push('');
                var i = 1;

                entities.forEach(function(e) {
                    data.push('--changeset_BBB456');
                    data.push('Content-Type:application/http');
                    data.push('Content-Transfer-Encoding:binary');
                    data.push('Content-ID:' + i);
                    i = i + 1;
                    data.push('');
                    data.push('DELETE ' + parent.Xrm.Page.context.getClientUrl() + '/api/data/v8.1/productassociations(' + e.productassociationid + ') HTTP/1.1');
                    data.push('Content-Type:application/json;type=entry');
                    data.push('');
                    data.push('{}');
                });
                data.push('--changeset_BBB456--');
                //end of batch
                data.push('--batch_123456--');
                var payload = data.join('\r\n');
                $.ajax({
                    method: 'POST',
                    url: parent.Xrm.Page.context.getClientUrl() + '/api/data/v8.1/$batch',
                    headers: {
                        'Content-Type': 'multipart/mixed;boundary=batch_123456',
                        'Accept': 'application/json',
                        'Odata-MaxVersion': '4.0',
                        'Odata-Version': '4.0'

                    },
                    data: payload,
                    async: false,
                    success: function(data, textStatus, xhr) {
                        Xrm.WebApi.deleteRecord("eti_productassociationrule", parentId).then(
                            function success(result) {
                                console.log("Rule deleted");
                                refreshRightGrid();
                            },
                            function(error) {
                                console.log(error.message);
                                refreshRightGrid();
                            }
                        );

                    },
                    error: function(xhr, textStatus, errorThrown) {
                        alert(textStatus + " " + errorThrown);
                    }
                });
            }

            function getRightFrameDataSource() {
                try {
                    var urlString = `/api/data/v9.1/eti_productassociationrules?$select=eti_min,eti_max,eti_price,_eti_productcategory_value,_eti_bundleproduct_value&$filter=_eti_bundleproduct_value eq GUID`;
                    var priceLevelId = Xrm.Page.getAttribute("eti_associatedpricelist").getValue()[0].id;
                    var currentProductID = formContext.data.entity.getId();
                    urlString = urlString.replace("GUID", currentProductID);
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
                            }
                        },
                        schema: {
                            model: {
                                id: "productassociationruleid",
                                fields: {
                                    price: {
                                        from: "_eti_price",
                                        type: "number"
                                    },
                                    min: {
                                        from: "_eti_min",
                                        type: "number"
                                    },
                                    max: {
                                        from: "_eti_max",
                                        type: "number"
                                    },
                                    category: {
                                        from: "_categoryName",
                                        editable: false
                                    },
                                    categoryId: {
                                        from: "_categoryId"
                                    }

                                }
                            },
                            parse: function(response) {
                                var services = [],
                                    result = response.value;
                                for (var i = 0; i < result.length; i++) {
                                    var service = {
                                        _eti_price: result[i].eti_price,
                                        _eti_min: result[i].eti_min,
                                        _eti_max: result[i].eti_max,
                                        _categoryName: result[i]["_eti_productcategory_value@OData.Community.Display.V1.FormattedValue"],
                                        _categoryId: result[i]["_eti_productcategory_value"],
                                        productassociationruleid: result[i]["eti_productassociationruleid"],

                                    };
                                    services.push(service);


                                }
                                return services;
                            }
                        },
                        serverGrouping: false,
                    }, );

                    if (debugMode) console.log(dataSource);
                    return dataSource;
                } catch (e) {
                    if (debugMode) console.log(e);
                    return null;
                }
            }
            //#endregion
            //#region detailGrid
            function detailInit(e) {
                var detailRow = e.detailRow;
                console.log(e.data);

                let childGrid = $('<div/>')
                    .appendTo($(e.detailCell))
                    .kendoGrid({
                        editable: true,
                        edit: function(e) {
                            console.log(e);
                        },
                        selectable: "row",
                        save: function(e) {
                            console.log(e);
                            let entity = {};
                            if ('price' in e.values) {
                                //check positive number
                                if (e.values.price < 0)
                                    displayErrorMessage("Price must be positive!", "Can't update Association!");

                                childGrid.data("kendoGrid").dataSource.cancelChanges();
                                e.preventDefault();

                            }


                            //if good, update
                            if ('price' in e.values)
                                entity.eti_price = e.values.price;
                            if ('requirementModeLabel' in e.values)

                            {
                                entity.eti_requirementmode = e.values.requirementModeLabel;
                                entity.productisrequired = (entity.eti_requirementmode == 964820000) ? 1 : 0;
                            }


                            Xrm.WebApi.updateRecord("productassociation", e.model.id, entity).then(
                                function success(result) {

                                    console.log("Rule updated");
                                    refreshRightGrid();

                                    // perform operations on record update
                                },
                                function(error) {
                                    displayErrorMessage(error.message, "Can't update Association!!");
                                    childGrid.data("kendoGrid").dataSource.cancelChanges();
                                    e.preventDefault();
                                    //refreshRightGrid();
                                    // handle error conditions
                                }
                            );




                            //find parent
                            //find kids
                            //recalculate price
                            //update 
                        },
                        
                        dataSource: buildDetailGridDataSource(e.data.productassociationruleid),
                        columns: [{
                                field: "productName",
                                title: "Product",
                                headerAttributes: {
                                    style: "text-align: center; "
                                }
                            },
                            {
                                field: "price",
                                title: "Price",
                                format: "{0:c}",
                                attributes: {
                                    "class": "table-cell",
                                    style: "text-align: right; "
                                },
                                headerAttributes: {
                                    style: "text-align: center; "
                                }
                            },
                            {
                                field: "associationRule",
                                hidden: true,
                                title: "Mode",
                                headerAttributes: {
                                    style: "text-align: center; "
                                }
                            },
                            {
                                field: " requirementMode",
                                hidden: true,
                                title: "Mode",
                                headerAttributes: {
                                    style: "text-align: center; "
                                }
                            },
                            {
                                field: "requirementModeLabel",
                                title: "Mode",
                                editor: modesDropDownEditor,
                                template: function(dataitem) {

                                    try {
                                        return associationModes.find(el => el.value == dataitem.requirementMode).label
                                    } catch (e) {
                                        return ""
                                    }
                                },

                                headerAttributes: {
                                    style: "text-align: center; "
                                },
                                attributes: {
                                    "class": "table-cell",
                                    style: "text-align: right; "
                                },
                            }
                        ]
                    });
                childGrid.find(".k-grid-toolbar").on("click", ".k-pager-minus", function(e) {

                    console.log(e);


                    var grid = childGrid.data("kendoGrid");
                    var selected = [];
                    grid.select().each(function() {
                        selected.push(grid.dataItem(this));
                    });
                    console.log("selected");
                    console.log(selected);
                    var select = grid.select();

                    var selectedItem = grid.dataItem(grid.select());
                    console.log(selectedItem);

                    Xrm.WebApi.deleteRecord("productassociation", selectedItem.id).then(
                        function success(result) {
                            deleteEmptyRule(selectedItem.associationRule);
                        },
                        function(error) {
                            displayErrorMessage(error.message, "Can't delete association!");

                        }
                    );


                    //batch delete rules
                });

                // localAssociations = associations
            }

            function deleteEmptyRule(id) {
                var associationsFetch = `<fetch>
                <entity name="productassociation" >
                <attribute name="eti_productassociationrule" />
                <filter>
                    <condition attribute="eti_productassociationrule" operator="eq" value="GUID" />
                </filter>
                </entity>
                </fetch>`;
                associationsFetch = associationsFetch.replace("GUID", id);
                associationsRequest = `?fetchXml=${encodeURIComponent(associationsFetch)}`;
                Xrm.WebApi.retrieveMultipleRecords("productassociation", associationsRequest).then(
                    function success(result) {
                        if (result.entities.length == 0)
                            Xrm.WebApi.deleteRecord("eti_productassociationrule", id).then(
                                function success(result) {
                                    console.log("Rule deleted");
                                    refreshRightGrid();
                                },
                                function(error) {
                                    console.log(error.message);
                                    refreshRightGrid();
                                }
                            );
                        else {
                            refreshRightGrid();
                        }
                        // perform additional operations on retrieved records
                    },
                    function(error) {
                        console.log(error.message);
                        // handle error conditions
                    }
                );
            }


            function buildDetailGridDataSource(ID) {
                try {
                    var urlString = `/api/data/v9.1/productassociations?$select=_productid_value,_associatedproduct_value,eti_price,_uomid_value,_eti_productassociationrule_value,eti_requirementmode&$filter=_eti_productassociationrule_value eq RULEID`;
                    var currentProductID = formContext.data.entity.getId();
                    urlString = urlString.replace("PRODID", currentProductID);
                    urlString = urlString.replace("RULEID", ID);
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
                            }
                        },
                        schema: {
                            model: {
                                id: "_productassociationid",
                                fields: {
                                    productName: {
                                        from: "_productName",
                                        editable: false
                                    },
                                    productId: "_productId",
                                    price: {
                                        from: "_price",
                                        type: "number",
                                        validation: {
                                            required: true,
                                        }
                                    },
                                    associationRule: "_associationrule",
                                    requirementModeLabel: "_requirementModeLabel",
                                    requirementMode: {
                                        from: "_requirementMode",
                                        validation: {
                                            required: true
                                        }
                                    }

                                }
                            },
                            parse: function(response) {
                                var services = [],
                                    result = response.value;
                                for (var i = 0; i < result.length; i++) {
                                    var service = {
                                        _associationrule: result[i]["_eti_productassociationrule_value"],
                                        _requirementMode: result[i].eti_requirementmode,
                                        _requirementModeLabel: result[i]["eti_requirementmode@OData.Community.Display.V1.FormattedValue"],
                                        _price: result[i].eti_price,
                                        _productId: result[i]["_associatedproduct_value"],
                                        _productName: result[i]["_associatedproduct_value@OData.Community.Display.V1.FormattedValue"],
                                        _productassociationid: result[i]["productassociationid"],

                                    };
                                    services.push(service);


                                }
                                return services;
                            }
                        },
                        serverGrouping: false,
                    });

                    if (debugMode) console.log(dataSource);
                    return dataSource;
                } catch (e) {
                    if (debugMode) console.log(e);
                    return null;
                }
            }

            function modesDropDownEditor(container, options) {

                var it = $('<input name="' + options.field + '" />')
                    .appendTo(container)
                    .kendoDropDownList({
                        valuePrimitive: true,
                        dataSource: buildModeDataSource(),
                        dataTextField: "label",
                        dataValueField: "value",
                    });

            }

            function buildModeDataSource() {
                var dataSource = new kendo.data.DataSource({
                    data: associationModes,
                    pageSize: 15,

                    schema: {
                        model: {
                            id: "value",
                            fields: {
                                label: {
                                    from: "label",
                                    validation: {
                                        required: true,
                                        productModeValidation: function(input) {

                                            return true;
                                        }
                                    }
                                }
                            }
                        }
                    }
                });
                console.log(dataSource);
                return dataSource;
            }

            ////#endregion