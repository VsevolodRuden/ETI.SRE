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
        var isPromo =  Xrm.Page.getAttribute("eti_ispromo").getValue();
        if(isPromo)
        {
            Xrm.Page.getControl("eti_expirationtype").setVisible(true);
            Xrm.Page.getAttribute("eti_expirationtype").setRequiredLevel("required");
            Xrm.Page.getControl("eti_keeppromocontent").setVisible(true);
            Xrm.Page.getAttribute("eti_keeppromocontent").setRequiredLevel("required");
            Xrm.Page.getControl("eti_promocontentsameas").setVisible(true);
            Xrm.Page.getAttribute("eti_promocontentsameas").setRequiredLevel("required");
            setChildVisibility();
        }
        else
        {
            Xrm.Page.getControl("eti_expirationtype").setVisible(false);
            Xrm.Page.getAttribute("eti_expirationtype").setRequiredLevel("none");
            Xrm.Page.getControl("eti_keeppromocontent").setVisible(false);
            Xrm.Page.getAttribute("eti_keeppromocontent").setRequiredLevel("none");
            Xrm.Page.getControl("eti_promocontentsameas").setVisible(false);
            Xrm.Page.getAttribute("eti_promocontentsameas").setRequiredLevel("none");
            Xrm.Page.getControl("eti_expirationdate").setVisible(false);
            Xrm.Page.getAttribute("eti_expirationdate").setRequiredLevel("none");
            Xrm.Page.getControl("eti_promoexpiretype").setVisible(false);
            Xrm.Page.getAttribute("eti_promoexpiretype").setRequiredLevel("none");
            Xrm.Page.getControl("eti_promoexpirevalue").setVisible(false);
            Xrm.Page.getAttribute("eti_promoexpirevalue").setRequiredLevel("none");
        }
        


    }
    function setChildVisibility()
    {
        if (parent.Xrm && parent.Xrm.Page) {
            formContext = parent.Xrm.Page;
            Xrm = parent.Xrm;
        }
        var isPeriod =  Xrm.Page.getAttribute("eti_expirationtype").getValue();
        var isPromo =  Xrm.Page.getAttribute("eti_ispromo").getValue();
        if(isPromo){
        if(!isPeriod)
        {
            Xrm.Page.getControl("eti_promoexpiretype").setVisible(true);
            Xrm.Page.getAttribute("eti_promoexpiretype").setRequiredLevel("required");
            Xrm.Page.getControl("eti_promoexpirevalue").setVisible(true);
            Xrm.Page.getAttribute("eti_promoexpirevalue").setRequiredLevel("required");
            Xrm.Page.getControl("eti_expirationdate").setVisible(false);
            Xrm.Page.getAttribute("eti_expirationdate").setRequiredLevel("none");
          
        }
        else
        {
            Xrm.Page.getControl("eti_promoexpiretype").setVisible(false);
            Xrm.Page.getAttribute("eti_promoexpiretype").setRequiredLevel("none");
            Xrm.Page.getControl("eti_promoexpirevalue").setVisible(false);
            Xrm.Page.getAttribute("eti_promoexpirevalue").setRequiredLevel("none");
            Xrm.Page.getControl("eti_expirationdate").setVisible(true);
            Xrm.Page.getAttribute("eti_expirationdate").setRequiredLevel("required");
        }
    }
    }