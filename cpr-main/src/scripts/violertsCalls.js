import {API_URL, email, password} from "../constants/constants";
// import {email, password, api} from '../constants'
// Auth Token for Violerts API
export const getAuth = async () => {
    try {
        const response = await fetch(API_URL, {
            method: "POST",
            body: JSON.stringify({
                email: email,
                password: password,
            }),
            headers: {
                'Content-Type': 'application/json;charset=UTF-8',
                'Accept': 'application/json, text/plain, */*',
            },
        });

        // Check if the response is okay
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        // Extract the authToken from header
        const authToken = response.headers.get('Authorization'); // or whichever header contains the token
        // console.log(authToken)
        return authToken;

    } catch (error) {
        console.error('Error during fetch:', error);
    }
}



// Function for Violerts API Call
export const getProperty = async (token, address) => {


    // console.log('full address parsed inside getproperty', address)

    try {
        const fetchParams = {
            headers: {
                'Authorization': `Bearer ${token}`, // Add the token here
                'Content-Type': 'application/json', // Optional: set content type if needed
                'Accept': 'application/json' // Optional: accept JSON response
            }
        };

        // let response = await fetch(`https://api.violerts.com/api/property/overview/${address}`, fetchParams);
        let response = await fetch(`https://ecs.violerts.com/api/property/overview/${address}`, fetchParams);

        // Check again if the second response was successful
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        // Parse the JSON response
        const data = await response.json();

        // console.log('data from the violerts API pull, ', data)
        if (data.property.additional_bins === 'NONE') data.property.additional_bins = "N/A"
        return data;

    } catch (error) {
        console.error('Error fetching data:', error);
    }
}


// export const loadFile = async (url) => {
//     const response = await fetch(url);
//     const template = await response.blob();
//     return template;
// };
//
//
// export function saveFile(filename, blob) {
//     const blobUrl = URL.createObjectURL(blob);
//
//     let link = document.createElement("a");
//     link.download = filename;
//     link.href = blobUrl;
//
//     document.body.appendChild(link);
//     link.click();
//
//     setTimeout(() => {
//         link.remove();
//         window.URL.revokeObjectURL(blobUrl);
//         link = null;
//     }, 0);
// }
