import { chain } from 'mathjs'

class LiquidityPool {
  constructor(componentAddress, resource1Address, resource2Address, resource1Amount, resource2Amount) {
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

  calculateOutputLiquidityAmount(inputLiquidityResourceAddress, inputLiquidityAmount) {
    console.log("Here")
    let outputLiquidityResourceAddress = this.otherResource(inputLiquidityResourceAddress);

    let dx = inputLiquidityAmount;
    let x = this.amountsMapping[inputLiquidityResourceAddress];
    let y = this.amountsMapping[outputLiquidityResourceAddress];

    return chain(dx)
      .multiply(y)
      .divide(x)
      .done()
  }

  calculateInputAmount(outputResourceAddress, outputAmount) {
    let inputResourceAddress = this.otherResource(outputResourceAddress);

    let x = this.amountsMapping[inputResourceAddress];
    let y = this.amountsMapping[outputResourceAddress];
    let dy = outputAmount;
    let r = 0.97;

    return chain(dy)
      .multiply(x)
      .divide(
        chain(y)
          .subtract(dy)
          .multiply(r)
          .done()
      )
      .done()
  }

  calculateInputLiquidityAmount(outputLiquidityResourceAddress, outputLiquidityAmount) {
    let inputLiquidityResourceAddress = this.otherResource(outputLiquidityResourceAddress);

    let dx = outputLiquidityAmount;
    let x = this.amountsMapping[outputLiquidityResourceAddress];
    let y = this.amountsMapping[inputLiquidityResourceAddress];

    return chain(dx)
      .multiply(y)
      .divide(x)
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

export default LiquidityPool;