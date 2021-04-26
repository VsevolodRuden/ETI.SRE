            //import {Service} from './eti_BillingWellKnown.js';
            //import {ServiceCategory} from './eti_BillingWellKnown.js'
            var leftTree = $("#treeview-left").data("kendoTreeView");
            var rightTree = $("#treeview-right").data("kendoTreeView");
            let globalProducts = [];
            let globalPrices;
            var leftDataSource;
            var rightDataSource;
            var upDataSource;
            var downDataSource;
            var newAccountProducts;
            var newActiveAccountProducts;
            var newProducts;
            var newHistory;


            if (parent.Xrm && parent.Xrm.Page) {
                formContext = parent.Xrm.Page;
                Xrm = parent.Xrm;
            }

            if (typeof GetGlobalContext !== "undefined") {
                globalContext = GetGlobalContext();
            }

            $(document).ready(function() {

                var dialog = $("#dialog").kendoDialog({
                    width: "800px",
                    visible: false,
                    title: "Members",
                    closable: true,
                    modal: true,
                    content: "<div id='treelist'></div>",
                    actions: [{
                            text: 'Cancel'
                        },
                        {
                            text: 'OK'
                        }
                    ],
                    initOpen: function(e) {}
                });


                let accountId = formContext.data.entity.getId();
                var gotErrors = false;
                //retrieve acc pricelist type
                var accountBillingType = window.parent.Xrm.Page.getAttribute("eti_accountbillingtype").getValue();
                console.log(accountBillingType);
                //define field to look for
                var priceLevelId = null;
                if (accountBillingType == 964820000) {
                    //search for residental
                    if (Xrm.Page.getAttribute("eti_residentalpricelist") != null)
                        var priceLevelId = Xrm.Page.getAttribute("eti_residentalpricelist").getValue()[0].id;
                    else
                        gotErrors = "No Price List selected";
                } else if (accountBillingType == 964820001) {
                    //search for commercial
                    if (Xrm.Page.getAttribute("eti_commercialpricelist") != null)
                        var priceLevelId = Xrm.Page.getAttribute("eti_commercialpricelist").getValue()[0].id;
                    else
                        gotErrors = "No Price List selected";
                } else {
                    gotErrors = "Unknown Price List type";
                }
                //retrieve pricelist items
                if (gotErrors) {
                    priceLevelId = "00000000-0000-0000-0000-000000000000"
                }
                const accountProductsFetchXml = `<fetch>
                <entity name="eti_accountproduct" >
                <attribute name="eti_productstate" />
                <attribute name="eti_rateoverriden" />
                <attribute name="eti_oldquantity" />
                <attribute name="eti_quantity" />
                <attribute name="eti_newquantity" />
                <attribute name="eti_rate" />
                <attribute name="eti_newrate" />
                <attribute name="eti_oldrate" />
                <attribute name="eti_accountproductid" />
                <attribute name="eti_name" />          
                <attribute name="eti_amount" />    
                <attribute name="eti_effectivedate" />        
                <attribute name="eti_parentbundle" />        
                <filter>
                    <condition attribute="eti_account" operator="eq" value="GUID" />
                    
                </filter>
                <link-entity name="product" from="productid" to="eti_product" >
                    <attribute name="name"/>
                    <attribute name="productstructure"/>
                    <attribute name="productid" />
                    <link-entity name="eti_productcategory" from="eti_productcategoryid" to="eti_productcategory" >
                    <attribute name="eti_name"/>              
                    <attribute name="eti_productcategoryid" />
                    </link-entity>
                </link-entity>
                </entity>
            </fetch>`;
                console.log(accountId);
                accountProductsRequest = `?fetchXml=${encodeURIComponent(accountProductsFetchXml.replace("GUID", accountId))}`;
                //1eb25d6d-554e-ea11-a812-000d3a591248
                const productsFetchXml = `<fetch>
                    <entity name="productpricelevel" >
                    <attribute name="amount" />
                    <filter>
                        <condition attribute="pricelevelid" operator="eq" value="GUID" />
                    </filter>
                    <link-entity name="product" from="productid" to="productid" link-type="outer" >
                        <attribute name="name" />
                        <attribute name="eti_productcategory" />
                        <attribute name="productstructure" />
                        <attribute name="productid" />
                        <link-entity name="eti_productcategory" from="eti_productcategoryid" to="eti_productcategory" link-type="inner" >
                        <attribute name="eti_name" />
                        <attribute name="eti_productcategoryid" />
                        </link-entity>
                    </link-entity>
                    </entity>
                </fetch>`;

                productsRequest = `?fetchXml=${encodeURIComponent(productsFetchXml.replace("GUID", priceLevelId))}`;

                const historyFetchXml = `<fetch>
                    <entity name="eti_productassignmenthistoryitem" >
                    <filter>
                        <condition attribute="eti_account" operator="eq" value="GUID" />
                    </filter>
                    <attribute name="eti_oldamount" />
                    <attribute name="eti_amount" />
                    <attribute name="eti_newamount" />
                    <attribute name="eti_oldquantity" />
                    <attribute name="eti_quantity" />
                    <attribute name="eti_newquantity" />
                    <attribute name="eti_oldrate" />
                    <attribute name="eti_rate" />
                    <attribute name="eti_newrate" />
                    <attribute name="eti_operationdate" />
                    <attribute name="eti_operationdate" />
                    <attribute name="eti_event" /> 
                        <link-entity name="product" from="productid" to="eti_product" >
                            <attribute name="name"/>
                            <attribute name="productid" />
                                <link-entity name="eti_productcategory" from="eti_productcategoryid" to="eti_productcategory" >
                                    <attribute name="eti_name"/>              
                                    <attribute name="eti_productcategoryid" />
                                </link-entity>
                        </link-entity>

                    
                    </entity>
                </fetch>`;
                historyRequest = `?fetchXml=${encodeURIComponent(historyFetchXml.replace("GUID", accountId))}`;

                $.when(
                        Xrm.WebApi.retrieveMultipleRecords("eti_accountproduct", accountProductsRequest),
                        Xrm.WebApi.retrieveMultipleRecords("productpricelevel", productsRequest),
                        Xrm.WebApi.retrieveMultipleRecords("eti_productassignmenthistoryitem", historyRequest)
                    )
                    .then(function(accountProducts, products, history) {
                        globalPrices = transformResponseRecords(products.entities);
                        InitializeLists(accountProducts, products, history)
                    }, errorNotification);

                //retrieve pricelist items products
                //retrieve product categories
                //retrieve account products

            });

            function assignTextValuesForAccountProducts(accpr) {
                if (accpr.eti_productstate == 964820000)
                    accpr.stateText = "Active";
                if (accpr.eti_productstate == 964820001)
                    accpr.stateText = "Pending Add";
                if (accpr.eti_productstate == 964820002)
                    accpr.stateText = "Pending Change";
                if (accpr.eti_productstate == 964820003)
                    accpr.stateText = "Pending Remove";
            }

            function InitializeLists(accountProducts, products, history) {

                console.log(accountProducts);
                accountProducts.entities.forEach(accpr => assignTextValuesForAccountProducts(accpr));

                newAccountProducts = transformResponseRecords(accountProducts.entities);
                newActiveAccountProducts = transformResponseRecords(accountProducts.entities);
                newProducts = transformResponseRecords(products.entities);
                newHistory = transformResponseRecords(history.entities);
                console.log(newAccountProducts);
                console.log(newProducts);
                console.log(newHistory);
                leftDataSource = buildLeftGridDataSource(newProducts);
                rightDataSource = buildRightGridDataSource(newAccountProducts.filter(function(e) {
                    return !("_eti_parentbundle_value" in e)
                }));
                upDataSource = buildUpperGridDataSource(newAccountProducts.filter(function(e) {
                    return !("_eti_parentbundle_value" in e)
                }));
                downDataSource = buildBottomGridDataSource(newHistory);
                var upGrid = $("#frame-up").kendoGrid({
                    dataSource: upDataSource,
                    toolbar: kendo.template($("#template-up").html()),
                    groupable: false,
                    sortable: false,
                    height: 300,
                    scrollable: {
                        endless: true
                    },
                    pageable: {
                        numeric: false,
                        previousNext: false
                    },
                    editable: "inline",
                    columns: [{
                            selectable: true,
                            //  editable: true,
                            width: "50px"
                        },
                        {
                            field: "productName",
                            //  editable: false,
                            title: "Product",
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
                            field: "quantity",
                            //  editable: false,
                            title: "Quantity",
                            attributes: {
                                "class": "table-cell",
                                style: "text-align: right; "
                            },
                            headerAttributes: {
                                style: "text-align: center; "
                            }
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
                        },
                        {
                            field: "effectiveDate",
                            /* editor: function(container, options) {
                                            
                                var dateString = kendo.toString(options.model.OrderDate, "yyyy/MM/dd" );
                                
                                var $input = $("<input value="+ dateString +" />").appendTo(container);
                                                    $input.datepicker();
                            },*/
                            title: "Effective Date",
                            // editable: true,
                            format: "{0:MM/dd/yyyy}",
                            headerAttributes: {
                                style: "text-align: center; "
                            }
                        }

                        /*{
                            command: [{
                                name: "edit",
                                text: { edit: " ", update: " ", cancel: " " },
                            //visible: true
                            }]
                        }*/
                    ],
                    dataBound: function() {
                        var ds = this.dataSource;
                        this.element.find('tr.k-master-row').each(function() {
                            var row = $(this);
                            var data = ds.getByUid(row.data('uid'));
                            // this example will work if ReportId is null or 0 (if the row has no details)
                            console.log("hierarchy data");
                            console.log(data);
                            if (newAccountProducts.filter(el => el._eti_parentbundle_value == data.eti_accountproductid).length == 0) {
                                //row.find('.k-hierarchy-cell a').css({ opacity: 0.3, cursor: 'default', visible }).click(function(e) { e.stopImmediatePropagation(); return false; });
                                row.find('.k-hierarchy-cell a').remove();
                                row.find('.k-hierarchy-col a').remove();
                            }

                        });
                    },
                    detailInit: function(e) {
                        var detailRow = e.detailRow;
                        console.log("DATA DATA");
                        console.log(e.data);
                        // localAssociations = associations;

                        childGrid = $('<div/>')
                            .appendTo($(e.detailCell))
                            .kendoGrid({
                                editable: true,

                                dataSource: buildUpperGridDataSource(newAccountProducts.filter(el => el._eti_parentbundle_value == e.data.eti_accountproductid)),
                                columns: [{
                                        selectable: true,
                                        //  editable: true,
                                        width: "50px"
                                    },
                                    {
                                        field: "productName",
                                        //  editable: false,
                                        title: "Product",
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


                                    /*{
                                        command: [{
                                            name: "edit",
                                            text: { edit: " ", update: " ", cancel: " " },
                                        //visible: true
                                        }]
                                    }*/
                                ]
                            });



                    }

                });
                upGrid.find(".k-grid-toolbar").on("click", ".k-pager-edit", function(e) {
                    var grid = $("#frame-up").data("kendoGrid");
                    var selected = [];
                    grid.select().each(function() {
                        selected.push(grid.dataItem(this));
                    });

                    var logicalName = "eti_accountproduct";
                    selected.forEach(function(selectedRow) {
                        var payload = {
                            "eti_productstate": 964820005,
                            "eti_newquantity": selectedRow.quantity,
                            "eti_newrate": selectedRow.rate

                        };
                        Xrm.WebApi.updateRecord("eti_accountproduct", selectedRow.eti_accountproductid.replace(/[{}]/g, ""), payload).then(
                            function success(result) {
                                console.log("Account updated");
                                refreshRightGrid();
                                refreshUpperGrid();
                                // perform operations on record update
                            },
                            function(error) {
                                console.log(error.message);
                                // handle error conditions
                            }
                        );

                    });
                    e.preventDefault();
                    //leftGrid.data("kendoGrid").dataSource.read();
                });
                upGrid.find(".k-grid-toolbar").on("click", ".k-pager-close-outline", function(e) {
                    var grid = $("#frame-up").data("kendoGrid");
                    var selected = [];
                    grid.select().each(function() {
                        selected.push(grid.dataItem(this));
                    });

                    var logicalName = "eti_accountproduct";
                    selected.forEach(function(selectedRow) {
                        var payload = {
                            "eti_productstate": 964820006,
                            "eti_newquantity": selectedRow.quantity,
                            "eti_newrate": selectedRow.rate
                        };
                        Xrm.WebApi.updateRecord("eti_accountproduct", selectedRow.eti_accountproductid.replace(/[{}]/g, ""), payload).then(
                            function success(result) {
                                console.log("Account updated");
                                refreshRightGrid();
                                refreshUpperGrid();
                                // perform operations on record update
                            },
                            function(error) {
                                console.log(error.message);
                                // handle error conditions
                            }
                        );

                    });
                    e.preventDefault();
                    //leftGrid.data("kendoGrid").dataSource.read();
                });
                upGrid.find(".k-grid-toolbar").on("click", ".k-pager-refresh", function(e) {

                    refreshUpperGrid();
                    e.preventDefault();
                });

                var downGrid = $("#frame-down").kendoGrid({
                    dataSource: downDataSource,
                    toolbar: kendo.template($("#template-down").html()),
                    groupable: true,
                    sortable: false,
                    height: 300,
                    scrollable: {
                        endless: true
                    },
                    pageable: {
                        numeric: false,
                        previousNext: false
                    },
                    editable: false,
                    columns: [{
                            field: "eti_operationdate",
                            //  editable: false,
                            title: "Date",
                            format: "{0:MM/dd/yyyy}",
                            headerAttributes: {
                                style: "text-align: center; "
                            }
                        },
                        {
                            field: "eti_event",
                            //  editable: false,
                            title: "Event",
                            headerAttributes: {
                                style: "text-align: center; "
                            }
                        },
                        {
                            field: "eti_categoryname",
                            //  editable: false,
                            title: "Category",
                            headerAttributes: {
                                style: "text-align: center; "
                            }
                        },
                        {
                            field: "eti_productname",
                            //  editable: false,
                            title: "Product",
                            headerAttributes: {
                                style: "text-align: center; "
                            }
                        },
                        {
                            field: "eti_oldrate",
                            //  editable: false,
                            title: "Old Rate",
                            headerAttributes: {
                                style: "text-align: center; "
                            }
                        },
                        {
                            field: "eti_rate",
                            //  editable: false,
                            title: "Rate",
                            headerAttributes: {
                                style: "text-align: center; "
                            }
                        },
                        {
                            field: "eti_newrate",
                            //  editable: false,
                            title: "New Rate",
                            headerAttributes: {
                                style: "text-align: center; "
                            }
                        },
                        {
                            field: "eti_oldquantity",
                            //  editable: false,
                            title: "Old Quantity",
                            headerAttributes: {
                                style: "text-align: center; "
                            }
                        },
                        {
                            field: "eti_quantity",
                            //  editable: false,
                            title: "Quantity",
                            headerAttributes: {
                                style: "text-align: center; "
                            }
                        },
                        {
                            field: "eti_newquantity",
                            //  editable: false,
                            title: "New Quantity",
                            headerAttributes: {
                                style: "text-align: center; "
                            }
                        },
                        {
                            field: "eti_oldamount",
                            //  editable: false,
                            title: "Old Amount",
                            headerAttributes: {
                                style: "text-align: center; "
                            }
                        },
                        {
                            field: "eti_amount",
                            //  editable: false,
                            title: "Amount",
                            headerAttributes: {
                                style: "text-align: center; "
                            }
                        },
                        {
                            field: "eti_newamount",
                            //  editable: false,
                            title: "New Amount",
                            headerAttributes: {
                                style: "text-align: center; "
                            }
                        }

                    ]

                });
                downGrid.find(".k-grid-toolbar").on("click", ".k-pager-refresh", function(e) {

                    refreshBottonGrid();
                    e.preventDefault();
                });

                var leftGrid = $("#frame-left").kendoGrid({
                    dataSource: leftDataSource,
                    toolbar: kendo.template($("#template-left").html()),
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
                    editable: false,
                    columns: [
                        /*{
                                                selectable: "row",
                                                width: "50px"
                                            },*/
                        {
                            field: "name",
                            title: "Product",
                            headerAttributes: {
                                style: "text-align: center; "
                            }
                        },
                        {
                            field: "category",
                            hidden: true,
                            groupHeaderTemplate: "#= data.value #",
                            title: "Product Category",
                            headerAttributes: {
                                style: "text-align: center; "
                            }
                        },
                        {
                            field: "formattedAmount",
                            title: "Price",
                            width: "130px",
                            attributes: {
                                "class": "table-cell",
                                style: "text-align: right; "
                            },
                            headerAttributes: {
                                style: "text-align: center; "
                            }
                        },

                    ],
                    dataBound: function(e) {
                        var grid = $("#frame-left").data("kendoGrid");
                        grid.table.find(".k-grouping-row").each(function() {
                            grid.collapseGroup(this);
                        });
                    }
                });

                var grid = $("#frame-left").data("kendoGrid"),
                    gridRowOffset = grid.tbody.find("tr:first").offset();
                grid.table.kendoDraggable({
                    filter: "tbody > tr",
                    dragstart: function(e) {
                        // Add a margin to position correctly the tooltip under the pointer.
                        $("#dragTooltip").css("margin-left", e.clientX - gridRowOffset.left - 50);
                    },
                    hint: function(row) {

                        // Remove the old selection.
                        row.parent().find(".k-state-selected").each(function() {
                            $(this).removeClass("k-state-selected")
                        })

                        // Add the selected class to the current row.
                        row.addClass("k-state-selected");

                        var dataItem = grid.dataItem(row);
                        var tooltipHtml = '<div class="k-grid k-widget" style="background-color: DarkOrange; color: black;"><table><tbody><tr>' + row.html() + '</tr></tbody></table></div>';

                        return tooltipHtml;
                    }
                });

                function checkAssignmentDuplicates(id) {
                    var right = $("#frame-right").data("kendoGrid")._data;
                    var up = $("#frame-up").data("kendoGrid")._data;
                    console.log(id);
                    console.log(right);
                    console.log(up);
                    return (right.filter(en => en.product1_productid == id).length > 0 || up.filter(en => en.product1_productid == id).length > 0)
                }



                leftGrid.find(".k-grid-toolbar").on("click", ".k-pager-plus", function(e) {
                    e.preventDefault();
                    var bundleassignment = false;
                    var grid = $("#frame-left").data("kendoGrid");
                    var selected = [];
                    grid.select().each(function() {
                        selected.push(grid.dataItem(this));
                    });
                    console.log(selected);
                    var conflicts = [];
                    var bundleCollision = false;

                    var id = formContext.data.entity.getId();

                    var logicalName = "eti_accountproduct";
                    //if(selected.filter(sel => sel.product1_productstructure==3).length>0)
                    selected.forEach(function(selectedRow) {
                        if (checkAssignmentDuplicates(selectedRow.product1_productid.replace(/[{}]/g, "\""))) {
                            conflicts.push(selectedRow.name);
                        }

                    });
                    if (typeof conflicts !== 'undefined' && conflicts.length > 0) {
                        var dialog = $('#dialog'),
                            undo = $("#undo");
                        var contentString = "<strong>Following product(s) already assigned to user</strong>";
                        conflicts.forEach(con => contentString = contentString + "<p>" + con);
                        dialog.kendoDialog({
                            width: "450px",
                            title: "Duplicate detected",
                            closable: false,
                            modal: false,
                            content: contentString,
                            actions: [{
                                text: 'Ok'
                            }]
                        });
                        dialog.data("kendoDialog").open();
                        console.log(conflicts);
                        return;
                    }


                    if (selected.filter(sel => sel.product1_productstructure == 3).length > 0) {
                        bundleassignment = true;
                        if (selected.length > 1) {
                            var dialog = $('#dialog'),
                                undo = $("#undo");
                            var contentString = "<strong>Bundles must be added separately!</strong>";
                            dialog.kendoDialog({
                                width: "450px",
                                title: "Can't assign produccts!",
                                closable: false,
                                modal: false,
                                content: contentString,
                                actions: [{
                                    text: 'Ok'
                                }]
                            });
                            dialog.data("kendoDialog").open();
                            console.log(conflicts);
                            return;
                        }

                    }

                    if (bundleassignment) {

                        //execute fetch

                        var rulesFetchXML = `<fetch>
                        <entity name="product" >
                        <attribute name="name" />
                        <filter>
                            <condition attribute="productid" operator="eq" value="GUID" />
                        </filter>
                        <link-entity name="eti_productassociationrule" from="eti_bundleproduct" to="productid" >
                            <attribute name="eti_productassociationruleid" />
                            <attribute name="eti_min" />
                            <attribute name="eti_max" />
                            <attribute name="eti_productcategory" />
                        </link-entity>
                        </entity>
                    </fetch>`;
                        rulesFetchXML = rulesFetchXML.replace("GUID", selected[0].product1_productid.replace(/[{}]/g, ""));
                        rulesRequest = `?fetchXml=${encodeURIComponent(rulesFetchXML)}`;
                        var associationsFetchXML = `<fetch>
                        <entity name="product" >
                        <filter>
                            <condition attribute="productid" operator="eq" value="GUID" />
                        </filter>
                        <link-entity name="productassociation" from="productid" to="productid" >
                            <attribute name="eti_productassociationrule" />
                            <attribute name="eti_price" />
                            <attribute name="eti_requirementmode" />
                            <link-entity name="product" from="productid" to="associatedproduct" >
                            <attribute name="name" alias="associatedName" />
                            <attribute name="productid" alias="prID" />
                            </link-entity>
                        </link-entity>
                        </entity>
                    </fetch>`;
                        associationsFetchXML = associationsFetchXML.replace("GUID", selected[0].product1_productid.replace(/[{}]/g, ""));
                        associationsRequest = `?fetchXml=${encodeURIComponent(associationsFetchXML)}`;




                        $.when(
                                Xrm.WebApi.retrieveMultipleRecords("product", rulesRequest),
                                Xrm.WebApi.retrieveMultipleRecords("product", associationsRequest)
                            )
                            .then(function(rulesResponse, associationsResponse) {

                                //builddatasources
                                let rules = transformResponseRecords(rulesResponse.entities);
                                let rulesCopy = rules;
                                let associations = transformResponseRecords(associationsResponse.entities);
                                let associationsCopy = associations;


                                console.log("bundles");

                                //then disdplay stuff
                                var bundleAssignmentDialog = $("#bundleAssignmentDialog").kendoDialog({
                                    width: "800px",
                                    visible: true,
                                    title: "Members",
                                    closable: true,
                                    modal: false,
                                    content: "<div id='defaultList'></div><div id='optionalList'></div>",

                                    initOpen: function(e) {
                                        console.log("btnID");
                                        console.log(selected);
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
                                let defaultrules = rules.filter(function(ru) {
                                    return associations.filter(function(el) {
                                        return ((el.productassociation1_eti_productassociationrule == ru.eti_productassociationrule1_eti_productassociationruleid) && (el.productassociation1_eti_requirementmode == 964820000));

                                    }).length > 0;

                                });
                                var defaultgrid = $("#defaultList").kendoGrid({
                                    dataSource: buildRulesDatasource(defaultrules),
                                    dataBound: function() {
                                        this.expandRow(this.tbody.find("tr.k-master-row"));

                                    },
                                    toolbar: kendo.template("<div class='requiredListHeader'>Required Products</div>"),
                                    groupable: false,
                                    sortable: false,
                                    selectable: "row",
                                    height: 350,
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
                                            title: "Product Categoty",
                                            headerAttributes: {
                                                style: "text-align: center; "
                                            }
                                        }

                                    ],
                                    detailInit: function(e) {
                                        var detailRow = e.detailRow;
                                        console.log("DATA DATA");
                                        console.log(e.data);
                                        let defaultAssociations = associations.filter(function(el) {
                                            return ((el.productassociation1_eti_productassociationrule == e.data.eti_productassociationrule1_eti_productassociationruleid) && (el.productassociation1_eti_requirementmode == 964820000));
                                        });

                                        childGrid = $('<div/>')
                                            .appendTo($(e.detailCell))
                                            .kendoGrid({
                                                editable: false,

                                                dataSource: buildBundleAssociationsDataSource(defaultAssociations),
                                                columns: [

                                                    {

                                                        field: "name",
                                                        //  editable: false,
                                                        title: "Product",
                                                        width: "250px",
                                                        headerAttributes: {
                                                            style: "text-align: center; "
                                                        }
                                                    },
                                                    //rate, rateoverr, effective, newquant

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
                                                    }
                                                ]
                                            });



                                    }
                                });
                                let optionalrules = rulesCopy.filter(function(ru) {
                                    return associationsCopy.filter(function(el) {
                                        return ((el.productassociation1_eti_productassociationrule == ru.eti_productassociationrule1_eti_productassociationruleid) && ((el.productassociation1_eti_requirementmode == 964820001) || (el.productassociation1_eti_requirementmode == 964820002)));

                                    }).length > 0;

                                });
                                let optionalGrid = $("#optionalList").kendoGrid({
                                    dataSource: buildRulesDatasource(optionalrules),
                                    dataBound: function() {
                                        this.expandRow(this.tbody.find("tr.k-master-row"));




                                    },
                                    toolbar: kendo.template("<div class='optionalListHeader'>Optional Products</div>"),

                                    groupable: false,
                                    sortable: false,
                                    selectable: "row",
                                    height: 350,
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
                                            title: "Product Categoty",
                                            headerAttributes: {
                                                style: "text-align: center; "
                                            }
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
                                        },

                                    ],
                                    detailInit: function(e) {
                                        var detailRow = e.detailRow;
                                        console.log("DATA DATA");
                                        console.log(e.data);
                                        let optionalAssociations = associationsCopy.filter(function(el) {
                                            return ((el.productassociation1_eti_productassociationrule == e.data.eti_productassociationrule1_eti_productassociationruleid) && ((el.productassociation1_eti_requirementmode == 964820001) || (el.productassociation1_eti_requirementmode == 964820002)));
                                        });

                                        childGrid = $('<div/>')
                                            .appendTo($(e.detailCell))
                                            .kendoGrid({
                                                editable: false,

                                                dataSource: buildBundleAssociationsDataSource(optionalAssociations),
                                                dataBound: function(e) {
                                                    var grid = e.sender;
                                                    $.each(grid.tbody.find('tr'), function() {
                                                        var model = grid.dataItem(this);
                                                        if (model.mode == 964820001) {
                                                            grid.select(this);
                                                        }
                                                    });
                                                },
                                                columns: [{
                                                        selectable: true,
                                                        //  editable: true,
                                                        width: "50px",
                                                        headerAttributes: {
                                                            style: "text-align: center; "
                                                        }
                                                    },
                                                    {
                                                        field: "name",
                                                        //  editable: false,
                                                        title: "Product",
                                                        width: "250px",
                                                        headerAttributes: {
                                                            style: "text-align: center; "
                                                        }
                                                    },
                                                    //rate, rateoverr, effective, newquant

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
                                                    }
                                                ]
                                            });



                                    }
                                });

                                function okClick() {
                                    var error = "";
                                    console.log("break here");
                                    console.log(defaultgrid.data("kendoGrid"));
                                    console.log(optionalGrid.data("kendoGrid"));
                                    var masterGrid = optionalGrid.data("kendoGrid");
                                    var detailRows = masterGrid.element.find(".k-detail-row");
                                    var selected = [];
                                    console.log("grid");
                                    console.log(masterGrid);
                                    for (var i = 0; i < detailRows.length; i++) {
                                        var detailGrid = $(detailRows[i]).find(".k-grid").data("kendoGrid");
                                        console.log(detailGrid.dataSource.view());

                                        detailGrid.select().each(function() {
                                            selected.push(detailGrid.dataItem(this));
                                        });


                                    }
                                    masterGrid = defaultgrid.data("kendoGrid");
                                    detailRows = masterGrid.element.find(".k-detail-row");
                                    for (var i = 0; i < detailRows.length; i++) {
                                        var detailGrid = $(detailRows[i]).find(".k-grid").data("kendoGrid");
                                        detailGrid.dataSource.data().forEach(el => selected.push(el));
                                    }
                                    console.log("selected");
                                    console.log(selected);
                                    validateProductCategories(selected)

                                    if (error == "") {
                                        var amount = 0;
                                        selected.forEach(el => amount += el.price);
                                        var grid = $("#frame-left").data("kendoGrid");
                                        var selectedRow = [];
                                        grid.select().each(function() {
                                            selectedRow.push(grid.dataItem(this));
                                        });
                                        $.when(Xrm.WebApi.createRecord("eti_accountproduct", {
                                            "eti_name": selectedRow[0].name + " for " + window.parent.Xrm.Page.getAttribute("name").getValue(),
                                            "eti_Account@odata.bind": "/accounts(" +  formContext.data.entity.getId().replace(/[{}]/g, "") + ")",
                                            "eti_quantity": 0,
                                            "eti_newquantity": 1,
                                            "eti_oldquantity": 0,
                                            "eti_productstate": 964820004,
                                            "eti_oldrate": 0,
                                            "eti_newrate": amount,
                                            "eti_rate": 0,
                                            "eti_rateoverriden": false,
                                            "eti_amount": amount,
                                            "eti_Product@odata.bind": "/products(" + selectedRow[0].product1_productid.replace(/[{}]/g, "") + ")"
                                        })).then(
                                            function success(result) {
                                                //console.log("eti_accountproduct created with ID: " + result.id);
                                                var grid = $("#frame-left").data("kendoGrid");
                                                // select the first table row
                                                var parentrecordid = result.id;
                                                var associationsEntities = [];
                                                selected.forEach(function(e) {
                                                    var entity = {};

                                                    entity["eti_name"] = e.name + " for " + window.parent.Xrm.Page.getAttribute("name").getValue(),
                                                        entity["eti_Account@odata.bind"] = "/accounts(" +  formContext.data.entity.getId().replace(/[{}]/g, "") + ")";
                                                    entity["eti_quantity"] = 0;
                                                    entity["eti_newquantity"] = 1;
                                                    entity["eti_oldquantity"] = 0;
                                                    entity["eti_productstate"] = 964820004;
                                                    entity["eti_oldrate"] = 0;
                                                    entity["eti_newrate"] = e.price;
                                                    entity["eti_rate"] = 0;
                                                    entity["eti_rateoverriden"] = false;
                                                    entity["eti_amount"] = e.price;
                                                    entity["eti_Product@odata.bind"] = "/products(" + e.associatedProductId.replace(/[{}]/g, "") + ")";
                                                    entity["eti_ParentBundle@odata.bind"] = "/eti_accountproducts(" + parentrecordid.replace(/[{}]/g, "") + ")";

                                                    var body = JSON.stringify(entity);
                                                    associationsEntities.push(body);
                                                });
                                                var data = [];
                                                data.push('--batch_123456');
                                                data.push('Content-Type: multipart/mixed;boundary=changeset_BBB456');
                                                data.push('');

                                                for (var i = 0; i < associationsEntities.length; i++) {
                                                    data.push('--changeset_BBB456');
                                                    data.push('Content-Type:application/http');
                                                    data.push('Content-Transfer-Encoding:binary');
                                                    var id = i + 1;
                                                    data.push('Content-ID:' + id);
                                                    data.push('');
                                                    data.push('POST ' + parent.Xrm.Page.context.getClientUrl() + '/api/data/v8.1/eti_accountproducts HTTP/1.1');

                                                    data.push('Content-Type:application/json;type=entry');
                                                    data.push('');
                                                    data.push(associationsEntities[i]);
                                                }
                                                data.push('--changeset_BBB456--');
                                                data.push('--batch_123456--');
                                                var payload = data.join('\r\n');
                                                console.log(payload);

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


                                                        grid.clearSelection();
                                                        refreshRightGrid();
                                                        var currentDuialog = $("#bundleAssignmentDialog").data("kendoDialog");
                                                        currentDuialog.close();


                                                    },
                                                    error: function(xhr, textStatus, errorThrown) {
                                                        console.log("error");
                                                        console.log(errorThrown, textStatus, xhr);
                                                        $.when(
                                                            Xrm.WebApi.deleteRecord("eti_accountproduct", parentrecordid.replace(/[{}]/g, "")
                                                            
                                                        ))
                                                        .then(
                                                            function success(result) {
                                                                console.log("rollback performed!");
                                                            },
                                                            function(error) {
                                                               alert("oops! something went wrong");
                                                            }
                                                        );
                                                    }
                                                });

                                                // perform operations on record creation
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

                                    } else {

                                    }
                                }


                                bundleAssignmentDialog.data("kendoDialog").open();
                            }, errorNotification);
                    } else {
                        selected.forEach(function(selectedRow) {
                            if (checkAssignmentDuplicates(selectedRow.product1_productid.replace(/[{}]/g, "\""))) {
                                conflicts.push(selectedRow.name);
                            } else {
                                console.log(selectedRow);
                                Xrm.WebApi.createRecord("eti_accountproduct", {
                                    "eti_name": selectedRow.name + " for " + window.parent.Xrm.Page.getAttribute("name").getValue(),
                                    "eti_Account@odata.bind": "/accounts(" + id.replace(/[{}]/g, "") + ")",
                                    "eti_quantity": 0,
                                    "eti_newquantity": 1,
                                    "eti_oldquantity": 0,
                                    "eti_productstate": 964820004,
                                    "eti_oldrate": 0,
                                    "eti_newrate": selectedRow.amount,
                                    "eti_rate": 0,
                                    "eti_rateoverriden": false,
                                    "eti_amount": selectedRow.amount,
                                    "eti_Product@odata.bind": "/products(" + selectedRow.product1_productid.replace(/[{}]/g, "") + ")"
                                }).then(
                                    function success(result) {
                                        //console.log("eti_accountproduct created with ID: " + result.id);
                                        var grid = $("#frame-left").data("kendoGrid");
                                        // select the first table row

                                        grid.clearSelection();
                                        refreshRightGrid();
                                        // perform operations on record creation
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
                        });
                    }




                    //leftGrid.data("kendoGrid").dataSource.read();
                });

                var rightGrid = $("#frame-right").kendoGrid({
                    dataSource: rightDataSource,
                    toolbar: kendo.template($("#template-right").html()),
                    groupable: false,
                    sortable: false,
                    height: 550,
                    scrollable: {
                        endless: true
                    },
                    pageable: {
                        numeric: false,
                        previousNext: false
                    },
                    editable: "inline",
                    columns: [{
                            selectable: true,
                            //  editable: true,
                            width: "50px",
                            headerAttributes: {
                                style: "text-align: center; "
                            }
                        },
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
                            title: "New Rate",
                            attributes: {
                                "class": "table-cell",
                                style: "text-align: right; "
                            },
                            headerAttributes: {
                                style: "text-align: center; "
                            }
                        },
                        {
                            field: "rateOverriden",
                            template: '<input type="checkbox" #= rateOverriden ? "checked=checked" : "" # disabled="disabled" ></input>',
                            title: "Overriden",
                            attributes: {
                                "class": "table-cell",
                                style: "text-align: center; "
                            },
                            headerAttributes: {
                                style: "text-align: center; "
                            }
                        },
                        // { command: { text: " ", iconClass: "k-icon eti-command-reset k-i-reset", click: resetPrice , title: "Reset", width: "30px" }},

                        {
                            field: "newQuantity",
                            // editable: true,
                            title: "New Quantity",
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
                            template: "<span class='amountSpan'>#= newQuantity ? kendo.format(\"{0:c} \",newQuantity*newRate) : kendo.format(\"{0:c}\",quantity * newRate )#</span>",

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
                            /* editor: function(container, options) {
                                            
                                var dateString = kendo.toString(options.model.OrderDate, "yyyy/MM/dd" );
                                
                                var $input = $("<input value="+ dateString +" />").appendTo(container);
                                                    $input.datepicker();
                            },*/
                            title: "Effective Date",
                            // editable: true,
                            format: "{0:MM/dd/yyyy}",
                            headerAttributes: {
                                style: "text-align: center; "
                            }
                        },
                        {
                            field: "formattedState",
                            // editable: false,
                            title: "Status",
                            headerAttributes: {
                                style: "text-align: center; "
                            }
                        },
                        {
                            command: [{
                                name: "Custom",
                                width: "em",
                                visible: function(dataItem) {
                                    return (newAccountProducts.filter(el => el._eti_parentbundle_value == dataItem.eti_accountproductid).length > 0);
                                },
                                click: function(e) {
                                    var dataItem = this.dataItem($(e.currentTarget).closest("tr"));
                                    console.log("dataItem");
                                    console.log(dataItem);

                                    var dialog = $("#dialog").kendoDialog({
                                        width: "800px",
                                        visible: true,
                                        title: "Members",
                                        closable: true,
                                        modal: false,
                                        content: "<div id='treelist'></div>",
                                        actions: [{
                                                text: 'Cancel'
                                            },
                                            {
                                                text: 'OK',
                                                primary: true
                                            }
                                        ]
                                    });
                                    $("#dialog").data("kendoDialog").open();
                                }

                            }, {
                                name: "edit",
                                visible: function(dataItem) {
                                    return (newAccountProducts.filter(el => el._eti_parentbundle_value == dataItem.eti_accountproductid).length == 0);
                                },
                                width: "em",
                                text: {
                                    edit: " ",
                                    update: " ",
                                    cancel: " "
                                }
                            }]
                        }

                        /*{
                            command: [{
                                name: "edit",
                                text: { edit: " ", update: " ", cancel: " " },
                            //visible: true
                            }]
                        }*/
                    ],
                    save: function(e) {
                        console.log("save");
                        var changes = {};
                        console.log(e);
                        // console.log(globalPrices);
                        var product = globalPrices.filter(gp => gp.product1_productid == e.model.product1_productid);
                        console.log(product);
                        var payload;
                        console.log()
                        if (product[0].amount != e.model.newRate) {
                            payload = {
                                "eti_amount": e.model.amount,
                                "eti_quantity": e.model.quantity,
                                "eti_newquantity": e.model.newQuantity,
                                "eti_effectivedate": e.model.effectiveDate,
                                "eti_newrate": e.model.newRate,
                                "eti_rateoverriden": true
                            }

                        } else {
                            payload = {
                                "eti_amount": e.model.amount,
                                "eti_quantity": e.model.quantity,
                                "eti_newquantity": e.model.newQuantity,
                                "eti_effectivedate": e.model.effectiveDate,
                                "eti_newrate": e.model.newRate
                            }
                        }
                        console.log(payload);
                        Xrm.WebApi.updateRecord("eti_accountproduct", e.model.eti_accountproductid.replace(/[{}]/g, ""), payload).then(
                            function success(result) {
                                console.log("Account updated");
                                refreshRightGrid();
                                refreshUpperGrid();
                                // perform operations on record update
                            },
                            function(error) {
                                console.log(error.message);
                                // handle error conditions
                            }
                        );


                    },
                    edit: function(e) {

                        console.log("edit called");
                        console.log(e);
                        if (newAccountProducts.filter(el => el._eti_parentbundle_value == e.model.eti_accountproductid).length > 0) {
                            console.log("bundle edit!");
                            e.preventDefault();
                            return;
                        } else {
                            var data = {};
                            console.log("RDS");
                            console.log(rightDataSource);
                        }
                        /*
                        Xrm.WebApi.updateRecord("eti_accountproduct", e.eti_accountproductid, data).then(
                            function success(result) {
                                console.log("Account priduct updated");
                            },
                            function(error) {
                                console.log(error.message);
                                // handle error conditions
                            });*/

                        //e.preventDefault();
                    },
                    cancel: function(e) {
                        //e.preventDefault()
                    },
                    dataBound: function() {
                        var ds = this.dataSource;
                        this.element.find('tr.k-master-row').each(function() {
                            var row = $(this);
                            var data = ds.getByUid(row.data('uid'));
                            // this example will work if ReportId is null or 0 (if the row has no details)
                            console.log("hierarchy data");
                            console.log(data);
                            if (newAccountProducts.filter(el => el._eti_parentbundle_value == data.eti_accountproductid).length == 0) {
                                //row.find('.k-hierarchy-cell a').css({ opacity: 0.3, cursor: 'default', visible }).click(function(e) { e.stopImmediatePropagation(); return false; });
                                row.find('.k-hierarchy-cell a').remove();
                                row.find('.k-hierarchy-col a').remove();
                            }

                        });

                    },
                    detailInit: function(e) {
                        var detailRow = e.detailRow;
                        console.log("DATA DATA");
                        console.log(e.data);
                        // localAssociations = associations;

                        childGrid = $('<div/>')
                            .appendTo($(e.detailCell))
                            .kendoGrid({
                                editable: "inline",

                                dataSource: buildRightGridDataSource(newAccountProducts.filter(el => el._eti_parentbundle_value == e.data.eti_accountproductid)),
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
                                        title: "New Rate",
                                        attributes: {
                                            "class": "table-cell",
                                            style: "text-align: right; "
                                        },
                                        headerAttributes: {
                                            style: "text-align: center; "
                                        }
                                    },
                                    {
                                        field: "rateOverriden",
                                        template: '<input type="checkbox" #= rateOverriden ? "checked=checked" : "" # disabled="disabled" ></input>',
                                        title: "Overriden",
                                        attributes: {
                                            "class": "table-cell",
                                            style: "text-align: center; "
                                        },
                                        headerAttributes: {
                                            style: "text-align: center; "
                                        }
                                    },
                                    // { command: { text: " ", iconClass: "k-icon eti-command-reset k-i-reset", click: resetPrice , title: "Reset", width: "30px" }},


                                    {
                                        command: [{
                                            name: "edit",
                                            text: {
                                                edit: " ",
                                                update: " ",
                                                cancel: " "
                                            },
                                            //visible: true
                                        }]
                                    }
                                ],
                    save: function(e) {
                        console.log("save");
                        var changes = {};
                        console.log(e);
                        // console.log(globalPrices);
                        var product = globalPrices.filter(gp => gp.product1_productid == e.model.product1_productid);
                        console.log(product);
                        var payload;
                        console.log()
                        if (product[0].amount != e.model.newRate) {
                            payload = {
                                "eti_amount": e.model.amount,
                                "eti_quantity": e.model.quantity,
                                "eti_newquantity": e.model.newQuantity,
                                "eti_effectivedate": e.model.effectiveDate,
                                "eti_newrate": e.model.newRate,
                                "eti_rateoverriden": true
                            }

                        } else {
                            payload = {
                                "eti_amount": e.model.amount,
                                "eti_quantity": e.model.quantity,
                                "eti_newquantity": e.model.newQuantity,
                                "eti_effectivedate": e.model.effectiveDate,
                                "eti_newrate": e.model.newRate
                            }
                        }
                        console.log(payload);
                        Xrm.WebApi.updateRecord("eti_accountproduct", e.model.eti_accountproductid.replace(/[{}]/g, ""), payload).then(
                            function success(result) {
                                console.log("Account updated");
                              
                                // perform operations on record update
                            },
                            function(error) {
                                console.log(error.message);
                                // handle error conditions
                            }
                        );


                    },
                    edit: function(e) {

                        console.log("edit called");
                        console.log(e);
                        if (newAccountProducts.filter(el => el._eti_parentbundle_value == e.model.eti_accountproductid).length > 0) {
                            console.log("bundle edit!");
                            e.preventDefault();
                            return;
                        } else {
                            var data = {};
                            console.log("RDS");
                            console.log(rightDataSource);
                        }
                        /*
                        Xrm.WebApi.updateRecord("eti_accountproduct", e.eti_accountproductid, data).then(
                            function success(result) {
                                console.log("Account priduct updated");
                            },
                            function(error) {
                                console.log(error.message);
                                // handle error conditions
                            });*/

                        //e.preventDefault();
                    },
                    cancel: function(e) {
                        //e.preventDefault()
                    },
                            });



                    }



                });
                rightGrid.find(".k-grid-toolbar").on("click", ".resetPrice", function(e) {
                    var rg = $("#frame-right").data("kendoGrid");
                    var selected = [];
                    rg.select().each(function() {
                        selected.push(rg.dataItem(this));
                    });
                    console.log(selected);

                    selected.forEach(function(selectedRow) {

                        var productId = selectedRow.product1_productid;
                        var product = globalPrices.filter(gp => gp.product1_productid == productId);
                        if (product[0].amount != selectedRow.rate) {
                            var payload = {
                                "eti_amount": product[0].amount * selectedRow.newQuantity,
                                "eti_quantity": selectedRow.quantity,
                                "eti_newquantity": selectedRow.newQuantity,
                                "eti_effectivedate": selectedRow.effectiveDate,
                                "eti_newrate": product[0].amount,
                                "eti_rateoverriden": false
                            }
                            Xrm.WebApi.updateRecord("eti_accountproduct", selectedRow.eti_accountproductid.replace(/[{}]/g, ""), payload).then(
                                function success(result) {
                                    console.log("Account updated");

                                    // perform operations on record update
                                },
                                function(error) {
                                    console.log(error.message);
                                    // handle error conditions
                                }
                            );
                        }
                    });
                    var millisecondsToWait = 500;
                    setTimeout(function() {
                        refreshRightGrid();
                        refreshUpperGrid();
                    }, millisecondsToWait);

                    e.preventDefault();
                });
                rightGrid.find(".k-grid-toolbar").on("click", ".k-pager-undo", function(e) {
                    var rg = $("#frame-right").data("kendoGrid");
                    var selected = [];
                    rg.select().each(function() {
                        selected.push(rg.dataItem(this));
                    });
                    console.log(selected);

                    selected.forEach(function(selectedRow) {
                        if (selectedRow.state == 964820004) {
                            console.log(selectedRow);
                            Xrm.WebApi.deleteRecord("eti_accountproduct", selectedRow.eti_accountproductid.replace(/[{}]/g, "")).then(
                                function success(result) {
                                    console.log("Account deleted");
                                    refreshRightGrid();
                                    refreshUpperGrid();
                                    // perform operations on record deletion
                                },
                                function(error) {
                                    console.log(error.message);
                                    // handle error conditions
                                }
                            );
                        } else {
                            var payload = {
                                "eti_productstate": null
                            };
                            if (selectedRow.state == 964820001)
                                payload.eti_productstate = 964820004;
                            else if (selectedRow.state == 964820005 || selectedRow.state == 964820006)
                                payload.eti_productstate = 964820000;
                            else if (selectedRow.state == 964820002)
                                payload.eti_productstate = 964820005;
                            else if (selectedRow.state == 964820003)
                                payload.eti_productstate = 964820006;
                            Xrm.WebApi.updateRecord("eti_accountproduct", selectedRow.eti_accountproductid.replace(/[{}]/g, ""), payload).then(
                                function success(result) {
                                    console.log("Account updated");
                                    refreshRightGrid();
                                    refreshUpperGrid();
                                    // perform operations on record update
                                },
                                function(error) {
                                    console.log(error.message);
                                    // handle error conditions
                                }
                            );
                        }
                    });
                    e.preventDefault();
                });
                rightGrid.find(".k-grid-toolbar").on("click", ".k-pager-refresh", function(e) {

                    refreshRightGrid();
                    e.preventDefault();
                });

                rightGrid.find(".k-grid-toolbar").on("click", ".k-pager-redo", function(e) {
                    console.log("test");
                    var rg = $("#frame-right").data("kendoGrid");
                    var selectedRows = [];
                    var selected=[];
                    rg.select().each(function() {
                        selectedRows.push(rg.dataItem(this));
                        selected.push(rg.dataItem(this));
                    });
                   
                    /*
                    optionalGrid.data("kendoGrid");
                                    var detailRows = masterGrid.element.find(".k-detail-row");
                                    var selected = [];
                                    console.log("grid");
                                    console.log(masterGrid);
                                    for (var i = 0; i < detailRows.length; i++) {
                                        var detailGrid = $(detailRows[i]).find(".k-grid").data("kendoGrid");
                                        console.log(detailGrid.dataSource.view());

                                        detailGrid.select().each(function() {
                                            selected.push(detailGrid.dataItem(this));
                                        });


                                    }
                    */

                    selected.forEach(function(selectedRow) {
                        if (selectedRow.state == 964820003) {
                            console.log(selectedRow);
                            Xrm.WebApi.deleteRecord("eti_accountproduct", selectedRow.eti_accountproductid.replace(/[{}]/g, "")).then(
                                function success(result) {
                                    console.log("Account deleted");
                                    refreshRightGrid();
                                    refreshUpperGrid();
                                    // perform operations on record deletion
                                },
                                function(error) {
                                    console.log(error.message);
                                    // handle error conditions
                                }
                            );
                        } else {
                            var payload = {
                                "eti_productstate": null
                            };
                            if (selectedRow.state == 964820002 || selectedRow.state == 964820001) {
                                payload.eti_productstate = 964820000;
                                payload["eti_oldquantity"] = payload["eti_quantity"];
                                payload["eti_quantity"] = selectedRow.newQuantity;

                                payload["eti_oldrate"] = selectedRow.rate,
                                    payload["eti_rate"] = selectedRow.newRate,
                                    payload["eti_newrate"] = null;
                                payload["eti_newquantity"] = null;
                            } else if (selectedRow.state == 964820004)
                                payload.eti_productstate = 964820001;
                            else if (selectedRow.state == 964820005)
                                payload.eti_productstate = 964820002;
                            else if (selectedRow.state == 964820006)
                                payload.eti_productstate = 964820003;
                            Xrm.WebApi.updateRecord("eti_accountproduct", selectedRow.eti_accountproductid.replace(/[{}]/g, ""), payload).then(
                                function success(result) {
                                    console.log("Account updated");
                                    refreshRightGrid();
                                    refreshUpperGrid();
                                    // perform operations on record update
                                },
                                function(error) {
                                    console.log(error.message);
                                    // handle error conditions
                                }
                            );
                        }
                    });
                    e.preventDefault();
                });




            }


            function refreshRightGrid() {
                let accountId = formContext.data.entity.getId();
                var gotErrors = false;
                //retrieve acc pricelist type
                var accountBillingType = window.parent.Xrm.Page.getAttribute("eti_accountbillingtype").getValue();
                console.log(accountBillingType);
                //define field to look for
                var priceLevelId = null;
                if (accountBillingType == 964820000) {
                    //search for residental
                    if (Xrm.Page.getAttribute("eti_residentalpricelist") != null)
                        var priceLevelId = Xrm.Page.getAttribute("eti_residentalpricelist").getValue()[0].id;
                    else
                        gotErrors = "No Price List selected";
                } else if (accountBillingType == 964820001) {
                    //search for commercial
                    if (Xrm.Page.getAttribute("eti_commercialpricelist") != null)
                        var priceLevelId = Xrm.Page.getAttribute("eti_commercialpricelist").getValue()[0].id;
                    else
                        gotErrors = "No Price List selected";
                } else {
                    gotErrors = "Unknown Price List type";
                }
                //retrieve pricelist items
                if (gotErrors) {
                    priceLevelId = "00000000-0000-0000-0000-000000000000"
                }
                const accountProductsFetchXml = `<fetch>
                    <entity name="eti_accountproduct" >
                    <attribute name="eti_productstate" />
                    <attribute name="eti_rateoverriden" />
                    <attribute name="eti_oldquantity" />
                    <attribute name="eti_quantity" />
                    <attribute name="eti_newquantity" />
                    <attribute name="eti_rate" />
                    <attribute name="eti_newrate" />
                    <attribute name="eti_oldrate" />
                    <attribute name="eti_accountproductid" />
                    <attribute name="eti_name" />          
                    <attribute name="eti_amount" />    
                    <attribute name="eti_effectivedate" />   
                    <attribute name="eti_parentbundle" />   
                    <filter>
                        <condition attribute="eti_account" operator="eq" value="GUID" />
                    </filter>
                    <link-entity name="product" from="productid" to="eti_product" >
                        <attribute name="name"/>
                        <attribute name="productid" />
                        <link-entity name="eti_productcategory" from="eti_productcategoryid" to="eti_productcategory" >
                        <attribute name="eti_name"/>              
                        <attribute name="eti_productcategoryid" />
                        </link-entity>
                    </link-entity>
                    </entity>
                </fetch>`;

                $.when(
                        Xrm.WebApi.retrieveMultipleRecords("eti_accountproduct", accountProductsRequest),
                    )
                    .then(function(accountProducts) {
                        var grid = $("#frame-right").data("kendoGrid");
                        newAccountProducts = transformResponseRecords(accountProducts.entities);
                        rightDataSource = buildRightGridDataSource(newAccountProducts.filter(function(e) {
                            return !("_eti_parentbundle_value" in e)
                        }));
                        grid.setDataSource(rightDataSource);
                        grid.refresh();
                    }, errorNotification);

            }


            function buildUpperGridDataSource(accountProducts) {
                var uDS = new kendo.data.DataSource({
                    //data: accountProducts.filter(acPr => acPr.eti_productstate != 964820000),

                    pageSize: 15,

                    transport: {
                        read: function(options) {
                            options.success(accountProducts.filter(acPr => (acPr.eti_productstate != 964820001 && acPr.eti_productstate != 964820004)));
                        },
                        update: function(options) {
                            console.log("transport update");
                            console.log(options);
                            options.success();
                        }
                    },
                    schema: {
                        model: {
                            id: "eti_accountproductid",
                            fields: {
                                product1_productid: {
                                    from: "product1_productid",
                                    editable: false
                                },
                                categoryId: {
                                    from: "eti_productcategory2_eti_productcategoryid",
                                    editable: false
                                },
                                name: {
                                    from: "eti_name",
                                    editable: false
                                },
                                categoryName: {
                                    from: "eti_productcategory2_eti_name",
                                    editable: false
                                },
                                productName: {
                                    from: "product1_name",
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
                                oldRate: {
                                    from: "eti_oldrate",
                                    type: "number",
                                    editable: false
                                },
                                currencyID: {
                                    from: "_transactioncurrencyid_value",
                                    editable: false
                                },
                                rateOverriden: {
                                    from: "eti_rateoverriden",
                                    type: "boolean",
                                    editable: false
                                },
                                state: {
                                    from: "eti_productstate",
                                    editable: false
                                },
                                formattedState: {
                                    from: "eti_productstate__OData_Community_Display_V1_FormattedValue",
                                    editable: false
                                },
                                amount: {
                                    from: "eti_amount",
                                    editable: false
                                },
                                effectiveDate: {
                                    from: "eti_effectivedate",
                                    type: "date",
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
                                oldQuantity: {
                                    from: "eti_oldquantity",
                                    type: "number",
                                    editable: false
                                },
                                parent: {from :"_eti_parentbundle_value"}


                            }
                        }
                    },
                    group: {
                        field: "categoryName"
                    }
                });
                //dataSource.bind("sync", dataSource_sync);
                console.log("updata");
                console.log(uDS);
                return uDS;
            }

            function refreshUpperGrid() {
                let accountId = formContext.data.entity.getId();
                var gotErrors = false;
                //retrieve acc pricelist type
                var accountBillingType = window.parent.Xrm.Page.getAttribute("eti_accountbillingtype").getValue();
                console.log(accountBillingType);
                //define field to look for
                var priceLevelId = null;
                if (accountBillingType == 964820000) {
                    //search for residental
                    if (Xrm.Page.getAttribute("eti_residentalpricelist") != null)
                        var priceLevelId = Xrm.Page.getAttribute("eti_residentalpricelist").getValue()[0].id;
                    else
                        gotErrors = "No Price List selected";
                } else if (accountBillingType == 964820001) {
                    //search for commercial
                    if (Xrm.Page.getAttribute("eti_commercialpricelist") != null)
                        var priceLevelId = Xrm.Page.getAttribute("eti_commercialpricelist").getValue()[0].id;
                    else
                        gotErrors = "No Price List selected";
                } else {
                    gotErrors = "Unknown Price List type";
                }
                //retrieve pricelist items
                if (gotErrors) {
                    priceLevelId = "00000000-0000-0000-0000-000000000000"
                }
                const accountProductsFetchXml = `<fetch>
                <entity name="eti_accountproduct" >
                <attribute name="eti_productstate" />
                <attribute name="eti_rateoverriden" />
                <attribute name="eti_oldquantity" />
                <attribute name="eti_quantity" />
                <attribute name="eti_newquantity" />
                <attribute name="eti_rate" />
                <attribute name="eti_newrate" />
                <attribute name="eti_oldrate" />
                <attribute name="eti_accountproductid" />
                <attribute name="eti_name" />          
                <attribute name="eti_amount" />    
                <attribute name="eti_effectivedate" />   
                <attribute name="eti_parentbundle" />  
                <filter>
                    <condition attribute="eti_account" operator="eq" value="GUID" />
                </filter>
                <link-entity name="product" from="productid" to="eti_product" >
                    <attribute name="name"/>
                    <attribute name="productid" />
                    <link-entity name="eti_productcategory" from="eti_productcategoryid" to="eti_productcategory" >
                    <attribute name="eti_name"/>              
                    <attribute name="eti_productcategoryid" />
                    </link-entity>
                </link-entity>
                </entity>
            </fetch>`;
                accountProductsRequest = `?fetchXml=${encodeURIComponent(accountProductsFetchXml.replace("GUID", accountId))}`;
                $.when(
                        Xrm.WebApi.retrieveMultipleRecords("eti_accountproduct", accountProductsRequest),
                    )
                    .then(function(accountProducts) {
                        var grid = $("#frame-up").data("kendoGrid");

                        newActiveAccountProducts = transformResponseRecords(accountProducts.entities);
                        grid.setDataSource(buildUpperGridDataSource(newAccountProducts.filter(function(e) {
                            return !("_eti_parentbundle_value" in e)
                        })));
                        grid.refresh();
                    }, errorNotification);

            }

            function refreshBottonGrid() {
                let accountId = formContext.data.entity.getId();

                const historyFetchXml = `<fetch>
                <entity name="eti_productassignmenthistoryitem" >
                <filter>
                    <condition attribute="eti_account" operator="eq" value="GUID" />
                </filter>
                <attribute name="eti_oldamount" />
                <attribute name="eti_amount" />
                <attribute name="eti_newamount" />
                <attribute name="eti_oldquantity" />
                <attribute name="eti_quantity" />
                <attribute name="eti_newquantity" />
                <attribute name="eti_oldrate" />
                <attribute name="eti_rate" />
                <attribute name="eti_newrate" />
                <attribute name="eti_operationdate" />
                <attribute name="eti_operationdate" />
                <attribute name="eti_event" /> 
                    <link-entity name="product" from="productid" to="eti_product" >
                        <attribute name="name"/>
                        <attribute name="productid" />
                            <link-entity name="eti_productcategory" from="eti_productcategoryid" to="eti_productcategory" >
                                <attribute name="eti_name"/>              
                                <attribute name="eti_productcategoryid" />
                            </link-entity>
                    </link-entity>

                
                </entity>
            </fetch>`;
                historyRequest = `?fetchXml=${encodeURIComponent(historyFetchXml.replace("GUID", accountId))}`;

                $.when(
                        Xrm.WebApi.retrieveMultipleRecords("eti_productassignmenthistoryitem", historyRequest),
                    )
                    .then(function(historyresponse) {
                        var grid = $("#frame-down").data("kendoGrid");
                        var newHistory = transformResponseRecords(historyresponse.entities);
                        grid.setDataSource(buildBottomGridDataSource(newHistory));
                        grid.refresh();
                    }, errorNotification);

            }

            function buildBottomGridDataSource(history) {
                var dataSource = new kendo.data.DataSource({
                    //data: accountProducts.filter(acPr => acPr.eti_productstate != 964820000),

                    pageSize: 15,

                    transport: {
                        read: function(options) {
                            options.success(history);
                        },
                        update: function(options) {
                            console.log("transport update");
                            console.log(options);
                            options.success();
                        }
                    },
                    schema: {
                        model: {
                            fields: {
                                eti_operationdate: {
                                    from: "eti_operationdate",
                                    editable: false
                                },
                                eti_newquantity: {
                                    from: "eti_newquantity",
                                    editable: false
                                },
                                eti_quantity: {
                                    from: "eti_quantity",
                                    editable: false
                                },
                                eti_newquantity: {
                                    from: "eti_oldquantity",
                                    editable: false
                                },
                                eti_rate: {
                                    from: "eti_rate",
                                    editable: false
                                },
                                eti_oldrate: {
                                    from: "eti_oldrate",
                                    editable: false
                                },
                                eti_newrate: {
                                    from: "eti_newrate",
                                    editable: false
                                },
                                eti_event: {
                                    from: "eti_event__OData_Community_Display_V1_FormattedValue",
                                    editable: false
                                },
                                eti_productname: {
                                    from: "product1_name",
                                    editable: false
                                },
                                eti_categoryname: {
                                    from: "eti_productcategory2_eti_name",
                                    editable: false
                                }




                            }
                        }
                    }
                });
                //dataSource.bind("sync", dataSource_sync);
                console.log("updata");
                console.log(dataSource);
                return dataSource;
            }

            function buildRulesDatasource(entities) {
                console.log("rules source");
                console.log(entities);
                let dataSource = new kendo.data.DataSource({
                    data: [...entities],
                    pageSize: 15,

                    schema: {
                        model: {
                            id: "eti_productassociationrule1_eti_productassociationruleid",
                            fields: {
                                name: "eti_productassociationrule1_eti_productcategory__OData_Community_Display_V1_FormattedValue",
                                min: "eti_productassociationrule1_eti_min",
                                max: "eti_productassociationrule1_eti_max",
                            }
                        }
                    }
                });
                console.log(dataSource);
                return dataSource;
            }

            function buildBundleAssociationsDataSource(entities) {
                console.log("associations source");
                console.log(entities);

                let dataSource = new kendo.data.DataSource({
                    data: [...entities],
                    pageSize: 15,

                    schema: {
                        model: {
                            id: "productid",
                            fields: {
                                name: "associatedName",
                                price: "productassociation1_eti_price",
                                mode: "productassociation1_eti_requirementmode",
                                modeValue: "productassociation1_eti_requirementmode__OData_Community_Display_V1_FormattedValue",
                                associatedProductId: "prID"
                            }
                        }
                    }
                });
                console.log(dataSource);
                return dataSource;
            }

            function buildLeftGridDataSource(products) {
                console.log("products source");
                console.log(products);
                var dataSource = new kendo.data.DataSource({
                    data: products,
                    pageSize: 15,

                    schema: {
                        model: {
                            id: "product1_productid",
                            fields: {
                                name: "product1_name",
                                structure: "productstructure",
                                amount: "amount",
                                formattedAmount: "amount__OData_Community_Display_V1_FormattedValue",
                                category: "eti_productcategory2_eti_name"
                            }
                        }
                    },
                    group: {
                        field: "category",
                        title: ""
                    }
                });
                console.log(dataSource);
                return dataSource;
            }

            function buildRightGridDataSource(accountProducts) {
                var rDS = new kendo.data.DataSource({
                    //data: accountProducts.filter(acPr => acPr.eti_productstate != 964820000),

                    pageSize: 15,

                    transport: {
                        read: function(options) {
                            options.success(accountProducts.filter(acPr => acPr.eti_productstate != 964820000));
                        },
                        update: function(options) {
                            console.log("transport update");
                            console.log(options);
                            options.success();
                        }
                    },

                    /*transport: {
                        read: function(options) {
                            options.success(accountProducts.filter(acPr => acPr.eti_productstate != 964820000))

                        },
                        update: function(e) {
                            var data = e;
                            console.log("data called");
                            console.log(data);
                            var item = e.data;
                            var dataToUpdate = {};
                            /*if(updated[item[id]].rate != item.rate)
                            {
                                dataToUpdate["eti_rate"] = item.rate;
                                dataToUpdate["eti_rateoverriden"] = true;
                                dataToUpdate["eti_amount"] = item.amount;
                            }
                            if(updated[item[id]].newQuantity != item.newQuantity)
                            {
                                dataToUpdate["eti_newquantity"] = item.newQuantity;
                                dataToUpdate["eti_amount"] = item.amount;
                            }
                            if(updated[item[id]].effectiveDate != item.effectiveDate)
                                dataToUpdate["eti_effectivedate"] = item.effectiveDate;
                            //e.success(accountProducts.filter(acPr => acPr.eti_productstate != 964820000));
                            e.success(e.data);
                        }
                    },*/
                    schema: {
                        model: {
                            id: "eti_accountproductid",
                            fields: {
                                product1_productid: {
                                    from: "product1_productid",
                                    editable: false
                                },
                                categoryId: {
                                    from: "eti_productcategory2_eti_productcategoryid",
                                    editable: false
                                },
                                name: {
                                    from: "eti_name",
                                    editable: false
                                },
                                categoryName: {
                                    from: "eti_productcategory2_eti_name",
                                    editable: false
                                },
                                productName: {
                                    from: "product1_name",
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
                                    editable: true
                                },
                                oldRate: {
                                    from: "eti_oldrate",
                                    type: "number",
                                    editable: false
                                },
                                currencyID: {
                                    from: "_transactioncurrencyid_value",
                                    editable: false
                                },
                                rateOverriden: {
                                    from: "eti_rateoverriden",
                                    type: "boolean",
                                    editable: false
                                },
                                state: {
                                    from: "eti_productstate",
                                    editable: false
                                },
                                formattedState: {
                                    from: "eti_productstate__OData_Community_Display_V1_FormattedValue",
                                    editable: false
                                },
                                amount: {
                                    from: "eti_amount",
                                    editable: false
                                },
                                effectiveDate: {
                                    from: "eti_effectivedate",
                                    type: "date",
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
                                    editable: true
                                },
                                oldQuantity: {
                                    from: "eti_oldquantity",
                                    type: "number",
                                    editable: false
                                },
                                parent: {from :"_eti_parentbundle_value"}


                            }
                        }
                    },
                    group: {
                        field: "categoryName"
                    }
                });
                rDS.bind("sync", dataSource_sync);
                console.log("rightdata");
                console.log(rDS);
                return rDS;
            }

            function validateProductCategories(entities) {
                //load required categories assignment
                const requiredFetchXML = `<fetch>
                <entity name="eti_productcategory" >
                <attribute name="eti_productcategoryid" />
                <attribute name="eti_name" alias="PARENT" />
                <link-entity name="eti_required_category" from="eti_productcategoryidtwo" to="eti_productcategoryid" link-type="outer" >
                    <link-entity name="eti_productcategory" from="eti_productcategoryid" to="eti_productcategoryidone" link-type="outer" >
                    <attribute name="eti_name" alias="CHILD" />
                    <attribute name="eti_productcategoryid" />
                    </link-entity>
                </link-entity>
                </entity>
            </fetch>`;
                requiredRequest = `?fetchXml=${encodeURIComponent(requiredFetchXML)}`;

                //load excluded category assignments 
                const excludedFetchXML = `<fetch>
        <entity name="eti_productcategory" >
        <attribute name="eti_productcategoryid" />
            <attribute name="eti_name" alias="PARENT" />
            <link-entity name="eti_excluded_category" from="eti_productcategoryidtwo" to="eti_productcategoryid" link-type="outer" >
            <link-entity name="eti_productcategory" from="eti_productcategoryid" to="eti_productcategoryidone" link-type="outer" >
                <attribute name="eti_name" alias="CHILD" />
                <attribute name="eti_productcategoryid" />
            </link-entity>
            </link-entity>
        </entity>
        </fetch>`;
                excludedRequest = `?fetchXml=${encodeURIComponent(excludedFetchXML)}`;
                $.when(
                        Xrm.WebApi.retrieveMultipleRecords("eti_productcategory", requiredRequest),
                        Xrm.WebApi.retrieveMultipleRecords("eti_productcategory", excludedRequest),
                    )
                    .then(function(requiredResponse, excludedResponse) {

                        var required = transformResponseRecords(requiredResponse.entities);
                        var excluded = transformResponseRecords(excludedResponse.entities);
                        console.log("required");
                        console.log(required);
                        console.log("excluded");
                        console.log(excluded);

                    }, errorNotification);
                //THEN map multiselect items and display boxes



            }

            function dataSource_sync(e) {
                console.log("sync");
                console.log(e);
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