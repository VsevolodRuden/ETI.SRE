// <copyright file="PluginBase.cs" company="">
// Copyright (c) 2020 All Rights Reserved
// </copyright>
// <author></author>
// <date>13.09.2020 18:26:59</date>
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

namespace ETI.SRE.CreateRuleForEmptuBundleAssociation
{
    /// <summary>
    /// Base class for all plug-in classes.
    /// </summary>    
    /// <summary>
    /// Base class for all plug-in classes.
    /// </summary>    
    /// 

    public class EntryOncreate : IPlugin
    {
        public void Execute(IServiceProvider serviceProvider)
        {
            // var tracingService = (ITracingService)serviceProvider.GetService(typeof(ITracingService));
            var context = (IPluginExecutionContext)serviceProvider.GetService(typeof(IPluginExecutionContext));
            var serviceFactory = (IOrganizationServiceFactory)serviceProvider.GetService(typeof(IOrganizationServiceFactory));
            ITracingService tracingService =(ITracingService)serviceProvider.GetService(typeof(ITracingService));
            IOrganizationService service = serviceFactory.CreateOrganizationService(context.UserId);

            if (context.InputParameters.Contains("Target") && context.InputParameters["Target"] is Entity)
            {
                Entity entity = (Entity)context.InputParameters["Target"];
                BundleHandler.checkForExistingRule(serviceProvider, entity);
            }
        }
    }
    public class EntryOndelete : IPlugin
    {
        public void Execute(IServiceProvider serviceProvider)
        {
            // var tracingService = (ITracingService)serviceProvider.GetService(typeof(ITracingService));
            var context = (IPluginExecutionContext)serviceProvider.GetService(typeof(IPluginExecutionContext));
            var serviceFactory = (IOrganizationServiceFactory)serviceProvider.GetService(typeof(IOrganizationServiceFactory));
            ITracingService tracingService = (ITracingService)serviceProvider.GetService(typeof(ITracingService));
            IOrganizationService service = serviceFactory.CreateOrganizationService(context.UserId);

            if (context.InputParameters.Contains("Target") && context.InputParameters["Target"] is Entity)
            {
                Entity entity = (Entity)context.InputParameters["Target"];
                BundleHandler.removeExistingRule(serviceProvider, entity);
            }
        }
    }
    public class EntryOnchange : IPlugin
    {
        public void Execute(IServiceProvider serviceProvider)
        {
            // var tracingService = (ITracingService)serviceProvider.GetService(typeof(ITracingService));
            var context = (IPluginExecutionContext)serviceProvider.GetService(typeof(IPluginExecutionContext));
            var serviceFactory = (IOrganizationServiceFactory)serviceProvider.GetService(typeof(IOrganizationServiceFactory));
            ITracingService tracingService = (ITracingService)serviceProvider.GetService(typeof(ITracingService));
            IOrganizationService service = serviceFactory.CreateOrganizationService(context.UserId);

            if (context.InputParameters.Contains("Target") && context.InputParameters["Target"] is Entity)
            {
                Entity entity = (Entity)context.InputParameters["Target"];
                Entity rule = new Entity(); // TODO retrieve related entity
                BundleHandler.updateExistingRule(serviceProvider, entity, rule);
            }
        }
    }
    public static class BundleHandler
    {
        public static void createNewRule(IServiceProvider serviceProvider, Entity entity)
        {
            //pre- create empty rule
            //preset values
            //check if product is optional
            //set 0 or price respectively
            //create rule
            //populate entity lookup with ID
        }
        public static void updateExistingRule(IServiceProvider serviceProvider, Entity product, Entity Rule)
        {
            //get all required/default childs
            //calculate sum
            //update entity
        }
        public static void checkForExistingRule(IServiceProvider serviceProvider, Entity entity)
        {
            //get bundle product id and category
            //find matching rule
            //create or update regarding rule
           
        }
        public static void removeExistingRule(IServiceProvider serviceProvider, Entity entity)
        {
            //remove rule 
        }
    }
}