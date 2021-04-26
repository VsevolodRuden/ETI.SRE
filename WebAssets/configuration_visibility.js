    var Xrm;

    function setMainVisibility()
    {
        if (parent.Xrm && parent.Xrm.Page) {
            formContext = parent.Xrm.Page;
            Xrm = parent.Xrm;
        }
        //eti_ispromo
        /*

        Xrm.Page.getControl("fax").setVisible(false);

        Xrm.Page.getAttribute("new_myfield").setRequiredLevel("none"); //Not Required

Xrm.Page.getAttribute("new_myfield").setRequiredLevel("recommended"); //Business Recommended

Xrm.Page.getAttribute("new_myfield").setRequiredLevel("required"); // Business Required
        */
        var isPromo =  Xrm.Page.getAttribute("eti_prorateperiodsgreaterthanamonth").getValue();
        if(isPromo)
        {
            Xrm.Page.getControl("eti_proratebyday").setVisible(true);
        }
        else
        {
            Xrm.Page.getControl("eti_proratebyday").setVisible(false);
           
        }
        var isPromo =  Xrm.Page.getAttribute("eti_billrunautocreate").getValue();
        if(isPromo)
        {
            Xrm.Page.getControl("eti_automaticallypostbillingdocuments").setVisible(true);
        }
        else
        {
            Xrm.Page.getControl("eti_automaticallypostbillingdocuments").setVisible(false);
           
        }
        


    }