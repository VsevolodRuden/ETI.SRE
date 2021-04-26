using System;
using System.Collections.ObjectModel;
using System.Globalization;
using System.Linq;
using System.ServiceModel;
using Microsoft.Xrm.Sdk;
using Microsoft.Xrm.Sdk.Query;

namespace ETI.SRE.ProductAssignmentValidation
{
    /// <summary>
    /// Base class for all plug-in classes.
    /// </summary>    
    /// 

    public class AssignDefaultBundleProducts : IPlugin
    {
        public void Execute(IServiceProvider serviceProvider)
        {
            ProductValidatior.DoJob(serviceProvider);
        }
    }

    public static class ProductValidatior
    {
        public static void DoJob(IServiceProvider serviceProvider)
        {
            // var tracingService = (ITracingService)serviceProvider.GetService(typeof(ITracingService));
            var context = (IPluginExecutionContext)serviceProvider.GetService(typeof(IPluginExecutionContext));
            var serviceFactory = (IOrganizationServiceFactory)serviceProvider.GetService(typeof(IOrganizationServiceFactory));
            IOrganizationService service = serviceFactory.CreateOrganizationService(context.UserId);
            ITracingService tracingService =
              (ITracingService)serviceProvider.GetService(typeof(ITracingService));

            if (context.InputParameters.Contains("Target") && context.InputParameters["Target"] is Entity)
            {
                try
                {
                    Entity entity = (Entity)context.InputParameters["Target"];
                    var accountId = entity.GetAttributeValue<EntityReference>("eti_account").Id;
                    var productId = entity.GetAttributeValue<EntityReference>("eti_product").Id;
                    var product = service.Retrieve("product", productId, new ColumnSet("eti_ispromo", "eti_promocontentsameas", "eti_keeppromocontent"));
                    var accountProductsQuery = new QueryExpression();
                    if ((product.Attributes.Contains("eti_ispromo") && product.GetAttributeValue<bool>("eti_ispromo")) && (product.Attributes.Contains("eti_promocontentsameas")))
                    {
                        accountProductsQuery = new QueryExpression
                        {
                            EntityName = "eti_accountproduct",
                            ColumnSet = new ColumnSet("eti_account", "eti_product"),
                            Criteria = new FilterExpression
                            {
                                Conditions = {
                                new ConditionExpression {
                                    AttributeName = "eti_account",
                                    Operator = ConditionOperator.Equal,
                                    Values = {
                                        accountId
                                    }
                                },
                                new ConditionExpression {
                                    AttributeName = "eti_product",
                                    Operator = ConditionOperator.In,
                                    Values = {
                                        productId,
                                        product.GetAttributeValue<EntityReference>("eti_promocontentsameas").Id
                                    }
                                }
                                }
                            }
                        };
                        var results = service.RetrieveMultiple(accountProductsQuery).Entities;
                        tracingService.Trace($"results.Count{results.Count}");
                        if (results.Count > 0) throw new DuplicatePromoException();
                        //if keepcontent
                        if (product.GetAttributeValue<bool>("eti_keeppromocontent"))
                        {
                            //get parent account
                            Entity account = service.Retrieve("account", accountId, new ColumnSet("eti_accountbillingtype", "eti_commercialpricelist", "eti_residentalpricelist"));
                            Guid targetPlId;
                            if (account.GetAttributeValue<OptionSetValue>("eti_accountbillingtype").Value == 964820000)
                                targetPlId = account.GetAttributeValue<EntityReference>("eti_residentalpricelist").Id;
                            else
                                targetPlId = account.GetAttributeValue<EntityReference>("eti_commercialpricelist").Id;
                            var priceListQuery = new QueryExpression
                            {
                                EntityName = "productpricelevel",
                                ColumnSet = new ColumnSet("productid", "pricelevelid", "amount"),
                                Criteria = new FilterExpression
                                {
                                    Conditions = {
                                new ConditionExpression {
                                    AttributeName = "productid",
                                    Operator = ConditionOperator.Equal,
                                    Values = {
                                        product.GetAttributeValue<EntityReference>("eti_promocontentsameas").Id
                                    }
                                },
                                new ConditionExpression {
                                    AttributeName = "pricelevelid",
                                    Operator = ConditionOperator.Equal,
                                    Values = {
                                        targetPlId
                                    }
                                }
                                }
                                }
                            };
                            var resultEntity = service.RetrieveMultiple(priceListQuery).Entities;
                            if(resultEntity.Count==0)
                            {
                                throw new PricelistValidationException();
                            }
                            else
                            {
                                entity["eti_keepcontent"] = true;
                                entity["eti_ratetoset"] = resultEntity[0].GetAttributeValue<Money>("amount");
                            }

                            //if same content isn't in Account's pricelist and "keep content"
                            //get parent pricelevelid
                            //find pricelevels with prId and plId
                            //if none
                            //throw exception
                            //else populate original price and samecontent
                        }
                        else
                        {
                            entity["eti_keepcontent"] = false;
                        }
                        entity["eti_producttoswap"] = product.GetAttributeValue<EntityReference>("eti_promocontentsameas");


                    }
                    else
                    {
                        accountProductsQuery = new QueryExpression
                        {
                            EntityName = "eti_accountproduct",
                            ColumnSet = new ColumnSet("eti_account", "eti_product"),
                            Criteria = new FilterExpression
                            {
                                Conditions = {
                                new ConditionExpression {
                                    AttributeName = "eti_account",
                                    Operator = ConditionOperator.Equal,
                                    Values = {
                                        accountId
                                    }
                                },
                                new ConditionExpression {
                                    AttributeName = "eti_product",
                                    Operator = ConditionOperator.Equal,
                                    Values = {
                                        productId
                                    }
                                }
                            }
                            }
                        };
                        var results = service.RetrieveMultiple(accountProductsQuery).Entities;
                        tracingService.Trace($"results.Count{results.Count}");
                        if (results.Count > 0) throw new DuplicateException();
                    }

                   


                    
                }
                catch (DuplicateException ex)
                {
                    throw new InvalidPluginExecutionException("This product is already assigned to account!");
                }
                catch (DuplicatePromoException ex)
                {
                    throw new InvalidPluginExecutionException("Same Product is already assigned to account!");
                }
                catch (PricelistValidationException ex)
                {
                    throw new InvalidPluginExecutionException("Can't assign Promo while content to keep is not present in the Acount's PriceList!");
                }


            }

        }
    }
}
public class PricelistValidationException : Exception
{

}
public class DuplicatePromoException : Exception
{

}
public class DuplicateException : Exception
{

}
public class ExcludedException : Exception
{

}
public class RequiredException : Exception
{

}