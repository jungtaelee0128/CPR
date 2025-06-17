import "./styles.css";
import {TemplateHandler} from "easy-template-x";
import {useState, useEffect, useContext, useRef} from "react";

import {getAuth, getProperty} from "./scripts/violertsCalls";
import {loadFile, saveFile} from './scripts/generateDocument'
import {boroughPull, boroughAbrv} from "./scripts/boroughScripts";
import {buildingCodes} from "./constants/buildingCodes";

const parser = require('parse-address');
// import {AddressSearch, GoogleAddressContext} from "./components/addressSearch";

import {parseAddress} from "./scripts/parseAddress";
import {GoogleMap, useJsApiLoader, StandaloneSearchBox} from '@react-google-maps/api';


export default function App() {

    const [error, setError] = useState("");


    // Main API calls to get data to fill out the document
    // await getJsonData(houseNum, streetName, borough, currAdd, zip).
    async function getJsonData(houseNum, streetName, borough, address, zip) {
        // need prop from search bar
        // const currAdd = document.getElementById('template-data-txt').value;
        // // setAddress(currAdd);
        // addressRef.current = currAdd;
        // console.log('zipcode from generate, arg in getjsondata', zip)


        const boroughData = boroughPull(borough);
        // Get Violerts login token
        const token = await getAuth();
        // console.log(token)

        const vioProperty = await getProperty(token, address)
        // vioProperty.property.borough = boroughData.boroughName
        // console.log('borough from violerts', vioProperty.property.borough)

        const borAbr = boroughAbrv(vioProperty.property);
        // console.log(borAbr, 'bor abrv')

        //Data straight from NYC API that give the basic information that is needed for each of the other sets
        // const originJson = await fetch(`https://api.nyc.gov/geo/geoclient/v1/address.json?houseNumber=${houseNum}&street=${streetName}&borough=${borough}&subscription-key=eda5feb13f8d4c4d90f69883569ccb9e`)

        const originJson = await fetch(`https://api.nyc.gov/geo/geoclient/v1/address.json?houseNumber=${houseNum}&street=${streetName}&borough=${borough}&subscription-key=eda5feb13f8d4c4d90f69883569ccb9e`)
            .then(res => res.json())
            .then(data => {
                const codes = {
                    "1": 'Manhattan',
                    "2": "Bronx",
                    "3": "Brooklyn",
                    "4": "Queens",
                    "5": "Staten Island",
                }

                // accessing Violerts obj that was returned before this;
                const boroughNum = vioProperty.property.borough;
                if (boroughNum === 1) data.address.city = "New York", data.address.boroughName = 'Manhattan';
                // borough in the below line is the same as city, from the parsedAdd
                else data.address.city = borough, data.address.boroughName = codes[boroughNum];

                data.address.zipCode = zip;


                return data.address
            });


        //Information from an endpoint from DOB BIS, second line is Violerts that has info to populate other datasets as well
        // const dataJson = await fetch('https://a810-dobnow.nyc.gov/Publish/WrapperPP/PublicPortal.svc/getPublicPortalPropertyDetailsGet/2%7C' + originJson.buildingIdentificationNumber)
        const dataJson = await fetch('https://a810-dobnow.nyc.gov/Publish/WrapperPP/PublicPortal.svc/getPublicPortalPropertyDetailsGet/2%7C' + vioProperty.property.bin)
            .then(res => res.json())
            .then(data => {
                if (data.PropertyDetails.LandmarkStatus === '') data.PropertyDetails.LandmarkStatus = "N/A";
                if (data.PropertyDetails.SpecialDistrict === '') data.PropertyDetails.SpecialDistrict = "N/A";
                return data.PropertyDetails
            });
        //Zoning Dataset that comes from the PLUTO Zoning Database
        const zoningJson = await fetch(`https://data.cityofnewyork.us/resource/64uk-42ks.json?$$app_token=LEYcd1HDy7d2hH39MliTnsgoP&borough=${borAbr}&block=${vioProperty.property.block}&lot=${vioProperty.property.lot}`)
            .then(res => res.json())
            .then(data => {
                // console.log('zoning data: look for building classification', data)
                data[0].builtfar = Number(data[0].builtfar)
                data[0].bldgclass = `${data[0].bldgclass}: ${buildingCodes[data[0].bldgclass]}`
                // adding commas to big numbers lol
                data[0].bldgarea = Number(data[0].bldgarea).toLocaleString();

                // taking care of multiple zones. According to Daisha there can be up to 3 zone districts for a property
                if (data[0].zonedist3) data[0].zoneDistricts = `${data[0].zonedist1} / ${data[0].zonedist2} ${data[0].zonedist2}`;
                else if (data[0].zonedist2) data[0].zoneDistricts = `${data[0].zonedist1} / ${data[0].zonedist2}`;
                else data[0].zoneDistricts = data[0].zonedist1;


                return data
            });

        const addressZone = zoningJson[0].zonemap;
        // const zoningMap = await fetch(`https://www.nyc.gov/assets/planning/download/pdf/zoning/zoning-maps/map${addressZone}.pdf`);


        // console.log("zoning data from zoningJson outside of function", zoningJson[0])

        // func here, takes zoningJson[0].zonemap. returns a picture?


        // Finds the link for the zoning map PDF from the city from the zoning map shown from the PLUTO zoning dataset
        // const zoningMapLink = [{
        //     zoningMap: {
        //         _type: 'link',
        //         text: 'Zoning Map',  // Optional - if not specified the `target` property will be used
        //         target: `https://www.nyc.gov/assets/planning/download/pdf/zoning/zoning-maps/map${zoningJson[0].zonemap}.pdf`
        //     }
        // }];


        //Dataset for Tax assessment and information
        // const taxJson = await fetch(`https://data.cityofnewyork.us/resource/8y4t-faws.json?$$app_token=LEYcd1HDy7d2hH39MliTnsgoP&boro=${boroughData.boroughCode}&block=${vioProperty.property.block}&lot=${vioProperty.property.lot}&year=2025`)
        const taxJson = await fetch(`https://data.cityofnewyork.us/resource/8y4t-faws.json?$$app_token=LEYcd1HDy7d2hH39MliTnsgoP&boro=${vioProperty.property.borough}&block=${vioProperty.property.block}&lot=${vioProperty.property.lot}&year=2025`)
            .then(res => res.json())
            .then(data => {
                // console.log('tax: look for building owner', data)
                data[0].land_area = Number(data[0].land_area).toLocaleString();
                return data[0]
            });

        //Only puts an explicit YES or NO returned if building exists in the multiple dwelling dataset
        const multipleDwellingJson = await fetch(`https://data.cityofnewyork.us/resource/tesw-yqqr.json?$$app_token=LEYcd1HDy7d2hH39MliTnsgoP&BIN=${vioProperty.property.bin}`)
            .then(res => res.json())
            .then(data => {

                if (data.toString() === "") {
                    const no = '[{"ismd": "NO"}]';
                    return JSON.parse(no)
                } else {
                    const yes = '[{"ismd": "YES"}]';
                    return JSON.parse(yes)
                }
            });

        //Only puts an explicit YES or NO returned if building exists in the HPD (Housing) dataset
        const HPDJson = await fetch(`https://data.cityofnewyork.us/resource/kj4p-ruqc.json?$$app_token=LEYcd1HDy7d2hH39MliTnsgoP&block=${vioProperty.property.block}&lot=${vioProperty.property.lot}`)
            .then(res => res.json())
            .then(data => {
                // console.log('this is HPD data: ', data)
                // HUGE issue for the 1000000 things.
                if (data.length === 0) {
                    const no = '{"registrationid": "Not a residential building"}';
                    // console.log('hello not a res')
                    return JSON.parse(no)
                } else {
                    // console.log('HPD, lookg for stories ', data[0])
                    return data[0]
                }
            });

        //if hpd id doesn't exist, parse over and give definitive "no" for if a property is rent controlled
        const rentControlledJson = JSON.stringify(HPDJson).includes('Not a residential building') ?

            await fetch(`https://data.cityofnewyork.us/resource/9ay9-xkek.json?$$app_token=LEYcd1HDy7d2hH39MliTnsgoP&BuildingID=0`)
                .then(res => res.json())
                .then(data => {

                    if (data.toString() === "" || data.toString() === "undefined" || data.toString() === "[object Object]") {
                        const no = '[{"isrs": "NO"}]';
                        return JSON.parse(no)
                    } else {
                        const yes = '[{"isrs": "YES"}]';
                        return JSON.parse(yes)
                    }
                })
            :
            await fetch(`https://data.cityofnewyork.us/resource/9ay9-xkek.json?$$app_token=LEYcd1HDy7d2hH39MliTnsgoP&BuildingID=${HPDJson.buildingid}`)
                .then(res => res.json())
                .then(data => {

                    if (data.toString() === "" || data.toString() === "undefined" || data.toString() === "[object Object]") {
                        const no = '[{"isrs": "NO"}]';
                        return JSON.parse(no)
                    } else {
                        const yes = '[{"isrs": "YES"}]';
                        return JSON.parse(yes)
                    }
                });


        //Landmark set that shows the landmark information if it exists and has a link to the designation report
        const landmark2Json = await fetch(`https://data.cityofnewyork.us/resource/buis-pvji.json?$$app_token=LEYcd1HDy7d2hH39MliTnsgoP&borough=${borAbr}&block=${vioProperty.property.block}&lot=${vioProperty.property.lot}`)
            .then(res => res.json())
            .then(data => {
                // if not a landmark, return N/A
                if (!data[0]) return {"lpc_lpnumb": 'Contact us at admin@violerts.com for more information'}
                console.log('lpc', data[0])
                return data[0]
            });

        //Shows Certificate of Occupancy for a building if it is from 2012 or later
        // current dataset is from 2021 forwards, and are ISSUED certificate of occupancies

        // const cOfoJson = async () => {
        //     // store in object to return and populate. but just need the most recent so? don't need object.
        //     const cOfOObj = {};
        //
        //
        //     // NEED JUST THE LATEST ONE, SO CHECK 2021 FIRST AND IF NOT THEN CHECK 2012 THEN IF NOT N/A
        //     // needs query params in 2012
        //     const cOfO2012 = await fetch(`https://data.cityofnewyork.us/resource/bs8b-p36w.json?$$app_token=LEYcd1HDy7d2hH39MliTnsgoP&bin_number=${vioProperty.property.bin}`)
        //         .then(res => res.json())
        //         .then(data => {
        //             // console.log("2012", data)
        //             return data;
        //         })
        //
        //     // const cOfO2021 = await(`https://data.cityofnewyork.us/resource/pkdm-hqz6.json?$$app_token=LEYcd1HDy7d2hH39MliTnsgoP&bin=${vioProperty.property.bin}`)
        //     const cOfO2021 = await fetch(`https://data.cityofnewyork.us/resource/pkdm-hqz6.json?$$app_token=LEYcd1HDy7d2hH39MliTnsgoP&bin=${vioProperty.property.bin}`)
        //         .then(res => res.json())
        //         .then(data => {
        //             return data;
        //         })
        //
        //     console.log('2012', cOfO2012)
        //     console.log('2021', cOfO2021)
        //
        //     //     if 2021 exist
        //     //         last is most recent
        //     //     else if 2012 exist
        //     //          first is most recent
        //     //     else return custom string
        //     if (cOfO2021.length > 0) {
        //         const latest = cOfO2021[cOfO2021.length - 1];
        //
        //         cOfOObj.issue_date = latest.c_of_o_issuance_date;
        //
        //         console.log('cofoobj', cOfOObj)
        //
        //         return cOfOObj;
        //     } else if (cOfO2012.length > 0) {
        //         return cOfO2012[cOfO2012.length - 1];
        //     } else {
        //         return ""
        //     }
        //
        //
        // }
        // // maybe call it here? w the block and lot passed in?
        // cOfoJson()


        //Uses coordinates from PLUTO zoning dataset in order to get the Google street view image to from this maps.googleapis.com endpoint
        const img = await fetch(`https://maps.googleapis.com/maps/api/streetview?size=500x500&location=${zoningJson[0].address},${zoningJson[0].zipcode}&fov=100&pitch=20&key=AIzaSyB16pyBgKK-CUFNTmajG_pjseOeCuZpljk`)
            .then(async res => await res.blob())
            .then(data => {
                return data
            })

        //Different Table Sets


        //DOB Violation Set
        const DOBViolationsJson = await fetch(`https://data.cityofnewyork.us/resource/3h2n-5cm9.json?$$app_token=LEYcd1HDy7d2hH39MliTnsgoP&bin=${vioProperty.property.bin}`)
            .then(res => res.json())
            .then(data => {


                let openVio = data.filter(item => item.violation_category === "V-DOB VIOLATION - ACTIVE");
                const openVioTotal = openVio.length;

                if (openVio.length === 0) return ['There are 0 open DOB Violations', data.length]

                if (openVio.length >= 10) {
                    // Get the last 10 elements
                    openVio = openVio.slice(-10);
                }

                for (const el of openVio) {
                    const year = parseInt(el.issue_date.substring(0, 4), 10);
                    const month = parseInt(el.issue_date.substring(4, 6), 10) - 1;
                    const day = parseInt(el.issue_date.substring(6, 8), 10);

                    const date = new Date(year, month, day);

                    el.issue_date = date.toLocaleDateString('en-US');

                }
                // console.log('dob violations', openVio)
                return [openVioTotal, data.length, openVio.reverse()];
            });

        //DOB Open Jobs Set
        const OpenJobsJson = await fetch(`https://data.cityofnewyork.us/resource/ic3t-wcy2.json?$query=SELECT%0A%20%20%60job__%60%2C%0A%20%20%60doc__%60%2C%0A%20%20%60borough%60%2C%0A%20%20%60house__%60%2C%0A%20%20%60street_name%60%2C%0A%20%20%60block%60%2C%0A%20%20%60lot%60%2C%0A%20%20%60bin__%60%2C%0A%20%20%60job_type%60%2C%0A%20%20%60job_status%60%2C%0A%20%20%60job_status_descrp%60%2C%0A%20%20%60latest_action_date%60%2C%0A%20%20%60building_type%60%2C%0A%20%20%60community___board%60%2C%0A%20%20%60cluster%60%2C%0A%20%20%60landmarked%60%2C%0A%20%20%60adult_estab%60%2C%0A%20%20%60loft_board%60%2C%0A%20%20%60city_owned%60%2C%0A%20%20%60little_e%60%2C%0A%20%20%60pc_filed%60%2C%0A%20%20%60efiling_filed%60%2C%0A%20%20%60plumbing%60%2C%0A%20%20%60mechanical%60%2C%0A%20%20%60boiler%60%2C%0A%20%20%60fuel_burning%60%2C%0A%20%20%60fuel_storage%60%2C%0A%20%20%60standpipe%60%2C%0A%20%20%60sprinkler%60%2C%0A%20%20%60fire_alarm%60%2C%0A%20%20%60equipment%60%2C%0A%20%20%60fire_suppression%60%2C%0A%20%20%60curb_cut%60%2C%0A%20%20%60other%60%2C%0A%20%20%60other_description%60%2C%0A%20%20%60applicant_s_first_name%60%2C%0A%20%20%60applicant_s_last_name%60%2C%0A%20%20%60applicant_professional_title%60%2C%0A%20%20%60applicant_license__%60%2C%0A%20%20%60professional_cert%60%2C%0A%20%20%60pre__filing_date%60%2C%0A%20%20%60paid%60%2C%0A%20%20%60fully_paid%60%2C%0A%20%20%60assigned%60%2C%0A%20%20%60approved%60%2C%0A%20%20%60fully_permitted%60%2C%0A%20%20%60initial_cost%60%2C%0A%20%20%60total_est__fee%60%2C%0A%20%20%60fee_status%60%2C%0A%20%20%60existing_zoning_sqft%60%2C%0A%20%20%60proposed_zoning_sqft%60%2C%0A%20%20%60horizontal_enlrgmt%60%2C%0A%20%20%60vertical_enlrgmt%60%2C%0A%20%20%60enlargement_sq_footage%60%2C%0A%20%20%60street_frontage%60%2C%0A%20%20%60existingno_of_stories%60%2C%0A%20%20%60proposed_no_of_stories%60%2C%0A%20%20%60existing_height%60%2C%0A%20%20%60proposed_height%60%2C%0A%20%20%60existing_dwelling_units%60%2C%0A%20%20%60proposed_dwelling_units%60%2C%0A%20%20%60existing_occupancy%60%2C%0A%20%20%60proposed_occupancy%60%2C%0A%20%20%60site_fill%60%2C%0A%20%20%60zoning_dist1%60%2C%0A%20%20%60zoning_dist2%60%2C%0A%20%20%60zoning_dist3%60%2C%0A%20%20%60special_district_1%60%2C%0A%20%20%60special_district_2%60%2C%0A%20%20%60owner_type%60%2C%0A%20%20%60non_profit%60%2C%0A%20%20%60owner_s_first_name%60%2C%0A%20%20%60owner_s_last_name%60%2C%0A%20%20%60owner_s_business_name%60%2C%0A%20%20%60owner_s_house_number%60%2C%0A%20%20%60owner_shouse_street_name%60%2C%0A%20%20%60city_%60%2C%0A%20%20%60state%60%2C%0A%20%20%60zip%60%2C%0A%20%20%60owner_sphone__%60%2C%0A%20%20%60job_description%60%2C%0A%20%20%60dobrundate%60%2C%0A%20%20%60job_s1_no%60%2C%0A%20%20%60total_construction_floor_area%60%2C%0A%20%20%60withdrawal_flag%60%2C%0A%20%20%60signoff_date%60%2C%0A%20%20%60special_action_status%60%2C%0A%20%20%60special_action_date%60%2C%0A%20%20%60building_class%60%2C%0A%20%20%60job_no_good_count%60%2C%0A%20%20%60gis_latitude%60%2C%0A%20%20%60gis_longitude%60%2C%0A%20%20%60gis_council_district%60%2C%0A%20%20%60gis_census_tract%60%2C%0A%20%20%60gis_nta_name%60%2C%0A%20%20%60gis_bin%60%0AWHERE%0A%20%20(caseless_contains(%60latest_action_date%60%2C%20%222020%22)%0A%20%20%20%20%20OR%20(caseless_contains(%60latest_action_date%60%2C%20%222021%22)%0A%20%20%20%20%20%20%20%20%20%20%20OR%20(caseless_contains(%60latest_action_date%60%2C%20%222022%22)%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20OR%20(caseless_contains(%60latest_action_date%60%2C%20%222023%22)%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20OR%20caseless_contains(%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%60latest_action_date%60%2C%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%222024%22%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20)))))%0A%20%20AND%20caseless_one_of(%60bin__%60%2C%20%22${vioProperty.property.bin}%22)`)
            .then(res => res.json())
            .then(data => {
                return data
            });

        //HPD Violations Set
        const HPDViolationsJson = await fetch(`https://data.cityofnewyork.us/resource/wvxf-dwi5.json?$$app_token=LEYcd1HDy7d2hH39MliTnsgoP&buildingid=${HPDJson.buildingid}`)
            .then(res => res.json())
            .then(data => {
                return data
            });

        //ECB Violations Set
        const ECBViolationsJson = await fetch(`https://data.cityofnewyork.us/resource/6bgk-3dad.json?$$app_token=LEYcd1HDy7d2hH39MliTnsgoP&bin=${vioProperty.property.bin}`)
            .then(res => res.json())
            .then(data => {
                // console.log('Oath/ECB Violations, look for FDNY/Fire violations', data)
                let openVio = data.filter(item => item.ecb_violation_status === "ACTIVE");
                const openVioTotal = openVio.length;

                if (openVio.length === 0) return ['There are 0 open ECB/OATH Violations', data.length]

                if (openVio.length >= 10) {
                    // Display only the last 10 elements
                    openVio = openVio.slice(-10);
                }

                for (const el of openVio) {
                    const year = parseInt(el.issue_date.substring(0, 4), 10);
                    const month = parseInt(el.issue_date.substring(4, 6), 10) - 1;
                    const day = parseInt(el.issue_date.substring(6, 8), 10);

                    const date = new Date(year, month, day);

                    el.issue_date = date.toLocaleDateString('en-US');
                    ;

                }


                return [openVioTotal, data.length, openVio.reverse()];
            });


        const paddedBlock = vioProperty.property.block.toString().padStart(5, '0');
        const paddedLot = vioProperty.property.lot.toString().padStart(4, '0');
        const FDNYViolationsJson = await fetch(`https://data.cityofnewyork.us/resource/jz4z-kudi.json?$$app_token=LEYcd1HDy7d2hH39MliTnsgoP&violation_location_block_no=${paddedBlock}&violation_location_lot_no=${paddedLot}&issuing_agency=FIRE DEPARTMENT OF NYC&violation_location_borough=${borough}`)
            .then(res => res.json())
            .then(data => {
                const dataLength = data.length;

                // to be clear, this is SUPPOSED to get rid of all closed out, and assumes that tickets that don't have the compliance status attached to it are open.
                const openViolations = data.filter(el => el.compliance_status !== "All Terms Met");
                const openViolationsLength = openViolations.length;

                for (const el of openViolations) {

                    // TODO: Maybe store each charge into an array so we can show them?
                    const newViolationDate = new Date(el.violation_date)
                    const newHearingDate = new Date(el.hearing_date)
                    el.violation_date = newViolationDate.toLocaleDateString('en-US')
                    el.hearing_date = newHearingDate.toLocaleDateString('en-US')

                    // have to create an obj for each charge?
                    el.charges = [];

                    for (let i = 1; i <= 5; i++) {
                        const chargeNum = `charge_${i.toString()}_code`
                        const chargeDesc = `charge_${i}_code_description`
                        const chargeSection = `charge_${i}_code_section`
                        const chargeInfraction = `charge_${i}_infraction_amount`
                        if (el[chargeNum]) {
                            // console.log('made it into the chargenum if statement')
                            el.charges.push(
                                {
                                    chargeCode: el[chargeNum],
                                    chargeDescription: el[chargeDesc],
                                    chargeSection: el[chargeSection],
                                    chargeInfraction: el[chargeInfraction],
                                }
                            )
                        }
                    }


                    //    could add a charges array prop to el?
                    //          once there, then add before the charge #1? let it iterate? how can we iterate? just take out carge 2-5
                    //    try way one:

                }
                // console.log('open fdny violations, check for charge prop,', openViolations)
                // console.log('res from FDNY', data)


                return [openViolations, dataLength, openViolationsLength]
            })


        //DOB Applications Set
        const DOBApplications = await fetch(`https://data.cityofnewyork.us/resource/ic3t-wcy2.json?$$app_token=LEYcd1HDy7d2hH39MliTnsgoP&bin__=${vioProperty.property.bin}`)
            .then(res => res.json())
            .then(data => {
                // console.log(data, 'data from DOB applications')
                const openApplications = data.filter(element => {
                    return element.job_status === "R" || element.job_status === 'Q';
                })
                // console.log(openApplications);

                if (openApplications.length === 0) {
                    return ['No DOB Applications found']
                } else if (openApplications.length > 10) {
                    // console.log('DOBApplications,', openApplications)
                    return [openApplications.length, openApplications.reverse().slice(0, 10)];
                }

                // console.log('DOB Applications, ', openApplications)

                return [openApplications.length, openApplications.reverse()];
            })

        //********************************************************
        // Last minute filtering before throwing into allVars


        //One big JSON object that is the one that will be used in order to populate the document
        const allVars = {
            currDate: new Date().toLocaleDateString(),
            violertsData: vioProperty.property,
            originData: [originJson],
            boroughData: [boroughData],
            propDetails: [dataJson],
            zoningDetails: zoningJson,
            // zoningMap: zoningMap,
            taxDetails: taxJson,
            multipleDwellingDetails: multipleDwellingJson,
            HPDData: [HPDJson],
            rentStableData: rentControlledJson,
            // landmarkData: landmarkJson,
            landmark2Data: [landmark2Json],
            // CofOData: [cOfoJson],
            // MultiCofO: cOfoJsonMulti,
            // zoningMap: zoningMapLink,
            coverImg: {
                _type: "image",
                source: img,
                format: img ? img.type : undefined,
                altText: "Street View of Building Image", // Optional
                width: 500,
                height: 500
            },

            // zoneImg:

            DOBApplicationsTotal: {length: DOBApplications[0]},
            DOBApplications: DOBApplications[1],

            DOBViolationTotal: {length: DOBViolationsJson[1]},
            DOBViolationOpenTotal: {length: DOBViolationsJson[0]},
            DOBOpenViolations: DOBViolationsJson[2],

            ECBViolationTotal: {length: ECBViolationsJson[1]},
            ECBViolationOpenTotal: {length: ECBViolationsJson[0]},
            ECBOpenViolations: ECBViolationsJson[2],

            FDNYOpenViolationsTotal: {length: FDNYViolationsJson[2]},
            FDNYViolationsTotal: {length: FDNYViolationsJson[1]},
            FDNYViolations: FDNYViolationsJson[0],


            OpenJobs: OpenJobsJson,
            HPDViolations: HPDViolationsJson,
            ECBViolations: ECBViolationsJson,
        }

        // console.log(allVars);
        return allVars;
    }


    const generateDocument = async () => {

        // in Violerts: overviewToolbar.js is where we grab property name:
        //      addressTitle, which is propertyData?.address. propertyData comes from state.property.propertyData.
        //      important lines: 19 - 25, 44, 56
        const currAdd = document.getElementById('template-data-txt').value;
        // console.log('should log address from usestate generate doc,', currAdd)
        const parsedAdd = parser.parseLocation(currAdd)

        const zip = parsedAdd.zip;
        // console.log(zip, 'zip')
        const houseNum = parsedAdd.number;
        // const streetName = `${parsedAdd.prefix ? `${parsedAdd.prefix} ` : ''}${parsedAdd.street} ${parsedAdd.type}`;
        const streetName = `${parsedAdd.prefix ? `${parsedAdd.prefix} ` : ''}${parsedAdd.street}${parsedAdd.type ? ` ${parsedAdd.type}` : ''}`;
        let borough;
        borough = parsedAdd.city === 'New York' ? "Manhattan" : parsedAdd.city;

        try {
            const handler = new TemplateHandler();
            setError("25%");
            // const template = await loadFile("/CPR.docx");
            const template = await loadFile("/CPR-Lite.docx");
            setError("50%");
            const test = await getJsonData(houseNum, streetName, borough, currAdd, zip).then((res) => {
                return res
            });
            setError("75%");
            const doc = await handler.process(template, test);
            setError("90%");

            // saveFile("result.docx", doc);
            saveFile(`${houseNum} ${streetName}, Comprehensive Property Report.docx`, doc);
            setError("Done");
        } catch (err) {
            setError(err.message);
            console.log(err);
        }
    };

    return (
        <div className="App">
            <h1>CPR (Comprehensive Property Report)</h1>

            <div className="data-container">
                <span className="block-title">Full Address</span>
                <input
                    id="template-data-txt"
                    onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                            generateDocument();
                        }
                    }}
                />
            </div>

            <button
                className="btn btn-primary"
                id="create-docx-button"
                onClick={generateDocument}
            >
                Generate Document
            </button>
            <p>{error}</p>

            <h1>Instructions:</h1>
            <div className='instructions-div'>
                <p>- Make sure that you look up the address on <a href='https://violerts.com'
                                                                   target="_blank">Violerts.com</a> first before using
                    this application. This is important because after looking up the address, you will need to copy and
                    paste the address that they have listed on the property page.</p>
                <p>- For instance, when you look up "918 Manhattan Avenue" in the Violerts search bar, the actual property page shows "918 Manhattan Ave" not "Avenue." This is a minor but VERY important detail.</p>
                <p>- Copy this address from this section, shown below:</p>
                <img src='/918_Manhattan.png'/>
                <p>- After entering the address in the search bar and hitting enter or clicking "generate document," you should be good to go. Just wait like 15-30 sec and a download should appear. </p>



                <h3>IMPORTANT NOTE:</h3>
                <p>The C of O section in II. Compliance Records 1 Most Recent Certificate of Occupancy will need to be edited manually in the document after it's generated. Again, this is due to the 2012/2021 building situation.</p>
            </div>
        </div>


    );


}
{/*<AddressSearch/>*/
}
{/*<div>*/
}
{/*    {isLoaded && (*/
}
{/*        <StandaloneSearchBox*/
}
{/*            onLoad={(ref) => (inputRef.current = ref)}*/
}
{/*            onPlacesChanged={handleOnPlacesChanges}*/
}
{/*        >*/
}
{/*            <input type="text" placeholder="Search for Address"/>*/
}
{/*        </StandaloneSearchBox>*/
}
{/*    )}*/
}
{/*</div>*/
}
