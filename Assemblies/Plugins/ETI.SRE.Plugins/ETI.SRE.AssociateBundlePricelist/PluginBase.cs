﻿// <copyright file="PluginBase.cs" company="">
// Copyright (c) 2020 All Rights Reserved
// </copyright>
// <author></author>
// <date>29.04.2020 12:45:07</date>
// <summary>Implements the PluginBase Workflow Activity.</summary>
// <auto-generated>
//     This code was generated by a tool.
//     Runtime Version:4.0.30319.1
// </auto-generated>
using System;
using System.Collections.ObjectModel;
using System.Globalization;
using System.Linq;
using System.ServiceModel;
using Microsoft.Xrm.Sdk;

namespace ETI.SRE.AssociateBundlePricelist
{
    /// <summary>
    /// Base class for all plug-in classes.
    /// </summary>    
    public class AssociateBundlePricelist : IPlugin
    {
        public void Execute(IServiceProvider serviceProvider)
        {
            Handler.DoCreateJob(serviceProvider);
        }
    }
    public class UpdateBundlePricelist : IPlugin
    {
        public void Execute(IServiceProvider serviceProvider)
        {
            Handler.DoUpdateJob(serviceProvider);
        }
    }
    public static class Handler
    {
        public static void DoCreateJob(IServiceProvider serviceProvider)
        {
            var context = (IPluginExecutionContext)serviceProvider.GetService(typeof(IPluginExecutionContext));
            var serviceFactory = (IOrganizationServiceFactory)serviceProvider.GetService(typeof(IOrganizationServiceFactory));
            IOrganizationService service = serviceFactory.CreateOrganizationService(context.UserId);

            if (context.InputParameters.Contains("Target") && context.InputParameters["Target"] is Entity)
            {
                Entity entity = (Entity)context.InputParameters["Target"];

                if (entity.GetAttributeValue<OptionSetValue>("productstructure").Value != 3)
                    return;
                //entity = service.Retrieve(entity.LogicalName, entity.Id, new ColumnSet(new string[] { "eti_account", "eti_product" }));
                try
                {
                    //get current Id
                    var id = entity.Id;
                    //get pricelist
                    var pricelistId = entity.GetAttributeValue<EntityReference>("eti_associatedpricelist").Id;
                    //pre-create relation
                    Entity productPriceLevel = new Entity("productpricelevel");
                    productPriceLevel["productid"] = new EntityReference("product", id);
                    productPriceLevel["pricelevelid"] = new EntityReference("pricelevel", pricelistId);
                    productPriceLevel["pricingmethodcode"] = new OptionSetValue(1);
                    productPriceLevel["quantitysellingcode"] = new OptionSetValue(1);                   
                    productPriceLevel["uomid"] = entity.Attributes["defaultuomid"];
                    //populate with zero
                    productPriceLevel["amount"] = new Money(0);
                    service.Create(productPriceLevel);


                   
                }
                catch (Exception ex)
                {
                    throw ex;
                }
            }
        }
        public static void DoUpdateJob(IServiceProvider serviceProvider)
        {
            //get pricelist
            //recalculate price
            //find relation
            //update with new price
        }
    }
}