
using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.Globalization;
using System.Linq;
using System.ServiceModel;
using Microsoft.Xrm.Sdk;
using Microsoft.Xrm.Sdk.Messages;
using Microsoft.Xrm.Sdk.Query;

namespace ETI.SRE.CoreHandler
{
    public enum syncMode
    {
        accToOppCreate,
        accToOppChange,
        accToOppDelete,
        oppToAccVerify,
        oppToAccCreate,
        oppToAccChange,
        oppToAccDelete
    }

    
    /// <summary>
    /// Base class for all plug-in classes.
    /// </summary>    
    /// 
    public class GetAccountBillingCycleBounds : IPlugin
    {
        public void Execute(IServiceProvider serviceProvider)
        {

            SRECoreHandler.GetAccountBillingCycleBounds(serviceProvider);
        }
    }
    public class UpdateParentAccountBundlePriceOnSiblingsValueChange : IPlugin
    {
        public void Execute(IServiceProvider serviceProvider)
        {

            SRECoreHandler.GetAccountBillingCycleBounds(serviceProvider);
        }
    }
    public class AddProductsToAccount : IPlugin
    {
        public void Execute(IServiceProvider serviceProvider)
        {

            SRECoreHandler.AddProducts(serviceProvider);
        }
    }
    public class SyncOpportunityWithAccountOnCreate : IPlugin
    {
        public void Execute(IServiceProvider serviceProvider)
        {

            SRECoreHandler.sync(syncMode.accToOppCreate, serviceProvider);
        }
    }
    public class SyncOpportunityWithAccountOnDelete : IPlugin
    {
        public void Execute(IServiceProvider serviceProvider)
        {
            SRECoreHandler.sync(syncMode.accToOppDelete, serviceProvider);
        }
    }
    public class SyncOpportunityWithAccountOnChange : IPlugin
    {
        public void Execute(IServiceProvider serviceProvider)
        {

            SRECoreHandler.sync(syncMode.accToOppChange, serviceProvider);
        }
    }
    public class SyncAccountWithOpportunityOnCreate : IPlugin
    {
        public void Execute(IServiceProvider serviceProvider)
        {

            SRECoreHandler.sync(syncMode.oppToAccCreate, serviceProvider);
        }
    }
    public class SyncAccountWithOpportunityOnDelete : IPlugin
    {
        public void Execute(IServiceProvider serviceProvider)
        {

            SRECoreHandler.sync(syncMode.oppToAccDelete, serviceProvider);
        }
    }
    public class SyncAccountWithOpportunityOnChange : IPlugin
    {
        public void Execute(IServiceProvider serviceProvider)
        {

            SRECoreHandler.sync(syncMode.oppToAccChange, serviceProvider);
        }
    }
    public class SyncAccountWithOpportunityOnVerify : IPlugin
    {
        public void Execute(IServiceProvider serviceProvider)
        {

            SRECoreHandler.sync(syncMode.oppToAccVerify, serviceProvider);
        }
    }

    public class SwapAccountProduct : IPlugin
    {
        public void Execute(IServiceProvider serviceProvider)
        {
            SRECoreHandler.swap(serviceProvider);

        }
    }

    public class ChangeAccountProductState : IPlugin
    {
        public void Execute(IServiceProvider serviceProvider)
        {
            SRECoreHandler.changeState(serviceProvider);

        }
    }
    static class SRECoreHandler
    {
        public static void UpdateParentAccountBundlePriceOnSiblingsValueChange(IServiceProvider serviceProvider)
        {



            var tracingService = (ITracingService)serviceProvider.GetService(typeof(ITracingService));

            var context = (IPluginExecutionContext)serviceProvider.GetService(typeof(IPluginExecutionContext));
            var serviceFactory = (IOrganizationServiceFactory)serviceProvider.GetService(typeof(IOrganizationServiceFactory));
            IOrganizationService service = serviceFactory.CreateOrganizationService(context.UserId);
            tracingService.Trace("start of the execution");
            Entity entity = (Entity)context.InputParameters["Target"];
            var parentProductId = entity.GetAttributeValue<EntityReference>("eti_parentbundle");

        }
        public static void GetAccountBillingCycleBounds(IServiceProvider serviceProvider)
        {


            var tracingService = (ITracingService)serviceProvider.GetService(typeof(ITracingService));

            var context = (IPluginExecutionContext)serviceProvider.GetService(typeof(IPluginExecutionContext));
            var serviceFactory = (IOrganizationServiceFactory)serviceProvider.GetService(typeof(IOrganizationServiceFactory));
            IOrganizationService service = serviceFactory.CreateOrganizationService(context.UserId);
            tracingService.Trace("start of the execution");
            context.OutputParameters["OperationReason"] = "";
            context.OutputParameters["OperationResult"] = true;
            var parameters = context.InputParameters;
            tracingService.Trace($"Start of execution at{DateTime.Now}");
            try
            {
                //get account 
                var account = service.Retrieve(((Entity)context.InputParameters["Account"]).LogicalName, ((Entity)context.InputParameters["Account"]).Id, new ColumnSet(true));
                if (account.Attributes.Contains("eti_byllingcycle"))
                {
                    //get billing cycle
                    var bcReference = account.GetAttributeValue<EntityReference>("eti_byllingcycle");
                    var billingCycle = service.Retrieve(bcReference.LogicalName, bcReference.Id, new ColumnSet(true));
                    string fetch2 = "";
                    EntityCollection result;
                    Entity record;
                    
                    switch (billingCycle.GetAttributeValue<OptionSetValue>("eti_frequency").Value)

                    {
                       
                        case 964820005: //week
                            fetch2 = @"<fetch mapping='logical'>
<entity name='eti_billingconfiguration'>
<attribute name='eti_weeklyrecurringchargesforpartialweek'/>
</entity>
</fetch>";
                            result = service.RetrieveMultiple(new FetchExpression(fetch2));
                            if(result.Entities.Count==0)
                            {
                                throw new Exception("Could not find Billing Configuration record!");
                            }
                            record = result.Entities[0];
                            if(record.Attributes.Contains("eti_weeklyrecurringchargesforpartialweek"))
                            {
                                var isPartial = record.GetAttributeValue<bool>("eti_weeklyrecurringchargesforpartialweek");
                                if (isPartial)
                                {
                                    DateTime baseDate = DateTime.Now;
                                    var thisWeekStart = baseDate.AddDays(-(int)baseDate.DayOfWeek);
                                    var thisWeekEnd = thisWeekStart.AddDays(7).AddSeconds(-1);
                                    context.OutputParameters["DateTimeFrom"] = baseDate;
                                    context.OutputParameters["DateTimeTo"] = thisWeekEnd;
                                }
                                else
                                {
                                    DateTime baseDate = DateTime.Now;
                                    var thisWeekStart = baseDate.AddDays(-(int)baseDate.DayOfWeek);
                                    var thisWeekEnd = thisWeekStart.AddDays(7).AddSeconds(-1);
                                    context.OutputParameters["DateTimeFrom"] = thisWeekStart;
                                    context.OutputParameters["DateTimeTo"] = thisWeekEnd;
                                }
                                return;
                            }
                            else
                            {
                                throw new Exception("Could not find Billing Configuration setting!");
                            }
                            break;
                        case 964820006: //month
                            fetch2 = @"<fetch mapping='logical'>
<entity name='eti_billingconfiguration'>
<attribute name='eti_monthlyrecurringchargesforpartialmonth'/>
</entity>
</fetch>";
                            result = service.RetrieveMultiple(new FetchExpression(fetch2));
                            if (result.Entities.Count == 0)
                            {
                                throw new Exception("Could not find Billing Configuration record!");
                            }
                            record = result.Entities[0];
                            if (record.Attributes.Contains("eti_monthlyrecurringchargesforpartialmonth"))
                            {
                                var isPartial = record.GetAttributeValue<bool>("eti_monthlyrecurringchargesforpartialmonth");
                                if(isPartial)
                                {
                                    DateTime baseDate = DateTime.Now;
                                    var thisWeekStart = baseDate.AddDays(-(int)baseDate.DayOfWeek);
                                    var thisWeekEnd = thisWeekStart.AddDays(7).AddSeconds(-1);
                                    var from = new DateTime(baseDate.Year, baseDate.Month, 1);
                                    context.OutputParameters["DateTimeFrom"] = baseDate;
                                    context.OutputParameters["DateTimeTo"] = from.AddMonths(1).AddDays(-1);
                                }
                                else
                                {
                                    DateTime baseDate = DateTime.Now;
                                    var thisWeekStart = baseDate.AddDays(-(int)baseDate.DayOfWeek);
                                    var thisWeekEnd = thisWeekStart.AddDays(7).AddSeconds(-1);
                                    var from = new DateTime(baseDate.Year, baseDate.Month, 1);
                                    context.OutputParameters["DateTimeFrom"] = from; 
                                    context.OutputParameters["DateTimeTo"] = from.AddMonths(1).AddDays(-1);
                                }
                                return;
                            }
                            else
                            {
                                throw new Exception("Could not find Billing Configuration setting!");
                            }

                            break;
                       
                    }

                  
                }
                else
                {
                    context.OutputParameters["OperationReason"] = "Could not find Account's Billing cycle!";
                    context.OutputParameters["OperationResult"] = false;
                    return;

                }
            }
            catch(Exception ex)
            {
                context.OutputParameters["OperationReason"] = ex.Message;
                context.OutputParameters["OperationResult"] = false;
            }
            



            tracingService.Trace($"End of execution at{DateTime.Now}");
            //throw new InvalidPluginExecutionException("debbugning event");
        }

        public static void sync(syncMode mode, IServiceProvider serviceProvider)
        {
            var tracingService = (ITracingService)serviceProvider.GetService(typeof(ITracingService));
            var context = (IPluginExecutionContext)serviceProvider.GetService(typeof(IPluginExecutionContext));
            var serviceFactory = (IOrganizationServiceFactory)serviceProvider.GetService(typeof(IOrganizationServiceFactory));
            IOrganizationService service = serviceFactory.CreateOrganizationService(context.UserId);
            tracingService.Trace("start of the execution");
            if (context.InputParameters.Contains("Target") && context.InputParameters["Target"] is Entity)
            {
                Entity entity = (Entity)context.InputParameters["Target"];

                try
                {
                    switch (mode)
                    {
                        case syncMode.accToOppCreate:
                            //find serviceProvider
                            Entity product = service.Retrieve("product", entity.GetAttributeValue<EntityReference>("eti_product").Id, new ColumnSet(true));
                            Guid accountId = entity.GetAttributeValue<EntityReference>("eti_account").Id;
                            Entity account = service.Retrieve("account", accountId, new ColumnSet(true));
                            Entity priceList = service.Retrieve("pricelevel", account.GetAttributeValue<EntityReference>("defaultpricelevelid").Id, new ColumnSet(true));

                            //find related opportunity

                            string fetch2 = @"<fetch mapping='logical'>
<entity name='opportunity'>
<filter>
<condition attribute='accountid' operator='eq' value='ACCGUID'/>
<condition attribute='eti_serviceprovider' operator='eq' value='SERVGUID'/>
</filter>
</entity>
</fetch>";
                            fetch2 = fetch2.Replace("ACCGUID", accountId.ToString());
                            fetch2 = fetch2.Replace("SERVGUID", product.GetAttributeValue<EntityReference>("eti_serviceprovider").Id.ToString());
                            EntityCollection result = service.RetrieveMultiple(new FetchExpression(fetch2));
                            Guid oppId;

                            //if none 
                            if (result.Entities.Count == 0)
                            {
                                //create
                                Entity opp = new Entity("opportunity");
                               
                                opp["name"] = product["name"].ToString() + " - " + account["name"].ToString();
                                opp["parentaccountid"] = new EntityReference("account", accountId);
                                opp["eti_serviceprovider"] = product["eti_serviceprovider"];
                                opp["transactioncurrencyid"] = priceList["transactioncurrencyid"];
                                opp["pricelevelid"] = account["defaultpricelevelid"];
                                opp["msdyn_ordertype"] = new OptionSetValue(690970002);
                                oppId = service.Create(opp);                                
                            }
                            else
                            {
                                oppId = result.Entities[0].Id;
                            }

                            //populate line
                            //defaultuomscheduleid
                            //defaultuomid
                            Entity line = new Entity("opportunityproduct");
                            line["uomid"] = product["defaultuomid"];
                            line["opportunityproductname"] = product["name"].ToString();
                            line["isproductoverridden"] = false;
                            line["productid"] = new EntityReference("product",product.Id);
                            line["ispriceoverridden"] = false;
                            line["quantity"] = (decimal)1;
                            line["opportunityid"] = new EntityReference("opportunity", oppId);

                            //create line
                            service.Create(line);

                               
                            break;
                        case syncMode.accToOppChange:
                            //find line
                            //update
                            break;
                        case syncMode.accToOppDelete:
                            //find line
                            //delete
                            break;
                        case syncMode.oppToAccCreate:
                            //find account product
                            //check duplicate
                            //create product
                            break;
                        case syncMode.oppToAccChange:
                            //find account product
                            //update
                            break;
                        case syncMode.oppToAccDelete:
                            //find account product
                            //delete
                            break;
                        case syncMode.oppToAccVerify:
                            //find all products
                            //create unique ones
                            break;
                    }

                }
                catch (Exception ex)
                {
                    throw new InvalidPluginExecutionException(ex.Message);
                }
                tracingService.Trace($"End of execution at{DateTime.Now}");

            }
        }

        public static void swap(IServiceProvider serviceProvider)
        {
            var tracingService = (ITracingService)serviceProvider.GetService(typeof(ITracingService));
            var context = (IPluginExecutionContext)serviceProvider.GetService(typeof(IPluginExecutionContext));
            var serviceFactory = (IOrganizationServiceFactory)serviceProvider.GetService(typeof(IOrganizationServiceFactory));
            IOrganizationService service = serviceFactory.CreateOrganizationService(context.UserId);
            tracingService.Trace("start of the execution");
            context.OutputParameters["AssignmentError"] = "";
            context.OutputParameters["AssignmentResult"] = true;
            var parameters = context.InputParameters;
            tracingService.Trace($"Start of execution at{DateTime.Now}");
          

            try
            {
                Entity account = ((Entity)context.InputParameters["TargetAccount"]);
                var swapProductRequest = new ExecuteMultipleRequest()
                {
                    Requests = new OrganizationRequestCollection(),
                    Settings = new ExecuteMultipleSettings
                    {
                        ContinueOnError = false,
                        ReturnResponses = true
                    }

                };
                Entity product = ((Entity)context.InputParameters["TragetProduct"]);
                product["eti_productstate"] = new OptionSetValue(964820006);
                var updateRequest = new UpdateRequest()
                {
                    Target = product
                };
                Entity newProduct = ((Entity)context.InputParameters["ProductToSwap"]);
                swapProductRequest.Requests.Add(updateRequest);

                Entity productToAdd = new Entity("eti_accountproduct");
                productToAdd["eti_name"] = "Assignment for " + account.GetAttributeValue<string>("name") + " at " + DateTime.Now;
                productToAdd["eti_account"] = (account.ToEntityReference());
                productToAdd["eti_quantity"] = 1;
                productToAdd["eti_newquantity"] = 1;
                productToAdd["eti_oldquantity"] = 0;
                productToAdd["eti_effectivedate"] = DateTime.Now.AddDays(1);
                productToAdd["eti_productstate"] = new OptionSetValue(964820004);
                productToAdd["eti_oldrate"] = new Money(0);
                productToAdd["eti_newrate"] = newProduct.GetAttributeValue<Money>("amount");
                productToAdd["eti_rate"] = new Money(0);
                productToAdd["eti_rateoverriden"] = false;
                productToAdd["eti_amount"] = newProduct.GetAttributeValue<Money>("amount");
                productToAdd["eti_product"] = ((EntityReference)newProduct["productid"]);
                var createRequest = new CreateRequest()
                {
                    Target = productToAdd
                };
                swapProductRequest.Requests.Add(createRequest);
                var response = (ExecuteMultipleResponse)service.Execute(swapProductRequest);
                if (response.IsFaulted)
                    throw new InvalidPluginExecutionException();

                context.OutputParameters["OperationError"] = "";
                context.OutputParameters["OperationSucessfull"] = true;

            }
            catch(Exception ex)
            {
                context.OutputParameters["OperationError"] = ex.Message;
                context.OutputParameters["OperationSucessfull"] = false;
                throw new InvalidPluginExecutionException(ex.Message);
            }

            tracingService.Trace($"End of execution at{DateTime.Now}");
        }

        public static void changeState(IServiceProvider serviceProvider)
        {

            var tracingService = (ITracingService)serviceProvider.GetService(typeof(ITracingService));
            var context = (IPluginExecutionContext)serviceProvider.GetService(typeof(IPluginExecutionContext));
            var serviceFactory = (IOrganizationServiceFactory)serviceProvider.GetService(typeof(IOrganizationServiceFactory));
            IOrganizationService service = serviceFactory.CreateOrganizationService(context.UserId);
            tracingService.Trace("start of the execution");
            context.OutputParameters["AssignmentError"] = "";
            context.OutputParameters["AssignmentResult"] = true;
            var parameters = context.InputParameters;
            tracingService.Trace($"Start of execution at{DateTime.Now}");
            context.OutputParameters["OperationError"] = "";
            context.OutputParameters["OperationSuccessful"] = true;
            switch (context.InputParameters["State"].ToString().ToLower())
            {
                case "pushforward":
                    PushForward(context, service);
                    break;
                case "pushbackward":
                    PushBackward(context, service);
                    break;
                case "edit":
                    SetChange(context, service);
                    break;
                case "delete":
                    SetDelete(context, service);
                    break;
               
                default:
                    context.OutputParameters["OperationError"] = "Unknown command was given to backend logic!";
                    context.OutputParameters["OperationSuccessful"] = false;
                    break;
            }
           


            tracingService.Trace($"End of execution at{DateTime.Now}");
        }
        public static void PushForward(IExecutionContext context, IOrganizationService service)
        {
            var pushForwardRequest = new ExecuteMultipleRequest()
            {
                Requests = new OrganizationRequestCollection(),
                Settings = new ExecuteMultipleSettings
                {
                    ContinueOnError = false,
                    ReturnResponses = true
                }

            };
            foreach (Entity en in ((EntityCollection)context.InputParameters["Products"]).Entities)
            {
                var product = en;
                UpdateRequest updateRequest;
                DeleteRequest deleteRequest;
                switch (en.GetAttributeValue<OptionSetValue>("eti_productstate").Value)
                {
                    case 964820001:
                        product["eti_productstate"] = new OptionSetValue(964820000);
                        product["eti_amount"] = new Money(product.GetAttributeValue<Money>("eti_newrate").Value * product.GetAttributeValue<int>("eti_newquantity"));
                        product["eti_rate"] = product.GetAttributeValue<Money>("eti_newrate");
                        product["eti_quantity"] = product.GetAttributeValue<int>("eti_newquantity");
                        updateRequest = new UpdateRequest()
                        {
                            Target = product
                        };
                        pushForwardRequest.Requests.Add(updateRequest);
                        break;
                    case 964820004:
                        product["eti_productstate"] = new OptionSetValue(964820001);
                        updateRequest = new UpdateRequest()
                        {
                            Target = product
                        };
                        pushForwardRequest.Requests.Add(updateRequest);
                        break;
                    case 964820002:
                        product["eti_productstate"] = new OptionSetValue(964820000);
                        product["eti_amount"] = new Money(product.GetAttributeValue<Money>("eti_newrate").Value * product.GetAttributeValue<int>("eti_newquantity"));
                        product["eti_rate"] = product.GetAttributeValue<Money>("eti_newrate");
                        product["eti_quantity"] = product.GetAttributeValue<int>("eti_newquantity");
                        updateRequest = new UpdateRequest()
                        {
                            Target = product
                        };
                        pushForwardRequest.Requests.Add(updateRequest);
                        break;

                    case 964820005:
                        product["eti_productstate"] = new OptionSetValue(964820002);
                        updateRequest = new UpdateRequest()
                        {
                            Target = product
                        };
                        pushForwardRequest.Requests.Add(updateRequest);
                        break;
                    case 964820006:
                        product["eti_productstate"] = new OptionSetValue(964820003);
                        updateRequest = new UpdateRequest()
                        {
                            Target = product
                        };
                        pushForwardRequest.Requests.Add(updateRequest);
                        break;
                    case 964820003:
                        deleteRequest = new DeleteRequest()
                        {
                            Target = product.ToEntityReference()
                        };
                        pushForwardRequest.Requests.Add(deleteRequest);
                        break;
                }
            }
            try
            {
                var response = (ExecuteMultipleResponse)service.Execute(pushForwardRequest);
                context.OutputParameters["OperationSuccessful"] = true;
            }
            catch (Exception ex)
            {
                context.OutputParameters["OperationSuccessful"] = false;
                context.OutputParameters["OperationError"] = ex.Message;
            }
        }

        public static void PushBackward(IExecutionContext context, IOrganizationService service)
        {
            var pushBackwardRequest = new ExecuteMultipleRequest()
            {
                Requests = new OrganizationRequestCollection(),
                Settings = new ExecuteMultipleSettings
                {
                    ContinueOnError = false,
                    ReturnResponses = true
                }

            };
            foreach (Entity en in ((EntityCollection)context.InputParameters["Products"]).Entities)
            {
                var product = en;
                UpdateRequest updateRequest;
                DeleteRequest deleteRequest;
                switch (en.GetAttributeValue<OptionSetValue>("eti_productstate").Value)
                {
                    case 964820001:
                        product["eti_productstate"] = new OptionSetValue(964820004);
                        updateRequest = new UpdateRequest()
                        {
                            Target = product
                        };
                        pushBackwardRequest.Requests.Add(updateRequest);
                        break;
                    case 964820002:
                        product["eti_productstate"] = new OptionSetValue(964820005);
                        updateRequest = new UpdateRequest()
                        {
                            Target = product
                        };
                        pushBackwardRequest.Requests.Add(updateRequest);
                        break;
                    case 964820005:
                        product["eti_productstate"] = new OptionSetValue(964820000);
                        updateRequest = new UpdateRequest()
                        {
                            Target = product
                        };
                        pushBackwardRequest.Requests.Add(updateRequest);
                        break;

                    case 964820003:
                        product["eti_productstate"] = new OptionSetValue(964820006);
                        updateRequest = new UpdateRequest()
                        {
                            Target = product
                        };
                        pushBackwardRequest.Requests.Add(updateRequest);
                        break;
                    case 964820006:
                        product["eti_productstate"] = new OptionSetValue(964820000);
                        updateRequest = new UpdateRequest()
                        {
                            Target = product
                        };
                        pushBackwardRequest.Requests.Add(updateRequest);
                        break;
                    case 964820004:
                        deleteRequest = new DeleteRequest()
                        {
                            Target = product.ToEntityReference()
                        };
                        pushBackwardRequest.Requests.Add(deleteRequest);
                        break;
                }
                try
                {
                    var response = (ExecuteMultipleResponse)service.Execute(pushBackwardRequest);
                    context.OutputParameters["OperationSuccessful"] = true;
                }
                catch (Exception ex)
                {
                    context.OutputParameters["OperationSuccessful"] = false;
                    context.OutputParameters["OperationError"] = ex.Message;
                }
            }
        }
        public static void SetChange(IExecutionContext context, IOrganizationService service)
        {

            var editProductRequest = new ExecuteMultipleRequest()
            {
                Requests = new OrganizationRequestCollection(),
                Settings = new ExecuteMultipleSettings
                {
                    ContinueOnError = false,
                    ReturnResponses = true
                }

            };
            foreach (Entity en in ((EntityCollection)context.InputParameters["Products"]).Entities)
            {
                var product = en;
                product["eti_productstate"] = new OptionSetValue(964820005);
                product["eti_newrate"] = product["eti_rate"];
                product["eti_newquantity"] = product["eti_quantity"];
                var updateRequest = new UpdateRequest()
                {
                    Target = product
                };
                editProductRequest.Requests.Add(updateRequest);
            }
            try
            {
                var response = (ExecuteMultipleResponse)service.Execute(editProductRequest);
                context.OutputParameters["OperationSuccessful"] = true;
            }
            catch(Exception ex)
            {
                context.OutputParameters["OperationSuccessful"] = false;
                context.OutputParameters["OperationError"] = ex.Message;
            }


            return;
        }
        public static void SetDelete(IExecutionContext context, IOrganizationService service)
        {

            //check category
            var removeProductRequest = new ExecuteMultipleRequest()
            {
                Requests = new OrganizationRequestCollection(),
                Settings = new ExecuteMultipleSettings
                {
                    ContinueOnError = false,
                    ReturnResponses = true
                }

            };
            List<Guid> guids = new List<Guid>();
            foreach (Entity en in ((EntityCollection)context.InputParameters["Products"]).Entities)
            {
                guids.Add(en.Id);
                var product = en;
                product["eti_productstate"] = new OptionSetValue(964820006);
                product["eti_newrate"] = product["eti_rate"];
                product["eti_newquantity"] = product["eti_quantity"];
                var removeRequest = new UpdateRequest()
                {
                    Target = product
                };
                removeProductRequest.Requests.Add(removeRequest);
            }
            string existingProductsFetch = @"<fetch mapping='logical' >
	<entity name='eti_accountproduct' >
    <filter>
			<condition attribute='eti_accountproductid' operator='not-in'>
                VALUES
              </condition>
		</filter>
</fetch>";
            string values = "";
            foreach (Guid gu in guids)
            {
                values += $"<value>{gu.ToString()}</value>{Environment.NewLine}";
            }
            existingProductsFetch = existingProductsFetch.Replace("VALUES", values);

            var existingProductsResponse = service.RetrieveMultiple(new FetchExpression(existingProductsFetch));
            guids = new List<Guid>();
            foreach(Entity en in existingProductsResponse.Entities)
            {
                guids.Add(en.Id);
            }
            if (!validateRules(context, service, guids, true))
            {
                return;
            }

            try
            {
                var response = (ExecuteMultipleResponse)service.Execute(removeProductRequest);
                context.OutputParameters["OperationSuccessful"] = true;
            }
            catch (Exception ex)
            {
                context.OutputParameters["OperationSuccessful"] = false;
                context.OutputParameters["OperationError"] = ex.Message;
            }


            return;
        }
        public static void AddProducts(IServiceProvider serviceProvider)
        {

            var tracingService = (ITracingService)serviceProvider.GetService(typeof(ITracingService));

            var context = (IPluginExecutionContext)serviceProvider.GetService(typeof(IPluginExecutionContext));
            var serviceFactory = (IOrganizationServiceFactory)serviceProvider.GetService(typeof(IOrganizationServiceFactory));
            IOrganizationService service = serviceFactory.CreateOrganizationService(context.UserId);
            tracingService.Trace("start of the execution");
            context.OutputParameters["AssignmentError"] = "";
            context.OutputParameters["AssignmentResult"] = true;
            var parameters = context.InputParameters;
            tracingService.Trace($"Start of execution at{DateTime.Now}");
            if ((bool)context.InputParameters["IsBundle"])
            {
                
                AddBundle(context, service);
               
            }
            else
            {
                AddPlainProducts(context, service);
            }



            tracingService.Trace($"End of execution at{DateTime.Now}");
            //throw new InvalidPluginExecutionException("debbugning event");
        }
        public static void AddPlainProducts(IExecutionContext context, IOrganizationService service)
        {
            List<EntityReference> products = new List<EntityReference>();
            //check duplicates
            var сreateProductRequest = new ExecuteMultipleRequest()
            {
                Requests = new OrganizationRequestCollection(),
                Settings = new ExecuteMultipleSettings
                {
                    ContinueOnError = false,
                    ReturnResponses = true
                }

            };
            List<Guid> guids = new List<Guid>();
            List<Guid> productGuids = new List<Guid>();
            foreach (Entity en in ((EntityCollection)context.InputParameters["ProductsToAdd"]).Entities)
            {
                guids.Add(((EntityReference)en["productid"]).Id);
                products.Add(((EntityReference)en["productid"]));
                Entity product = new Entity("eti_accountproduct");
                product["eti_name"] ="Assignment for " + ((EntityReference)context.InputParameters["TargetAccount"]).Name + " at " + DateTime.Now;
                product["eti_account"] = ((EntityReference)context.InputParameters["TargetAccount"]);
                product["eti_quantity"] = 0;
                product["eti_newquantity"] = 1;
                product["eti_oldquantity"] = 0;
                product["eti_effectivedate"] = DateTime.Now.AddDays(1);
                product["eti_productstate"] = new OptionSetValue(964820004);
                product["eti_oldrate"] = new Money(0);
                product["eti_newrate"] = en.GetAttributeValue<Money>("amount");
                product["eti_rate"] = new Money(0);
                product["eti_rateoverriden"] = false;
                product["eti_amount"] = en.GetAttributeValue<Money>("amount");
                product["eti_product"] = ((EntityReference)en["productid"]);
                productGuids.Add(((EntityReference)en["productid"]).Id);
                var createRequest = new CreateRequest()
                {
                    Target = product
                };
                сreateProductRequest.Requests.Add(createRequest);
            }
            List<Entity> duplicateErrors = CheckDuplicates(guids, ((EntityReference)(context.InputParameters["TargetAccount"])).Id, service);
           
            if (duplicateErrors.Count > 0)
            {
                string error = $"Following products:{Environment.NewLine}";
                foreach (Entity en in duplicateErrors)
                {
                    error += $"{en.GetAttributeValue<EntityReference>("eti_product").Name},{Environment.NewLine}";
                }
                error += "Are already assigned to account!";
                context.OutputParameters["AssignmentError"] = error;
                context.OutputParameters["AssignmentResult"] = false;
                return;
            }
            else
            {
                 if(!validateRules(context, service, productGuids, false))
            {
                return;
            }
                var response = (ExecuteMultipleResponse)service.Execute(сreateProductRequest);
                if (response.IsFaulted)
                    throw new InvalidPluginExecutionException();
                context.OutputParameters["AssignmentResult"] = true;
               
                return;

            }


            //check categories
            //add products
        }
        public static bool validateRules(IExecutionContext context, IOrganizationService service, List<Guid> ids, bool isRemove)
        {
            
            var account = (EntityReference)context.InputParameters["TargetAccount"];
            string values = "";
            List<Guid> existingCategoriesGuids = new List<Guid>();
            List<Guid> pendingCategoriesGuids = new List<Guid>();
            string existingProductsFetch = @"<fetch mapping='logical' >
	<entity name='eti_accountproduct' >
    <attribute name='eti_name'/>
		<filter>
			<condition attribute='eti_account' operator='eq' value='ACCGUID' />
		</filter>
		<link-entity name='product' from='productid' to='eti_product' >
			<link-entity name='eti_productcategory' from='eti_productcategoryid' to='eti_productcategory' >
 <attribute name='eti_productcategoryid'/>
<attribute name='eti_name'/>
</link-entity>
</link-entity>
	</entity>
</fetch>";
            existingProductsFetch = existingProductsFetch.Replace("ACCGUID", account.Id.ToString());

            var existingCategories = service.RetrieveMultiple(new FetchExpression(existingProductsFetch));

             
            string pendingProductsFetch = @"<fetch mapping='logical' >
	<entity name='product' >
		<filter>
			<condition attribute='productid' operator='in'>
                VALUES
              </condition>
		</filter>
			<link-entity name='eti_productcategory' from='eti_productcategoryid' to='eti_productcategory' >
 <attribute name='eti_productcategoryid'/>
<attribute name='eti_name'/>
</link-entity>
	</entity>
</fetch>";
            foreach (var element in ids)
            {
                values += $"<value>{element.ToString()}</value>{Environment.NewLine}";
            }
            pendingProductsFetch = pendingProductsFetch.Replace("VALUES", values); //

            var pendingCategories = service.RetrieveMultiple(new FetchExpression(pendingProductsFetch));



            string requiredRulesFetch = @"<fetch mapping='logical'>
<entity name='eti_required_category'>
<attribute name='eti_productcategoryidone'/>
<attribute name='eti_productcategoryidtwo'/>
<filter>
      <condition attribute='eti_productcategoryidtwo' operator='in'>
              VALUES
              </condition>
            </filter>
<link-entity name='eti_productcategory' from='eti_productcategoryid' to='eti_productcategoryidone' >
 <attribute name='eti_productcategoryid'/>
<attribute name='eti_name'/>
</link-entity>
<link-entity name='eti_productcategory' from='eti_productcategoryid' to='eti_productcategoryidtwo' >
 <attribute name='eti_productcategoryid'/>
<attribute name='eti_name'/>
</link-entity>
</entity>
        </fetch>";
            values = "";
            foreach (var element in existingCategories.Entities)
            {
                //existingCategories.Entities[0].GetAttributeValue<Microsoft.Xrm.Sdk.AliasedValue>("eti_productcategory2.eti_productcategoryid").Value.ToString()
                values += $"<value>{element.GetAttributeValue<Microsoft.Xrm.Sdk.AliasedValue>("eti_productcategory2.eti_productcategoryid").Value.ToString()}</value>{Environment.NewLine}";
                existingCategoriesGuids.Add(new Guid(element.GetAttributeValue<Microsoft.Xrm.Sdk.AliasedValue>("eti_productcategory2.eti_productcategoryid").Value.ToString()));
            }
            foreach (var element in pendingCategories.Entities)
            {
                values += $"<value>{element.GetAttributeValue<Microsoft.Xrm.Sdk.AliasedValue>("eti_productcategory1.eti_productcategoryid").Value.ToString()}</value>{Environment.NewLine}";
                pendingCategoriesGuids.Add(new Guid(element.GetAttributeValue<Microsoft.Xrm.Sdk.AliasedValue>("eti_productcategory1.eti_productcategoryid").Value.ToString()));
            }
            requiredRulesFetch = requiredRulesFetch.Replace("VALUES", values);
            var requiredCategories = service.RetrieveMultiple(new FetchExpression(requiredRulesFetch));


            string excludedRulesFetch = @"<fetch mapping='logical'>
<entity name='eti_excluded_category'>
<attribute name='eti_productcategoryidone'/>
<attribute name='eti_productcategoryidtwo'/>
<filter>
      <condition attribute='eti_productcategoryidtwo' operator='in'>
              VALUES
              </condition>
            </filter>
<link-entity name='eti_productcategory' from='eti_productcategoryid' to='eti_productcategoryidone' >
 <attribute name='eti_productcategoryid'/>
<attribute name='eti_name'/>
</link-entity>
<link-entity name='eti_productcategory' from='eti_productcategoryid' to='eti_productcategoryidtwo' >
 <attribute name='eti_productcategoryid'/>
<attribute name='eti_name'/>
</link-entity>
</entity>
</fetch>";
            values = "";
            foreach (var element in existingCategories.Entities)
            {
                //existingCategories.Entities[0].GetAttributeValue<Microsoft.Xrm.Sdk.AliasedValue>("eti_productcategory2.eti_productcategoryid").Value.ToString()
                values += $"<value>{element.GetAttributeValue<Microsoft.Xrm.Sdk.AliasedValue>("eti_productcategory2.eti_productcategoryid").Value.ToString()}</value>{Environment.NewLine}";
            }
            foreach (var element in pendingCategories.Entities)
            {
                values += $"<value>{element.GetAttributeValue<Microsoft.Xrm.Sdk.AliasedValue>("eti_productcategory1.eti_productcategoryid").Value.ToString()}</value>{Environment.NewLine}";
            }
            excludedRulesFetch = excludedRulesFetch.Replace("VALUES", values);
            var excludedCategories = service.RetrieveMultiple(new FetchExpression(excludedRulesFetch));

            //check required
            List<string> requiredErrors = new List<string>();
            
            foreach (Entity en in requiredCategories.Entities)
            {
                bool found = false;
                Guid temp = new Guid(en.GetAttributeValue<Microsoft.Xrm.Sdk.AliasedValue>("eti_productcategory1.eti_productcategoryid").Value.ToString());
                foreach (Guid gu in existingCategoriesGuids)
                {
                    if (gu == temp)
                    {
                        found = true;
                        break;
                    }
                }
                if (found)
                    continue;
                foreach (Guid gu in pendingCategoriesGuids)
                {
                    if (gu == temp)
                    {
                        found = true;
                        break;
                    }
                }
                if (found)
                    continue;
                else
                {
                    requiredErrors.Add(en.GetAttributeValue<Microsoft.Xrm.Sdk.AliasedValue>("eti_productcategory1.eti_name").Value.ToString());
                }


            }
            if(requiredErrors.Count>0)
            {
                string error = "";
                if (!isRemove)
                    error = "Following Product Categories are required for this assignment!";
                else
                    error = "Following Product Categories block this delete operation!";
                foreach (string str in requiredErrors)
                {
                    error += $"{Environment.NewLine} {str}";
                }

                context.OutputParameters["AssignmentError"] = error;
                context.OutputParameters["AssignmentResult"] = false;
                return false;
            }
            else
            {
                List<string> excludedErrors = new List<string>();
               

                foreach (Guid gu in pendingCategoriesGuids)
                {
                    bool foundOnce = false;
                    foreach (Entity en in excludedCategories.Entities)
                    {
                        Guid temp = new Guid(en.GetAttributeValue<Microsoft.Xrm.Sdk.AliasedValue>("eti_productcategory1.eti_productcategoryid").Value.ToString());
                        if (gu == temp && foundOnce)
                        {
                            excludedErrors.Add(en.GetAttributeValue<Microsoft.Xrm.Sdk.AliasedValue>("eti_productcategory1.eti_name").Value.ToString());
                            break;
                        }
                        else if(gu == temp && !foundOnce)
                        {
                            foundOnce = true;
                        }
                     
                    }
                }
                foreach (Entity en in excludedCategories.Entities)
                {
                    Guid temp = new Guid(en.GetAttributeValue<Microsoft.Xrm.Sdk.AliasedValue>("eti_productcategory1.eti_productcategoryid").Value.ToString());
                    bool foundOnce = false;
                    foreach (Guid gu in pendingCategoriesGuids)
                    {                        
                        if (gu == temp && foundOnce)
                        {
                            excludedErrors.Add(en.GetAttributeValue<Microsoft.Xrm.Sdk.AliasedValue>("eti_productcategory1.eti_name").Value.ToString());
                            break;
                        }
                        else if (gu == temp && !foundOnce)
                        {
                            foundOnce = true;
                        }

                    }
                }


                if (excludedErrors.Count > 0)
                {
                    string error = "Following Product Categories are conflicting with this assignment!";
                    foreach (string str in excludedErrors)
                    {
                        error += $"{Environment.NewLine} {str}";
                    }

                    context.OutputParameters["AssignmentError"] = error;
                    context.OutputParameters["AssignmentResult"] = false;
                    return false;
                }
            }


            return true;
        }
        public static void AddBundle(IExecutionContext context, IOrganizationService service)
        {
            //check bundle header collision
            //check contents collision
            Entity parentProduct = ((EntityCollection)context.InputParameters["ProductsToAdd"]).Entities[0];
            EntityCollection siblings = ((EntityCollection)context.InputParameters["BundleCollection"]);
            if (siblings.Entities.Count == 0)
            {
                context.OutputParameters["AssignmentError"] = "No contents selected!";
                context.OutputParameters["AssignmentResult"] = false;
                return;
            }
            List<Guid> guids = new List<Guid>();
            guids.Add(parentProduct.Id);
            foreach(Entity en in siblings.Entities)
            {
                guids.Add(en.Id);
            }
            List<Entity> duplicateErrors = CheckDuplicates(guids, ((EntityReference)(context.InputParameters["TargetAccount"])).Id, service);
            if (duplicateErrors.Count > 0)
            {
                string error = $"Following products:{Environment.NewLine}";
                foreach (Entity en in duplicateErrors)
                {
                    error += $"{en.GetAttributeValue<EntityReference>("eti_product").Name},{Environment.NewLine}";
                }
                error += "Are already assigned to account!";
                context.OutputParameters["AssignmentError"] = error;
                context.OutputParameters["AssignmentResult"] = false;
                return;
            }
            //check bundle rules DONE
            //CHECK CATEGORIES!!1111;
            List<Guid> prGuids = new List<Guid>();
           
            //create parent product
          
            Entity product = new Entity("eti_accountproduct");
            product["eti_name"] = "Assignment for " + ((EntityReference)context.InputParameters["TargetAccount"]).Name + " at " + DateTime.Now;
            product["eti_account"] = ((EntityReference)context.InputParameters["TargetAccount"]);
            product["eti_quantity"] = 0;
            product["eti_newquantity"] = 1;
            product["eti_oldquantity"] = 0;
            product["eti_effectivedate"] = DateTime.Now.AddDays(1);
            product["eti_productstate"] = new OptionSetValue(964820004);
            product["eti_oldrate"] = new Money(0);
            product["eti_newrate"] = parentProduct.GetAttributeValue<Money>("amount");
            product["eti_rate"] = new Money(0);
            product["eti_rateoverriden"] = false;
            product["eti_amount"] = parentProduct.GetAttributeValue<Money>("amount");
            product["eti_product"] = parentProduct.GetAttributeValue<EntityReference>("productid");
            prGuids.Add(parentProduct.GetAttributeValue<EntityReference>("productid").Id);

            EntityCollection products = new EntityCollection { EntityName = "eti_accountproduct" };
            //create siblings
            foreach (Entity sib in siblings.Entities)
            {
               
                Entity sibling = new Entity("eti_accountproduct");
                sibling["eti_name"] = "Assignment for " + ((EntityReference)context.InputParameters["TargetAccount"]).Name + " at " + DateTime.Now;
                sibling["eti_account"] = ((EntityReference)context.InputParameters["TargetAccount"]);
                sibling["eti_quantity"] = 0;
                sibling["eti_newquantity"] = 1;
                sibling["eti_oldquantity"] = 0;
                sibling["eti_effectivedate"] = DateTime.Now.AddDays(1);
                sibling["eti_productstate"] = new OptionSetValue(964820004);
                sibling["eti_oldrate"] = new Money(0);
                sibling["eti_newrate"] = sib.GetAttributeValue<Money>("eti_price");
                sibling["eti_rate"] = new Money(0);
                sibling["eti_rateoverriden"] = false;
                sibling["eti_amount"] = sib.GetAttributeValue<Money>("eti_price");
                sibling["eti_product"] = ((EntityReference)sib["productid"]);
                prGuids.Add(((EntityReference)sib["productid"]).Id);
                products.Entities.Add(sibling);
                //sibling["eti_parentbundle"] = new EntityReference("eti_accountproduct", resultId);
               
            }
            if (!validateRules(context, service, prGuids, false))
            {
                return;
            }
            var relationship = new Relationship("eti_eti_accountproduct_eti_accountproduct_ParentBundle");
            relationship.PrimaryEntityRole = EntityRole.Referenced;
            product.RelatedEntities.Add(relationship, products);
            var response = service.Create(product);
            if (response == Guid.Empty)
            {
                context.OutputParameters["AssignmentError"] = "Cant's assign bundle!";
                context.OutputParameters["AssignmentResult"] = false;
                throw new InvalidPluginExecutionException();
            }
           
            context.OutputParameters["AssignmentResult"] = true;

            return;
           
            //return
        }
        public static List<Entity> CheckDuplicates(List<Guid> guids,Guid accId, IOrganizationService service)
        {
            List<Entity> duplicates = new List<Entity>();
            string fetch2 = @"  
   <fetch mapping='logical'>  
     <entity name='eti_accountproduct'>   
        <attribute name='eti_account'/>   
        <attribute name='eti_name'/>   
        <attribute name='eti_product'/>   
           <filter type='and'>   
              <condition attribute='eti_product' operator='in'>
                VALUES
              </condition>
              <condition attribute='eti_account' operator='eq' value = 'GUID'>
              </condition> 
            </filter>   
<link-entity name='product' from='productid' to='eti_product' >
      <attribute name='name'/>
     </link-entity>
      </entity>   
   </fetch> ";
            fetch2 = fetch2.Replace("GUID", accId.ToString());
            string values = "";
            foreach(var element in guids)
            {
                values += $"<value>{element.ToString()}</value>{Environment.NewLine}";
            }
            fetch2 = fetch2.Replace("VALUES", values);

            EntityCollection result = service.RetrieveMultiple(new FetchExpression(fetch2));
            if(result.Entities.Count>0)
                foreach(Entity en in result.Entities)
                {
                    duplicates.Add(en);
                }
            return duplicates;
        }

    }

}