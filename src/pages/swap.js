import CenterPanel from "../components/center_panel";

import { getAccountAddress, signTransaction } from 'pte-browser-extension-sdk';
import { DefaultApi, ManifestBuilder } from 'pte-sdk';
import { useEffect, useState } from "react";

import { RADEX_COMPONENT_ADDRESS } from '../constants';
import { addressStringToAddress } from "../utils";
import SwapInput from "../components/swap_input";
import { Button } from "react-bootstrap";

import { chain } from 'mathjs'
import SwapInOut from "../components/swap_in_out";

const Swap = () => {
  const [pools, setPools] = useState([]);
  const [currentPool, setCurrentPool] = useState(undefined);
  const [tokenInfoMapping, setTokenInfoMapping] = useState({});
  
  const [amountIn, setAmountIn] = useState(undefined);
  const [resourceIn, setResourceIn] = useState(undefined);
  const [amountOut, setAmountOut] = useState(undefined);
  const [resourceOut, setResourceOut] = useState(undefined);

  const [validResourcesOutInfoMapping, setValidResourcesOutInfoMapping] = useState({});

  const handleButtonOnClick = async (e) => {
    // Getting the address of the currently active account to deposit the tokens into
    const accountComponentAddress = await getAccountAddress();
    

    //  Building the swapping transaction
    const manifest = new ManifestBuilder()
      .callMethod(accountComponentAddress, 'withdraw_by_amount', [`Decimal("${amountIn}")`, `ResourceAddress("${resourceIn.resourceAddress}")`])
      .takeFromWorktop(resourceIn.resourceAddress, 'inputBucket')
      .callMethod(RADEX_COMPONENT_ADDRESS, "swap", [
        `Bucket("inputBucket")`,
        `ResourceAddress("${resourceOut.resourceAddress}")`
      ])
      .callMethodWithAllResources(accountComponentAddress, 'deposit_batch')
      .build()
      .toString();

    let response = await signTransaction(manifest);
  } 

  const handleSwapButtonOnClick = () => {
    let resource1 = resourceIn;
    let resource2 = resourceOut;

    setResourceIn(resource2);
    setResourceOut(resource1);
  }

  // Getting the available pools, their addresses, as well as the tokens that they hold
  const api = new DefaultApi();
  useEffect(() => {
    api.getComponent({
      address: RADEX_COMPONENT_ADDRESS
    }).then((response) => {
      let json_response = JSON.parse(response.state).fields[0].elements;

      let keys = json_response.filter(item => item.type === 'Tuple');
      let values = json_response.filter(item => item.type === 'Struct');

      let parsedResponse = keys.map(function(element, i) {
        let addresses = [element.elements[0].value, element.elements[1].value, values[i].fields[0].value].map(addressStringToAddress)
        
        return {
          resources: [addresses[0], addresses[1]],
          liquidityPoolComponent: addresses[2]
        };
      })

      setPools(parsedResponse);

      // Getting a list of all of the unique token addresses in the list
      let uniqueResourceAddresses = [...new Set(parsedResponse
        .map((item) => {
          return item.resources
        })
        .flat())];
      
      // Getting the image associated with each of the unique resource addresses
      Promise.all(
        uniqueResourceAddresses.map(async (resourceAddress) => {
          let resourceInformation = await api.getResource({address: resourceAddress})
          
          let metadata = {};
          for (const item of resourceInformation.metadata) {
            metadata[item.name] = item.value;
          }

          let resource = new Resource(
            resourceAddress,
            resourceInformation.resource_type,
            resourceInformation.divisibility,
            metadata,
            resourceInformation.total_supply
          );
        
          return resource
        })
      ).then((results) => {
        let resourceMapping = {};
        for (const resource of results) {
          resourceMapping[resource.resourceAddress] = resource
        }
        setTokenInfoMapping(resourceMapping);
      })
    })
  }, []);

  // This runs when the resource changes to find the resources which it can be exchanged for
  useEffect(() => {
    if (resourceIn !== undefined) {
      const resourceInAddress = resourceIn.resourceAddress;
  
      let validOutputResources = [];
      for (const poolInformation of pools) {
        if (poolInformation.resources.includes(resourceInAddress)) {
          validOutputResources.push(...poolInformation.resources)
        }
      }
  
      let uniqueResourceAddresses = [...new Set(validOutputResources)]
        .filter((x) => x !== resourceInAddress);
        
      let validOutputResourcesMapping = {};
      for (const resourceAddress of uniqueResourceAddresses) {
        validOutputResourcesMapping[resourceAddress] = tokenInfoMapping[resourceAddress];
      }

      setValidResourcesOutInfoMapping(validOutputResourcesMapping);
      // setResourceOut(undefined);
      // setAmountOut(undefined);
    }
  }, [resourceIn]);

  // This runs when the input amount changes
  useEffect(() => {
    if (![amountIn, resourceIn, resourceOut, currentPool].some((x) => x === undefined)) {
      let outputAmount = currentPool.calculateOutputAmount(resourceIn.resourceAddress, amountIn);
      setAmountOut(outputAmount);
    }
  }, [amountIn, resourceOut])

  // This runs whenever any of the resources change (whether input or output)
  useEffect(() => {
    // Ensure that all of the resources we depend upon are not undefined
    if (resourceIn !== undefined && resourceOut !== undefined) {
      // Getting the component address of the liquidity pool
      let liquidity_pool = pools.filter((x) => {
        return (x.resources[0] === resourceIn.resourceAddress || x.resources[1] === resourceIn.resourceAddress) && (x.resources[0] === resourceOut.resourceAddress || x.resources[1] === resourceOut.resourceAddress)
      })[0];

      if (liquidity_pool !== undefined) {
        // Query the API for the component state
        api.getComponent({address: liquidity_pool.liquidityPoolComponent})
        .then((response) => {
          let balances = response.ownedResources
            .filter((x) => x.amount !== '1');

          let currentPool = new LiquidityPool(
            liquidity_pool.liquidityPoolComponent,
            
            balances[0].resourceAddress,
            balances[1].resourceAddress,
            
            balances[0].amount,
            balances[1].amount,
          );

          setCurrentPool(currentPool);

          let outputAmount = currentPool.calculateOutputAmount(resourceIn.resourceAddress, amountIn);
          setAmountOut(outputAmount);
        })
      }
    }
  }, [resourceIn, resourceOut])

  return <CenterPanel className='w-100 position-relative'>
    <h4 style={{fontWeight: 900}}>Swap</h4>
    <p style={{fontSize: 12}}>Swap between fungible resources on the Radix public test environment</p>

    {/* The div with the two input fields */}
    <div className='w-100'>
      <SwapInput 
        resourceList={tokenInfoMapping}
        currentResource={resourceIn}
        currentAmount={amountIn}
        onChange={(resource, amount) => {
          setResourceIn(resource);
          setAmountIn(amount);
        }}
      />
      <SwapInput 
        className='mt-3'
        resourceList={validResourcesOutInfoMapping}
        currentResource={resourceOut}
        currentAmount={amountOut}
        onChange={(resource, amount) => {
          setResourceOut(resource);
          setAmountOut(amount);
        }}
      />
      <SwapInOut
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-40%, -40%)',
        }}
        onClick={handleSwapButtonOnClick}
      />
    </div>
    <Button 
    className='ibm-mono mt-3 mx-auto w-100' 
    onClick={handleButtonOnClick}
    disabled={[amountIn, amountOut, resourceIn, resourceOut].some((x) => x === undefined)}
    style={{
      fontWeight: 900,
      borderRadius:  90,
      paddingInline: 20,
    }}
    >
      Swap
    </Button>
  </CenterPanel>
}

export default Swap;

/// Definition of the resource class used in this page. All that this class does is that it stores the information on 
/// resources and includes useful getter methods to allow for quick interactions with resources.
class Resource {
  constructor (resourceAddress, resourceType, divisibility, metadata, totalSupply) {
    this.resourceAddress = resourceAddress;
    this.resourceType = resourceType;
    this.divisibility = divisibility;
    this.metadata = metadata;
    this.totalSupply = totalSupply;
  }

  get icon_url() {
    if (this.resourceAddress === "030000000000000000000000000000000000000000000000000004") {
      return "https://s2.coinmarketcap.com/static/img/coins/128x128/11948.png";
    } else {
      return this.metadata.icon_url || `https://api.kwelo.com/v1/media/identicon/${this.resourceAddress}`;
    }
  }
}

class LiquidityPool {
  constructor (componentAddress, resource1Address, resource2Address, resource1Amount, resource2Amount) {
    this.componentAddress = componentAddress

    this.amountsMapping = {};
    this.amountsMapping[resource1Address] = resource1Amount;
    this.amountsMapping[resource2Address] = resource2Amount;
  }

  calculateOutputAmount(inputResourceAddress, inputAmount) {
    let outputResourceAddress = this.otherResource(inputResourceAddress);

    let x = this.amountsMapping[inputResourceAddress];
    let y = this.amountsMapping[outputResourceAddress];
    let dx = inputAmount;
    let r = 0.97;

    return chain(dx)
      .multiply(r)
      .multiply(y)
      .divide(
        chain(r)
          .multiply(dx)
          .add(x)
          .done()
      )
      .done()
  }

  otherResource(resource) {
    let keys = Object.keys(this.amountsMapping);
    if (resource === keys[0]) {
      return keys[1];
    } else if (resource === keys[1]) {
      return keys[0];
    } else {
      return undefined;
    }
  }
}