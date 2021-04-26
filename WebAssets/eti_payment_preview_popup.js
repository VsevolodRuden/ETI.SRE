        if (parent.Xrm && parent.Xrm.Page) {
            formContext = parent.Xrm.Page;
            Xrm = parent.Xrm;
        }

        if (typeof GetGlobalContext !== "undefined") {
            globalContext = GetGlobalContext();
        }
        var accountId;
        var kendoGrid;

        $(document).ready(function() {
        initializeControls();
        });

        function initializeControls() 
        {
        var params = JSON.parse(getUrlParameters().data);
        console.log(params);
        accountId = params.id;
        $('#relativePaymentValue').text(params.results.diff);
        $('#nextMonthPaymentValue').text(params.results.total);



        kendoGrid = $("#grid").kendoGrid({
            dataSource: getProductsDataSource(),
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
        }).data("kendoGrid");
            
        }
        function getUrlParameters() {
            var queryString = location.search.substring(1);
            var params = {};
            var queryStringParts = queryString.split("&");
            for (var i = 0; i < queryStringParts.length; i++) {
                var pieces = queryStringParts[i].split("=");
                params[pieces[0].toLowerCase()] = pieces.length === 1 ? null : decodeURIComponent(pieces[1]);
            }
        
            return params;
        }

        function getProductsDataSource() {
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
                                    //console.log(globalPriceLevels);
                                    
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
        
        
                                    }
        
                                    if (service._categoryName == undefined || !service._categoryName)
                                        service._categoryName = "No category";
                                    services.push(service);
        
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