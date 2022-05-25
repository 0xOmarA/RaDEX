export const addressStringToAddress = (address) => {
  return address.split('"')[1]
}

export const addressToAddressShorthand = (address, length) => {
  return address.slice(0, length) + '..' + address.slice(address.length - length, address.length)
}