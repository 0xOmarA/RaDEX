import CenterPanel from "../components/center_panel";

import { DefaultApi, ManifestBuilder } from 'pte-sdk';
import { useEffect, useState } from "react";

import { RADEX_COMPONENT_ADDRESS } from '../constants';
import { addressStringToAddress } from "../utils";
import SwapInput from "../components/swap_input";

const Swap = () => {
  const [pools, setPools] = useState([]);
  const [tokenInfoMapping, setTokenInfoMapping] = useState({});
  
  const [amountIn, setAmountIn] = useState('0');
  const [resourceIn, setResourceIn] = useState(undefined);
  const [amountOut, setAmountOut] = useState('0');
  const [resourceOut, setResourceOut] = useState(undefined);

  const [validResourcesOutInfoMapping, setValidResourcesOutInfoMapping] = useState({});

  // Getting the available pools, their addresses, as well as the tokens that they hold
  const api = new DefaultApi();
  useEffect(() => {
    api.getComponent({
      address: RADEX_COMPONENT_ADDRESS
    }).then((response) => {
      let json_response = JSON.parse(response.state).fields[0].elements;

      let keys = json_response.filter(item => item.type == 'Tuple');
      let values = json_response.filter(item => item.type == 'Struct');

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
        console.log("Token info has been updated", resourceMapping);
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
      setResourceOut(undefined);
      setAmountOut(undefined);
    }

  }, [resourceIn]);

  return <CenterPanel className='w-100'>
    <h4 style={{fontWeight: 900}}>Swap </h4>
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
    </div>
  
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
    if (this.resourceAddress == "030000000000000000000000000000000000000000000000000004") {
      return "https://s2.coinmarketcap.com/static/img/coins/128x128/11948.png";
    } else {
      return this.metadata.icon_url || `https://api.kwelo.com/v1/media/identicon/${this.resourceAddress}`;
    }
  }
}