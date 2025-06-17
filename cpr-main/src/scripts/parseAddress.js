const HOUSE_NUM_INDEX = 0;
const STREET_NAME_INDEX = 1;
const MANHATTAN_BOROUGH_INDEX = 2;
const OUTER_BOROUGH_INDEX = 3;




export const parseAddress = (address) => {
    // address is an array
    const addressObj = {};

    // needs full direction, needs NO nd, st, rd, etc

    addressObj.houseNum = address[HOUSE_NUM_INDEX].long_name;

    // Parsing the street name and parsing the numbered streets. Eg: 37th -> 37, 41st -> 41, etc.
    addressObj.shortStreetName = address[STREET_NAME_INDEX].short_name.replace(/\b(\d+)(st|nd|rd|th)\b/g, '$1')
    addressObj.longStreetName = address[STREET_NAME_INDEX].long_name.replace(/\b(\d+)(st|nd|rd|th)\b/g, '$1');


    // Manhattan has a different borough index than other boroughs, from Google API
    if (address[MANHATTAN_BOROUGH_INDEX] === 'Manhattan') {
        //     then make the borough manhattan
        addressObj.borough = address[MANHATTAN_BOROUGH_INDEX].long_name;
        addressObj.zip = address[MANHATTAN_BOROUGH_INDEX + 5].long_name;
    } else {
        //     make the borough outer borough index
        addressObj.borough = address[OUTER_BOROUGH_INDEX].short_name;
        addressObj.zip = address[OUTER_BOROUGH_INDEX + 4].long_name;
    }

    // console.log('this is address obj to fill out API', addressObj)
    return addressObj;


}



// *****REFERENCE CODE FROM VIOLERTS*******
//
//
// export const getHouseNumber = (place) => {
//
//     console.log('this is place from google utils', place)
//     return place.address_components[HOUSE_NUM_INDEX].long_name;
// };
//
// export const getStreetName = (place) => {
//     return place.address_components[STREET_NAME_INDEX].long_name;
// };
//
// const isInBorough = (place, borough) => {
//     if (!place || !borough) {
//         return false;
//     }
//     let boroughComponent = place?.address_components?.[OUTER_BOROUGH_INDEX];
//     if (borough.toLowerCase() === 'manhattan') {
//         //special case for manhattan addresses. borough is in a different spot in the array of address parts
//         boroughComponent = place?.address_components?.[MANHATTAN_BOROUGH_INDEX];
//     }
//
//     //use .includes() because we sometimes see "Bronx" vs "The Bronx"
//     return !!boroughComponent?.long_name?.toLowerCase()?.includes(borough.toLowerCase());
// }
//
// export const getBoroughNum = (place) => {
//     if (isInBorough(place, 'Manhattan')) {
//         return BOROUGHS.MANHATTAN;
//     }
//     //use "Bronx" rather than "The Bronx". the "The" is sometimes missing from google's addresses
//     if (isInBorough(place, 'Bronx')) {
//         return BOROUGHS.BRONX;
//     }
//     if (isInBorough(place, 'Brooklyn')) {
//         return BOROUGHS.BROOKLYN;
//     }
//     if (isInBorough(place, 'Queens')) {
//         return BOROUGHS.QUEENS;
//     }
//     if (isInBorough(place, 'Staten Island')) {
//         return BOROUGHS.STATEN_ISLAND;
//     }
//
//     return -1;
// };
//
// export const getAddressWithoutUSA = (place) => {
//     return place.formatted_address.replace(', USA', '');
// }
