import CenterPanel from "../components/center_panel";

import { getAccountAddress, signTransaction } from 'pte-browser-extension-sdk';
import { DefaultApi, ManifestBuilder } from 'pte-sdk';
import { useEffect, useState } from "react";

import { RADEX_COMPONENT_ADDRESS } from '../constants';
import { addressStringToAddress } from "../utils";
import SwapInput from "../components/swap_input";
import Loading from '../components/loading';
import { Button } from "react-bootstrap";

import Resource from '../library/resource';
import LiquidityPool from '../library/liquidity_pool';

import SwapInOut from "../components/swap_in_out";

const Swap = () => {
  const [pools, setPools] = useState([]);
  const [currentPool, setCurrentPool] = useState(undefined);
  const [tokenInfoMapping, setTokenInfoMapping] = useState({});
  
  const [resource1Amount, setResource1Amount] = useState(undefined);
  const [resource1, setResource1] = useState(undefined);
  const [resource2Amount, setResource2Amount] = useState(undefined);
  const [resource2, setResource2] = useState(undefined);

  const [isLoading, setIsLoading] = useState(false);

  const [validResourcesOutInfoMapping, setValidResourcesOutInfoMapping] = useState({});

  const handleButtonOnClick = async (e) => {
    // Getting the address of the currently active account to deposit the tokens into
    const accountComponentAddress = await getAccountAddress();
    
    //  Building the swapping transaction
    const manifest = new ManifestBuilder()
      .callMethod(accountComponentAddress, 'withdraw_by_amount', [`Decimal("${resource1Amount}")`, `ResourceAddress("${resource1.resourceAddress}")`])
      .callMethod(accountComponentAddress, 'withdraw_by_amount', [`Decimal("${resource2Amount}")`, `ResourceAddress("${resource2.resourceAddress}")`])
      .takeFromWorktop(resource1.resourceAddress, 'bucket1')
      .takeFromWorktop(resource2.resourceAddress, 'bucket2')
      .callMethod(RADEX_COMPONENT_ADDRESS, "add_liquidity", [`Bucket("bucket1")`, `Bucket("bucket2")`])
      .callMethodWithAllResources(accountComponentAddress, 'deposit_batch')
      .build()
      .toString();

    let response = await signTransaction(manifest);
    console.log(response);
  } 

  const handleSwapButtonOnClick = () => {
    let _resource1 = resource1;
    let _resource2 = resource2;

    setResource1(_resource2);
    setResource2(_resource1);
  }

  // Getting the available pools, their addresses, as well as the tokens that they hold
  const api = new DefaultApi();
  useEffect(() => {
    setIsLoading(true);

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

      // Getting a list of all of the unique tokens the user account has
      getAccountAddress().then((accountAddress) => {
        api.getComponent({address: accountAddress}).then((componentInfo) => {
          let tokensResourceAddresses = parsedResponse.map((item) => item.resources).flat()
          for (const resource of componentInfo.ownedResources) {
            tokensResourceAddresses.push(resource.resourceAddress);
          }

          // Getting a list of all of the unique token addresses in the list
          let uniqueResourceAddresses = [...new Set(tokensResourceAddresses)
          ];
          
          // Loading up the information of the token
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

            console.log('Loading should stop now');
            setTokenInfoMapping(resourceMapping);
            setValidResourcesOutInfoMapping(resourceMapping);
            setIsLoading(false);
          })
        })
      });
    })
  }, []);

  // This runs whenever any of the resources change (whether input or output)
  useEffect(() => {
    // Ensure that all of the resources we depend upon are not undefined
    if (resource1 !== undefined && resource2 !== undefined) {
      // Getting the component address of the liquidity pool
      let liquidity_pool = pools.filter((x) => {
        return (x.resources[0] === resource1.resourceAddress || x.resources[1] === resource1.resourceAddress) && (x.resources[0] === resource2.resourceAddress || x.resources[1] === resource2.resourceAddress)
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

          let outputAmount = currentPool.calculateOutputLiquidityAmount(resource1.resourceAddress, resource1Amount);
          setResource2Amount(outputAmount);
        })
      }
    }
  }, [resource1, resource2])

  return <CenterPanel className='w-100 position-relative'>
    <Loading isLoading={isLoading}/>

    <h4 style={{fontWeight: 900}}>Add Liquidity</h4>
    <p style={{fontSize: 12}}>Add or create new liquidity pools on the RaDEX platform</p>

    {/* The div with the two input fields */}
    <div className='w-100'>
      <SwapInput 
        resourceList={tokenInfoMapping}
        currentResource={resource1}
        currentAmount={resource1Amount}
        onChange={(resource, amount) => {
          setResource1(resource);
          setResource1Amount(amount);

          let outputAmount = currentPool.calculateOutputLiquidityAmount(resource.resourceAddress, amount);
          if (outputAmount !== undefined) {
            setResource2Amount(outputAmount);
          }
        }}
      />
      <SwapInput 
        className='mt-3'
        resourceList={validResourcesOutInfoMapping}
        currentResource={resource2}
        currentAmount={resource2Amount}
        onChange={(resource, amount) => {
          setResource2(resource);
          setResource2Amount(amount);

          let inputAmount = currentPool.calculateInputLiquidityAmount(resource.resourceAddress, amount);
          if (inputAmount !== undefined) {
            setResource1Amount(inputAmount);
          }
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
    disabled={[resource1Amount, resource2Amount, resource1, resource2].some((x) => x === undefined)}
    style={{
      fontWeight: 900,
      borderRadius:  90,
      paddingInline: 20,
    }}
    >
      Add Liquidity
    </Button>
  </CenterPanel>
}

export default Swap;