# CPR Report (Comprehensive Property Report (Report))

# About CPR
The goal of CPR is to automatically generate Comprehensive Property Reports in Word Doc format, given an address in NYC. Eventually, this functionality will be ported over to Violerts as a clickable button to generate and download the report on a specific address' page, either as code copy/pasted over as a function OR an iFrame.



# Flow of Data
Search box takes in a NYC address, and upon submit, does a series of API calls to eventually populate a Word document with relevant information. 
Important to note: in this iteration not yet implemented onto Violerts, you cannot look up addresses UNTIL it's been searched on Violerts. Or rather, until the address is entered into the database as that's where the API is pulling from.
- Upon submit: generateDocument();
   1. Takes the value in the search box and parses it, separating the address into an object which is used to pass data into the getJsonData's arguments.   
      1. Important to note: After a LOT of exhaustive trial and error, the best way to get the address during development is by searching the address on Violerts and then copy and pasting whatever the address comes out to be at the top of the property page. The Google Maps API doesn't have a standardized way of returning addresses so the headache is just not worth it.
      2. Eventually, we will be grabbing the address from Violert's state anyway, so copy and pasting will have to do for now. 
   2. Waits for getJsonData() to finish all of its API calls and return allVars, an object that contains all information needed for the document.
   3. The easy-template-x library uses allVars in order to populate a Word document.

- getJsonData(). Takes in houseNum, streetName, borough, and address that are passed in from generateDocument(). At the end of the day, it's an async function that does a LOT of API calls and returns all of that information in an object called allVars.
   1. Starts with an API call to Violerts to pull BIN and BBL. 
      1. This requires a token for authentication from Violerts, gained by making a POST to Violerts with the email and password in the body of the request. It can be any email and password for a pre-existing account on Violerts. 
      2. Then you can make the API call to Violerts with the token from above step and the address.
   2. Then does a series of calls to various API's, including from Open Data datasets, DOBNOW, other NYC API sources. 
      1. For NYC Open Data, each call needs an app token in the URL of the API call.
      2. Sources of each API and Dataset are noted in the Data Sources section of this README. 
 

# Technologies and Libraries Used
 - Libraries/Packages
   - easy-template-x: https://www.npmjs.com/package/easy-template-x. Used to populate Word Documents with information.
   - parse-address: https://www.npmjs.com/package/parse-address. Used to parse the address and break it up into easy to handle objects.
 - Technologies
   - React, JavaScript, HTML, CSS.

# Data Sources 
- Violerts 
- Google Maps API
- NYC Geoclient API (originJson): https://maps.nyc.gov/geoclient/v1/doc#section-1.0     NOT USED IN VIOLERTS
- NYC DOB NOW (dataJson): https://a810-dobnow.nyc.gov/publish/Index.html#!/ VARIATIONS USED IN VIOLERTS
- NYC Open Data
  - Pluto Zoning: DCP (zoningJson): https://data.cityofnewyork.us/City-Government/Primary-Land-Use-Tax-Lot-Output-PLUTO-/64uk-42ks/about_data NOT USED IN VIOLERTS
  - Property Valuation and Assessment Data Tax Classes: DoF (taxJson): https://data.cityofnewyork.us/City-Government/Property-Valuation-and-Assessment-Data-Tax-Classes/8y4t-faws/about_data NOT USED IN VIOLERTS
  - Multiple Dwelling Registrations: HPD (multipleDwellingJson): https://data.cityofnewyork.us/Housing-Development/Multiple-Dwelling-Registrations/tesw-yqqr/about_data NOT USED IN VIOLERTS
  - Buildings Subject to HPD Jurisdiction: HPD (hpdJson): https://data.cityofnewyork.us/Housing-Development/Buildings-Subject-to-HPD-Jurisdiction/kj4p-ruqc/about_data NOT USED
  - Local Law 44 - Unit Income Rent: HPD (rentControlledJson): https://data.cityofnewyork.us/Housing-Development/Local-Law-44-Unit-Income-Rent/9ay9-xkek/about_data NOT USED
  - Housing Maintenance Code Violations: HPD (HPDViolationsJson): https://data.cityofnewyork.us/Housing-Development/Housing-Maintenance-Code-Violations/wvxf-dwi5/about_data YES BEING USED
  - Individual Landmark Sites: LPC (landmark2Json): https://data.cityofnewyork.us/Housing-Development/Individual-Landmark-Sites/buis-pvji/about_data NOT BEING USED
  - DOB NOW: Certificate of Occupancy: DOB (cOfoJson): https://data.cityofnewyork.us/Housing-Development/DOB-NOW-Certificate-of-Occupancy/pkdm-hqz6/about_data NOT
  - DOB Violations: DOB (DOBViolationsJson): https://data.cityofnewyork.us/Housing-Development/DOB-Violations/3h2n-5cm9/about_data NOT
  - DOB Job Application Filings: DOB (OpenJobsJson, DOBApplications): https://data.cityofnewyork.us/Housing-Development/DOB-Job-Application-Filings/ic3t-wcy2/about_data NOT
  - DOB ECB Violations: DOB (ECBViolationsJson): https://data.cityofnewyork.us/Housing-Development/DOB-ECB-Violations/6bgk-3dad/about_data NOT

# Missing Data/Things we need to include but are still wonky
- Zoning Map: https://www.nyc.gov/assets/planning/download/pdf/zoning/zoning-maps/map${addressZone}.pdf
  - Towards the end of the link you see ${addressZone} which is where CPR inserts the Zone (1b, 2a, etc) and it works just fine to create the pdf. Only issue is getting it from a PDF to a picture to insert into the final CPR document. Having trouble with this, will work on it.
  - 