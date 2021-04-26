            if (parent.Xrm && parent.Xrm.Page) {
                formContext = parent.Xrm.Page;
                Xrm = parent.Xrm;
            }

            if (typeof GetGlobalContext !== "undefined") {
                globalContext = GetGlobalContext();
            }

            var accountId = formContext.data.entity.getId();
            var products;
            var calculationResults;


            $(document).ready(function() {
            
            
                getProducts();
            });

            function initializeControls() 
            {
            console.log(products);
            calculationResults = initiateLabels(products.entities);
            $("#detailButton").kendoButton({
                click: openDetailPreview
            });
                
            }
            function openDetailPreview()
            {
    if(products.entities)
    {
                var pageInput = {
                    pageType: "webresource",
                    webresourceName: "eti_payment_preview_popup.html",
                    data: JSON.stringify({id: accountId, results: calculationResults})
                };
                var navigationOptions = {
                    target: 2,
                    width: 800, // value specified in pixel
                    height: 878, // value specified in pixel
                    position: 1
                };
                Xrm.Navigation.navigateTo(pageInput, navigationOptions).then(
                    function success() {
                            // Run code on success
                    },
                    function error() {
                            // Handle errors
                    }
                );
    }
            }
            function closeDialog()
            {
                
            }

            function initiateLabels(values)
            {
                var current =0;
                var added = 0;
                var removed = 0;
                var changed = 0;
                var currentprice = 0;
                var followingprice = 0;
                var difference = 0;
                var differenceString = "";
                for (var i = 0; i < values.length; i++) {
                    if(values[i].eti_productstate == 964820000)
                        currentprice +=values[i].eti_amount;
                    if(values[i].eti_productstate ==964820004 || values[i].eti_productstate ==964820001)
                    {
                        followingprice+=(values[i].eti_newrate * values[i].eti_newquantity);
                        added++;
                    }
                    if(values[i].eti_productstate ==964820003 || values[i].eti_productstate ==964820006)
                    {
                        currentprice +=values[i].eti_amount;
                        removed++
                        followingprice-=values[i].eti_amount;
                    }
                    if(values[i].eti_productstate ==964820005 || values[i].eti_productstate ==964820002)
                    {
                        currentprice +=values[i].eti_amount;
                        changed++
                        followingprice+=((values[i].eti_newrate * values[i].eti_newquantity)-values[i].eti_amount);
                    }
                }
                var resultPrice = currentprice + followingprice;
            
                difference = resultPrice-currentprice;
                if(difference>0)
                    differenceString = "+$" + difference.toFixed(2);
                if(difference<0)
                    {
                        difference *=-1;
                        differenceString = "-$" + difference.toFixed(2);
                    }
            
                $('#currentMonthlyPaymentValue').text("$"+currentprice);
                var pluralAddedString = "";
                var pluralRemovedString = "";
                var pluralChangedString = "";
                if(added == 1)
                    pluralAddedString = added + " product";
                if(added > 1)
                    pluralAddedString = added + " products";
                if(added == 0)
                    pluralAddedString = "No products";
                if(removed == 1)
                    pluralRemovedString = removed + " product";
                if(removed > 1)
                    pluralRemovedString = removed + " products";
                if(removed == 0)
                    pluralRemovedString = "No products";
                if(changed == 1)
                    pluralChangedString = changed + " product";
                if(changed > 1)
                    pluralChangedString = changed + " products";
                if(changed == 0)
                    pluralChangedString = "No products";
                $('#nextMonthPaymentLabelAdd').text(pluralAddedString + ' will be added to account.');
                $('#nextMonthPaymentLabelChange').text(pluralChangedString + ' will be changed.')
                $('#nextMonthPaymentLabelRemove').text(pluralRemovedString + ' will be removed from account.')
                $('#nextMonthPaymentLabelSummary').text('Starting at XX/XX/XXXX it will be')
                $('#nextMonthPaymentValue').text("$"+resultPrice.toFixed(2)+" (" + differenceString+")");
                return({diff: differenceString, total: resultPrice.toFixed(2)});
            }

            function getProducts()
            {const accountProductsFetchXml = `<fetch>
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

            accountProductsRequest = `?fetchXml=${encodeURIComponent(accountProductsFetchXml.replace("GUID", accountId))}`;

            $.when(
                Xrm.WebApi.retrieveMultipleRecords("eti_accountproduct", accountProductsRequest),
            )
            .then(function(accountProducts) {
                products = accountProducts;
                initializeControls();
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