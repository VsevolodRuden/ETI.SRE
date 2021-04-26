                //#region dlobal variables
                if (parent.Xrm && parent.Xrm.Page) {
                    formContext = parent.Xrm.Page;
                    Xrm = parent.Xrm;
                }

                if (typeof GetGlobalContext !== "undefined") {
                    globalContext = GetGlobalContext();
                }
                var treeList;
                var currentProductID = formContext.data.entity.getId();

                var debugMode = true;
                var frameLeft, frameRight;
                var leftGrid;
                var rightGrid;
                var storedRules = [];

                var productDialog;

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

                $(document).ready(function() {
                    initialize();
                });

                function initialize() {
                    //kendo.ui.progress($(document.body),true)
                    initializeControls();
                }

                function initializeControls() {
                    treeList = $("#frame-right").kendoGrid({
                        dataSource: createBundleProductsDataSource(),
                        toolbar: kendo.template($("#template-active").html()),
                        editable: true,
                        save: function(e) {
                            updateInlineRow(e)
                        },
                        selectable: true,
                        height: 540,
                        columns: [{
                                field: "ruleId",
                                title: "Rule",
                                hidden: true,
                                groupHeaderTemplate: '<span class =  "catLabel" style = "min-width: 200px">#= storedRules.filter(el => el._ruleId == value)[0]._categoryName#</span><p class="p_medium"">Select from </p><input name="#=value#" id="#=uuidv4()#" class="numerictextbox numerictextbox-min" style="" /><p class="p_medium"">  to </p><input name="#=value#" id="#=uuidv4()#" class="numerictextbox numerictextbox-max" style="" /><p class="p_medium""> items</p>'
                            },
                            {
                                field: "productName",
                                title: "Product"
                            },
                            {
                                field: "eti_price",
                                title: "Price, $",
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
                                field: "requirementModeName",
                                title: "Mode",
                                editor: modesDropDownEditor,
                                template: function(dataitem) {

                                    try {
                                        return associationModes.find(el => el.value == dataitem.requirementModeValue).label
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
                            },
                            {
                                field: "glCode",
                                title: "GL code"
                            },
                            {
                                field: "chargeCode",
                                title: "Charge Code"
                            },


                        ],
                        dataBound: function(e) {
                            var firstCell = e.sender.element.find(".k-grouping-row td:first-child");

                            initializeInputsAfterGridLoad();
                        }
                    });
                    treeList.find(".k-grid-toolbar").on("click", ".k-pager-plus", addProduct);
                    treeList.find(".k-grid-toolbar").on("click", ".k-pager-delete", removeProduct);
                    treeList.find(".k-grid-toolbar").on("click", ".k-pager-refreshLeft", refresh);
                }

                function updateInlineRow(item) {
                    console.log("edit");
                    console.log(item);
                    var payload = {};
                    debugger;
                    if (item.values.eti_price) {
                        payload["eti_price"] = item.values.eti_price;
                    }
                    if (item.values.requirementModeName) {
                        payload["eti_requirementmode"] = parseInt(item.values.requirementModeName);
                    }
                    if (payload.eti_price || payload.eti_requirementmode) {
                        Xrm.WebApi.updateRecord("productassociation", item.model.id, payload).then(
                            function success(result) {
                                refresh();

                                // perform operations on record update
                            },
                            function(error) {
                                displayErrorMessage(error.message, "Can't update Association!!");
                                refresh();
                                e.preventDefault();

                                //refreshRightGrid();
                                // handle error conditions
                            }
                        );
                    }


                }

                function removeProduct() {
                    var grid = $("#frame-right").data("kendoGrid");
                    var selectedItem = grid.dataItem(grid.select());
                    console.log(selectedItem);
                    $.when(
                            Xrm.WebApi.deleteRecord("productassociation", selectedItem._productAssociationId

                            ))
                        .then(
                            function success(result) {

                                refresh();
                                //     findAndDeleteEmptyRules();
                            },
                            function(error) {
                                refresh();
                                //     findAndDeleteEmptyRules();                       
                                alert("oops! something went wrong");
                            }
                        );

                }

                function refresh() {
                    var grid = $("#frame-right").data("kendoGrid");
                    grid.dataSource.read();

                    grid.refresh();
                }

                function addProduct() {
                    console.log("add");
                    initializeDialog();

                    productDialog.data("kendoDialog").open();

                }

                function okClick() {
                    var grid = $("#frame-left").data("kendoGrid");
                    var selectedItem = grid.dataItem(grid.select());
                    var data = $("#frame-right").data("kendoGrid").dataSource;
                    console.log("selectedItem");
                    console.log(selectedItem);
                    console.log("data");
                    console.log(data);
                    if (data._data.filter(el => el.id == selectedItem.id).length == 0) {
                        var needToCreateRule = storedRules.filter(el => el._categoryId == selectedItem.category).length == 0;
                        if (needToCreateRule)
                            createRule(selectedItem);
                        else
                            createProduct(selectedItem, storedRules.filter(el => el._categoryId == selectedItem.category)[0]._ruleId);
                    } else
                        displayErrorMessage("This product is already assigned to bundle!", "Duplicate detected");


                }

                function createRule(pr) {
                    var entity = {};
                    entity["eti_BundleProduct@odata.bind"] = "/products(" + formContext.data.entity.getId().replace(/[{}]/g, "").toLowerCase() + ")";
                    entity["eti_ProductCategory@odata.bind"] = "/eti_productcategories(" + pr.category + ")";
                    entity["eti_name"] = "New Rule";
                    Xrm.WebApi.createRecord("eti_productassociationrule", entity).then(
                        function success(result) {
                            ;
                            console.log("requested rule created");
                            createProduct(pr, result.id);
                            // perform operations on record creation
                        },
                        function(error) {
                            displayErrorMessage(error.message, "Error occured while creating rule!");


                            refresh();
                            //     findAndDeleteEmptyRules();
                            // handle error conditions
                        }
                    );

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
                            refresh();
                        },
                        function(error) {
                            displayErrorMessage(error.message, "Can't associate product!");
                            $.when(
                                    Xrm.WebApi.deleteRecord("eti_productassociationrule", ruleId

                                    ))
                                .then(
                                    function success(result) {
                                        console.log("irrelevant rule deleted");
                                        refresh();
                                        //     findAndDeleteEmptyRules();
                                    },
                                    function(error) {
                                        refresh();
                                        alert("oops! something went wrong");
                                    }
                                );


                            //     findAndDeleteEmptyRules();
                        }
                    );

                }

                function initializeInputsAfterGridLoad() {
                    var inputs = treeList.find(".numerictextbox").kendoNumericTextBox({
                        format: "#",
                decimals: 0,
                        change: function onChange() {

                            var payload = null;
                            var needToUpdate = false;
                            debugger;
                            if (this.element.hasClass("numerictextbox-max")) {
                                if (this.value() != storedRules.filter(ru => ru._ruleId == this.element[0].name)[0].eti_max)
                                    payload = {
                                        eti_max: this.value()
                                    };
                                needToUpdate = true;
                            } else {
                                if (this.value() != storedRules.filter(ru => ru._ruleId == this.element[0].name)[0].eti_min)
                                    payload = {
                                        eti_min: this.value()
                                    };
                                needToUpdate = true;
                            }
                            if (needToUpdate) {
                                debugger;
                                $.when(
                                        Xrm.WebApi.updateRecord("eti_productassociationrule", this.element[0].name, payload

                                        ))
                                    .then(
                                        function success(result) {
                                            refresh();
                                        },
                                        function(error) {

                                            displayErrorMessage(error.message, "Unable to update Rule!");
                                            refresh();
                                        }
                                    );
                            }



                        }
                    });
                    console.log(inputs);

                    console.log(storedRules);
                    debugger;
                    for (i = 0; i < inputs.length; i++) {
                        if (inputs[i].classList.contains("numerictextbox-max")) {
                            if (storedRules.filter(ru => ru._ruleId == inputs[i].name)[0].eti_max)
                                $("#" + inputs[i].id).data("kendoNumericTextBox").value(storedRules.filter(ru => ru._ruleId == inputs[i].name)[0].eti_max);
                            else
                                $("#" + inputs[i].id).data("kendoNumericTextBox").value(null);
                        } else {
                            if (storedRules.filter(ru => ru._ruleId == inputs[i].name)[0].eti_min)
                                $("#" + inputs[i].id).data("kendoNumericTextBox").value(storedRules.filter(ru => ru._ruleId == inputs[i].name)[0].eti_min);
                            else
                                $("#" + inputs[i].id).data("kendoNumericTextBox").value(null);
                        }
                    }
                    $("#printBillDetails").kendoSwitch({
                        messages: {
                            checked: "Yes",
                            unchecked: "No"
                        },
                        chkecked: false
                        /*values.eti_creditbackforotc,
                                        change: function(e){ switchFlip(e, "eti_creditbackforotc")}*/
                    });

                }

                function createBundleProductsDataSource() {
                    console.log("associations source");



                    const bundleRulesAndAssociationsFetchXML = `<fetch>
                    <entity name="productassociation" >
                    <attribute name="eti_requirementmode" />
                    <attribute name="productid" />
                    <attribute name="associatedproduct" />
                    <attribute name="eti_price" />
                    <attribute name="eti_productassociationrule" />
                    <filter>
                        <condition attribute="productid" operator="eq" value="GUID" />
                    </filter>
                    <link-entity name="eti_productassociationrule" from="eti_productassociationruleid" to="eti_productassociationrule" >
                        <attribute name="eti_max" />
                        <attribute name="eti_productcategory" />
                        <attribute name="eti_min" />
                        <attribute name="eti_price" />
                    </link-entity>
                    <link-entity name="product" from="productid" to="associatedproduct" >
                        <attribute name="eti_glcode" />
                        <attribute name="eti_productcategory" />
                        <attribute name="eti_chargecode" />
                    </link-entity>
                    </entity>
                </fetch>`;
                    bundleRulesAndAssociationsRequest = `/api/data/v9.1/productassociations?fetchXml=${encodeURIComponent(bundleRulesAndAssociationsFetchXML.replace("GUID", currentProductID))}`;

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
                                id: "_productAssociationId",
                                fields: {
                                    eti_price: {
                                        from: "_eti_price",
                                        editable: true,
                                        type: "number",
                                        validation: {
                                            required: true,
                                        }
                                    },
                                    productName: {
                                        from: "_productName",
                                        editable: false
                                    },
                                    productId: {
                                        from: "_productId",
                                        editable: false
                                    },
                                    categoryName: {
                                        from: "_categoryName",
                                        editable: false
                                    },
                                    categoryId: {
                                        from: "_categoryId",
                                        editable: false
                                    },
                                    ruleId: {
                                        from: "_ruleId",
                                        editable: false
                                    },
                                    requirementModeName: {
                                        from: "_requirementModeName",
                                        editable: true
                                    },
                                    requirementModeValue: {
                                        from: "_requirementModeValue",
                                        editable: false
                                    },
                                    glCode: {
                                        from: "_glCode",
                                        editable: false
                                    },
                                    chargeCode: {
                                        from: "_chargeCode",
                                        editable: false
                                    },

                                }
                            },
                            parse: function(response) {

                                var services = [];
                                storedRules = [];
                                result = response.value;
                                for (var i = 0; i < result.length; i++) {

                                    var service = {
                                        _productAssociationId: result[i]["productassociationid"],
                                        _eti_price: result[i]["eti_price"],
                                        _productName: result[i]["_associatedproduct_value@OData.Community.Display.V1.FormattedValue"],
                                        _productId: result[i]["_associatedproduct_value"],
                                        _categoryName: result[i]["eti_productassociationrule1.eti_productcategory@OData.Community.Display.V1.FormattedValue"],
                                        _categoryId: result[i]["eti_productassociationrule1.eti_productcategory"],
                                        _ruleId: result[i]["_eti_productassociationrule_value"],
                                        _requirementModeName: result[i]["eti_requirementmode@OData.Community.Display.V1.FormattedValue"],
                                        _requirementModeValue: result[i]["eti_requirementmode"],
                                        _glCode: result[i]["product2.eti_glcode@OData.Community.Display.V1.FormattedValue"],
                                        _chargeCode: result[i]["product2.eti_chargecode"]
                                    };
                                    services.push(service);
                                    if (!storedRules.filter(el => el._ruleId == service._ruleId).length) {
                                        var newRule = {
                                            _ruleId: service._ruleId,
                                            eti_min: result[i]["eti_productassociationrule1.eti_min"],
                                            eti_max: result[i]["eti_productassociationrule1.eti_max"],
                                            _categoryName: service._categoryName,
                                            _categoryId: service._categoryId
                                        };
                                        storedRules.push(newRule);
                                    }


                                }
                                return services;
                            }
                        },
                        group: {
                            field: "ruleId",
                            title: ""
                        },
                    });
                    console.log(storedRules);
                    console.log(dataSource);
                    return dataSource;
                }


                function initializeLeftGrid() {
                    leftGrid = $("#frame-left").kendoGrid({
                        //toolbar: kendo.template($("#template-left").html()),
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
                                hidden: true,
                                headerAttributes: {
                                    style: "text-align: center; "
                                }
                            }

                        ],
                        dataBound: function(e) {}
                    });
                    //leftGrid.find(".k-grid-toolbar").on("click", ".k-pager-plus", addProductTobundle);
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

                function initializeDialog() {
                    productDialog = $("#productAssignmentDialog").kendoDialog({
                        width: "800px",
                        visible: true,
                        title: "Add products to bundle",
                        position: {
                            top: 100, // or "100px"

                        },
                        height: 750,
                        closable: true,
                        modal: true,
                        content: "<div id='frame-left'></div>",

                        initOpen: function(e) {
                            initializeLeftGrid();
                            console.log(formContext.data.entity.getId());
                        },
                        actions: [{
                                text: 'Cancel'
                            },
                            {
                                text: 'OK',
                                primary: true,
                                action: okClick
                            }
                        ]
                    });
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

                function uuidv4() {
                    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                        var r = Math.random() * 16 | 0,
                            v = c == 'x' ? r : (r & 0x3 | 0x8);
                        return v.toString(16);
                    });
                }

                ////#endregion