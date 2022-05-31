/// Definition of the resource class used in this page. All that this class does is that it stores the information on 
/// resources and includes useful getter methods to allow for quick interactions with resources.
class Resource {
  constructor(resourceAddress, resourceType, divisibility, metadata, totalSupply) {
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

export default Resource;