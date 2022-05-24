import CenterPanel from "../components/center_panel";
import { Button } from "react-bootstrap";

import { DefaultApi, ManifestBuilder } from 'pte-sdk';
import { useEffect, useState } from "react";

import { RADEX_COMPONENT_ADDRESS } from '../constants';
import { addressStringToAddress } from "../utils";

const Swap = () => {
  const [pools, setPools] = useState([]);
  const [tokenInfoMapping, setTokenInfoMapping] = useState({})
  
  // Getting the available pools, their addresses, as well as the tokens that they hold
  useEffect(() => {
    const api = new DefaultApi();
    api.getComponent({
      address: RADEX_COMPONENT_ADDRESS
    }).then((response) => {
      let json_response = JSON.parse(response.state).fields[0].elements;

      let keys = json_response.filter(item => item.type == 'Tuple');
      let values = json_response.filter(item => item.type == 'Struct');

      let parsed_response = keys.map(function(element, i) {
        let addresses = [element.elements[0].value, element.elements[1].value, values[i].fields[0].value].map(addressStringToAddress)
        
        return {
          resources: [addresses[0], addresses[1]],
          liquidity_pool_component: addresses[2]
        };
      })

      setPools(parsed_response);

      // Getting a list of all of the unique token addresses in the list
      let unique_resource_addresses = [...new Set(parsed_response
        .map((item) => {
          return item.resources
        })
        .flat())];
      
      // Getting the image associated with each of the unique resource addresses
      console.log(unique_resource_addresses);
    })
  }, [])

  console.log(pools);

  return <CenterPanel>
  <h4 style={{fontWeight: 900}}>Swap </h4>
  <p style={{fontSize: 12}}>Swap between fungible resources</p>

  {/* The div with the two input fields */}
  <div>
    
  </div>
  
</CenterPanel>
}

export default Swap;