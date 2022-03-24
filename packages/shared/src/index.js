export const isObject = val => {
  return val !== null && typeof val === 'object'
}
export const isString = (value) => {
  return typeof value === 'string'
}
export const isNumber = (value) =>{
  return typeof value === 'number'
}
export const isFunction = (value) =>{
  return typeof value === 'function'
}

export const isArray = Array.isArray;
export const assign = Object.assign