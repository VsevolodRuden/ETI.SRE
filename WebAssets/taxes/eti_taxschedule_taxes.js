    if (parent.Xrm && parent.Xrm.Page) {
        formContext = parent.Xrm.Page;
        Xrm = parent.Xrm;
    }

    if (typeof GetGlobalContext !== "undefined") {
        globalContext = GetGlobalContext();
    }

    var Sdk = window.Sdk || {};

    Sdk.DeleteRequest = function(entity) {
        this.entityReference = entity;
    };

    // NOTE: The getMetadata property should be attached to the function prototype instead of the
    // function object itself.
    Sdk.DeleteRequest.prototype.getMetadata = function () {
            return {
                boundParameter: null,
                parameterTypes: {},
                operationType: 2, // This is a CRUD operation. Use '0' for actions and '1' for functions
                operationName: "Delete",
            };
        };

    /**
     * Request to execute an update operation
     */
    Sdk.UpdateRequest = function(entityName, entityId, payload) {
        this.etn = entityName;
        this.id = entityId;
        this.payload = payload;
    };

    // NOTE: The getMetadata property should be attached to the function prototype instead of the
    // function object itself.
    Sdk.UpdateRequest.prototype.getMetadata = function () {
        return {
            boundParameter: null,
            parameterTypes: {},
            operationType: 2, // This is a CRUD operation. Use '0' for actions and '1' for functions
            operationName: "Update",
        };
    };

    var currentTaxId = formContext.data.entity.getId();


    $(document).ready(function() {
        initializeControls();
    });

    function initializeControls() {

        mainToolbar = kendo.template($("#template-main").html());
        mainGrid = $("#mainWindow").kendoGrid({
            dataSource: getTaxesDataSource(true),
            toolbar: mainToolbar,
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
            editable: false,

            columns: [
                {
                    selectable: true,
                    //  editable: true,
                    width: "50px",
                },{
                    field: "taxName",
                    //  editable: false,
                    title: "Name",
                    headerAttributes: {
                        style: "text-align: center; "
                    }
                },
                {
                    field: "eti_taxdefinitionid",
                    hidden: true,

                },
            ]
        }).data("kendoGrid");

        //leftTree.find(".k-grid-toolbar").on("click", ".k-pager-plus", addProduct);
        $(".k-pager-plus").bind('click', addTax);
        $(".k-pager-delete").bind('click', removeTax);
        $(".k-pager-refreshMain").bind('click', refreshMainGrid);
    }

    function refreshMainGrid(e) {
        mainGrid.dataSource.read();
        console.log("refresh");
    }
  
    function addTax(e) {
        taxDefinitionAssignmentDialog = $("#taxDefinitionAssignmentDialog").kendoDialog({
            width: "800px",
            visible: true,
            title: "Add Tax Definition",
            closable: true,
            modal: false,
            content: "<div id='taxDefinitionList'></div>",
            open: setTaxAssignmentGrid,

            actions: [{
                    text: 'Cancel',
                    primary: false,
                    action: taxCancelClick
                },
                {
                    text: 'Add Tax Definition',
                    primary: true,
                    action: addTaxDefinition
                }
            ]
        });
        taxDefinitionAssignmentDialog.data("kendoDialog").open().element.closest(".k-window").css({
            top: 15
        });
        console.log("plus");
    } 
    

    
    function addTaxDefinition(e) {
        try {
            var selected = [];
           
                if (availableTaxesGrid.select().length) 
                {
                    availableTaxesGrid.select().each(function(){
                    selected.push(availableTaxesGrid.dataItem(this));
                });
                }
            
           
            if (selected.length) 
            {
                var requests = [];
                selected.forEach(function(data)
                {
                    debugger;
                    var payload = {}
                    payload["eti_ProductTaxSchedule@odata.bind"] = "/eti_producttaxschedules(" + currentTaxId.replace(/[{}]/g, "") + ")";
                    var updateRequest = new Sdk.UpdateRequest("eti_taxdefinition", data.eti_taxdefinitionid.replace(/[{}]/g, ""), payload);
                    requests.push(updateRequest);
                   
               
            });
            Xrm.WebApi.online.executeMultiple(requests).then(
                function success(result) {
                    console.log("Tax Definitions  updated");
                    refreshMainGrid();
                    // perform operations on record update
                },
                function(error) {
                    displayErrorMessage(error.message, "Can't process Assignment!");
                    // handle error conditions
                });
            }
    
        } catch (e) {
            displayErrorMessage(e, "Can't associate Tax Definition!");
            return null;
        }

    }
    function removeTax(e) {
        try {
            var selected = [];
           
                if (mainGrid.select().length) 
                {
                    mainGrid.select().each(function(){
                    selected.push(mainGrid.dataItem(this));

                    
                });
                }
            
           
            if (selected.length) 
            {

                var data = [];
        data.push('--batch_123456');
        data.push('Content-Type: multipart/mixed;boundary=changeset_BBB456');
        data.push('');

        for (var i = 0; i < selected.length; i++) {
            data.push('--changeset_BBB456');
            data.push('Content-Type:application/http');
            data.push('Content-Transfer-Encoding:binary');
            var id = i + 1;
            data.push('Content-ID:' + id);
            data.push('');
            //DELETE [Organization URI]/api/data/v9.0/accounts(00000000-0000-0000-0000-000000000002)/opportunity_customer_accounts(00000000-0000-0000-0000-000000000001)/$ref HTTP/1.1 
            data.push('DELETE ' + parent.Xrm.Page.context.getClientUrl() + '/api/data/v8.1/eti_producttaxschedules('+currentTaxId.replace(/[{}]/g, "")+')/eti_eti_producttaxschedule_eti_taxdefinition_ProductTaxSchedule/$ref?$id='+parent.Xrm.Page.context.getClientUrl()+'/api/data/v8.1/eti_taxdefinitions('+selected[i].eti_taxdefinitionid.replace(/[{}]/g, "")+') HTTP/1.1');

            data.push('Content-Type:application/json;type=entry');
            data.push('');
        }
        data.push('--changeset_BBB456--');
        data.push('--batch_123456--');
        var payload = data.join('\r\n');
        console.log(payload);


        $.ajax({
            method: 'POST',
            url: Xrm.Page.context.getClientUrl() + '/api/data/v8.1/$batch',
            headers: {
                'Content-Type': 'multipart/mixed;boundary=batch_123456',
                'Accept': 'application/json',
                'Odata-MaxVersion': '4.0',
                'Odata-Version': '4.0'
            },
            data: payload,
            async: false,
            success: function(data, textStatus, xhr) {
                refreshMainGrid();

            },
            error: function(xhr, textStatus, errorThrown) {
                console.log("error");
                console.log(errorThrown, textStatus, xhr);
            //debugger;
                displayErrorMessage("An error occured while removing Tax Definitions!", "Can't delete Tax Definitions!");
            }
        });
            
            }
    
        } catch (e) {
            displayErrorMessage(e, "Can't associate Tax Definition!");
            return null;
        }

    }
    function taxCancelClick(e) {

    }

    function setTaxAssignmentGrid(e) {
        ///api/data/v9.1/productpricelevels?$select=amount&$expand=productid($select=name,_eti_productcategory_value,productstructure,productid,_eti_productcategory_value)&$filter=_pricelevelid_value ne 7f244025-9ecb-4116-a90e-a3ab77d9ce62
        availableTaxesGrid = $("#taxDefinitionList").kendoGrid({
            dataSource: getTaxesDataSource(false),
            groupable: false,
            sortable: false,
            toolbar: ["search"],
            height: 550,
            //selectable: "row",
            scrollable: {
                endless: true
            },
            editable: false,
            columns: [
                {
                    selectable: true,
                    //  editable: true,
                    width: "50px",
                },{
                    field: "taxName",
                    //  editable: false,
                    title: "Name",
                    headerAttributes: {
                        style: "text-align: center; "
                    }
                },
                {
                    field: "eti_taxdefinitionid",
                    hidden: true,

                },
            ],
        }).data("kendoGrid");
    }



    function getTaxesDataSource(active) {
        try {
            var urlString = `/api/data/v9.1/eti_taxdefinitions?$select=eti_name,_eti_producttaxschedule_value&$filter=_eti_producttaxschedule_value eq TXGUID`;
            if(active)
           {
            urlString = urlString.replace("TXGUID",currentTaxId);
           } 
           else
           {
            urlString = urlString.replace("TXGUID","null");
           }

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
                            taxName: {
                                from: "_name",
                                type: "string",
                                editable: false
                            },
                            eti_taxdefinitionid: {
                                from: "eti_taxdefinitionid",
                                type: "string",
                                editable: false
                            }
                        }
                    },
                    parse: function(response) {
                        //debugger;
                            let taxdefinitions = [],
                                result = response.value;
                            if (result.length)
                                for (var i = 0; i < result.length; i++) {
                                    var taxdefinition = {
                                        _name: result[i]["eti_name"],
                                        eti_taxdefinitionid:result[i]["eti_taxdefinitionid"]
                                    };
                                    taxdefinitions.push(taxdefinition);
                                }
                                 
                            return taxdefinitions;
                        }
                },
                pageSize: 100,
            });


            return dataSource;
        } catch (e) {
            displayErrorMessage(e, "Can't read Tax Definitions");
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