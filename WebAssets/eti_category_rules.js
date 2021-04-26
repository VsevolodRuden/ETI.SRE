

        if (parent.Xrm && parent.Xrm.Page) {
            formContext = parent.Xrm.Page;
            Xrm = parent.Xrm;
        }

        if (typeof GetGlobalContext !== "undefined") {
            globalContext = GetGlobalContext();
        }

        $(document).ready(function() {
            //load all product categories
            var currentCategoryID = formContext.data.entity.getId();
            /*const categoriesFetchXML = `<fetch>
            <entity name="eti_productcategory" >
            <attribute name="eti_name" />
            <attribute name="eti_productcategoryid" />
            <attribute name="eti_classtype" />
            <filter>
                <condition attribute="eti_productcategoryid" operator="neq" value="GUID" />
            </filter>
            </entity>
        </fetch>`;*/
        const categoriesFetchXML = `<fetch>
            <entity name="eti_productcategory" >
            <attribute name="eti_name" />
            <attribute name="eti_productcategoryid" />
            <attribute name="eti_classtype" />
            </entity>
        </fetch>`;
        categoriesRequest = `?fetchXml=${encodeURIComponent(categoriesFetchXML.replace("GUID", currentCategoryID))}`;

            //load required categories assignment
                const requiredFetchXML = `<fetch>
                <entity name="eti_productcategory" >
                <attribute name="eti_name" alias="PARENT" />
                <filter>
                    <condition attribute="eti_productcategoryid" operator="eq" value="GUID" />
                </filter>
                <link-entity name="eti_required_category" from="eti_productcategoryidtwo" to="eti_productcategoryid" link-type="outer" >
                    <link-entity name="eti_productcategory" from="eti_productcategoryid" to="eti_productcategoryidone" link-type="outer" >
                    <attribute name="eti_name" alias="CHILD" />
                    <attribute name="eti_productcategoryid" />
                    </link-entity>
                </link-entity>
                </entity>
            </fetch>`;
        requiredRequest = `?fetchXml=${encodeURIComponent(requiredFetchXML.replace("GUID", currentCategoryID))}`;

        //load excluded category assignments 
        const excludedFetchXML = `<fetch>
        <entity name="eti_productcategory" >
            <attribute name="eti_name" alias="PARENT" />
            <filter>
            <condition attribute="eti_productcategoryid" operator="eq" value="GUID" />
            </filter>
            <link-entity name="eti_excluded_category" from="eti_productcategoryidtwo" to="eti_productcategoryid" link-type="outer" >
            <link-entity name="eti_productcategory" from="eti_productcategoryid" to="eti_productcategoryidone" link-type="outer" >
                <attribute name="eti_name" alias="CHILD" />
                <attribute name="eti_productcategoryid" />
            </link-entity>
            </link-entity>
        </entity>
        </fetch>`;
        excludedRequest = `?fetchXml=${encodeURIComponent(excludedFetchXML.replace("GUID", currentCategoryID))}`;

        const productsFetchXML = `<fetch>
        <entity name="product" >
          <attribute name="name" />
          <attribute name="eti_productcategory" />
          <filter>
            <condition attribute="eti_productcategory" operator="eq" value="GUID" />
            <condition attribute="statecode" operator="eq" value="0" />
          </filter>
        </entity>
      </fetch>`;
        productsRequest = `?fetchXml=${encodeURIComponent(productsFetchXML.replace("GUID", currentCategoryID))}`;

        
            $.when(
                Xrm.WebApi.retrieveMultipleRecords("eti_productcategory", categoriesRequest),
                Xrm.WebApi.retrieveMultipleRecords("eti_productcategory", requiredRequest),
                Xrm.WebApi.retrieveMultipleRecords("eti_productcategory", excludedRequest),
                Xrm.WebApi.retrieveMultipleRecords("product", productsRequest)
            )
            .then(function(categoriesResponse, requiredResponse, excludedResponse, products) {
                initalizeControls(categoriesResponse, requiredResponse, excludedResponse, products);

            }, errorNotification);
            //THEN map multiselect items and display boxes
            

        });
        function initalizeControls(cats, reqs, excls, prods)
        {
            var categories = transformResponseRecords(cats.entities);
            var required = transformResponseRecords(reqs.entities);
            var excluded = transformResponseRecords(excls.entities);
            var products = transformResponseRecords(prods.entities);
            console.log(categories);
            console.log(required);
            console.log(excluded);
            console.log(products);

            var filteredCategories = categories.filter(cat => cat.eti_productcategoryid.toUpperCase() != formContext.data.entity.getId().replace(/[{}]/g, "").toUpperCase());
            $("#frame-left").kendoMultiSelect({
                dataTextField: "eti_name",
                dataValueField: "eti_productcategoryid",
                dataSource: filteredCategories,
                deselect: onDeSelectLeft,
                select: onSelectLeft
            });
            var selectedReq = [];
            var leftSelect =  $("#frame-left").data("kendoMultiSelect");
            console.log(required);
            required.forEach(req => selectedReq.push(req.eti_productcategory2_eti_productcategoryid));
            console.log(selectedReq);
            leftSelect.value(selectedReq);

            $("#frame-center").kendoMultiSelect({
                dataTextField: "eti_name",
                dataValueField: "eti_productcategoryid",
                dataSource: categories,
                deselect: onDeSelectCenter,
                select: onSelectCenter,
            });
            var selectedExcl = [];
            var centerSelect =  $("#frame-center").data("kendoMultiSelect");
            excluded.forEach(req => selectedExcl.push(req.eti_productcategory2_eti_productcategoryid));
            console.log(selectedExcl);
            centerSelect.value(selectedExcl);
            var gridSource = new kendo.data.DataSource({
                data: products,
                pageSize: 15,
    
                schema: {
                    model: {
                       
                        fields: {
                            name: "name"
                        }
                    }
                }
            });
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
            $("#frame-right").kendoGrid({
                dataSource: gridSource,
                pageSize: 15,
                groupable: false,
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
                    title: "Name"
                }]
            });

        }   
        function onSelectLeft(e) {
            console.log("select");
            console.log(e);
            var values = $("#frame-center").data("kendoMultiSelect").value();
            
                if(values.filter(val => val==e.dataItem.eti_productcategoryid).length>0)
                {
                var dialog = $('#dialog');
                        var contentString = "<strong>This value is already set as Excluded</strong>";
                         dialog.kendoDialog({
                            width: "450px",
                            title: "Conflict detected",
                            closable: false,
                            modal: true,
                            content: contentString,
                            actions: [
                                { text: 'Ok' }
                            ]
                });
                dialog.data("kendoDialog").open();    
                e.preventDefault();
                       
            }
            else
            {
                var payload = {};
                payload.relatedEntitySetName = "eti_productcategories";
                payload.parentId = e.dataItem.eti_productcategoryid;
                payload.parentEntitySetName = "eti_productcategories";
                payload.relatedId = formContext.data.entity.getId().replace(/[{}]/g, "");
                payload.relationshipName = "eti_eti_productcategory_eti_productcategory_r";
                console.log(payload);
                callAssociation(payload);
            }
            
        }
         function onSelectCenter(e) {
            console.log("select");
            console.log(e);
            console.log("select");
            console.log(e);
            var values = $("#frame-left").data("kendoMultiSelect").value();
            
                if(values.filter(val => val==e.dataItem.eti_productcategoryid).length>0)
                {
                var dialog = $('#dialog');
                        var contentString = "<strong>This value is already set as Required</strong>";
                         dialog.kendoDialog({
                            width: "450px",
                            title: "Conflict detected",
                            closable: false,
                            modal: false,
                            content: contentString,
                            actions: [
                                { text: 'Ok' }
                            ]
                });
                dialog.data("kendoDialog").open();    
                e.preventDefault();
                       
            }
            else
            {
                var payload = {};
                payload.relatedEntitySetName = "eti_productcategories";
                payload.parentId = e.dataItem.eti_productcategoryid;
                payload.parentEntitySetName = "eti_productcategories";
                payload.relatedId = formContext.data.entity.getId().replace(/[{}]/g, "");
                payload.relationshipName = "eti_eti_productcategory_eti_productcategory_e";
                console.log(payload);
                callAssociation(payload);
               
            }
            
        }
        function onDeSelectLeft(e) {
            console.log("deselect");
            console.log(e);
           
            var payload = {};
            payload.relatedEntitySetName = "eti_productcategories";
                payload.parentId = e.dataItem.eti_productcategoryid;
                payload.parentEntitySetName = "eti_productcategories";
                payload.relatedId = formContext.data.entity.getId().replace(/[{}]/g, "");
            payload.relationshipName = "eti_eti_productcategory_eti_productcategory_r";
            console.log(payload);
            callDeAssociation(payload);
            
        }
        function onDeSelectCenter(e) {
            console.log("deselect");
            console.log(e);
            var payload = {};
            payload.relatedEntitySetName = "eti_productcategories";
            payload.parentId = e.dataItem.eti_productcategoryid;
            payload.parentEntitySetName = "eti_productcategories";
            payload.relatedId = formContext.data.entity.getId().replace(/[{}]/g, "");
            payload.relationshipName = "eti_eti_productcategory_eti_productcategory_e";
            console.log(payload);
            callDeAssociation(payload);
            
        }
        async function callAssociation(params)
        {
            let result  = await associateRequest(params);               
            console.log(result);
        }
        async function callDeAssociation(params)
        {
            let result  = await dissociateRequest(params);               
            console.log(result);
        }
        
        
        function errorNotification()
        {}
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
            return new Promise(function (resolve, reject) {
                var association = {
                    "@odata.id": globalContext.getClientUrl() + "/api/data/v9.1/" + params.relatedEntitySetName + "(" + params.relatedId + ")"
                };
                var req = new XMLHttpRequest();
                req.open("POST", globalContext.getClientUrl() + "/api/data/v9.1/" + params.parentEntitySetName + "(" + params.parentId + ")/" + params.relationshipName + "/$ref", true);
                req.setRequestHeader("Accept", "application/json");
                req.setRequestHeader("Content-Type", "application/json; charset=utf-8");
                req.setRequestHeader("OData-MaxVersion", "4.0");
                req.setRequestHeader("OData-Version", "4.0");
                req.onreadystatechange = function () {
                    if (this.readyState === 4) {

                        req.onreadystatechange = null;
                
                        if (this.status === 204 || this.status === 1223) 
                        {
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
            return new Promise(function (resolve, reject) {
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
                req.onreadystatechange = function () {
                    if (this.readyState === 4) {
                        req.onreadystatechange = null;                
                        if (this.status === 204 || this.status === 1223)
                        {
                            console.log("success");                
                        } else {                
                            console.log("error");                
                        }                
                    }                
                };
                req.send();
            });
        }