const express = require('express');
const router = express.Router();

const nlp = require('compromise');
nlp.extend(require('compromise-dates'));
const stringSimilarity = require('string-similarity');

function closestSubsetStr(target, options) {
    let closestOption = null;
    let highestSimilarity = -1;
    
    options.forEach(option => {
        const similarity = stringSimilarity.compareTwoStrings(target, option);
        if (similarity > highestSimilarity) {
            closestOption = option;
            highestSimilarity = similarity;
        }
    });

    return closestOption;
}

router.post('/get', (req, res) => {
    let { userPrompt } = req.body;
    let nlpSucceeded = true;
    const doc = nlp(userPrompt.toLowerCase());

    const startLocationContext = doc.match('(from|between) #Place').out('normal');
    const destinationContext = doc.match('(to|and) #Place').out('normal');
    const locations = doc.places().out('array');

    if(locations.length < 2)
        nlpSucceeded = false;

    const startingLocation = closestSubsetStr(startLocationContext, locations);
    const destination = closestSubsetStr(destinationContext, locations);

    const dates = doc.dates().get();

    if(Object.keys(dates).length < 1)
        nlpSucceeded = false;

    const response = {
        "nlp_success": nlpSucceeded,
        "locations": {
            "start": startingLocation,
            "dest": destination,
            "mentioned_places": locations
        },
        "datetimes": { dates }
    };

    res.status(200).json(response);
});

module.exports = router;