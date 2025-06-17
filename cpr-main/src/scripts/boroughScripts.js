export function boroughPull(borough) {
    // handling google maps returning everything in uppercase
    const boroughLower = borough.toLowerCase();

    if (boroughLower === 'manhattan' || boroughLower === 'new york') {
        // console.log('made it to Manhattan/New York')
        return {
            boroughName: 'Manhattan',
            boroughCode: 1,
            boroughAbrv: "MN",
        }
    } else if (boroughLower === 'brooklyn') {
        // console.log('made it to Brooklyn')
        return {
            boroughName: 'Brooklyn',
            boroughCode: 3,
            boroughAbrv: "BK",
        }
    } else if (boroughLower === 'queens') {
        // console.log('made it to Queens')
        return {
            boroughName: 'Queens',
            boroughCode: 4,
            boroughAbrv: "QN",
        }
    } else if (boroughLower === 'bronx') {
        // console.log('made it to The Bronx')
        return {
            boroughName: 'Bronx',
            boroughCode: 2,
            boroughAbrv: "BX",
        }
    } else if (boroughLower === 'staten island') {
        // console.log('made it to Staten Island')
        return {
            boroughName: 'Staten Island',
            boroughCode: 5,
            boroughAbrv: "SI",
        }
    }

}

export const boroughAbrv = (property) => {
//     need abrv
    if (property.borough === 1) return 'MN';
    else if (property.borough === 2) return 'BX';
    else if (property.borough === 3) return 'BK';
    else if (property.borough === 4) return 'QN';
    else if (property.borough === 5) return 'SI';
}