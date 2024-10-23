const cors = require('cors');
const express = require('express');
const { BigQuery } = require('@google-cloud/bigquery');

const app = express();
const port = process.env.PORT || 8080;

app.use(cors({
    origin: 'https://acevolution-app-dot-clgx-gcp-hackathon-36-48da.ts.r.appspot.com', // your React app URL
}));

// Creates a BigQuery client
const bigquery = new BigQuery();

// Endpoint to run a query in BigQuery
app.get('/api/suggestions', async (req, res) => {

    const keyword = req.query.keyword; // e.g., ?name=John

    const query = `
        SELECT MIN(ID) as ID, -- Or any aggregate function to select an ID
               B_FullName
        FROM \`clgx-gcp-hackathon-36-48da.energy_efficiency.Building_Eff_Enhanced\`
        WHERE B_FullName LIKE @conditionPattern
        GROUP BY B_FullName LIMIT 10
    `;

    const options = {
        query: query,
        params: { conditionPattern: `%${keyword}%` }, // Wildcards for "contains" search
    };

    try {
        const [rows] = await bigquery.query(options);
        const suggestions = rows.map(row => ({
            id: row['ID'],
            fullAddress: row['B_FullName']
        }));

        res.json(suggestions);
    } catch (err) {
        console.error('Error querying BigQuery', err);
        res.status(500).send('Error querying BigQuery');
    }
});

app.get('/api/report', async (req, res) => {

    const propertyId = req.query.propertyId; // e.g., ?name=John

    const query = `
        SELECT
            ID,
            B_FullName,
            CRT_Nabers_RatedArea,
            CRT_Nabers_RatedHours,
            CRT_Nabers_AnnualEmissions,
            CRT_Nabers_AnnualEmissionIntensity,
            CRT_Nabers_AnnualConsumption,
            RoofMaterial,
            ExternalWallMaterial,
            CRT_BuildingNla
        FROM
            \`clgx-gcp-hackathon-36-48da.energy_efficiency.Building_Eff_Enhanced\`
        WHERE
            ID = @propertyId
    `;

    const options = {
        query: query,
        params: { propertyId }, // Pass the fullName as a parameter to prevent SQL injection
    };

    try {
        const [rows] = await bigquery.query(options);
        let result = []
        if (rows) {
            result = rows.map(row => ({
                id: row['ID'],
                fullAddress: row['B_FullName'],
                ratedArea: row['CRT_Nabers_RatedArea'],
                ratedHours: row['CRT_Nabers_RatedHours'],
                annualEmissions: row['CRT_Nabers_AnnualEmissions'],
                annualEmissionIntensity: row['CRT_Nabers_AnnualEmissionIntensity'],
                annualConsumption: row['CRT_Nabers_AnnualConsumption'],
                roofMaterial: row['RoofMaterial'],
                externalWallMaterial: row['ExternalWallMaterial'],
                buildingNla: row['CRT_BuildingNla'],
            }));
        }
        res.json(result);
    } catch (err) {
        console.error('Error querying BigQuery', err);
        res.status(500).send('Error querying BigQuery');
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
