

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
                $(document).ready(function() {
                const productsFetchXML = `<fetch>
                <entity name="product" >
                  <attribute name="name" />
                  <attribute name="productstructure" />
                  <attribute name="defaultuomid" />
                  <attribute name="defaultuomscheduleid" />
                  <filter>
                    <condition attribute="productstructure" operator="ne" value="3" />
                    <condition attribute="statecode" operator="eq" value="0" />
                  </filter>
                  <link-entity name="eti_productcategory" from="eti_productcategoryid" to="eti_productcategory" >
                    <attribute name="eti_name" />
                    <attribute name="eti_productcategoryid" />
                  </link-entity>
                </entity>
              </fetch>`;
                productsRequest = `?fetchXml=${encodeURIComponent(productsFetchXML)}`;
                const priceLevelFetchXML = `<fetch>
                <entity name="pricelevel" >
                <attribute name="name" />
                <filter>
                    <condition attribute="statecode" operator="eq" value="0" />
                </filter>
                <order attribute="createdon" descending="true" />
                </entity>
            </fetch>`;
                priceLevelRequest = `?fetchXml=${encodeURIComponent(priceLevelFetchXML)}`;

                const productPriceLevelFetchXML = `<fetch>
                <entity name="productpricelevel" >
                <attribute name="amount" />
                <attribute name="productid" />
                <attribute name="pricelevelid" />
                </entity>
            </fetch>`;
                productPriceLevelRequest = `?fetchXml=${encodeURIComponent(productPriceLevelFetchXML)}`;

                


                
                    $.when(
                        Xrm.WebApi.retrieveMultipleRecords("product", productsRequest),
                        Xrm.WebApi.retrieveMultipleRecords("pricelevel", priceLevelRequest),
                        Xrm.WebApi.retrieveMultipleRecords("productpricelevel", productPriceLevelRequest)
                    )
                    .then(function(productsResponse, pricelevelsResponse, productPriceLevelResponse) {
                        initalizeControls(productsResponse,pricelevelsResponse,productPriceLevelResponse);

                    });
                    //THEN map multiselect items and display boxes
                    

                });
                function initalizeControls(productsResponse,pricelevelsResponse,productPriceLevelResponse)
                {
                
                    products = transformResponseRecords(productsResponse.entities);
                    pricelevels = transformResponseRecords(pricelevelsResponse.entities);
                    productPriceLevels = transformResponseRecords(productPriceLevelResponse.entities);
                    //cnsole.log(products);
                    //cnsole.log(pricelevels);
                    var generatedColumns = generateColumns(pricelevels.slice(0,5));
                    var initialData = generateData(products, pricelevels)
                    $("#frame-left").kendoMultiSelect({
                        dataTextField: "name",
                        dataValueField: "pricelevelid",
                        dataSource: pricelevels,
                        change: onSelectLeft,
                    });
                    var leftSelect =  $("#frame-left").data("kendoMultiSelect");
                    leftSelect.value(pricelevels.slice(0,5));
                   
                    //cnsole.log("generating grid");
                    var upGrid = $("#frame-bottom").kendoGrid({
                        dataSource: initialData,
                        scrollable: {
                            endless: true
                        },
                        
                        editable: "incell",
                        save: onEdit,
                        columns: generatedColumns
                    });
                    //cnsole.log("grid generated");
                    var grid = $("#frame-bottom").data("kendoGrid");
                    //cnsole.log("grid");
                    //cnsole.log(grid);
                }
                function onEdit(e)
                {
                    console.log(e);
                
                        if(Object.keys(e.values).length>0)
                        {
                        var plIdKey = Object.keys(e.values)[0];
                        var amount = e.values[plIdKey];
                        var prId = e.model.productid;
                        var uom = e.model.defaultuomid;
                        var uomschedule = e.model.defaultuomscheduleid;
                        var convertedPlId = plIdKey.substring(1);
                        //"a4a3a4056-51ed-ea11-a817-000d3a33b5c3": "",
                        convertedPlId = [convertedPlId.slice(0, 8), '-', convertedPlId.slice(8)].join('');
                        convertedPlId = [convertedPlId.slice(0, 13), '-', convertedPlId.slice(13)].join('');
                        convertedPlId = [convertedPlId.slice(0, 18), '-', convertedPlId.slice(18)].join('');
                        convertedPlId = [convertedPlId.slice(0, 23), '-', convertedPlId.slice(23)].join('');
                        console.log("pr");
                        console.log(prId);
                        console.log("pl");
                        console.log(convertedPlId);
                        var matchedEntries = productPriceLevels.filter(function(prods) {
                            return (prods._productid_value == prId && prods._pricelevelid_value ==convertedPlId)
                        });
                        if(matchedEntries.length == 0)
                        {
                            //create new productpricelevel
                            var payload = {
                                "amount": parseFloat(amount),
                                // entity["eti_ProductAssociationRule@odata.bind"] = "/eti_productassociationrules(" + ruleId + ")";
                                "productid@odata.bind": "/products(" + prId + ")",
                                "pricelevelid@odata.bind":"/pricelevels(" +convertedPlId+ ")",
                                "uomscheduleid@odata.bind":"/uomschedules(" +uomschedule+ ")",
                                "uomid@odata.bind":"/uoms(" +uom+ ")"
                            };
                            Xrm.WebApi.createRecord("productpricelevel",  payload).then(
                                function success(result) {
                                    console.log("entry created");
                                    console.log(result);
                                                                        productPriceLevels.push({"_productid_value":prId, "_pricelevelid_value":convertedPlId, amount:parseFloat(amount), productpricelevelid:result.id});
                                    /*
                                    var index = productPriceLevels.indexOf(matchedEntries[0]);
                                        if (index > -1) {
                                            productPriceLevels[index].amount = amount;
                                        }
                                        */
                                
                                },
                                function(error) {
                                    $("#frame-bottom").data("kendoGrid").dataSource.cancelChanges();
                                    $("#frame-bottom").data("kendoGrid").refresh();
                                    displayErrorMessage(error.message, "Can't create entry!");
                                }
                            );
                            
                        }
                        else
                        {
                            console.log(matchedEntries)
                            var productpricelevelId = matchedEntries[0].productpricelevelid;
                            if(!isNaN(amount) && amount){
                            var payload = {
                                "amount": parseFloat(amount)
                            };
                            Xrm.WebApi.updateRecord("productpricelevel", productpricelevelId.replace(/[{}]/g, ""), payload).then(
                                function success(result) {
                                    console.log("entry updated");
                                    var index = productPriceLevels.indexOf(matchedEntries[0]);
                                        if (index > -1) {
                                            productPriceLevels[index].amount = amount;
                                        }
                                
                                },
                                function(error) {
                                    $("#frame-bottom").data("kendoGrid").dataSource.cancelChanges();
                                    $("#frame-bottom").data("kendoGrid").refresh();
                                    displayErrorMessage(error.message, "Can't update entry!");
                                }
                            );
                            }
                            else
                            {
                                Xrm.WebApi.deleteRecord("productpricelevel", productpricelevelId.replace(/[{}]/g, "")).then(
                                    function success(result) {
                                        console.log("entry deleted");
                                        var index = productPriceLevels.indexOf(matchedEntries[0]);
                                        if (index > -1) {
                                            productPriceLevels.splice(index, 1);
                                        }

                                    },
                                    function(error) {
                                        $("#frame-bottom").data("kendoGrid").dataSource.cancelChanges();
                                        $("#frame-bottom").data("kendoGrid").refresh();
                                        displayErrorMessage(error.message, "Can't delete entry!");
                                        // handle error conditions
                                    }
                                );
                                
                            }
                        }
                        e.model.dirty = false;
                        e.model.dirtyFields = [];
                        }


                
                    //
                }
                function generateData(pr, pl){
                    var generatedData = [];
                    var generatedModelFields = generateModelFields(pl);
                    pr.forEach(function(p)
                    {
                        var item = {};
                        item.productid = p.productid.toString();
                        item.productname  = p.name.toString();
                        item.eti_productcategory1_eti_name = p.eti_productcategory1_eti_name;
                        item.defaultuomid = p._defaultuomid_value;
                        item.defaultuomscheduleid = p._defaultuomscheduleid_value;
                        //cnsole.log(productPriceLevels);
                        pl.forEach(function(pp){
                        
                            var matchedProducts = productPriceLevels.filter(function(e) {
                                return (e._productid_value == item.productid && e._pricelevelid_value ==pp.pricelevelid)
                            })
                            if(matchedProducts.length ==0)
                            item["a"+pp.pricelevelid.toString().replace(/-/g,'')] = null;
                            else
                            item["a"+pp.pricelevelid.toString().replace(/-/g,'')] = matchedProducts[0].amount;
                        });
                        generatedData.push(item);
                    });
                    //cnsole.log(generatedData);
                    //debugger;
                    var ds = new kendo.data.DataSource({
                        data: generatedData,
                    /*data: [
                            {
                                "a4a3a4056-51ed-ea11-a817-000d3a33b5c3": "",
                                "a584a5f6e-51ed-ea11-a817-000d3a33b5c3": "",
        "a44502e4a-51ed-ea11-a817-000d3a33b5c3": "",
        "a69136f26-456c-ea11-a811-000d3a5915b2": "",
        "abd0f34eb-037f-ea11-a812-000d3a33a5cc": "",
        "abf14dfde-037f-ea11-a812-000d3a33a5cc": "",
        "af9451781-446c-ea11-a811-000d3a5915b2": "",
        "productid": "e7c656b2-067f-ea11-a812-000d3a33a5cc",
        "productname": "Internet Cable"
                            }
                        ],*/
                        schema: {
                            model: {
                            fields: generatedModelFields
                            /*fields: {
                            // "a4a3a4056-51ed-ea11-a817-000d3a33b5c3": {editable: true},
                                //"a584a5f6e-51ed-ea11-a817-000d3a33b5c3": {editable: true},
                                //"a44502e4a-51ed-ea11-a817-000d3a33b5c3": {editable: true},
                                //"a69136f26-456c-ea11-a811-000d3a5915b2": {editable: true},
                                //"abd0f34eb-037f-ea11-a812-000d3a33a5cc": {editable: true},
                                //"abf14dfde-037f-ea11-a812-000d3a33a5cc": {editable: true},
                                //"af9451781-446c-ea11-a811-000d3a5915b2": {editable: true},
                                "productid": {editable: false},
                                "productname": {editable: false}
                            }*/
                            }
                        },
                        group: {
                            field: "eti_productcategory1_eti_name",
                            title: ""
                        }
                        
                    });
                    //cnsole.log("ds");
                    //cnsole.log(ds);
                
                    return ds;

                }
                function generateModelFields(pls)
                {
                    var item ={"productname": {editable: false}, "productid": {editable: false}, "eti_productcategory1_eti_name": {editable: false}, "defaultuomid":{editable:false}, "defaultuomscheduleid": {editable:false}};
                    pls.forEach(function(p)
                    {
                        item["a"+p.pricelevelid.toString().replace(/-/g,'')] = {editable: true,  type: "number"};
                    });
                    
                    //cnsole.log("item");
                    //cnsole.log(item);
                    return item;
                    
                }
                function generateColumns(pricelevels)
                        {
                            var clmn = [];
                            clmn.push({field: "productid", title: "ProductID", hidden: true});
                            clmn.push({field: "eti_productcategory1_eti_name", title: "Category", hidden: true});
                            clmn.push({field: "productname", title: "Product"});
                            //defaultuomid":{editable:false}, "defaultuomscheduleid": {editable:false}
                            clmn.push({field: "defaultuomid", title: "uom", hidden: true});
                            clmn.push({field: "defaultuomscheduleid", title: "uomschedule", hidden: true});
                            pricelevels.forEach(function(pl)
                            {
                                clmn.push({field: "a"+pl.pricelevelid.toString().replace(/-/g,''),  title: pl.name.toString(), format: "{0:c}",  attributes: {"class": "table-cell",style: "text-align: right; "}})
                            });
                            //cnsole.log("clmn");
                            //cnsole.log(clmn);
                            return clmn;
                        }
                function buildMatrix(products,pricelevels) {
                
                }
                function updateGrid(selected)
                {
                    var newGeneratedColumns = generateColumns(selected);
                    var updatedData = generateData(products, selected);
                    var grid = $("#frame-bottom").data("kendoGrid");
                    var options = grid.getOptions();
                    options.columns = newGeneratedColumns;
                    updatedData.read();
                    grid.setDataSource(updatedData);
                    grid.setOptions(options);
                    grid.dataSource.read();
                    grid.refresh()
                }
                function onSelectLeft(e) {
                    //cnsole.log("select");
                    //cnsole.log(e);
                    var multiselect = $("#frame-left").data("kendoMultiSelect");

                    // get data items for the selected options.
                    var dataItem = multiselect.dataItems();
                    updateGrid(dataItem);
                    
                }
            
                function onDeSelectLeft(e) {
                    //cnsole.log("deselect");
                    //cnsole.log(e);
                    var multiselect = $("#frame-left").data("kendoMultiSelect");

                    // get data items for the selected options.
                    var dataItem = multiselect.dataItems();
                    updateGrid(dataItem);
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
            
            