const express = require('express');
const request = require('request');
//const { clientId, clientSecret, merchantId, countryCode,currencyCode } = require('../config');
const  clientId = 'AahjB-LVy2RIYmf0Sc4UhQGukQJ5VfaO77cdsAszeCXhttAbpr9Zc-g7fLFefIIDq-k7KsL5877dekEB';
const clientSecret ='EIB_cenVzy9IP00hLFPBMhw-al-8J7Jm1cGNaZNkmuQLS3zI-HfoNGy33-8vdfbqZnvIm9cihCFQmyCH';
const merchantId ='YDHLALG3QWAES';
const countryCode ='US';
  const currencyCode  = 'USD';

const router = express.Router();



const PAYPAL_ORDER_API = 'https://api.sandbox.paypal.com/v2/checkout/orders/';

const auth_1 = Buffer.from("{\"alg\":\"none\"}").toString('base64');
let auth_2 = Buffer.from("{\"iss\":" + clientId + ",\"payer_id\":" + merchantId + "}").toString('base64');
const paypal_auth_assertion = auth_1 + "." + auth_2 + ".";
console.log(" inside oauth" + merchantId);

basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

var contactmoduleBearerToken;
// Render the page
router.get('/', (req, response) => {

console.log("inside contact and sssc route");
  let authorisation = `Basic ${basicAuth}`

  auth = request.post(
    'https://api-m.sandbox.paypal.com/v1/oauth2/token/',
    {
      headers: {
        Accept: `application/json`,
        Authorization: authorisation,
        'Content-Type': `application/x-www-form-urlencoded`,
      
      },

      form: { grant_type: 'client_credentials' },
    },
    async (err, res) => {
      console.log(
        '\n----------:::Getting oauth access token for::: -----------' +
          clientId +
          '\n'
      );
      if (err) {
        console.error(err);
        return res.sendStatus(500);
      }
      const jsonToken = JSON.parse(res.body);
      contactmoduleBearerToken = jsonToken.access_token;

      console.log(
        '\n---------------result oauth Access token / bearer token ::: ---------------\n' +
          contactmoduleBearerToken
      );

       response.render('contactandsssc/index');
    }
  );
});

   router.post('/createOrder', (req, res) => {
    console.log("creating contact module Order");
    request.post(PAYPAL_ORDER_API, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${contactmoduleBearerToken}`,
        'paypal-auth-assertion': paypal_auth_assertion
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        "payment_source": {
            "paypal": {
            "experience_context": {
                "shipping_preference": "GET_FROM_FILE",
                "contact_preference": "UPDATE_CONTACT_INFO",
                "user_action": "PAY_NOW",
                "return_url": "https://example.com/returnUrl",
                "cancel_url": "https://example.com/cancelUrl",
                 "order_update_callback_config": {
              "callback_events": ["SHIPPING_ADDRESS", "SHIPPING_OPTIONS"],
             "callback_url": "https://qlfeatures.onrender.com/contactandsssc/shipping-callback"
            }
            }
            }
        },
        purchase_units: [{
          amount: {
            currency_code: currencyCode,
            value: '100.00',
             "breakdown": {
                    "item_total": {
                        "currency_code": currencyCode,
                        "value": '100.00'
                    }
                }
          }, items: [{
            name: "Test Item",
            unit_amount: {
              currency_code: currencyCode,
              value: '50.00'
            },
            quantity: '2'
          }],
          "shipping": {
         "name": {
            "full_name": "Firstname Lastname"
         },
        "email_address": "customer@example.com",
        "phone_number": {
           "country_code": "1",
           "national_number": "5555555555"
         },
        "address": {
          "address_line_1": "123 Main St.",
          "admin_area_2": "Anytown",
          "admin_area_1": "CA",
          "postal_code": "12345",
          "country_code": "US"
        }
      }
        }]
      })
    }, (err, response, body) => {
      if (err) {
        console.error(err);
        return res.sendStatus(500);
      }
      console.log(body);
      res.json(JSON.parse(body));
    });
  });

 router.get('/shipping-callback', async (req, res) => {
   console.log("calling callback", res.body)
 })


  router.post('/shipping-callback', async (req, res) => {
  try {
    const { id, shipping_address, shipping_option, purchase_units } = req.body;
    
    console.log('Received shipping callback for order:', id);
    console.log('Shipping address:', shipping_address);
    
    // Extract address details
    const { country_code, admin_area_1, admin_area_2, postal_code } = shipping_address;
    
      // Validate shipping address
    const validationResult = validateShippingAddress(shipping_address);
    
    if (!validationResult.isValid) {
      // Return 422 error with appropriate reason
      return res.status(422).json({
        name: validationResult.errorName,
        message: validationResult.errorMessage,
        details: [{
          issue: validationResult.errorName,
          description: validationResult.errorMessage
        }]
      });
    }
    
    // Calculate shipping options based on address (for the entire order)
    const shippingOptions = calculateShippingOptions(shipping_address, purchase_units[0]);
    
    // Get the selected shipping cost (applies to entire order)
    const selectedOption = shippingOptions.find(opt => opt.selected) || shippingOptions[0];
    const shippingCost = selectedOption ? parseFloat(selectedOption.amount.value) : 0;
    
    // Calculate updated amounts
    const updatedPurchaseUnits = purchase_units.map((unit) => {
      
      // Get original item total and tax
      const itemTotal = parseFloat(unit.amount.breakdown.item_total.value);
      const taxTotal = parseFloat(unit.amount.breakdown.tax_total?.value || 0);
      
      // Calculate new total
      const newTotal = (itemTotal + taxTotal + shippingCost).toFixed(2);
      
      return {
        reference_id: unit.reference_id,
        amount: {
          currency_code: unit.amount.currency_code,
          value: newTotal,
          breakdown: {
            item_total: {
              currency_code: unit.amount.currency_code,
              value: itemTotal.toFixed(2)
            },
            tax_total: {
              currency_code: unit.amount.currency_code,
              value: taxTotal.toFixed(2)
            },
            shipping: {
              currency_code: unit.amount.currency_code,
              value: shippingCost.toFixed(2)
            }
          }
        },
        shipping: {
          options: shippingOptions // Same options for all units
        }
      };
    });
    
    // Return success response with updated order
    return res.status(200).json({
      purchase_units: updatedPurchaseUnits
    });
    
  } catch (error) {
    console.error('Error processing shipping callback:', error);
    return res.status(500).json({
      name: 'INTERNAL_SERVER_ERROR',
      message: 'An error occurred while processing your shipping information.'
    });
  }
});


  function calculateShippingOptions(address, firstPurchaseUnit) {
  const { country_code } = address;
  const currencyCode = firstPurchaseUnit.amount.currency_code;
  
  const options = [];
    
  // Standard shipping
  options.push({
    id: 'STANDARD',
    label: 'Standard Shipping (5-7 business days)',
    type: 'SHIPPING',
    selected: true, // First option is selected by default
    amount: {
      currency_code: currencyCode,
      value: calculateShippingCost('STANDARD', country_code, firstPurchaseUnit)
    }
  });
  
  // Express shipping
  options.push({
    id: 'EXPRESS',
    label: 'Express Shipping (2-3 business days)',
    type: 'SHIPPING',
    selected: false,
    amount: {
      currency_code: currencyCode,
      value: calculateShippingCost('EXPRESS', country_code, firstPurchaseUnit)
    }
  });
  
  // Overnight shipping (US only)
  if (country_code === 'US') {
    options.push({
      id: 'OVERNIGHT',
      label: 'Overnight Shipping',
      type: 'SHIPPING',
      selected: false,
      amount: {
        currency_code: currencyCode,
        value: calculateShippingCost('OVERNIGHT', country_code, firstPurchaseUnit)
      }
    });
  }
  
  return options;

}

// Validate shipping address
function validateShippingAddress(address) {

   const { country_code, admin_area_1, admin_area_2, postal_code } = address;
  
  // Example: Only ship to US, Canada, and UK
  const allowedCountries = ['US', 'CA', 'GB'];
  if (!allowedCountries.includes(country_code)) {
    return {
      isValid: false,
      errorName: 'SHIPPING_ADDRESS_INVALID',
      errorMessage: 'Your order can\'t be shipped to this country.'
    };
  }
  
  // Example: Don't ship to Alaska or Hawaii
  const restrictedStates = ['AK', 'HI'];
  if (country_code === 'US' && restrictedStates.includes(admin_area_1)) {
    return {
      isValid: false,
      errorName: 'SHIPPING_ADDRESS_INVALID',
      errorMessage: 'Your order can\'t be shipped to this state.'
    };
  }
  
  // Example: Validate postal code format for US
  if (country_code === 'US' && postal_code) {
    const zipRegex = /^\d{5}(-\d{4})?$/;
    if (!zipRegex.test(postal_code)) {
      return {
        isValid: false,
        errorName: 'SHIPPING_ADDRESS_INVALID',
        errorMessage: 'Invalid postal code format.'
      };
    }
  }
  
  return { isValid: true };
}


// Calculate shipping cost based on type and location
function calculateShippingCost(shippingType, countryCode, purchaseUnit) {
  // Get item total to potentially calculate based on order value
  const itemTotal = parseFloat(purchaseUnit.amount.breakdown.item_total.value);
  
  // Free shipping for orders over $50
  if (itemTotal >= 50 && shippingType === 'STANDARD') {
    return '0.00';
  }
  
  // Base rates by shipping type and country
  const rates = {
    US: {
      STANDARD: '5.99',
      EXPRESS: '12.99',
      OVERNIGHT: '24.99'
    },
    CA: {
      STANDARD: '9.99',
      EXPRESS: '19.99'
    },
    GB: {
      STANDARD: '8.99',
      EXPRESS: '16.99'
    }
  };
  
  return rates[countryCode]?.[shippingType] || '9.99';
}
  
  module.exports = router;
