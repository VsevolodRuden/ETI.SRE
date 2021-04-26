﻿// <copyright file="PluginBase.cs" company="">
// Copyright (c) 2020 All Rights Reserved
// </copyright>
// <author></author>
// <date>22.10.2020 15:19:54</date>
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
using Microsoft.Xrm.Sdk.Query;

namespace ETI.SRE.BillingConfigurationSingleton
{

    /// <summary>
    /// Base class for all plug-in classes.
    /// </summary>    
    /// 
    public enum configurationEvent
    {
        create,
        update
    }

 
    public class DetectDuplicatesOnCreate : IPlugin
    {
        public void Execute(IServiceProvider serviceProvider)
        {
            ConfigurationsSingleton.DoJob(serviceProvider, configurationEvent.create);
        }
    }
    public class DetectDuplicatesOnUpdate : IPlugin
    {
        public void Execute(IServiceProvider serviceProvider)
        {
            ConfigurationsSingleton.DoJob(serviceProvider, configurationEvent.update);
        }
    }




    public static class ConfigurationsSingleton
    {
        public static void DoJob(IServiceProvider serviceProvider, configurationEvent ev)
        {
            var tracingService = (ITracingService)serviceProvider.GetService(typeof(ITracingService));
            var context = (IPluginExecutionContext)serviceProvider.GetService(typeof(IPluginExecutionContext));
            var serviceFactory = (IOrganizationServiceFactory)serviceProvider.GetService(typeof(IOrganizationServiceFactory));
            IOrganizationService service = serviceFactory.CreateOrganizationService(context.UserId);

           
            try
            {
                if (context.InputParameters.Contains("Target") && context.InputParameters["Target"] is Entity)
                {
                    Entity entity = (Entity)context.InputParameters["Target"];
                    if(ev == configurationEvent.create)
                    {
                        //if active configurations exist
                        //throw exceprion
                        var billingConfigurationQuery = new QueryExpression();
                        billingConfigurationQuery = new QueryExpression
                        {
                            EntityName = "eti_billingconfiguration",
                            ColumnSet = new ColumnSet("statecode"),
                            Criteria = new FilterExpression
                            {
                                Conditions = {
                                new ConditionExpression {
                                    AttributeName = "statecode",
                                    Operator = ConditionOperator.Equal,
                                    Values = {
                                        0
                                    }

                                }
                            }
                            }
                        };
                        var results = service.RetrieveMultiple(billingConfigurationQuery).Entities;
                        if (results.Count > 0)
                            throw new Exception("Only one active Billing Configuration can exist at the same time!");
                    }
                    else if(ev== configurationEvent.update && entity.GetAttributeValue<OptionSetValue>("statecode").Value == 0)
                    {
                        //if ANOTHER active conf exists
                        //throw excepton
                        var billingConfigurationQuery = new QueryExpression();
                        billingConfigurationQuery = new QueryExpression
                        {
                            EntityName = "eti_billingconfiguration",
                            ColumnSet = new ColumnSet("statecode"),
                            Criteria = new FilterExpression
                            {
                                Conditions = {
                                new ConditionExpression {
                                    AttributeName = "statecode",
                                    Operator = ConditionOperator.Equal,
                                    Values = {
                                        0
                                    }

                                },
                                new ConditionExpression {
                                    AttributeName = "eti_billingconfigurationid",
                                    Operator = ConditionOperator.NotEqual,
                                    Values = {
                                        entity.Id
                                    }
                                }
                            }
                            }
                        };
                        var results = service.RetrieveMultiple(billingConfigurationQuery).Entities;
                        if (results.Count > 0)
                            throw new Exception("Only one active Billing Configuration can exist at the same time!");
                    }

                }
               
            }
            catch (Exception ex)
            {
                throw new InvalidPluginExecutionException(ex.Message);
            }


        }
       
    }
}